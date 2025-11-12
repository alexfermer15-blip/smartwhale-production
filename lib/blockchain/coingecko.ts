// lib/blockchain/coingecko.ts

const COINGECKO_BASE_URL = process.env.NEXT_PUBLIC_COINGECKO_API_URL || 'https://api.coingecko.com/api/v3'

export interface CoinPrice {
  id: string
  symbol: string
  name: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  price_change_24h: number
  price_change_percentage_24h: number
  total_volume: number
  high_24h: number
  low_24h: number
  image: string
}

/**
 * Получить цену ETH в USD
 */
export async function getEthPrice(): Promise<number> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE_URL}/simple/price?ids=ethereum&vs_currencies=usd`
    )
    const data = await response.json()
    return data.ethereum?.usd || 0
  } catch (error) {
    console.error('Error fetching ETH price:', error)
    return 3400 // Fallback price
  }
}

/**
 * Получить цены нескольких криптовалют
 */
export async function getMultiplePrices(coinIds: string[]): Promise<Record<string, number>> {
  try {
    const ids = coinIds.join(',')
    const response = await fetch(
      `${COINGECKO_BASE_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    )
    const data = await response.json()

    const prices: Record<string, number> = {}
    coinIds.forEach((id) => {
      prices[id] = data[id]?.usd || 0
    })

    return prices
  } catch (error) {
    console.error('Error fetching multiple prices:', error)
    return {}
  }
}

/**
 * Получить топ криптовалюты по рыночной капитализации
 */
export async function getTopCoins(limit: number = 10): Promise<CoinPrice[]> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`
    )
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching top coins:', error)
    return []
  }
}

/**
 * Получить детальную информацию о монете
 */
export async function getCoinDetails(coinId: string): Promise<any | null> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE_URL}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`
    )
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching coin details:', error)
    return null
  }
}

/**
 * Получить историю цен
 */
export async function getCoinHistory(
  coinId: string,
  days: number = 7
): Promise<any> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
    )
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching coin history:', error)
    return null
  }
}
