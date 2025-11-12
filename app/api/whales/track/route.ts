// app/api/whales/track/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { AlchemyService } from '@/lib/services/alchemyService'

// Известные whale адреса
const KNOWN_WHALES = [
  {
    address: '0xF977814e90dA44bFA03b6295A0616a897441aceC',
    label: 'Binance Cold Wallet 5',
  },
  {
    address: '0x28C6c06298d514Db089934071355E5743bf21d60',
    label: 'Binance Cold Wallet 2',
  },
  {
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    label: 'Whale 0x742d',
  },
  {
    address: '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549',
    label: 'Whale 0x21a3',
  },
]

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const alchemy = new AlchemyService()

    let totalActivities = 0

    // Отслеживаем каждого кита
    for (const whale of KNOWN_WHALES) {
      const transfers = await alchemy.getAssetTransfers(whale.address, '0x' + (Date.now() - 86400000).toString(16))

      for (const transfer of transfers) {
        // Определяем тип транзакции
        const txType = transfer.from.toLowerCase() === whale.address.toLowerCase() ? 'sell' : 'buy'

        // Сохраняем в БД
        const { error } = await supabase.from('whale_activities').upsert({
          whale_address: whale.address,
          whale_label: whale.label,
          tx_hash: transfer.hash,
          tx_type: txType,
          token_symbol: transfer.asset || 'ETH',
          amount: parseFloat(transfer.value || '0'),
          amount_usd: parseFloat(transfer.value || '0') * 3500, // Примерная цена ETH
          from_address: transfer.from,
          to_address: transfer.to,
          blockchain: 'ethereum',
          severity: parseFloat(transfer.value || '0') > 100 ? 'HIGH' : 'MEDIUM',
          timestamp: new Date().toISOString(),
        }, {
          onConflict: 'tx_hash',
          ignoreDuplicates: true,
        })

        if (!error) totalActivities++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Tracked ${KNOWN_WHALES.length} whales`,
      activitiesFound: totalActivities,
    })
  } catch (error) {
    console.error('Error tracking whales:', error)
    return NextResponse.json({ error: 'Failed to track whales' }, { status: 500 })
  }
}
