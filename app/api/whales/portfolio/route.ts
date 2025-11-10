// app/api/whales/portfolio/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

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
      { next: { revalidate: 30 } }
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
      BTC: 103000,
      ETH: 3456,
      SOL: 163,
      BNB: 645,
      ADA: 0.65,
      DOT: 7.8,
      AVAX: 42,
      MATIC: 0.95,
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn('User not authenticated, returning mock data')

      const mockPortfolio: WhalePortfolio = {
        walletAddress: '0xdemo123...',
        tokens: [
          {
            tokenId: 'BTC',
            balance: 0.5,
            priceUsd: 103000,
            valueUsd: 51500,
            avgBuyPrice: 90000,
            holdingTimeDays: 120,
          },
          {
            tokenId: 'ETH',
            balance: 5,
            priceUsd: 3456,
            valueUsd: 17280,
            avgBuyPrice: 3000,
            holdingTimeDays: 90,
          },
          {
            tokenId: 'SOL',
            balance: 100,
            priceUsd: 163,
            valueUsd: 16300,
            avgBuyPrice: 150,
            holdingTimeDays: 60,
          },
        ],
        totalValueUsd: 85080,
        totalPnlUsd: 12834,
        totalInvestedUsd: 72246,
      }

      return NextResponse.json(mockPortfolio)
    }

    const { data: portfolio } = await supabase
      .from('user_portfolios')
      .select('id, wallet_address')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!portfolio) {
      const { data: newPortfolio } = await supabase
        .from('user_portfolios')
        .insert({
          user_id: user.id,
          wallet_address: null,
        })
        .select('id, wallet_address')
        .single()

      return NextResponse.json({
        walletAddress: newPortfolio?.wallet_address || '',
        tokens: [],
        totalValueUsd: 0,
        totalPnlUsd: 0,
        totalInvestedUsd: 0,
      })
    }

    const { data: assets, error: assetsError } = await supabase
      .from('portfolio_assets')
      .select('*')
      .eq('portfolio_id', portfolio.id)

    if (assetsError) {
      console.error('Error fetching assets:', assetsError)
      return NextResponse.json({ error: assetsError.message }, { status: 500 })
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

    const symbols = assets.map((a) => a.symbol)
    const prices = await fetchTokenPrices(symbols)

    const tokens: TokenBalance[] = assets.map((asset) => {
      const currentPrice = prices[asset.symbol] || 0
      const valueUsd = parseFloat(asset.amount) * currentPrice
      const avgBuyPrice = asset.avg_buy_price || currentPrice
      const invested = parseFloat(asset.amount) * avgBuyPrice

      return {
        tokenId: asset.symbol,
        balance: parseFloat(asset.amount),
        priceUsd: currentPrice,
        valueUsd: valueUsd,
        avgBuyPrice: avgBuyPrice,
        holdingTimeDays: Math.floor(
          (Date.now() - new Date(asset.created_at).getTime()) / (1000 * 60 * 60 * 24)
        ),
      }
    })

    const totalValueUsd = tokens.reduce((sum, t) => sum + t.valueUsd, 0)
    const totalInvestedUsd = tokens.reduce((sum, t) => sum + t.balance * t.avgBuyPrice, 0)
    const totalPnlUsd = totalValueUsd - totalInvestedUsd

    const portfolioData: WhalePortfolio = {
      walletAddress: portfolio.wallet_address || '',
      tokens,
      totalValueUsd,
      totalPnlUsd,
      totalInvestedUsd,
    }

    return NextResponse.json(portfolioData)
  } catch (error) {
    console.error('Error in GET /api/whales/portfolio:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
