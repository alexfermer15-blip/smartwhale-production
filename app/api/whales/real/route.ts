import { NextResponse } from 'next/server'
import {
  getTopWhaleAddresses,
  monitorWhaleTransaction,
  detectLargeTransactions,
} from '@/lib/api/whale-tracking'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'top'

  try {
    let data

    switch (action) {
      case 'top':
        // Fetch top 100 whale addresses
        data = await getTopWhaleAddresses(100)
        break

      case 'monitor':
        const address = searchParams.get('address')
        if (!address) {
          return NextResponse.json(
            { error: 'Address required' },
            { status: 400 }
          )
        }
        data = await monitorWhaleTransaction(address)
        break

      case 'large-tx':
        // Detect large transactions
        data = await detectLargeTransactions()
        break

      default:
        data = await getTopWhaleAddresses(50)
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Whale API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch whale data' },
      { status: 500 }
    )
  }
}
