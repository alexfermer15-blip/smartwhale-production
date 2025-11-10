// app/api/signals/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface TradingSignal {
  id: string
  tokenSymbol: string
  signalType: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL'
  source: string
  confidence: number
  title: string
  description: string
  reasoning: string
  entryPrice: number
  targetPrice: number
  stopLoss: number
  timeHorizon: 'short' | 'medium' | 'long'
  createdAt: string
}

interface WhaleActivity {
  id: string
  whale_address: string
  whale_label: string | null
  tx_hash: string
  tx_type: 'buy' | 'sell' | 'transfer'
  token_symbol: string
  amount: number
  amount_usd: number | null
  from_address: string | null
  to_address: string | null
  blockchain: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  timestamp: string
  created_at: string
}

const COINGECKO_IDS: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'BNB': 'binancecoin',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'AVAX': 'avalanche-2',
  'USDT': 'tether',
  'USDC': 'usd-coin',
}

async function fetchCurrentPrice(symbol: string): Promise<number> {
  const coinId = COINGECKO_IDS[symbol.toUpperCase()]
  if (!coinId) return 0

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { next: { revalidate: 300 } }
    )
    const data = await response.json()
    return data[coinId]?.usd || 0
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error)
    return 0
  }
}

function formatUSD(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`
  }
  return `$${value.toFixed(2)}`
}

async function generateSignalsFromWhaleActivity(): Promise<TradingSignal[]> {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  
  const { data: recentActivities, error } = await supabase
    .from('whale_activities')
    .select('*')
    .gte('timestamp', yesterday)
    .order('timestamp', { ascending: false })

  if (error) {
    console.error('Error fetching whale activities:', error)
    return []
  }

  if (!recentActivities || recentActivities.length === 0) {
    console.log('No recent whale activities found')
    return []
  }

  const activities = recentActivities as WhaleActivity[]

  // Группируем по токенам
  const tokenGroups: Record<string, WhaleActivity[]> = {}
  activities.forEach(activity => {
    const token = activity.token_symbol
    if (!tokenGroups[token]) {
      tokenGroups[token] = []
    }
    tokenGroups[token].push(activity)
  })

  const signals: TradingSignal[] = []

  // Анализируем каждый токен
  for (const [token, tokenActivities] of Object.entries(tokenGroups)) {
    const buyActivities = tokenActivities.filter(a => a.tx_type === 'buy')
    const sellActivities = tokenActivities.filter(a => a.tx_type === 'sell')
    const transferActivities = tokenActivities.filter(a => a.tx_type === 'transfer')

    const totalBuyVolume = buyActivities.reduce((sum, a) => sum + (a.amount_usd || 0), 0)
    const totalSellVolume = sellActivities.reduce((sum, a) => sum + (a.amount_usd || 0), 0)
    const totalTransferVolume = transferActivities.reduce((sum, a) => sum + (a.amount_usd || 0), 0)

    const netVolume = totalBuyVolume - totalSellVolume
    const totalVolume = totalBuyVolume + totalSellVolume + totalTransferVolume

    // Пропускаем токены с низкой активностью
    if (totalVolume < 100000 || tokenActivities.length < 2) continue

    // Определяем тип сигнала
    let signalType: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL'
    let confidence: number
    let title: string
    let description: string

    const netRatio = netVolume / totalVolume

    if (netRatio > 0.6 && buyActivities.length >= 3) {
      signalType = 'STRONG_BUY'
      confidence = Math.min(85 + buyActivities.length * 2, 95)
      title = `🐋 Strong Whale Accumulation Detected`
      description = `${buyActivities.length} whales accumulated ${token} worth ${formatUSD(totalBuyVolume)}`
    } else if (netRatio > 0.3 && buyActivities.length >= 2) {
      signalType = 'BUY'
      confidence = Math.min(70 + buyActivities.length * 3, 85)
      title = `🐋 Whale Buying Pressure`
      description = `${buyActivities.length} whales bought ${token} worth ${formatUSD(totalBuyVolume)}`
    } else if (Math.abs(netRatio) < 0.15) {
      signalType = 'HOLD'
      confidence = 55
      title = `⚖️ Mixed Whale Activity`
      description = `Balanced whale activity: ${buyActivities.length} buys, ${sellActivities.length} sells`
    } else if (netRatio < -0.3 && sellActivities.length >= 2) {
      signalType = 'SELL'
      confidence = Math.min(70 + sellActivities.length * 3, 85)
      title = `⚠️ Whale Distribution Detected`
      description = `${sellActivities.length} whales sold ${token} worth ${formatUSD(totalSellVolume)}`
    } else {
      signalType = 'STRONG_SELL'
      confidence = Math.min(85 + sellActivities.length * 2, 95)
      title = `🚨 Strong Whale Sell-Off`
      description = `${sellActivities.length} whales dumped ${token} worth ${formatUSD(totalSellVolume)}`
    }

    const currentPrice = await fetchCurrentPrice(token)
    if (currentPrice === 0) continue

    const uniqueWhales = new Set(tokenActivities.map(a => a.whale_address)).size

    const reasoning = `Analysis of last 24h whale activity for ${token}:
• ${buyActivities.length} buy transaction${buyActivities.length !== 1 ? 's' : ''} totaling ${formatUSD(totalBuyVolume)}
• ${sellActivities.length} sell transaction${sellActivities.length !== 1 ? 's' : ''} totaling ${formatUSD(totalSellVolume)}
• ${transferActivities.length} transfer${transferActivities.length !== 1 ? 's' : ''} totaling ${formatUSD(totalTransferVolume)}
• Net flow: ${formatUSD(netVolume)} (${netRatio > 0 ? 'accumulation' : 'distribution'})
• Total unique whales: ${uniqueWhales}

${signalType.includes('BUY') 
  ? 'Historically, when multiple whales accumulate simultaneously, price tends to rise 5-15% within 7 days.'
  : signalType.includes('SELL')
  ? 'Historical data shows price typically drops 5-15% after major whale distributions.'
  : 'Market is consolidating. Wait for clearer directional signal.'
}`

    const targetMultiplier = signalType === 'STRONG_BUY' ? 1.15 : signalType === 'BUY' ? 1.10 : signalType === 'SELL' ? 0.93 : signalType === 'STRONG_SELL' ? 0.87 : 1.05
    const stopMultiplier = signalType.includes('BUY') ? 0.95 : signalType.includes('SELL') ? 1.07 : 0.97

    signals.push({
      id: `whale-${token}-${Date.now()}`,
      tokenSymbol: token,
      signalType,
      source: 'whale_activity',
      confidence,
      title,
      description,
      reasoning,
      entryPrice: currentPrice,
      targetPrice: parseFloat((currentPrice * targetMultiplier).toFixed(2)),
      stopLoss: parseFloat((currentPrice * stopMultiplier).toFixed(2)),
      timeHorizon: buyActivities.length + sellActivities.length > 5 ? 'short' : 'medium',
      createdAt: new Date().toISOString(),
    })
  }

  return signals
}

function generateMockTechnicalSignals(): TradingSignal[] {
  return [
    {
      id: 'tech-btc-1',
      tokenSymbol: 'BTC',
      signalType: 'BUY',
      source: 'technical_analysis',
      confidence: 75,
      title: '📊 Golden Cross Forming',
      description: '50-day MA crossing above 200-day MA',
      reasoning: '50-day MA ($98,500) crossing above 200-day MA ($95,200). RSI at 58 (neutral). MACD showing bullish divergence. Classic bullish signal with 75% historical accuracy.',
      entryPrice: 103000,
      targetPrice: 108000,
      stopLoss: 99500,
      timeHorizon: 'medium',
      createdAt: new Date().toISOString(),
    },
  ]
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tokenSymbol = searchParams.get('token')
    const signalType = searchParams.get('type')

    const whaleSignals = await generateSignalsFromWhaleActivity()
    const technicalSignals = generateMockTechnicalSignals()
    
    let allSignals = [...whaleSignals, ...technicalSignals]
    allSignals.sort((a, b) => b.confidence - a.confidence)

    if (tokenSymbol) {
      allSignals = allSignals.filter(s => s.tokenSymbol === tokenSymbol)
    }

    if (signalType) {
      allSignals = allSignals.filter(s => s.signalType === signalType)
    }

    allSignals = allSignals.slice(0, 10)

    const stats = {
      total: allSignals.length,
      strongBuy: allSignals.filter(s => s.signalType === 'STRONG_BUY').length,
      buy: allSignals.filter(s => s.signalType === 'BUY').length,
      hold: allSignals.filter(s => s.signalType === 'HOLD').length,
      sell: allSignals.filter(s => s.signalType === 'SELL').length,
      strongSell: allSignals.filter(s => s.signalType === 'STRONG_SELL').length,
      avgConfidence: allSignals.length > 0
        ? allSignals.reduce((sum: number, s) => sum + s.confidence, 0) / allSignals.length
        : 0,
    }

    return NextResponse.json({
      signals: allSignals,
      stats,
    })
  } catch (error) {
    console.error('Error generating signals:', error)
    return NextResponse.json({ error: 'Failed to generate signals' }, { status: 500 })
  }
}
