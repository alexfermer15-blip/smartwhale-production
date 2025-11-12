// utils/fetch-tokens.ts

export interface CryptoToken {
  id: string
  symbol: string
  name: string
  currentPrice: number
  marketCap: number
  priceChange24h: number
  volume24h: number
  image: string
  category?: string
}

/**
 * Получение актуальных токенов с CoinGecko API
 */
export async function fetchCryptoTokens(limit: number = 250): Promise<CryptoToken[]> {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 } // Кэш на 5 минут
    })

    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status}`)
      return getFallbackTokens()
    }

    const data = await response.json()

    return data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      currentPrice: coin.current_price || 0,
      marketCap: coin.market_cap || 0,
      priceChange24h: coin.price_change_percentage_24h || 0,
      volume24h: coin.total_volume || 0,
      image: coin.image,
      category: detectCategory(coin.id, coin.symbol, coin.name),
    }))
  } catch (error) {
    console.error('Error fetching crypto tokens:', error)
    return getFallbackTokens()
  }
}

/**
 * Определяет категорию токена
 */
function detectCategory(id: string, symbol: string, name: string): string {
  const lowerId = id.toLowerCase()
  const lowerName = name.toLowerCase()

  if (
    lowerId.includes('doge') ||
    lowerId.includes('shib') ||
    lowerId.includes('pepe') ||
    lowerId.includes('floki') ||
    lowerName.includes('meme') ||
    lowerName.includes('inu')
  ) return 'MEME'

  if (
    lowerId.includes('render') ||
    lowerId.includes('fetch') ||
    lowerId.includes('ocean') ||
    lowerName.includes('ai') ||
    lowerName.includes('artificial')
  ) return 'AI'

  if (
    lowerId.includes('uni') ||
    lowerId.includes('aave') ||
    lowerId.includes('curve') ||
    lowerId.includes('maker') ||
    lowerName.includes('defi') ||
    lowerName.includes('swap')
  ) return 'DEFI'

  if (
    lowerId.includes('arbitrum') ||
    lowerId.includes('optimism') ||
    lowerId.includes('polygon') ||
    lowerName.includes('layer 2')
  ) return 'LAYER2'

  return 'OTHER'
}

/**
 * Fallback токены на случай ошибки API
 */
function getFallbackTokens(): CryptoToken[] {
  return [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', currentPrice: 94500, marketCap: 1850000000000, priceChange24h: 2.5, volume24h: 35000000000, image: '', category: 'OTHER' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', currentPrice: 3420, marketCap: 410000000000, priceChange24h: 1.8, volume24h: 18000000000, image: '', category: 'OTHER' },
    { id: 'solana', symbol: 'SOL', name: 'Solana', currentPrice: 245, marketCap: 110000000000, priceChange24h: 5.2, volume24h: 4200000000, image: '', category: 'LAYER2' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB', currentPrice: 625, marketCap: 91000000000, priceChange24h: -0.8, volume24h: 2100000000, image: '', category: 'OTHER' },
    { id: 'polygon', symbol: 'MATIC', name: 'Polygon', currentPrice: 0.89, marketCap: 8200000000, priceChange24h: 3.1, volume24h: 420000000, image: '', category: 'LAYER2' },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', currentPrice: 21.5, marketCap: 13500000000, priceChange24h: 1.2, volume24h: 850000000, image: '', category: 'DEFI' },
    { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', currentPrice: 13.2, marketCap: 9900000000, priceChange24h: 4.7, volume24h: 310000000, image: '', category: 'DEFI' },
  ]
}
