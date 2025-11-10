// app/api/cron/sync-whales/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { AlchemyService } from '@/lib/services/alchemyService'

// Известные whale адреса для отслеживания
const KNOWN_WHALES = [
  { address: '0xF977814e90dA44bFA03b6295A0616a897441aceC', label: 'Binance Cold Wallet 5' },
  { address: '0x28C6c06298d514Db089934071355E5743bf21d60', label: 'Binance Cold Wallet 2' },
  { address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', label: 'Whale 0x742d' },
  { address: '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549', label: 'Whale 0x21a3' },
  { address: '0x220866B1A2219f40e72f5c628B65D54268cA3A9D', label: 'Binance Cold Wallet 8' },
]

// Кэш для цен токенов
let priceCache: { [key: string]: { price: number; timestamp: number } } = {}
const CACHE_DURATION = 5 * 60 * 1000 // 5 минут

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 минут максимум для выполнения

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Проверка authorization header
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const alchemy = new AlchemyService()

    let totalActivities = 0
    let skippedDuplicates = 0
    const errors: { whale: string; error: string }[] = []

    // Получаем текущий блок (последние 24 часа ≈ 6500 блоков)
    const latestBlock = await alchemy.getLatestBlock()
    const fromBlock = latestBlock ? parseInt(latestBlock.number, 16) - 6500 : 0

    console.log(`🔄 Starting whale sync from block ${fromBlock}`)

    // Отслеживаем каждого кита
    for (const whale of KNOWN_WHALES) {
      try {
        console.log(`🐋 Tracking ${whale.label}...`)

        const transfers = await alchemy.getAssetTransfers(
          whale.address,
          '0x' + fromBlock.toString(16)
        )

        console.log(`  Found ${transfers.length} transfers`)

        // Ограничиваем до последних 20 транзакций
        const recentTransfers = transfers.slice(0, 20)

        for (const transfer of recentTransfers) {
          if (!transfer.hash) continue

          // Определяем тип транзакции
          const isOutgoing = transfer.from.toLowerCase() === whale.address.toLowerCase()
          const txType = isOutgoing ? 'sell' : 'buy'

          // Получаем цену токена
          let amountUsd = 0
          if (transfer.value) {
            const tokenSymbol = transfer.asset || 'ETH'
            const tokenPrice = await getTokenPrice(tokenSymbol)
            amountUsd = parseFloat(transfer.value) * tokenPrice
          }

          // Сохраняем в БД
          const { error } = await supabase.from('whale_activities').upsert(
            {
              whale_address: whale.address,
              whale_label: whale.label,
              tx_hash: transfer.hash,
              tx_type: txType,
              token_symbol: transfer.asset || 'ETH',
              amount: parseFloat(transfer.value || '0'),
              amount_usd: amountUsd,
              from_address: transfer.from,
              to_address: transfer.to,
              blockchain: 'ethereum',
              severity: calculateSeverity(amountUsd),
              timestamp: getTransferTimestamp(transfer),
            },
            {
              onConflict: 'tx_hash',
              ignoreDuplicates: true,
            }
          )

          if (!error) {
            totalActivities++
          } else if (error.code === '23505') {
            // Duplicate key - skip
            skippedDuplicates++
          } else {
            console.error('Error inserting activity:', error)
            errors.push({
              whale: whale.label,
              error: `Insert failed: ${error.message}`,
            })
          }
        }
      } catch (error) {
        console.error(`Error tracking ${whale.label}:`, error)
        errors.push({
          whale: whale.label,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const executionTime = Date.now() - startTime

    const result = {
      success: true,
      message: 'Whale sync completed',
      stats: {
        whalesTracked: KNOWN_WHALES.length,
        activitiesFound: totalActivities,
        skippedDuplicates,
        errors: errors.length,
        executionTimeMs: executionTime,
      },
      timestamp: new Date().toISOString(),
      errors: errors.length > 0 ? errors : undefined,
    }

    console.log('✅ Sync completed:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Cron job failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync whale activities',
        details: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

// Helper: Получить цену токена с кэшированием
async function getTokenPrice(symbol: string): Promise<number> {
  const now = Date.now()
  
  // Проверяем кэш
  if (priceCache[symbol] && now - priceCache[symbol].timestamp < CACHE_DURATION) {
    return priceCache[symbol].price
  }

  try {
    const coinGeckoIds: { [key: string]: string } = {
      ETH: 'ethereum',
      BTC: 'bitcoin',
      USDT: 'tether',
      USDC: 'usd-coin',
      BNB: 'binancecoin',
    }

    const coinId = coinGeckoIds[symbol.toUpperCase()]
    if (!coinId) {
      return 0
    }

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { next: { revalidate: 300 } }
    )

    const data = await response.json()
    const price = data[coinId]?.usd || 0

    // Сохраняем в кэш
    priceCache[symbol] = { price, timestamp: now }

    return price
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error)
    // Fallback цены
    const fallbackPrices: { [key: string]: number } = {
      ETH: 3500,
      BTC: 65000,
      USDT: 1,
      USDC: 1,
      BNB: 600,
    }
    return fallbackPrices[symbol.toUpperCase()] || 0
  }
}

// Helper: Определить severity транзакции
function calculateSeverity(amountUsd: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (amountUsd >= 10000000) return 'HIGH' // $10M+
  if (amountUsd >= 1000000) return 'MEDIUM' // $1M+
  return 'LOW'
}

// Helper: Получить timestamp транзакции
function getTransferTimestamp(transfer: any): string {
  try {
    if (transfer.metadata?.blockTimestamp) {
      const timestamp = parseInt(transfer.metadata.blockTimestamp, 16) * 1000
      return new Date(timestamp).toISOString()
    }
  } catch (error) {
    console.error('Error parsing timestamp:', error)
  }
  return new Date().toISOString()
}
