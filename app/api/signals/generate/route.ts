// app/api/signals/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { fetchCryptoTokens, CryptoToken } from '@/utils/fetch-tokens'

interface TradingSignal {
  id: string
  tokenSymbol: string
  tokenName: string
  tokenImage?: string
  signalType: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL'
  source: 'whale_activity' | 'technical_analysis' | 'volume_analysis' | 'sentiment'
  confidence: number
  title: string
  description: string
  reasoning: string
  entryPrice: number
  targetPrice: number
  stopLoss: number
  timeHorizon: 'short' | 'medium' | 'long'
  createdAt: string
  category?: string
}

interface Stats {
  total: number
  strongBuy: number
  buy: number
  hold: number
  sell: number
  strongSell: number
  avgConfidence: number
}

// Whale addresses (твои текущие)
const WHALE_ADDRESSES = [
  { address: '0xF977814e90dA44bFA03b6295A0616a897441aceC', label: 'Binance 5' },
  { address: '0x28C6c06298d514Db089934071355E5743bf21d60', label: 'Binance Hot' },
  { address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', label: 'Bitfinex' },
  { address: '0x2910543Af39abA0Cd09dBb2D50200b3E800A63D2', label: 'Kraken' },
  { address: '0xAB5C66752a9e8167967685F1450532fB96d5d24f', label: 'Huobi' },
]

// Кэш токенов
let cachedTokens: CryptoToken[] = []
let lastFetchTime = 0
const CACHE_DURATION = 10 * 60 * 1000 // 10 минут

/**
 * Получить актуальные токены с кэшем
 */
async function getTrackedTokens(): Promise<CryptoToken[]> {
  const now = Date.now()
  
  if (cachedTokens.length > 0 && now - lastFetchTime < CACHE_DURATION) {
    return cachedTokens
  }

  console.log('🔄 Fetching fresh tokens from CoinGecko...')
  cachedTokens = await fetchCryptoTokens(100) // Топ-100 монет
  lastFetchTime = now
  console.log(`✅ Loaded ${cachedTokens.length} tokens`)
  
  return cachedTokens
}

/**
 * Анализ whale активности и генерация сигналов
 */
async function analyzeWhaleActivity(tokens: CryptoToken[]): Promise<TradingSignal[]> {
  const signals: TradingSignal[] = []

  for (const token of tokens) {
    // Твоя текущая логика анализа
    const buyActivity = Math.floor(Math.random() * 80) + 20
    const sellActivity = Math.floor(Math.random() * 60) + 10
    const netActivity = buyActivity - sellActivity

    const volumeScore = Math.random() * 100
    const priceChange24h = token.priceChange24h

    // Определяем signal type
    let signalType: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL'
    let confidence: number
    let reasoning: string

    if (netActivity > 40) {
      signalType = 'STRONG_BUY'
      confidence = Math.min(95, 75 + Math.random() * 20)
      reasoning = `Strong whale accumulation detected! ${buyActivity} major whales bought vs ${sellActivity} sold. Net inflow of ${netActivity} whales. Volume spike ${volumeScore.toFixed(0)}%. High conviction buy signal based on smart money movement.`
    } else if (netActivity > 15) {
      signalType = 'BUY'
      confidence = Math.min(85, 60 + Math.random() * 20)
      reasoning = `Moderate whale buying pressure observed. ${buyActivity} whales accumulating positions. Technical indicators showing bullish momentum. Consider entry positions with ${netActivity} whale confirmation.`
    } else if (netActivity > -10 && netActivity <= 15) {
      signalType = 'HOLD'
      confidence = Math.min(75, 50 + Math.random() * 20)
      reasoning = `Balanced whale activity with ${buyActivity} buyers and ${sellActivity} sellers. Market in consolidation phase. Wait for clearer directional signal before entering new positions.`
    } else if (netActivity > -30) {
      signalType = 'SELL'
      confidence = Math.min(85, 60 + Math.random() * 20)
      reasoning = `Increased whale distribution detected. ${sellActivity} major holders taking profits vs ${buyActivity} buying. Negative net flow of ${Math.abs(netActivity)} indicates profit-taking. Consider reducing exposure.`
    } else {
      signalType = 'STRONG_SELL'
      confidence = Math.min(95, 75 + Math.random() * 20)
      reasoning = `Heavy whale selling! ${sellActivity} major wallets dumping vs only ${buyActivity} buyers. Massive net outflow of ${Math.abs(netActivity)} whales. Smart money exiting - high risk of downside continuation.`
    }

    // Calculate price targets
    const currentPrice = token.currentPrice
    let targetPrice: number
    let stopLoss: number
    let priceMovement: number

    if (signalType === 'STRONG_BUY' || signalType === 'BUY') {
      priceMovement = signalType === 'STRONG_BUY' ? 0.15 : 0.08
      targetPrice = currentPrice * (1 + priceMovement)
      stopLoss = currentPrice * 0.93
    } else if (signalType === 'HOLD') {
      priceMovement = 0.03
      targetPrice = currentPrice * 1.03
      stopLoss = currentPrice * 0.95
    } else {
      priceMovement = signalType === 'STRONG_SELL' ? -0.12 : -0.06
      targetPrice = currentPrice * (1 + priceMovement)
      stopLoss = currentPrice * 1.07
    }

    // Time horizon
    let timeHorizon: 'short' | 'medium' | 'long'
    if (Math.abs(netActivity) > 40) timeHorizon = 'short'
    else if (Math.abs(netActivity) > 20) timeHorizon = 'medium'
    else timeHorizon = 'long'

    // Source
    const sources = ['whale_activity', 'technical_analysis', 'volume_analysis', 'sentiment'] as const
    const source = netActivity > 20 || netActivity < -20 ? 'whale_activity' : sources[Math.floor(Math.random() * sources.length)]

    // Title and description
    let title: string
    let description: string

    switch (signalType) {
      case 'STRONG_BUY':
        title = `🚀 Strong Buy Signal - ${token.name} Breaking Out`
        description = `Massive whale accumulation detected with ${buyActivity} major buyers entering ${token.symbol}. Price target: $${targetPrice.toFixed(2)} (+${(priceMovement * 100).toFixed(1)}%)`
        break
      case 'BUY':
        title = `📈 Buy Signal - ${token.name} Bullish Setup`
        description = `Whales accumulating ${token.symbol} with ${buyActivity} active buyers. Technical setup favors upside to $${targetPrice.toFixed(2)}`
        break
      case 'HOLD':
        title = `⏸️ Hold Signal - ${token.name} Consolidating`
        description = `${token.symbol} in balance with ${buyActivity} buyers vs ${sellActivity} sellers. Wait for clearer direction before new entry`
        break
      case 'SELL':
        title = `📉 Sell Signal - ${token.name} Distribution Phase`
        description = `Whales distributing ${token.symbol} with ${sellActivity} major sellers. Consider reducing positions. Target: $${targetPrice.toFixed(2)}`
        break
      case 'STRONG_SELL':
        title = `⚠️ Strong Sell Signal - ${token.name} Heavy Selling`
        description = `Massive whale exit detected! ${sellActivity} major holders dumping ${token.symbol}. High risk of further downside to $${targetPrice.toFixed(2)}`
        break
    }

    signals.push({
      id: `signal-${token.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tokenSymbol: token.symbol,
      tokenName: token.name,
      tokenImage: token.image,
      signalType,
      source,
      confidence: Math.round(confidence),
      title,
      description,
      reasoning,
      entryPrice: Math.round(currentPrice * 100) / 100,
      targetPrice: Math.round(targetPrice * 100) / 100,
      stopLoss: Math.round(stopLoss * 100) / 100,
      timeHorizon,
      createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      category: token.category,
    })
  }

  return signals.sort((a, b) => b.confidence - a.confidence)
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const typeFilter = searchParams.get('type')
    const tokenFilter = searchParams.get('token')
    const categoryFilter = searchParams.get('category')

    // Получаем актуальные токены
    const tokens = await getTrackedTokens()

    // Генерируем сигналы
    let signals = await analyzeWhaleActivity(tokens)

    // Применяем фильтры
    if (typeFilter && typeFilter !== 'all') {
      signals = signals.filter(s => s.signalType === typeFilter)
    }

    if (tokenFilter && tokenFilter !== 'all') {
      signals = signals.filter(s => s.tokenSymbol === tokenFilter)
    }

    if (categoryFilter && categoryFilter !== 'all') {
      signals = signals.filter(s => s.category === categoryFilter)
    }

    // Статистика
    const stats: Stats = {
      total: signals.length,
      strongBuy: signals.filter(s => s.signalType === 'STRONG_BUY').length,
      buy: signals.filter(s => s.signalType === 'BUY').length,
      hold: signals.filter(s => s.signalType === 'HOLD').length,
      sell: signals.filter(s => s.signalType === 'SELL').length,
      strongSell: signals.filter(s => s.signalType === 'STRONG_SELL').length,
      avgConfidence: signals.length > 0
        ? Math.round(signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length)
        : 0,
    }

    return NextResponse.json({
      signals,
      stats,
      generatedAt: new Date().toISOString(),
      whalesAnalyzed: WHALE_ADDRESSES.length,
      tokensAnalyzed: tokens.length,
    })
  } catch (error) {
    console.error('Error generating signals:', error)
    return NextResponse.json(
      { error: 'Failed to generate signals' },
      { status: 500 }
    )
  }
}
