import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper: Определить severity транзакции
function calculateSeverity(amountUsd: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (amountUsd >= 1000000) return 'HIGH';  // $1M+
  if (amountUsd >= 100000) return 'MEDIUM'; // $100K+
  return 'LOW';
}

// Helper: Получить timestamp транзакции
function getTransferTimestamp(transfer: any): string {
  try {
    if (transfer?.metadata?.blockTimestamp) {
      const timestamp = parseInt(transfer.metadata.blockTimestamp, 16) * 1000;
      return new Date(timestamp).toISOString();
    }
  } catch (error) {
    console.error('Error parsing timestamp:', error);
  }
  return new Date().toISOString();
}

// Helper: Получить цену токена из CoinGecko
async function getTokenPrice(symbol: string): Promise<number> {
  const fallbackPrices: { [key: string]: number } = {
    BNB: 600,
    ETH: 3500,
    BTC: 100000,
    USDT: 1,
    USDC: 1,
    DAI: 1,
  };

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`,
      {
        headers: {
          'x-cg-demo-api-key': process.env.NEXT_PUBLIC_COINGECKO_API_KEY || '',
        },
      }
    );

    if (!response.ok) {
      return fallbackPrices[symbol.toUpperCase()] || 0;
    }

    const data = await response.json();
    return data[symbol.toLowerCase()]?.usd || fallbackPrices[symbol.toUpperCase()] || 0;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return fallbackPrices[symbol.toUpperCase()] || 0;
  }
}

export async function GET(request: Request) {
  try {
    // 1. Проверка авторизации
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token || token !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // 2. Инициализация Supabase client (без cookies для server-side)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 3. Получить все отслеживаемые whale wallets
    const { data: whales, error: whalesError } = await supabase
      .from('tracked_whales')
      .select('*')
      .eq('is_active', true);

    if (whalesError) {
      console.error('Error fetching whales:', whalesError);
      return NextResponse.json(
        { error: 'Failed to fetch whales', details: whalesError.message },
        { status: 500 }
      );
    }

    if (!whales || whales.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active whales to sync',
        synced: 0,
      });
    }

    // 4. Синхронизация данных каждого whale
    let syncedCount = 0;
    let updatedCount = 0;

    for (const whale of whales) {
      try {
        // Получить balance через Alchemy
        const alchemyUrl = process.env.ALCHEMY_HTTP_URL;
        if (!alchemyUrl) {
          console.error('ALCHEMY_HTTP_URL not configured');
          continue;
        }

        // Получить ETH balance
        const balanceResponse = await fetch(alchemyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getBalance',
            params: [whale.wallet_address, 'latest'],
          }),
        });

        const balanceData = await balanceResponse.json();
        const ethBalance = balanceData.result
          ? parseInt(balanceData.result, 16) / 1e18
          : 0;

        // Получить token transfers через Alchemy
        const transfersResponse = await fetch(alchemyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'alchemy_getAssetTransfers',
            params: [{
              fromBlock: '0x0',
              toBlock: 'latest',
              fromAddress: whale.wallet_address,
              category: ['external', 'erc20', 'erc721', 'erc1155'],
              maxCount: '0x64', // 100 последних транзакций
            }],
          }),
        });

        const transfersData = await transfersResponse.json();
        const transfers = transfersData.result?.transfers || [];

        // Получить текущую цену ETH
        const ethPrice = await getTokenPrice('ethereum');
        const totalValueUsd = ethBalance * ethPrice;

        // Обновить whale данные
        const { error: updateError } = await supabase
          .from('tracked_whales')
          .update({
            balance: ethBalance,
            total_value_usd: totalValueUsd,
            last_synced_at: new Date().toISOString(),
            transaction_count: transfers.length,
          })
          .eq('id', whale.id);

        if (updateError) {
          console.error(`Error updating whale ${whale.wallet_address}:`, updateError);
        } else {
          updatedCount++;
        }

        // Сохранить последние транзакции (top 10)
        const recentTransfers = transfers.slice(0, 10);
        for (const transfer of recentTransfers) {
          try {
            const tokenSymbol = transfer.asset || 'ETH';
            const tokenPrice = await getTokenPrice(tokenSymbol);
            const amount = parseFloat(transfer.value || '0');
            const amountUsd = amount * tokenPrice;

            // Проверить существует ли транзакция
            const { data: existingTx } = await supabase
              .from('whale_transactions')
              .select('id')
              .eq('tx_hash', transfer.hash)
              .single();

            if (!existingTx) {
              // Создать новую транзакцию
              await supabase.from('whale_transactions').insert({
                whale_id: whale.id,
                tx_hash: transfer.hash,
                from_address: transfer.from,
                to_address: transfer.to,
                amount: amount,
                token_symbol: tokenSymbol,
                amount_usd: amountUsd,
                tx_type: transfer.category,
                severity: calculateSeverity(amountUsd),
                timestamp: getTransferTimestamp(transfer),
              });
            }
          } catch (txError) {
            console.error(`Error saving transaction:`, txError);
          }
        }

        syncedCount++;
      } catch (whaleError) {
        console.error(`Error syncing whale ${whale.wallet_address}:`, whaleError);
      }
    }

    // 5. Вернуть результат
    return NextResponse.json({
      success: true,
      message: 'Whale sync completed',
      synced: syncedCount,
      updated: updatedCount,
      totalWhales: whales.length,
    });

  } catch (error) {
    console.error('Cron sync error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
