import axios from 'axios'

const COINGECKO_API = 'https://api.coingecko.com/api/v3'

interface CryptoPrice {
  symbol: string
  name: string
  price: number
  change24h: number
  marketCap: number
  volume: number
}

interface HistoricalData {
  date: string
  price: number
}

// Получить текущие цены
export async function getCryptoPrices(
  cryptoIds: string[] = ['bitcoin', 'ethereum', 'solana']
): Promise<CryptoPrice[]> {
  try {
    const response = await axios.get(`${COINGECKO_API}/simple/price`, {
      params: {
        ids: cryptoIds.join(','),
        vs_currencies: 'usd',
        include_market_cap: true,
        include_24hr_vol: true,
        include_24hr_change: true,
      },
    })

    const data = response.data

    return [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: data.bitcoin.usd,
        change24h: data.bitcoin.usd_24h_change,
        marketCap: data.bitcoin.usd_market_cap,
        volume: data.bitcoin.usd_24h_vol,
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        price: data.ethereum.usd,
        change24h: data.ethereum.usd_24h_change,
        marketCap: data.ethereum.usd_market_cap,
        volume: data.ethereum.usd_24h_vol,
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        price: data.solana.usd,
        change24h: data.solana.usd_24h_change,
        marketCap: data.solana.usd_market_cap,
        volume: data.solana.usd_24h_vol,
      },
    ]
  } catch (error) {
    console.error('Error fetching crypto prices:', error)
    return []
  }
}

// Получить исторические данные (last 7 days)
export async function getHistoricalData(
  cryptoId: string = 'bitcoin'
): Promise<HistoricalData[]> {
  try {
    const response = await axios.get(
      `${COINGECKO_API}/coins/${cryptoId}/market_chart`,
      {
        params: {
          vs_currency: 'usd',
          days: '7',
          interval: 'daily',
        },
      }
    )

    const prices = response.data.prices

    return prices.map((item: [number, number]) => {
      const date = new Date(item[0])
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: Math.round(item[1]),
      }
    })
  } catch (error) {
    console.error('Error fetching historical data:', error)
    return []
  }
}

// Генерируем мок портфель с реальными ценами
export async function generateRealPortfolio() {
  try {
    const prices = await getCryptoPrices()

    const holdings = [
      { symbol: 'BTC', amount: 0.5, price: prices[0]?.price || 43250 },
      { symbol: 'ETH', amount: 5, price: prices[1]?.price || 2350 },
      { symbol: 'SOL', amount: 100, price: prices[2]?.price || 103.2 },
    ]

    let totalValue = 0
    holdings.forEach(hold => {
      totalValue += hold.amount * hold.price
    })

    return { holdings, totalValue, prices }
  } catch (error) {
    console.error('Error generating portfolio:', error)
    return { holdings: [], totalValue: 0, prices: [] }
  }
}
