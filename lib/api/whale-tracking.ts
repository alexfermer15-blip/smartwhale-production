import axios from 'axios'

interface WhaleAddress {
  address: string
  balance: number
  chainId: 1
  transactions: number
  firstSeen: string
  lastActive: string
  verified: boolean
}

// Используй переменную окружения
const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY

export async function getTopWhaleAddresses(limit: number = 100): Promise<WhaleAddress[]> {
  try {
    if (!ETHERSCAN_API_KEY) {
      console.error('❌ ETHERSCAN_API_KEY не установлен!')
      return []
    }

    const response = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'account',
        action: 'tokenholderlist',
        contractaddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
        page: 1,
        offset: limit,
        apikey: ETHERSCAN_API_KEY,
      },
      timeout: 10000,
    })

    if (response.data.status === '0') {
      console.warn('⚠️ Etherscan API Error:', response.data.message)
      return []
    }

    return response.data.result.slice(0, 10).map((holder: any) => ({
      address: holder.TokenHolderAddress,
      balance: parseFloat(holder.TokenHolderQuantity),
      chainId: 1,
      transactions: Math.floor(Math.random() * 5000) + 1000,
      firstSeen: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      verified: true,
    }))
  } catch (error) {
    console.error('❌ Error fetching whales:', error)
    return []
  }
}

export async function monitorWhaleTransaction(address: string) {
  try {
    if (!ETHERSCAN_API_KEY) return []

    const response = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'account',
        action: 'txlist',
        address: address,
        startblock: 0,
        endblock: 99999999,
        page: 1,
        offset: 10,
        sort: 'desc',
        apikey: ETHERSCAN_API_KEY,
      },
      timeout: 10000,
    })

    return response.data.result.slice(0, 5).map((tx: any) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: parseFloat(tx.value) / 1e18,
      tokenSymbol: 'ETH',
      timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      usdValue: (parseFloat(tx.value) / 1e18) * 45000,
    }))
  } catch (error) {
    console.error('❌ Error monitoring whale:', error)
    return []
  }
}

export async function detectLargeTransactions(minValue: number = 1000000) {
  try {
    if (!ETHERSCAN_API_KEY) return []

    const response = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'account',
        action: 'txlistinternal',
        startblock: 0,
        endblock: 99999999,
        sort: 'desc',
        apikey: ETHERSCAN_API_KEY,
      },
      timeout: 10000,
    })

    return response.data.result
      .filter((tx: any) => parseFloat(tx.value) / 1e18 > 100)
      .slice(0, 20)
      .map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: parseFloat(tx.value) / 1e18,
        tokenSymbol: 'ETH',
        timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
        usdValue: (parseFloat(tx.value) / 1e18) * 45000,
      }))
  } catch (error) {
    console.error('❌ Error detecting large transactions:', error)
    return []
  }
}

export async function getWhalePortfolio(address: string) {
  try {
    if (!ETHERSCAN_API_KEY) return []

    const response = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'account',
        action: 'addresstokenbalance',
        address: address,
        page: 1,
        offset: 100,
        apikey: ETHERSCAN_API_KEY,
      },
      timeout: 10000,
    })

    return response.data.result.slice(0, 10).map((token: any) => ({
      name: token.TokenName,
      symbol: token.TokenSymbol,
      balance: parseFloat(token.TokenHolderQuantity),
      decimals: token.TokenDecimal,
      value: 0,
    }))
  } catch (error) {
    console.error('❌ Error fetching portfolio:', error)
    return []
  }
}
