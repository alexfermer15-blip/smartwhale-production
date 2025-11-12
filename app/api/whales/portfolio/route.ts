// app/api/whales/portfolio/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface TokenBalance {
  tokenId: string
  balance: number
  priceUsd: number
  valueUsd: number
  avgBuyPrice: number
  holdingTimeDays: number
}

interface WhalePortfolio {
  walletAddress: string
  tokens: TokenBalance[]
  totalValueUsd: number
  totalPnlUsd: number
  totalInvestedUsd: number
}

// Расширенный маппинг криптовалют для CoinGecko
const COIN_GECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  ADA: 'cardano',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  LTC: 'litecoin',
  XRP: 'ripple',
  DOGE: 'dogecoin',
  SHIB: 'shiba-inu',
}

// Создаём Supabase client для server-side
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )
}

async function fetchTokenPrices(symbols: string[]): Promise<Record<string, number>> {
  try {
    const ids = symbols
      .map((s) => COIN_GECKO_IDS[s] || s.toLowerCase())
      .filter((id) => id)
      .join(',')

    if (!ids) {
      return {}
    }

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      { 
        next: { revalidate: 30 },
        headers: {
          'Accept': 'application/json',
        }
      }
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()

    const prices: Record<string, number> = {}
    symbols.forEach((symbol) => {
      const coinGeckoId = COIN_GECKO_IDS[symbol] || symbol.toLowerCase()
      prices[symbol] = data[coinGeckoId]?.usd || 0
    })

    return prices
  } catch (error) {
    console.error('Error fetching prices from CoinGecko:', error)
    // Fallback prices
    return {
      BTC: 106089,
      ETH: 3575,
      SOL: 167,
      BNB: 991,
      ADA: 0.67,
      DOT: 8.1,
      AVAX: 43,
      MATIC: 0.98,
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    // Try to get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // If not authenticated, return mock data for demo
    if (authError || !user) {
      console.warn('User not authenticated, returning mock data')

      const mockPortfolio: WhalePortfolio = {
        walletAddress: '0xDemo1234567890abcdef',
        tokens: [
          {
            tokenId: 'BTC',
            balance: 0.5,
            priceUsd: 106089,
            valueUsd: 53044.5,
            avgBuyPrice: 95000,
            holdingTimeDays: 120,
          },
          {
            tokenId: 'ETH',
            balance: 5,
            priceUsd: 3575,
            valueUsd: 17875,
            avgBuyPrice: 3200,
            holdingTimeDays: 90,
          },
          {
            tokenId: 'SOL',
            balance: 100,
            priceUsd: 167,
            valueUsd: 16700,
            avgBuyPrice: 155,
            holdingTimeDays: 60,
          },
          {
            tokenId: 'BNB',
            balance: 10,
            priceUsd: 991,
            valueUsd: 9910,
            avgBuyPrice: 950,
            holdingTimeDays: 45,
          },
        ],
        totalValueUsd: 97529.5,
        totalPnlUsd: 14529.5,
        totalInvestedUsd: 83000,
      }

      return NextResponse.json(mockPortfolio, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      })
    }

    // Get user's portfolio from database
    const { data: portfolio, error: portfolioError } = await supabase
      .from('user_portfolios')
      .select('id, wallet_address')
      .eq('user_id', user.id)
      .maybeSingle()

    if (portfolioError) {
      console.error('Error fetching portfolio:', portfolioError)
      return NextResponse.json(
        { error: 'Failed to fetch portfolio' },
        { status: 500 }
      )
    }

    // If no portfolio exists, create one
    if (!portfolio) {
      const { data: newPortfolio, error: createError } = await supabase
        .from('user_portfolios')
        .insert({
          user_id: user.id,
          wallet_address: null,
        })
        .select('id, wallet_address')
        .single()

      if (createError) {
        console.error('Error creating portfolio:', createError)
      }

      return NextResponse.json({
        walletAddress: newPortfolio?.wallet_address || '',
        tokens: [],
        totalValueUsd: 0,
        totalPnlUsd: 0,
        totalInvestedUsd: 0,
      })
    }

    // Fetch portfolio assets
    const { data: assets, error: assetsError } = await supabase
      .from('portfolio_assets')
      .select('*')
      .eq('portfolio_id', portfolio.id)

    if (assetsError) {
      console.error('Error fetching assets:', assetsError)
      return NextResponse.json(
        { error: 'Failed to fetch assets' },
        { status: 500 }
      )
    }

    if (!assets || assets.length === 0) {
      return NextResponse.json({
        walletAddress: portfolio.wallet_address || '',
        tokens: [],
        totalValueUsd: 0,
        totalPnlUsd: 0,
        totalInvestedUsd: 0,
      })
    }

    // Fetch current prices for all tokens
    const symbols = assets.map((a) => a.symbol)
    const prices = await fetchTokenPrices(symbols)

    // Calculate token balances with current prices
    const tokens: TokenBalance[] = assets.map((asset) => {
      const currentPrice = prices[asset.symbol] || 0
      const balance = parseFloat(asset.amount) || 0
      const valueUsd = balance * currentPrice
      const avgBuyPrice = asset.avg_buy_price || currentPrice
      const invested = balance * avgBuyPrice
      const holdingTimeDays = Math.floor(
        (Date.now() - new Date(asset.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        tokenId: asset.symbol,
        balance,
        priceUsd: currentPrice,
        valueUsd,
        avgBuyPrice,
        holdingTimeDays,
      }
    })

    // Calculate totals
    const totalValueUsd = tokens.reduce((sum, t) => sum + t.valueUsd, 0)
    const totalInvestedUsd = tokens.reduce((sum, t) => sum + (t.balance * t.avgBuyPrice), 0)
    const totalPnlUsd = totalValueUsd - totalInvestedUsd

    const portfolioData: WhalePortfolio = {
      walletAddress: portfolio.wallet_address || '',
      tokens,
      totalValueUsd,
      totalPnlUsd,
      totalInvestedUsd,
    }

    return NextResponse.json(portfolioData, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('Error in GET /api/whales/portfolio:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
