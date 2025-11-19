// app/api/whales/track/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { TOP_ETHEREUM_WHALES, WHALE_LABELS } from '../../../../lib/whale-addresses'
import { createServerClient } from '@/lib/supabase/server'
import { AlchemyService } from '@/lib/services/alchemyService'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// Используем расширенный список whale адресов
const KNOWN_WHALES = TOP_ETHEREUM_WHALES.map((address: string) => ({
  address,
  label: WHALE_LABELS[address] || `Whale ${address.slice(0, 6)}...`
}))

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
      const transfers = await alchemy.getAssetTransfers(whale.address, '0x' + (Date.now() - 864000).toString(16))

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
