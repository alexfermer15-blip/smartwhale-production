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

interface TechnicalIndicators {
  rsi: number
  macd: number
  bollingerPosition: number
  volumeRatio: number
  volatility: number
  momentum: number
}

import { TOP_ETHEREUM_WHALES, WHALE_LABELS } from '../../../../lib/whale-addresses'

// Используем расширенный список whale адресов
const WHALE_ADDRESSES = TOP_ETHEREUM_WHALES.map((address: string) => ({
  address,
  label: WHALE_LABELS[address] || `Whale ${address.slice(0, 6)}...`
}))

// Кэш токенов
let cachedTokens: CryptoToken[] = []
let lastFetchTime = 0
const CACHE_DURATION = 10 * 60 * 1000 // 10 минут

// Динамические пороги для разных категорий токенов
const CATEGORY_THRESHOLDS = {
  'MEME': {
    volumeMultiplier: 1.5,
    volatilityMultiplier: 1.3,
    confidenceBoost: 0.8
  },
  'AI': {
    volumeMultiplier: 1.2,
    volatilityMultiplier: 1.1,
    confidenceBoost: 0.9
  },
  'DEFI': {
    volumeMultiplier: 1.1,
    volatilityMultiplier: 1.0,
    confidenceBoost: 0.95
  },
  'LAYER2': {
    volumeMultiplier: 1.1,
    volatilityMultiplier: 1.0,
    confidenceBoost: 0.95
  },
  'OTHER': {
    volumeMultiplier: 1.0,
    volatilityMultiplier: 1.0,
    confidenceBoost: 0.9
  }
}

/**
 * Расчет технических индикаторов на основе доступных данных
 */
function calculateTechnicalIndicators(token: CryptoToken, marketData: CryptoToken[]): TechnicalIndicators {
  // Рассчитываем RSI на основе изменения цены за 24ч
  const priceChange = token.priceChange24h
  const rsi = 50 + (priceChange * 2) // Упрощенный RSI на основе 24ч изменения
  
  // MACD на основе тренда цены
  const macd = priceChange / 100
  
  // Позиция относительно Bollinger Bands (упрощенно)
  const avgPriceChange = marketData.reduce((sum, t) => sum + t.priceChange24h, 0) / marketData.length
  const bollingerPosition = (priceChange - avgPriceChange) / (avgPriceChange || 1)
  
  // Отношение объема торгов к среднему
  const avgVolume = marketData.reduce((sum, t) => sum + t.volume24h, 0) / marketData.length
  const volumeRatio = token.volume24h / (avgVolume || 1)
  
  // Волатильность на основе изменения цены
  const volatility = Math.abs(priceChange) / 100
  
  // Моментум на основе изменения цены и объема
  const momentum = (priceChange / 100) * (volumeRatio / 10)
  
  return {
    rsi: Math.max(0, Math.min(100, rsi)),
    macd,
    bollingerPosition,
    volumeRatio,
    volatility,
    momentum
  }
}

/**
 * Генерация сигнала на основе технических индикаторов
 */
function generateTechnicalSignal(token: CryptoToken, indicators: TechnicalIndicators): {
  signalType: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL'
  confidence: number
  reasoning: string
  source: 'whale_activity' | 'technical_analysis' | 'volume_analysis' | 'sentiment'
} {
  const { rsi, macd, bollingerPosition, volumeRatio, volatility, momentum } = indicators
  const thresholds = CATEGORY_THRESHOLDS[token.category as keyof typeof CATEGORY_THRESHOLDS] || CATEGORY_THRESHOLDS.OTHER
  
  // Расчет баллов для каждого типа сигнала
  let buyScore = 0
  let sellScore = 0
  
  // RSI анализ
  if (rsi < 30) buyScore += 25
  else if (rsi < 40) buyScore += 15
  else if (rsi > 70) sellScore += 25
  else if (rsi > 60) sellScore += 15
  
  // MACD анализ
  if (macd > 0.05) buyScore += 20
  else if (macd > 0.02) buyScore += 10
  else if (macd < -0.05) sellScore += 20
  else if (macd < -0.02) sellScore += 10
  
  // Bollinger Bands анализ
  if (bollingerPosition < -0.5) buyScore += 15
  else if (bollingerPosition < -0.2) buyScore += 8
  else if (bollingerPosition > 0.5) sellScore += 15
  else if (bollingerPosition > 0.2) sellScore += 8
  
  // Объем торгов анализ
  const adjustedVolumeRatio = volumeRatio * thresholds.volumeMultiplier
  if (adjustedVolumeRatio > 2) {
    if (momentum > 0) buyScore += 20
    else sellScore += 20
  } else if (adjustedVolumeRatio > 1.5) {
    if (momentum > 0) buyScore += 10
    else sellScore += 10
  }
  
  // Волатильность анализ
  const adjustedVolatility = volatility * thresholds.volatilityMultiplier
  if (adjustedVolatility > 0.1) {
    // Высокая волатильность увеличивает уверенность в сигнале
    if (buyScore > sellScore) buyScore += 10
    else if (sellScore > buyScore) sellScore += 10
  }
  
  // Определение типа сигнала и уверенности
  let signalType: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL'
  let confidence = 0
  let reasoning = ''
  
  if (buyScore >= 60) {
    signalType = 'STRONG_BUY'
    confidence = Math.min(95, 60 + (buyScore - 60) * 0.5) * thresholds.confidenceBoost
    reasoning = `Сильный бычий сигнал: RSI=${rsi.toFixed(1)}, MACD=${macd.toFixed(3)}, Объем=${volumeRatio.toFixed(2)}x среднего. Высокая уверенность в росте на основе технических индикаторов.`
  } else if (buyScore >= 40) {
    signalType = 'BUY'
    confidence = Math.min(85, 50 + (buyScore - 40) * 0.5) * thresholds.confidenceBoost
    reasoning = `Умеренный бычий сигнал: RSI=${rsi.toFixed(1)}, MACD=${macd.toFixed(3)}, Объем=${volumeRatio.toFixed(2)}x среднего. Технические индикаторы указывают на потенциальный рост.`
  } else if (sellScore >= 60) {
    signalType = 'STRONG_SELL'
    confidence = Math.min(95, 60 + (sellScore - 60) * 0.5) * thresholds.confidenceBoost
    reasoning = `Сильный медвежий сигнал: RSI=${rsi.toFixed(1)}, MACD=${macd.toFixed(3)}, Объем=${volumeRatio.toFixed(2)}x среднего. Высокая уверенность в падении на основе технических индикаторов.`
  } else if (sellScore >= 40) {
    signalType = 'SELL'
    confidence = Math.min(85, 50 + (sellScore - 40) * 0.5) * thresholds.confidenceBoost
    reasoning = `Умеренный медвежий сигнал: RSI=${rsi.toFixed(1)}, MACD=${macd.toFixed(3)}, Объем=${volumeRatio.toFixed(2)}x среднего. Технические индикаторы указывают на потенциальное падение.`
  } else {
    signalType = 'HOLD'
    confidence = 50 + Math.abs(buyScore - sellScore) * 0.5
    reasoning = `Нейтральный сигнал: RSI=${rsi.toFixed(1)}, MACD=${macd.toFixed(3)}, Объем=${volumeRatio.toFixed(2)}x среднего. Рынок в консолидации, рекомендуется подождать ясного сигнала.`
  }
  
  return {
    signalType,
    confidence: Math.round(confidence),
    reasoning,
    source: 'technical_analysis'
  }
}

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
 * Генерация улучшенных mock сигналов на основе технического анализа
 */
function generateMockSignals(tokens: CryptoToken[]): TradingSignal[] {
  const signals: TradingSignal[] = []

  for (const token of tokens) {
    // Генерируем технические индикаторы
    const indicators = calculateTechnicalIndicators(token, tokens)
    
    // Генерируем сигнал на основе технического анализа
    const technicalSignal = generateTechnicalSignal(token, indicators)
    
    // Calculate price targets
    const currentPrice = token.currentPrice
    let targetPrice: number
    let stopLoss: number
    let priceMovement: number

    if (technicalSignal.signalType === 'STRONG_BUY' || technicalSignal.signalType === 'BUY') {
      // Для BUY сигналов используем разумные проценты роста
      priceMovement = technicalSignal.signalType === 'STRONG_BUY' ? 0.15 : 0.08 // 15% или 8%
      targetPrice = currentPrice * (1 + priceMovement)
      // Стоп-лосс должен быть ниже цены входа
      stopLoss = currentPrice * (technicalSignal.signalType === 'STRONG_BUY' ? 0.95 : 0.97) // 5% или 3% ниже
    } else if (technicalSignal.signalType === 'HOLD') {
      // Для HOLD сигналов небольшое движение
      priceMovement = 0.03 // 3%
      targetPrice = currentPrice * (1 + priceMovement)
      stopLoss = currentPrice * 0.95 // 5% ниже
    } else {
      // Для SELL сигналов
      priceMovement = technicalSignal.signalType === 'STRONG_SELL' ? -0.12 : -0.06 // -12% или -6%
      targetPrice = currentPrice * (1 + priceMovement)
      // Стоп-лосс для шортов должен быть выше цены входа
      stopLoss = currentPrice * (technicalSignal.signalType === 'STRONG_SELL' ? 1.05 : 1.03) // 5% или 3% выше
    }

    // Time horizon based on volatility
    let timeHorizon: 'short' | 'medium' | 'long'
    if (indicators.volatility > 0.1) timeHorizon = 'short'
    else if (indicators.volatility > 0.05) timeHorizon = 'medium'
    else timeHorizon = 'long'

    // Title and description
    let title: string
    let description: string

    switch (technicalSignal.signalType) {
      case 'STRONG_BUY':
        title = `🚀 Strong Buy Signal - ${token.name} Breaking Out`
        description = `Сильный бычий сигнал для ${token.symbol} на основе технического анализа. Целевая цена: $${targetPrice.toFixed(6)} (+${(priceMovement * 100).toFixed(2)}%)`
        break
      case 'BUY':
        title = `📈 Buy Signal - ${token.name} Bullish Setup`
        description = `Умеренный бычий сигнал для ${token.symbol} на основе технических индикаторов. Потенциальный рост до $${targetPrice.toFixed(6)}`
        break
      case 'HOLD':
        title = `⏸️ Hold Signal - ${token.name} Consolidating`
        description = `${token.symbol} в фазе консолидации. Рекомендуется дождаться ясного сигнала перед входом в позицию`
        break
      case 'SELL':
        title = `📉 Sell Signal - ${token.name} Distribution Phase`
        description = `Умеренный медвежий сигнал для ${token.symbol}. Рассмотрите снижение позиций. Цель: $${targetPrice.toFixed(6)}`
        break
      case 'STRONG_SELL':
        title = `⚠️ Strong Sell Signal - ${token.name} Heavy Selling`
        description = `Сильный медвежий сигнал для ${token.symbol}. Высокий риск дальнейшего снижения до $${targetPrice.toFixed(6)}`
        break
    }

    // Проверяем валидность параметров сигнала
    if (validateSignalParams(currentPrice, targetPrice, stopLoss, technicalSignal.signalType)) {
      signals.push({
        id: `signal-${token.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tokenSymbol: token.symbol,
        tokenName: token.name,
        tokenImage: token.image,
        signalType: technicalSignal.signalType,
        source: technicalSignal.source,
        confidence: technicalSignal.confidence,
        title,
        description,
        reasoning: `${technicalSignal.reasoning} Entry price: $${currentPrice.toFixed(6)}, Target: $${targetPrice.toFixed(6)}, Stop Loss: $${stopLoss.toFixed(6)}.`,
        entryPrice: currentPrice,
        targetPrice,
        stopLoss,
        timeHorizon,
        createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        category: token.category,
      })
    } else {
      console.warn(`Skipping invalid signal for ${token.symbol}: ${technicalSignal.signalType}`)
    }
 }

  return signals.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Улучшенный анализ активности китов с техническим анализом
 */
async function analyzeWhaleActivity(tokens: CryptoToken[]): Promise<TradingSignal[]> {
  const signals: TradingSignal[] = []

 try {
    console.log('[DEBUG] Starting enhanced whale and technical analysis...')
    
    // Получаем реальные данные о транзакциях китов
    const whaleActivityUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/whales/activity`
    console.log('[DEBUG] Fetching whale activity from:', whaleActivityUrl)
    
    const whaleActivityResponse = await fetch(whaleActivityUrl)
    const whaleActivityData = await whaleActivityResponse.json()
    const whaleActivities = whaleActivityData.activities || []
    
    console.log('[DEBUG] Whale activities response:', {
      status: whaleActivityResponse.status,
      activitiesCount: whaleActivities.length,
      firstActivity: whaleActivities[0] ? {
        txType: whaleActivities[0].txType,
        tokenSymbol: whaleActivities[0].tokenSymbol,
        amountUsd: whaleActivities[0].amountUsd
      } : null
    })

    // Получаем технические индикаторы для всех токенов
    const technicalIndicators = new Map<string, TechnicalIndicators>()
    for (const token of tokens) {
      technicalIndicators.set(token.symbol, calculateTechnicalIndicators(token, tokens))
    }

    for (const token of tokens) {
      // Анализируем активность китов по конкретному токену
      const tokenActivities = whaleActivities.filter((activity: any) =>
        activity.tokenSymbol.toLowerCase() === token.symbol.toLowerCase()
      )
      
      // Calculate buy/sell activity for this token
      const buyActivity = tokenActivities.filter((activity: any) => activity.txType === 'buy').length
      const sellActivity = tokenActivities.filter((activity: any) => activity.txType === 'sell').length
      const totalActivity = tokenActivities.length
      const netActivity = buyActivity - sellActivity

      // Calculate USD volumes
      const buyVolume = tokenActivities
        .filter((activity: any) => activity.txType === 'buy')
        .reduce((sum: number, activity: any) => sum + activity.amountUsd, 0)
      const sellVolume = tokenActivities
        .filter((activity: any) => activity.txType === 'sell')
        .reduce((sum: number, activity: any) => sum + activity.amountUsd, 0)
      const netVolume = buyVolume - sellVolume
      
      // Получаем технические индикаторы для токена
      const indicators = technicalIndicators.get(token.symbol) || calculateTechnicalIndicators(token, tokens)
      
      // Генерируем сигнал на основе технического анализа
      const technicalSignal = generateTechnicalSignal(token, indicators)
      
      // Определяем финальный сигнал на основе комбинированного анализа
      let finalSignalType: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL'
      let finalConfidence: number
      let finalReasoning: string
      let finalSource: 'whale_activity' | 'technical_analysis' | 'volume_analysis' | 'sentiment'
      
      // Если есть значительная активность китов, используем комбинированный подход
      if (totalActivity > 0) {
        // Взвешиваем сигналы от китов и технического анализа
        const whaleWeight = Math.min(0.7, totalActivity * 0.1) // Максимальный вес 70% для активности китов
        const technicalWeight = 1 - whaleWeight
        
        // Конвертируем типы сигналов в числовые значения для сравнения
        const signalValues = {
          'STRONG_BUY': 2,
          'BUY': 1,
          'HOLD': 0,
          'SELL': -1,
          'STRONG_SELL': -2
        }
        
        // Определяем сигнал от китов
        let whaleSignalType: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL'
        if (netActivity > 5 && netVolume > 100000) {
          whaleSignalType = 'STRONG_BUY'
        } else if (netActivity > 2 && netVolume > 50000) {
          whaleSignalType = 'BUY'
        } else if (netActivity < -5 && netVolume < -10000) {
          whaleSignalType = 'STRONG_SELL'
        } else if (netActivity < -2 && netVolume < -5000) {
          whaleSignalType = 'SELL'
        } else {
          whaleSignalType = 'HOLD'
        }
        
        // Комбинируем сигналы
        const whaleValue = signalValues[whaleSignalType]
        const technicalValue = signalValues[technicalSignal.signalType]
        const combinedValue = whaleValue * whaleWeight + technicalValue * technicalWeight
        
        // Определяем финальный сигнал на основе комбинированного значения
        if (combinedValue >= 1.5) {
          finalSignalType = 'STRONG_BUY'
        } else if (combinedValue >= 0.5) {
          finalSignalType = 'BUY'
        } else if (combinedValue > -0.5) {
          finalSignalType = 'HOLD'
        } else if (combinedValue > -1.5) {
          finalSignalType = 'SELL'
        } else {
          finalSignalType = 'STRONG_SELL'
        }
        
        // Комбинируем уверенность
        finalConfidence = (technicalSignal.confidence * technicalWeight +
                           Math.min(90, 50 + Math.abs(netActivity) * 5) * whaleWeight)
        
        // Комбинируем обоснование
        finalReasoning = `Комбинированный анализ: ${technicalSignal.reasoning.substring(0, 100)}... Активность китов: ${buyActivity} покупок, ${sellActivity} продаж, чистый объем: $${Math.abs(netVolume).toLocaleString()}.`
        finalSource = 'whale_activity'
      } else {
        // Если нет активности китов, используем только технический анализ
        finalSignalType = technicalSignal.signalType
        finalConfidence = technicalSignal.confidence
        finalReasoning = technicalSignal.reasoning
        finalSource = technicalSignal.source
      }

      // Calculate price targets based on signal type
      const currentPrice = token.currentPrice
      let targetPrice: number
      let stopLoss: number
      let priceMovement: number

      if (finalSignalType === 'STRONG_BUY' || finalSignalType === 'BUY') {
        // Для BUY сигналов используем разумные проценты роста
        priceMovement = finalSignalType === 'STRONG_BUY' ? 0.15 : 0.08 // 15% или 8%
        targetPrice = currentPrice * (1 + priceMovement)
        // Стоп-лосс должен быть ниже цены входа
        stopLoss = currentPrice * (finalSignalType === 'STRONG_BUY' ? 0.95 : 0.97) // 5% или 3% ниже
      } else if (finalSignalType === 'HOLD') {
        // Для HOLD сигналов небольшое движение
        priceMovement = 0.03 // 3%
        targetPrice = currentPrice * (1 + priceMovement)
        stopLoss = currentPrice * 0.95 // 5% ниже
      } else {
        // Для SELL сигналов
        priceMovement = finalSignalType === 'STRONG_SELL' ? -0.12 : -0.06 // -12% или -6%
        targetPrice = currentPrice * (1 + priceMovement)
        // Стоп-лосс для шортов должен быть выше цены входа
        stopLoss = currentPrice * (finalSignalType === 'STRONG_SELL' ? 1.05 : 1.03) // 5% или 3% выше
      }

      // Time horizon based on signal strength and volatility
      let timeHorizon: 'short' | 'medium' | 'long'
      if (Math.abs(finalSignalType === 'STRONG_BUY' || finalSignalType === 'STRONG_SELL' ? 2 :
                   finalSignalType === 'BUY' || finalSignalType === 'SELL' ? 1 : 0) > 1 ||
          indicators.volatility > 0.1) {
        timeHorizon = 'short'
      } else if (Math.abs(finalSignalType === 'STRONG_BUY' || finalSignalType === 'STRONG_SELL' ? 2 :
                          finalSignalType === 'BUY' || finalSignalType === 'SELL' ? 1 : 0) > 0 ||
                 indicators.volatility > 0.05) {
        timeHorizon = 'medium'
      } else {
        timeHorizon = 'long'
      }

      // Title and description
      let title: string
      let description: string

      switch (finalSignalType) {
        case 'STRONG_BUY':
          title = `🚀 Strong Buy Signal - ${token.name} Breaking Out`
          description = `Сильный бычий сигнал для ${token.symbol} на основе комбинированного анализа. Целевая цена: $${targetPrice.toFixed(6)} (+${(priceMovement * 100).toFixed(2)}%)`
          break
        case 'BUY':
          title = `📈 Buy Signal - ${token.name} Bullish Setup`
          description = `Умеренный бычий сигнал для ${token.symbol} на основе технических индикаторов. Потенциальный рост до $${targetPrice.toFixed(6)}`
          break
        case 'HOLD':
          title = `⏸️ Hold Signal - ${token.name} Consolidating`
          description = `${token.symbol} в фазе консолидации. Рекомендуется дождаться ясного сигнала перед входом в позицию`
          break
        case 'SELL':
          title = `📉 Sell Signal - ${token.name} Distribution Phase`
          description = `Умеренный медвежий сигнал для ${token.symbol}. Рассмотрите снижение позиций. Цель: $${targetPrice.toFixed(6)}`
          break
        case 'STRONG_SELL':
          title = `⚠️ Strong Sell Signal - ${token.name} Heavy Selling`
          description = `Сильный медвежий сигнал для ${token.symbol}. Высокий риск дальнейшего снижения до $${targetPrice.toFixed(6)}`
          break
      }

      // Validate signal parameters
      if (validateSignalParams(currentPrice, targetPrice, stopLoss, finalSignalType)) {
        signals.push({
          id: `signal-${token.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          tokenSymbol: token.symbol,
          tokenName: token.name,
          tokenImage: token.image,
          signalType: finalSignalType,
          source: finalSource,
          confidence: Math.round(finalConfidence),
          title,
          description,
          reasoning: `${finalReasoning} Entry price: $${currentPrice.toFixed(6)}, Target: $${targetPrice.toFixed(6)}, Stop Loss: $${stopLoss.toFixed(6)}.`,
          entryPrice: currentPrice,
          targetPrice,
          stopLoss,
          timeHorizon,
          createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          category: token.category,
        })
      } else {
        console.warn(`Skipping invalid signal for ${token.symbol}: ${finalSignalType}`)
      }
    }

    return signals.sort((a, b) => b.confidence - a.confidence)
  } catch (error) {
    console.error('Error analyzing whale activity:', error)
    // Возвращаем сигналы на основе технического анализа при ошибке получения реальных данных
    const signals: TradingSignal[] = []
    for (const token of tokens) {
      const indicators = calculateTechnicalIndicators(token, tokens)
      const technicalSignal = generateTechnicalSignal(token, indicators)
      
      // Calculate price targets
      const currentPrice = token.currentPrice
      let targetPrice: number
      let stopLoss: number
      let priceMovement: number

      if (technicalSignal.signalType === 'STRONG_BUY' || technicalSignal.signalType === 'BUY') {
        priceMovement = technicalSignal.signalType === 'STRONG_BUY' ? 0.15 : 0.08
        targetPrice = currentPrice * (1 + priceMovement)
        stopLoss = currentPrice * (technicalSignal.signalType === 'STRONG_BUY' ? 0.95 : 0.97)
      } else if (technicalSignal.signalType === 'HOLD') {
        priceMovement = 0.03
        targetPrice = currentPrice * (1 + priceMovement)
        stopLoss = currentPrice * 0.95
      } else {
        priceMovement = technicalSignal.signalType === 'STRONG_SELL' ? -0.12 : -0.06
        targetPrice = currentPrice * (1 + priceMovement)
        stopLoss = currentPrice * (technicalSignal.signalType === 'STRONG_SELL' ? 1.05 : 1.03)
      }

      // Time horizon
      let timeHorizon: 'short' | 'medium' | 'long'
      if (indicators.volatility > 0.1) timeHorizon = 'short'
      else if (indicators.volatility > 0.05) timeHorizon = 'medium'
      else timeHorizon = 'long'

      // Title and description
      let title: string
      let description: string

      switch (technicalSignal.signalType) {
        case 'STRONG_BUY':
          title = `🚀 Strong Buy Signal - ${token.name} Breaking Out`
          description = `Сильный бычий сигнал для ${token.symbol} на основе технического анализа. Целевая цена: $${targetPrice.toFixed(6)}`
          break
        case 'BUY':
          title = `📈 Buy Signal - ${token.name} Bullish Setup`
          description = `Умеренный бычий сигнал для ${token.symbol} на основе технических индикаторов. Потенциальный рост до $${targetPrice.toFixed(6)}`
          break
        case 'HOLD':
          title = `⏸️ Hold Signal - ${token.name} Consolidating`
          description = `${token.symbol} в фазе консолидации. Рекомендуется дождаться ясного сигнала перед входом в позицию`
          break
        case 'SELL':
          title = `📉 Sell Signal - ${token.name} Distribution Phase`
          description = `Умеренный медвежий сигнал для ${token.symbol}. Рассмотрите снижение позиций. Цель: $${targetPrice.toFixed(6)}`
          break
        case 'STRONG_SELL':
          title = `⚠️ Strong Sell Signal - ${token.name} Heavy Selling`
          description = `Сильный медвежий сигнал для ${token.symbol}. Высокий риск дальнейшего снижения до $${targetPrice.toFixed(6)}`
          break
      }

      if (validateSignalParams(currentPrice, targetPrice, stopLoss, technicalSignal.signalType)) {
        signals.push({
          id: `signal-${token.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          tokenSymbol: token.symbol,
          tokenName: token.name,
          tokenImage: token.image,
          signalType: technicalSignal.signalType,
          source: technicalSignal.source,
          confidence: technicalSignal.confidence,
          title,
          description,
          reasoning: `${technicalSignal.reasoning} Entry price: $${currentPrice.toFixed(6)}, Target: $${targetPrice.toFixed(6)}, Stop Loss: $${stopLoss.toFixed(6)}.`,
          entryPrice: currentPrice,
          targetPrice,
          stopLoss,
          timeHorizon,
          createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          category: token.category,
        })
      }
    }
    
    return signals.sort((a, b) => b.confidence - a.confidence)
  }
}

/**
 * Валидация параметров сигнала
 */
function validateSignalParams(currentPrice: number, targetPrice: number, stopLoss: number, signalType: string): boolean {
  // Проверяем, что цены положительные
  if (currentPrice <= 0 || targetPrice <= 0 || stopLoss <= 0) {
    console.error(`Invalid price values: currentPrice=${currentPrice}, targetPrice=${targetPrice}, stopLoss=${stopLoss}`)
    return false
  }

  // Проверяем логические соотношения цен в зависимости от типа сигнала
  if (signalType === 'STRONG_BUY' || signalType === 'BUY') {
    // Для BUY сигналов: targetPrice > currentPrice > stopLoss
    if (!(targetPrice > currentPrice && currentPrice > stopLoss)) {
      console.error(`Invalid price relationship for BUY signal: targetPrice=${targetPrice}, currentPrice=${currentPrice}, stopLoss=${stopLoss}`)
      return false
    }
  } else if (signalType === 'STRONG_SELL' || signalType === 'SELL') {
    // Для SELL сигналов: currentPrice > stopLoss и targetPrice < currentPrice
    if (!(currentPrice > stopLoss && targetPrice < currentPrice)) {
      console.error(`Invalid price relationship for SELL signal: targetPrice=${targetPrice}, currentPrice=${currentPrice}, stopLoss=${stopLoss}`)
      return false
    }
  } else if (signalType === 'HOLD') {
    // Для HOLD сигналов: targetPrice и stopLoss должны быть в разумном диапазоне от currentPrice
    const maxTarget = currentPrice * 1.1; // Максимум 10% роста
    const minTarget = currentPrice * 0.9; // Минимум 10% падения
    const maxStop = currentPrice * 1.05; // Максимальный стоп-лосс 5% выше
    const minStop = currentPrice * 0.95; // Минимальный стоп-лосс 5% ниже
    
    if (targetPrice > maxTarget || targetPrice < minTarget || stopLoss > maxStop || stopLoss < minStop) {
      console.error(`Invalid price relationship for HOLD signal: targetPrice=${targetPrice}, currentPrice=${currentPrice}, stopLoss=${stopLoss}`)
      return false
    }
  }

  // Проверяем, что соотношения цен разумны (не слишком большие различия)
  const targetRatio = Math.abs(targetPrice / currentPrice)
  const stopRatio = Math.abs(stopLoss / currentPrice)
  
  if (targetRatio > 10 || targetRatio < 0.1) {
    console.error(`Unrealistic target price ratio: ${targetRatio}`)
    return false
  }
  
  if (stopRatio > 10 || stopRatio < 0.1) {
    console.error(`Unrealistic stop loss ratio: ${stopRatio}`)
    return false
  }

  return true
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
