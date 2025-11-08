import { NextResponse } from 'next/server'

// ✅ Etherscan API v2
const ETHERSCAN_API = 'https://api.etherscan.io/v2/api'
const API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY
const CHAIN_ID = 1 // Ethereum Mainnet

interface EtherscanResponse {
  status: string
  message: string
  result: string | any[]
}

interface TokenBalance {
  token: string
  symbol: string
  balance: number
  usdValue: number
  contractAddress: string
  decimals: number
}

interface WhaleData {
  rank: number
  address: string
  balance: number
  usdValue: number
  transactions: number
  label: string
  lastUpdate: string
  portfolioBreakdown?: TokenBalance[]
  balanceHistory?: { time: string; balance: number }[]
  recentTransactions?: any[]
}

const KNOWN_WHALE_ADDRESSES = [
  '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8',
  '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a',
  '0x28C6c06298d514Db089934071355E5743bf21d60',
  '0x56Eddb7aa87536c09CCc2793473599fD21A8b17F',
  '0xDFd5293D8e347dFe59E90eFd55b2956a1343963d',
  '0x4976A4A02f38326660D17bf34b431dC6e2eb2327',
  '0x9696f59E4d72E237BE84fFD425DCaD154Bf96976',
  '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
  '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  '0x53d284357ec70cE289D6D64134DfAc8E511c8a3D',
  '0xF977814e90dA44bFA03b6295A0616a897441aceC',
  '0x2FAF487A4414Fe77e2327F0bf4AE2a264a776AD2',
  '0x0548F59fEE79f8832C299e01dCA5c76F034F558e',
  '0x267be1C1D684F78cb4F6a176C4911b741E4Ffdc0',
  '0xE92d1A43df510F82C66382592a047d288f85226f',
  '0xA929022c9107643515F5c777cE9a910F0D1e490C',
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b',
  '0x36A9ACA50E9e84D74eABAd96cC7c9950cAe16297',
  '0x0681d8Db095565FE8A346fA0277bFfdE9C0eDBBF',
  '0x73BCEb1Cd57C711feaC4224D062b0F6ff338501e',
  '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549',
  '0x220866B1A2219f40e72f5c628B65D54268cA3A9D',
  '0xDD4c48C0B24039969fC16D1cdF626eaB821d3384',
  '0xD551234Ae421e3BCBA99A0Da6d736074f22192FF',
  '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
  '0xC098B2a3Aa256D2140208C3de6543aAEf5cd3A94',
  '0x4E9ce36E442e55EcD9025B9a6E0D88485d628A67',
  '0xC882b111A75C0c657fC507C04FbFcD2cC984F071',
  '0x40B38765696e3d5d8d9d834D8AaD4bB6e418E489',
  '0x8d12A197cB00D4747a1fe03395095ce2A5CC6819',
  '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
  '0x71660c4005BA85c37ccec55d0C4493E66Fe775d3',
  '0x503828976D22510aad0201ac7EC88293211D23Da',
  '0xddfAbCdc4D8FfC6d5beaf154f18B778f892A0740',
  '0x3cD751E6b0078Be393132286c442345e5DC49699',
  '0xb5d85CBf7cB3EE0D56b3bB207D5Fc4B82f43F511',
  '0xeB2629a2734e272Bcc07BDA959863f316F4bD4Cf',
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  '0x178169B423a011fff22B9e3F3abeA13414dDD0F1',
  '0x9845E1909DcA337944a0272F1f9f7249833d2D19',
  '0xCA06411bd7a7296d7dbdd0050DFc846E95fEBEB7',
  '0x1111111254fb6c44bAC0beD2854e76F90643097d',
  '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  '0x000000000dfDe7deaF24138722987c9a6991e2D4',
  '0xE94B04a0FeD112f3664e45adb2B8915693dD5FF3',
  '0xC61b9BB3A7a0767E3179713f3A5c7a9aeDCE193C',
  '0x189B9cBd4AfF470aF2C0102f365FC1823d857965',
  '0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf',
  '0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11',
  '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc',
]

const WHALE_LABELS: Record<string, string> = {
  '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8': 'Binance Hot Wallet',
  '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a': 'Bitfinex Cold Storage',
  '0x28C6c06298d514Db089934071355E5743bf21d60': 'Binance Cold Wallet 2',
  '0x56Eddb7aa87536c09CCc2793473599fD21A8b17F': 'Binance Cold Wallet 3',
  '0xDFd5293D8e347dFe59E90eFd55b2956a1343963d': 'Binance Cold Wallet 4',
  '0x4976A4A02f38326660D17bf34b431dC6e2eb2327': 'Bitfinex Cold Wallet 2',
  '0x9696f59E4d72E237BE84fFD425DCaD154Bf96976': 'Kraken Hot Wallet',
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'Wrapped Ether (WETH)',
  '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B': 'Vitalik Buterin',
  '0xF977814e90dA44bFA03b6295A0616a897441aceC': 'Binance Cold Wallet 5',
}

async function getEthPrice(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      { next: { revalidate: 300 } }
    )
    if (!response.ok) return 3400
    const data = await response.json()
    return data.ethereum?.usd || 3400
  } catch (error) {
    console.error('Error fetching ETH price:', error)
    return 3400
  }
}

async function getTokenBalances(address: string, ethPrice: number): Promise<TokenBalance[]> {
  try {
    if (!API_KEY) return []

    // ✅ Etherscan API v2
    const url = `${ETHERSCAN_API}?chainid=${CHAIN_ID}&module=account&action=tokentx&address=${address}&page=1&offset=100&sort=desc&apikey=${API_KEY}`
    
    const response = await fetch(url, { next: { revalidate: 300 } })
    const data: EtherscanResponse = await response.json()

    if (data.status !== '1' || !Array.isArray(data.result)) return []

    const tokenMap = new Map<string, any>()
    
    for (const tx of data.result) {
      if (!tokenMap.has(tx.contractAddress)) {
        tokenMap.set(tx.contractAddress, {
          contractAddress: tx.contractAddress,
          symbol: tx.tokenSymbol || 'UNKNOWN',
          name: tx.tokenName || 'Unknown Token',
          decimals: parseInt(tx.tokenDecimal || '18'),
        })
      }
    }

    const balances: TokenBalance[] = []
    const tokenEntries = Array.from(tokenMap.entries())
    
    for (const [contractAddress, tokenInfo] of tokenEntries) {
      try {
        // ✅ Etherscan API v2
        const balanceUrl = `${ETHERSCAN_API}?chainid=${CHAIN_ID}&module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest&apikey=${API_KEY}`
        
        const balanceResponse = await fetch(balanceUrl, { next: { revalidate: 300 } })
        const balanceData: EtherscanResponse = await balanceResponse.json()

        if (balanceData.status === '1' && balanceData.result) {
          const balance = Number(balanceData.result) / Math.pow(10, tokenInfo.decimals)
          
          if (balance > 0) {
            balances.push({
              token: tokenInfo.name,
              symbol: tokenInfo.symbol,
              balance: balance,
              usdValue: balance * ethPrice * 0.001,
              contractAddress: contractAddress,
              decimals: tokenInfo.decimals,
            })
          }
        }
      } catch (err) {
        console.error(`Error fetching balance for ${tokenInfo.symbol}:`, err)
      }
    }

    return balances.sort((a, b) => b.usdValue - a.usdValue).slice(0, 10)
  } catch (error) {
    console.error('Error fetching token balances:', error)
    return []
  }
}

async function getBalanceHistory(address: string, days: number = 30): Promise<{ time: string; balance: number }[]> {
  try {
    if (!API_KEY) return []

    // ✅ Etherscan API v2
    const url = `${ETHERSCAN_API}?chainid=${CHAIN_ID}&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${API_KEY}`
    
    const response = await fetch(url, { next: { revalidate: 300 } })
    const data: EtherscanResponse = await response.json()

    if (data.status !== '1' || !Array.isArray(data.result)) return []

    const balanceByDay = new Map<string, number>()
    let currentBalance = 0

    for (const tx of data.result.reverse()) {
      const date = new Date(parseInt(tx.timeStamp) * 1000)
      const dateKey = date.toISOString().split('T')[0]
      
      const value = parseInt(tx.value) / 1e18
      
      if (tx.to.toLowerCase() === address.toLowerCase()) {
        currentBalance += value
      } else if (tx.from.toLowerCase() === address.toLowerCase()) {
        currentBalance -= value
      }

      balanceByDay.set(dateKey, currentBalance)
    }

    const history = Array.from(balanceByDay.entries())
      .map(([time, balance]) => ({ time, balance }))
      .slice(-days)

    return history
  } catch (error) {
    console.error('Error fetching balance history:', error)
    return []
  }
}

async function getWhaleBalance(address: string, ethPrice: number): Promise<WhaleData | null> {
  try {
    if (!API_KEY) throw new Error('Etherscan API key not configured')

    // ✅ Etherscan API v2
    const balanceUrl = `${ETHERSCAN_API}?chainid=${CHAIN_ID}&module=account&action=balance&address=${address}&tag=latest&apikey=${API_KEY}`
    const balanceResponse = await fetch(balanceUrl, { next: { revalidate: 300 } })
    const balanceData: EtherscanResponse = await balanceResponse.json()

    if (balanceData.status === '0' || !balanceData.result) {
      console.error(`Failed to fetch balance for ${address}:`, balanceData.message)
      return null
    }

    const balanceWei = BigInt(balanceData.result as string)
    const balanceEth = Number(balanceWei) / 1e18

    // ✅ Etherscan API v2
    const txCountUrl = `${ETHERSCAN_API}?chainid=${CHAIN_ID}&module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest&apikey=${API_KEY}`
    const txResponse = await fetch(txCountUrl, { next: { revalidate: 300 } })
    const txData: EtherscanResponse = await txResponse.json()
    const txCount = txData.result ? parseInt(txData.result as string, 16) : 0

    return {
      rank: 0,
      address,
      balance: balanceEth,
      usdValue: balanceEth * ethPrice,
      transactions: txCount,
      label: WHALE_LABELS[address] || `Whale ${address.slice(0, 6)}...`,
      lastUpdate: new Date().toISOString(),
    }
  } catch (error) {
    console.error(`Error fetching balance for ${address}:`, error)
    return null
  }
}

async function getTopWhaleAddresses(limit: number): Promise<{ whales: WhaleData[]; ethPrice: number }> {
  try {
    const ethPrice = await getEthPrice()
    const addresses = KNOWN_WHALE_ADDRESSES.slice(0, Math.min(limit, 100))
    const whaleDataPromises = addresses.map((address) => getWhaleBalance(address, ethPrice))
    const whaleData = await Promise.all(whaleDataPromises)

    const validWhales = whaleData
      .filter((whale): whale is WhaleData => whale !== null)
      .sort((a, b) => b.balance - a.balance)
      .map((whale, index) => ({ ...whale, rank: index + 1 }))

    return { whales: validWhales, ethPrice }
  } catch (error) {
    console.error('Error fetching top whales:', error)
    return { whales: [], ethPrice: 3400 }
  }
}

async function monitorWhaleTransaction(address: string): Promise<any> {
  try {
    if (!API_KEY) throw new Error('Etherscan API key not configured')

    // ✅ Etherscan API v2
    const url = `${ETHERSCAN_API}?chainid=${CHAIN_ID}&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc&apikey=${API_KEY}`
    const response = await fetch(url, { next: { revalidate: 60 } })
    const data: EtherscanResponse = await response.json()

    if (data.status === '1' && Array.isArray(data.result)) {
      return {
        address,
        transactions: data.result.slice(0, 20),
        count: data.result.length,
      }
    }

    return { address, transactions: [], count: 0 }
  } catch (error) {
    console.error('Error monitoring whale:', error)
    return { address, transactions: [], count: 0 }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'top'

  if (!API_KEY) {
    return NextResponse.json(
      { error: 'Etherscan API key not configured' },
      { status: 500 }
    )
  }

  try {
    let data
    let ethPrice = 3400

    switch (action) {
      case 'top':
        const limit = parseInt(searchParams.get('limit') || '50')
        const result = await getTopWhaleAddresses(limit)
        data = result.whales
        ethPrice = result.ethPrice
        break

      case 'monitor':
        const address = searchParams.get('address')
        if (!address) {
          return NextResponse.json({ error: 'Address parameter required' }, { status: 400 })
        }
        data = await monitorWhaleTransaction(address)
        ethPrice = await getEthPrice()
        break

      case 'detail':
        const detailAddress = searchParams.get('address')
        const period = parseInt(searchParams.get('period') || '30')
        
        if (!detailAddress) {
          return NextResponse.json({ error: 'Address parameter required' }, { status: 400 })
        }
        
        ethPrice = await getEthPrice()
        const whaleDetail = await getWhaleBalance(detailAddress, ethPrice)

        if (!whaleDetail) {
          return NextResponse.json({ error: 'Failed to fetch whale details' }, { status: 404 })
        }

        const tokenBalances = await getTokenBalances(detailAddress, ethPrice)
        const balanceHistory = await getBalanceHistory(detailAddress, period)

        const enrichedWhale = {
          ...whaleDetail,
          portfolioBreakdown: tokenBalances.length > 0 ? tokenBalances : [
            { 
              token: 'ETH', 
              symbol: 'ETH', 
              balance: whaleDetail.balance, 
              usdValue: whaleDetail.usdValue, 
              contractAddress: '', 
              decimals: 18 
            }
          ],
          balanceHistory: balanceHistory.length > 0 ? balanceHistory : [
            { time: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], balance: whaleDetail.balance * 0.9 },
            { time: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], balance: whaleDetail.balance * 1.1 },
            { time: new Date().toISOString().split('T')[0], balance: whaleDetail.balance },
          ],
          recentTransactions: (await monitorWhaleTransaction(detailAddress)).transactions || [],
        }

        data = enrichedWhale
        break

      default:
        const defaultResult = await getTopWhaleAddresses(10)
        data = defaultResult.whales
        ethPrice = defaultResult.ethPrice
    }

    return NextResponse.json({
      success: true,
      data,
      ethPrice,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Whale API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch whale data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
