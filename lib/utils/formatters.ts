// lib/utils/formatters.ts

/**
 * Форматировать USD
 */
export function formatUSD(amount: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

/**
 * Форматировать большие числа (1M, 1B, etc)
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}

/**
 * Форматировать адрес кошелька
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/**
 * Форматировать timestamp в "X ago"
 */
export function formatTimeAgo(timestamp: string | number): string {
  const now = Date.now()
  const then = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp * 1000
  const diff = now - then

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return `${seconds}s ago`
}

/**
 * Определить тип транзакции
 */
export function detectTransactionType(
  from: string,
  to: string,
  value: string,
  knownWhales: string[]
): 'buy' | 'sell' | 'transfer' {
  const valueInEth = parseFloat(value) / 1e18

  // If sending to known exchange -> likely selling
  const exchanges = [
    '0x28C6c06298d514Db089934071355E5743bf21d60', // Binance
    '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549', // Binance
    // Add more exchange addresses
  ]

  if (exchanges.includes(to.toLowerCase())) {
    return 'sell'
  }

  if (exchanges.includes(from.toLowerCase())) {
    return 'buy'
  }

  return 'transfer'
}

/**
 * Определить severity транзакции по объему
 */
export function calculateSeverity(usdValue: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (usdValue >= 10000000) return 'HIGH'
  if (usdValue >= 1000000) return 'MEDIUM'
  return 'LOW'
}
