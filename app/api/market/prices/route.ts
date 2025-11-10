// app/api/market/prices/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const coins = 'bitcoin,ethereum,solana,binancecoin,cardano'
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 30 } }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch prices')
    }

    const data = await response.json()

    const prices = [
      {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        price: data.bitcoin?.usd || 0,
        change24h: data.bitcoin?.usd_24h_change || 0,
      },
      {
        id: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        price: data.ethereum?.usd || 0,
        change24h: data.ethereum?.usd_24h_change || 0,
      },
      {
        id: 'solana',
        symbol: 'SOL',
        name: 'Solana',
        price: data.solana?.usd || 0,
        change24h: data.solana?.usd_24h_change || 0,
      },
      {
        id: 'binancecoin',
        symbol: 'BNB',
        name: 'BNB',
        price: data.binancecoin?.usd || 0,
        change24h: data.binancecoin?.usd_24h_change || 0,
      },
      {
        id: 'cardano',
        symbol: 'ADA',
        name: 'Cardano',
        price: data.cardano?.usd || 0,
        change24h: data.cardano?.usd_24h_change || 0,
      },
    ]

    return NextResponse.json(prices)
  } catch (error) {
    console.error('Error fetching market prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    )
  }
}
