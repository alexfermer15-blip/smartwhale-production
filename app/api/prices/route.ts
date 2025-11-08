import { NextResponse } from 'next/server'

// CoinGecko API endpoint
const COINGECKO_API = 'https://api.coingecko.com/api/v3'

// Supported tokens mapping
const TOKEN_IDS = {
  btc: 'bitcoin',
  eth: 'ethereum',
  sol: 'solana',
  bnb: 'binancecoin',
  usdt: 'tether',
  usdc: 'usd-coin',
  xrp: 'ripple',
  ada: 'cardano',
  doge: 'dogecoin',
  matic: 'matic-network',
  link: 'chainlink',
  uni: 'uniswap',
  avax: 'avalanche-2',
  atom: 'cosmos',
  dot: 'polkadot',
} as const

interface CoinGeckoPrice {
  usd: number
  usd_market_cap: number
  usd_24h_vol: number
  usd_24h_change: number
}

interface CoinGeckoResponse {
  [key: string]: CoinGeckoPrice
}

export async function GET(request: Request) {
  try {
    // Parse query params
    const { searchParams } = new URL(request.url)
    const tokensParam = searchParams.get('tokens') || 'bitcoin,ethereum'
    
    // Validate and map token IDs
    const requestedTokens = tokensParam
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => Object.values(TOKEN_IDS).includes(t))
      .join(',')

    if (!requestedTokens) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid tokens. Use CoinGecko IDs like: bitcoin,ethereum,solana' 
        },
        { status: 400 }
      )
    }

    // Fetch from CoinGecko
    const url = `${COINGECKO_API}/simple/price?ids=${requestedTokens}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
    
    const response = await fetch(url, {
      next: { 
        revalidate: 60, // Cache for 60 seconds
        tags: ['crypto-prices']
      },
      headers: {
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('CoinGecko API error:', response.status, errorText)
      
      // Rate limit handling
      if (response.status === 429) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Rate limit exceeded. Please try again in a moment.' 
          },
          { status: 429 }
        )
      }
      
      throw new Error(`CoinGecko API returned ${response.status}`)
    }

    const data: CoinGeckoResponse = await response.json()

    // Format response
    const formattedData: Record<string, {
      price: number
      marketCap: number
      volume24h: number
      change24h: number
    }> = {}

    Object.entries(data).forEach(([coinId, priceData]) => {
      // Find short symbol from TOKEN_IDS
      const symbol = Object.entries(TOKEN_IDS).find(
        ([_, id]) => id === coinId
      )?.[0] || coinId

      formattedData[symbol] = {
        price: priceData.usd,
        marketCap: priceData.usd_market_cap,
        volume24h: priceData.usd_24h_vol,
        change24h: priceData.usd_24h_change,
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedData,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Price fetch error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch prices from CoinGecko',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST endpoint for batch price fetching (optional)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tokens } = body

    if (!Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json(
        { success: false, error: 'tokens array is required' },
        { status: 400 }
      )
    }

    // Convert short symbols to CoinGecko IDs
    const coinGeckoIds = tokens
      .map(t => TOKEN_IDS[t.toLowerCase() as keyof typeof TOKEN_IDS])
      .filter(Boolean)
      .join(',')

    if (!coinGeckoIds) {
      return NextResponse.json(
        { success: false, error: 'No valid tokens provided' },
        { status: 400 }
      )
    }

    const url = `${COINGECKO_API}/simple/price?ids=${coinGeckoIds}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error('CoinGecko API error')
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('POST price fetch error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch prices',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
