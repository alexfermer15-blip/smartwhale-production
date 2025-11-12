// /utils/fetchPriceHistory.ts

export async function fetchPriceHistory(
  symbol: string,
  days: number = 7
): Promise<{ date: string; value: number }[]> {
  // Маппинг для CoinGecko ID
  const idMap: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    USDT: 'tether',
    BNB: 'binancecoin',
    SOL: 'solana',
    XRP: 'ripple',
    USDC: 'usd-coin',
    ADA: 'cardano',
    DOGE: 'dogecoin',
    TRX: 'tron',
    AVAX: 'avalanche-2',
    DOT: 'polkadot',
    MATIC: 'matic-network',
    LINK: 'chainlink',
    UNI: 'uniswap',
    ATOM: 'cosmos',
    LTC: 'litecoin',
    ETC: 'ethereum-classic',
    OKB: 'okb',
    ICP: 'internet-computer',
    SHIB: 'shiba-inu',
    BCH: 'bitcoin-cash',
    FIL: 'filecoin',
    APT: 'aptos',
    ARB: 'arbitrum',
    OP: 'optimism',
    PEPE: 'pepe',
    RENDER: 'render-token',
    INJ: 'injective-protocol',
    NEAR: 'near',
    GRT: 'the-graph',
    // Добавляй новые тикеры по необходимости
  }

  const cgId = idMap[symbol.toUpperCase()] || symbol.toLowerCase()

  try {
    const url = `/api/proxy/price-history?id=${cgId}&days=${days}`
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`Failed to fetch price history for ${symbol}`)
      return []
    }
    const data = await res.json()
    if (!data.prices || !Array.isArray(data.prices)) {
      return []
    }
    return data.prices.map((arr: [number, number]) => ({
      date: new Date(arr[0]).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      value: arr[1],
    }))
  } catch (error) {
    console.error(`Error fetching price history for ${symbol}:`, error)
    return []
  }
}
