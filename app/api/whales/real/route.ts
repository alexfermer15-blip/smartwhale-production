import { NextResponse } from 'next/server'

const ETHERSCAN_API_V2 = 'https://api.etherscan.io/v2/api'
const API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY

interface EtherscanResponse {
  status: string
  message: string
  result: string | any[]
}

interface WhaleData {
  address: string
  balance: number
  chainId: number
  transactions: number
  verified: boolean
}

// Топ известных whale адресов
const KNOWN_WHALE_ADDRESSES = [
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH Contract
  '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8', // Binance 7
  '0xF977814e90dA44bFA03b6295A0616a897441aceC', // Binance 8
  '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a', // Bitfinex
  '0x28C6c06298d514Db089934071355E5743bf21d60', // Binance 5
  '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549', // Binance 14
  '0xDFd5293D8e347dFe59E90eFd55b2956a1343963d', // Binance 16
  '0x56Eddb7aa87536c09CCc2793473599fD21A8b17F', // Binance 17
  '0x9696f59E4d72E237BE84fFD425DCaD154Bf96976', // Binance 18
  '0x4976A4A02f38326660D17bf34b431dC6e2eb2327', // Binance 19
]

async function getWhaleBalance(address: string): Promise<WhaleData | null> {
  try {
    if (!API_KEY) {
      throw new Error('Etherscan API key not configured')
    }

    // ✅ Используем API V2 с chainid=1
    const url = `${ETHERSCAN_API_V2}?module=account&action=balance&address=${address}&tag=latest&apikey=${API_KEY}&chainid=1`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data: EtherscanResponse = await response.json()

    // Проверка на ошибку API V2
    if (data.status === '0' && data.message === 'NOTOK') {
      console.error('Etherscan API Error:', data.result)
      return null
    }

    if (data.status === '1' && data.result) {
      const balanceWei = BigInt(data.result as string)
      const balanceEth = Number(balanceWei) / 1e18

      return {
        address,
        balance: balanceEth,
        chainId: 1,
        transactions: 0, // Можно добавить отдельный запрос для txlist
        verified: true,
      }
    }

    return null
  } catch (error) {
    console.error(`Error fetching balance for ${address}:`, error)
    return null
  }
}

async function getTopWhaleAddresses(limit: number): Promise<WhaleData[]> {
  try {
    // Получаем балансы для известных whale адресов
    const addresses = KNOWN_WHALE_ADDRESSES.slice(0, limit)
    
    const whaleDataPromises = addresses.map((address) =>
      getWhaleBalance(address)
    )

    const whaleData = await Promise.all(whaleDataPromises)

    // Фильтруем null значения и сортируем по балансу
    const validWhales = whaleData
      .filter((whale): whale is WhaleData => whale !== null)
      .sort((a, b) => b.balance - a.balance)

    return validWhales
  } catch (error) {
    console.error('Error fetching top whales:', error)
    return []
  }
}

async function monitorWhaleTransaction(address: string): Promise<any> {
  try {
    if (!API_KEY) {
      throw new Error('Etherscan API key not configured')
    }

    // ✅ Используем API V2 с chainid=1
    const url = `${ETHERSCAN_API_V2}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${API_KEY}&chainid=1`

    const response = await fetch(url)
    const data: EtherscanResponse = await response.json()

    if (data.status === '1' && Array.isArray(data.result)) {
      return {
        address,
        transactions: data.result.slice(0, 10), // Последние 10 транзакций
        count: data.result.length,
      }
    }

    return { address, transactions: [], count: 0 }
  } catch (error) {
    console.error('Error monitoring whale:', error)
    return { address, transactions: [], count: 0 }
  }
}

async function detectLargeTransactions(): Promise<any[]> {
  try {
    // Получаем последние транзакции для каждого whale
    const whales = await getTopWhaleAddresses(5) // Топ 5 китов
    
    const txPromises = whales.map(async (whale) => {
      const data = await monitorWhaleTransaction(whale.address)
      return {
        whale: whale.address,
        balance: whale.balance,
        recentTransactions: data.transactions,
      }
    })

    const results = await Promise.all(txPromises)
    return results
  } catch (error) {
    console.error('Error detecting large transactions:', error)
    return []
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'top'

  // Проверка API ключа
  if (!API_KEY) {
    return NextResponse.json(
      { 
        error: 'Etherscan API key not configured',
        hint: 'Add NEXT_PUBLIC_ETHERSCAN_API_KEY to your .env.local file'
      },
      { status: 500 }
    )
  }

  try {
    let data

    switch (action) {
      case 'top':
        // Fetch top whale addresses
        const limit = parseInt(searchParams.get('limit') || '10')
        data = await getTopWhaleAddresses(limit)
        break

      case 'monitor':
        const address = searchParams.get('address')
        if (!address) {
          return NextResponse.json(
            { error: 'Address parameter required' },
            { status: 400 }
          )
        }
        data = await monitorWhaleTransaction(address)
        break

      case 'large-tx':
        // Detect large transactions
        data = await detectLargeTransactions()
        break

      default:
        data = await getTopWhaleAddresses(10)
    }

    return NextResponse.json({ 
      success: true, 
      data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Whale API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch whale data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
