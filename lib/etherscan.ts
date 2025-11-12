// lib/etherscan.ts

interface EtherscanBalance {
  account: string
  balance: string
}

interface EtherscanResponse {
  status: string
  message: string
  result: string | EtherscanBalance[]
}

interface WhaleWallet {
  address: string
  balance: number
  balanceUSD: number
  label?: string
}

// Top Ethereum whale addresses (known exchanges, DeFi protocols, etc.)
export const KNOWN_WHALE_ADDRESSES = [
  {
    address: '0xBE0eB53F46cd790d1d3851d5EFf43D12404d33E8',
    label: 'Binance: Hot Wallet',
  },
  {
    address: '0xF977814e90dA44bFA03b6295A0616a897441aceC',
    label: 'Binance: Hot Wallet 2',
  },
  {
    address: '0x8D12A197cB00D4747a1fe03395095ce2A5CC6819',
    label: 'Kraken: Exchange',
  },
  {
    address: '0xDA9dfA130Df4dE4673b89022EE50ff26f6EA73Cf',
    label: 'Kraken: Hot Wallet',
  },
  {
    address: '0x2910543Af39abA0Cd09dBb2D50200b3E800A63D2',
    label: 'Kraken: Hot Wallet 2',
  },
  {
    address: '0x1522900b6dAfaC587D499A862861C0869BE6e428',
    label: 'BitMEX: Hot Wallet',
  },
  {
    address: '0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa',
    label: 'BitMEX: Cold Wallet',
  },
  {
    address: '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b',
    label: 'OKX: Hot Wallet',
  },
  {
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    label: 'Uniswap V3: Router',
  },
  {
    address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503',
    label: 'Wrapped Ether',
  },
]

export async function fetchEthBalance(address: string): Promise<number> {
  const apiKey = process.env.ETHERSCAN_API_KEY

  if (!apiKey) {
    console.warn('⚠️ ETHERSCAN_API_KEY not found in environment variables')
    return 0
  }

  try {
    const response = await fetch(
      `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`,
      { next: { revalidate: 60 } }
    )

    const data: EtherscanResponse = await response.json()

    if (data.status !== '1' || data.message !== 'OK') {
      console.error(`❌ Etherscan API error for ${address}:`, data.message)
      return 0
    }

    const balanceInWei = typeof data.result === 'string' ? data.result : '0'
    const balanceInEth = parseFloat(balanceInWei) / 1e18

    return balanceInEth
  } catch (error) {
    console.error(`❌ Error fetching balance for ${address}:`, error)
    return 0
  }
}

export async function fetchMultipleBalances(
  addresses: string[]
): Promise<WhaleWallet[]> {
  const apiKey = process.env.ETHERSCAN_API_KEY

  if (!apiKey) {
    console.warn('⚠️ ETHERSCAN_API_KEY not found')
    return []
  }

  try {
    const addressList = addresses.slice(0, 20).join(',')

    const response = await fetch(
      `https://api.etherscan.io/api?module=account&action=balancemulti&address=${addressList}&tag=latest&apikey=${apiKey}`,
      { next: { revalidate: 60 } }
    )

    const data: EtherscanResponse = await response.json()

    if (data.status !== '1' || !Array.isArray(data.result)) {
      console.error('❌ Etherscan API error:', data.message)
      return []
    }

    const ethPrice = await fetchEthPrice()

    const whales: WhaleWallet[] = data.result.map((item) => {
      const balanceInEth = parseFloat(item.balance) / 1e18
      const knownWhale = KNOWN_WHALE_ADDRESSES.find(
        (w) => w.address.toLowerCase() === item.account.toLowerCase()
      )

      return {
        address: item.account,
        balance: balanceInEth,
        balanceUSD: balanceInEth * ethPrice,
        label: knownWhale?.label,
      }
    })

    return whales.sort((a, b) => b.balance - a.balance)
  } catch (error) {
    console.error('❌ Error fetching multiple balances:', error)
    return []
  }
}

async function fetchEthPrice(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      { next: { revalidate: 300 } }
    )

    const data = await response.json()
    return data.ethereum?.usd || 3500
  } catch (error) {
    console.error('❌ Error fetching ETH price:', error)
    return 3500
  }
}

export async function getWhaleStats() {
  const whales = await fetchMultipleBalances(
    KNOWN_WHALE_ADDRESSES.map((w) => w.address)
  )

  const totalValue = whales.reduce((sum, whale) => sum + whale.balanceUSD, 0)
  const totalETH = whales.reduce((sum, whale) => sum + whale.balance, 0)
  const whaleCount = whales.length

  const totalEthSupply = 120_000_000
  const marketImpact = (totalETH / totalEthSupply) * 100

  return {
    totalValue,
    totalETH,
    whaleCount,
    marketImpact,
    whales,
  }
}
