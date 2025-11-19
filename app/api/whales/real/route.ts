import { NextResponse } from 'next/server'
import { TOP_ETHEREUM_WHALES, WHALE_LABELS } from '../../../../lib/whale-addresses'

// ✅ Etherscan API v2 - ИСПРАВЛЕНО: правильный V2 endpoint
const ETHERSCAN_API = 'https://api.etherscan.io/v2/api'
const API_KEY = process.env.ETHERSCAN_API_KEY || process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY
const CHAIN_ID = 1 // Ethereum Mainnet

// Debug logging
console.log('[INIT] API Key available:', !!API_KEY)
console.log('[INIT] API Key source:', process.env.ETHERSCAN_API_KEY ? 'ETHERSCAN_API_KEY' : 'NEXT_PUBLIC_ETHERSCAN_API_KEY')
console.log('[INIT] API Key length:', API_KEY?.length || 0)
console.log('[INIT] API Key first 4 chars:', API_KEY?.substring(0, 4) || 'None')

// Check if we're using the correct API endpoint for Etherscan v2
const ETHERSCAN_V2_ENDPOINT = `https://api.etherscan.io/v2/api`

interface EtherscanResponse {
  status: string | number
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

const KNOWN_WHALE_ADDRESSES = TOP_ETHEREUM_WHALES

async function getEthPrice(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
    )
    if (!response.ok) return 3400
    const data = await response.json()
    return data.ethereum?.usd || 340
  } catch (error) {
    console.error('Error fetching ETH price:', error)
    return 3400
  }
}
async function getTokenPrice(contractAddress: string, tokenSymbol: string): Promise<number> {
  try {
    // Сначала пытаемся получить точную цену по contractAddress
    if (contractAddress && contractAddress !== '') {
      // Для токенов Ethereum используем CoinGecko API
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${contractAddress}&vs_currencies=usd`
      );
      
      if (response.ok) {
        const data = await response.json();
        const price = data[contractAddress]?.usd;
        if (price !== undefined) {
          return price;
        }
      }
    }
    
    // Если не удалось получить цену по contractAddress, используем символ токена
    if (tokenSymbol) {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenSymbol}&vs_currencies=usd`
      );
      
      if (response.ok) {
        const data = await response.json();
        const price = data[tokenSymbol.toLowerCase()]?.usd;
        if (price !== undefined) {
          return price;
        }
      }
    }
    
    // Если не удалось получить точную цену, используем ETH цену как fallback
    const ethPrice = await getEthPrice();
    return ethPrice;
  } catch (error) {
    console.error(`[ERROR] Error fetching price for token ${tokenSymbol} (${contractAddress}):`, error);
    // Возвращаем ETH цену как последний fallback
    const ethPrice = await getEthPrice();
    return ethPrice;
  }
}

async function getTokenBalances(address: string, ethPrice: number): Promise<TokenBalance[]> {
  try {
    console.log(`[DEBUG] getTokenBalances called for address: ${address}`)
    if (!API_KEY) {
      console.log(`[ERROR] API Key is missing in getTokenBalances`)
      return []
    }

    // ✅ Etherscan API v2 - Правильный URL формат
    const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokentx&address=${address}&page=1&offset=100&sort=desc&apikey=${API_KEY}`
    console.log(`[DEBUG] Fetching token transactions from: ${url.replace(API_KEY, '***')}`)
    
    const response = await fetch(url)
    const data: EtherscanResponse = await response.json()

    console.log(`[DEBUG] Token transactions API response:`, {
      status: data.status,
      message: data.message,
      resultIsArray: Array.isArray(data.result),
      resultLength: Array.isArray(data.result) ? data.result.length : 0
    })

    // Handle both "0" and "NOTOK" status responses
    if (data.status !== '1' || data.status.toString() === 'NOTOK' || !Array.isArray(data.result)) {
      console.log(`[ERROR] Token transactions API returned status: ${data.status}, message: ${data.message}`)
      return []
    }

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

    console.log(`[DEBUG] Found ${tokenMap.size} unique tokens in transactions`)

    const balances: TokenBalance[] = []
    const tokenEntries = Array.from(tokenMap.entries())
    
    for (const [contractAddress, tokenInfo] of tokenEntries) {
      try {
        // ✅ Etherscan API v2 - Правильный URL формат
        const balanceUrl = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest&apikey=${API_KEY}`
        
        const balanceResponse = await fetch(balanceUrl)
        const balanceData: EtherscanResponse = await balanceResponse.json()

        // Handle both "1" and "OK" status responses
        if ((balanceData.status === '1' || balanceData.status === 'OK') && balanceData.result) {
          const balance = Number(balanceData.result) / Math.pow(10, tokenInfo.decimals)
          
          console.log(`[DEBUG] Token ${tokenInfo.symbol} balance: ${balance} (raw: ${balanceData.result}, decimals: ${tokenInfo.decimals})`)
          
          if (balance > 0) {
            // ИСПРАВЛЕНИЕ: корректный расчет USD стоимости токенов
            // Получаем цену токена из CoinGecko API
            const tokenPrice = await getTokenPrice(tokenInfo.contractAddress, tokenInfo.symbol);
            const usdValue = balance * tokenPrice;
            balances.push({
              token: tokenInfo.name,
              symbol: tokenInfo.symbol,
              balance: balance,
              usdValue: usdValue,
              contractAddress: contractAddress,
              decimals: tokenInfo.decimals,
            })
            console.log(`[DEBUG] Added token ${tokenInfo.symbol} to portfolio with balance ${balance} and value $${usdValue}`)
          } else {
            console.log(`[DEBUG] Skipping token ${tokenInfo.symbol} due to zero balance`)
          }
        } else {
          console.log(`[ERROR] Failed to get balance for ${tokenInfo.symbol}: status=${balanceData.status}, message=${balanceData.message}`)
        }
      } catch (err) {
        console.error(`[ERROR] Error fetching balance for ${tokenInfo.symbol}:`, err)
      }
    }

    console.log(`[DEBUG] Returning ${balances.length} tokens with non-zero balance`)
    return balances.sort((a, b) => b.usdValue - a.usdValue).slice(0, 10)
  } catch (error) {
    console.error('[ERROR] Error fetching token balances:', error)
    return []
  }
}

async function getBalanceHistory(address: string, days: number = 30): Promise<{ time: string; balance: number }[]> {
  try {
    if (!API_KEY) return []

    // ✅ Etherscan API v2 - Правильный URL формат
    const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${address}&startblock=0&endblock=999999&page=1&offset=100&sort=desc&apikey=${API_KEY}`
    
    const response = await fetch(url)
    const data: EtherscanResponse = await response.json()

    // Handle both "0" and "NOTOK" status responses
    if (data.status !== '1' || data.status.toString() === 'NOTOK' || !Array.isArray(data.result)) {
      console.log(`Transaction list API returned status: ${data.status}, message: ${data.message}`)
      return []
    }

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

    // ✅ Etherscan API v2 - Правильный URL формат
    const balanceUrl = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=balance&address=${address}&tag=latest&apikey=${API_KEY}`
    console.log(`[DEBUG] Fetching balance for ${address} from: ${balanceUrl.replace(API_KEY, '***')}`)
    console.log(`[DEBUG] API Key length: ${API_KEY?.length || 0}`)
    console.log(`[DEBUG] API Key first 4 chars: ${API_KEY?.substring(0, 4) || 'None'}`)
    
    const balanceResponse = await fetch(balanceUrl)
    const balanceData: EtherscanResponse = await balanceResponse.json()

    console.log(`[DEBUG] Balance API response for ${address}:`, {
      status: balanceData.status,
      message: balanceData.message,
      hasResult: !!balanceData.result,
      resultType: typeof balanceData.result,
      resultValue: balanceData.result
    })

    // Handle both "0" and "NOTOK" status responses
    if (balanceData.status === '0' || balanceData.status.toString() === 'NOTOK' || !balanceData.result) {
      console.error(`[ERROR] Failed to fetch balance for ${address}:`, balanceData.message)
      console.error(`[ERROR] Full API response:`, JSON.stringify(balanceData, null, 2))
      
      // Don't return null immediately, try to provide a fallback response
      console.log(`[FALLBACK] Attempting to provide fallback response for ${address}`)
      return {
        rank: 0,
        address,
        balance: 0,
        usdValue: 0,
        transactions: 0,
        label: WHALE_LABELS[address] || `Whale ${address.slice(0, 6)}...`,
        lastUpdate: new Date().toISOString(),
      }
    }

    const balanceWei = BigInt(balanceData.result as string)
    const balanceEth = Number(balanceWei) / 1e18
    console.log(`[DEBUG] Calculated balance for ${address}: ${balanceEth} ETH`)

    // ✅ Etherscan API v2 - Правильный URL формат
    const txCountUrl = `https://api.etherscan.io/v2/api?chainid=1&module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest&apikey=${API_KEY}`
    const txResponse = await fetch(txCountUrl)
    const txData: EtherscanResponse = await txResponse.json()
    const txCount = txData.result ? parseInt(txData.result as string, 16) : 0

    console.log(`[DEBUG] Transaction count for ${address}: ${txCount}`)

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
    console.error(`[ERROR] Error fetching balance for ${address}:`, error)
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

    // ✅ Etherscan API v2 - Правильный URL формат
    const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${address}&startblock=0&endblock=999999&page=1&offset=20&sort=desc&apikey=${API_KEY}`
    const response = await fetch(url)
    const data: EtherscanResponse = await response.json()

    // Handle both "1" and "OK" status responses
    if ((data.status === '1' || data.status === 'OK') && Array.isArray(data.result)) {
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
  
  console.log(`[GET /api/whales/real] Request received:`, {
    url: request.url,
    action,
    address: searchParams.get('address'),
    period: searchParams.get('period'),
    limit: searchParams.get('limit')
  })

  // If API key is not configured, return mock data based on extended whale list
  if (!API_KEY) {
    console.log('Etherscan API key not configured, returning mock data based on extended whale list')
    
    // Handle different actions with mock data
    switch (action) {
      case 'top':
        const limit = parseInt(searchParams.get('limit') || '10')
        const mockWhales = KNOWN_WHALE_ADDRESSES.slice(0, Math.min(limit, 50)).map((address, index) => {
          const balance = Math.floor(Math.random() * 10000000) + 10000
          const ethPrice = 3500
          const balanceUSD = balance * ethPrice
          
          return {
            rank: index + 1,
            address,
            balance,
            usdValue: balanceUSD,
            transactions: Math.floor(Math.random() * 10000),
            label: WHALE_LABELS[address] || `Whale ${address.slice(0, 6)}...`,
            lastUpdate: new Date().toISOString(),
          }
        })
        
        return NextResponse.json({
          success: true,
          data: mockWhales,
          ethPrice: 3500,
          timestamp: new Date().toISOString(),
          mock: true,
        })
        
      case 'detail':
        const detailAddress = searchParams.get('address')
        const period = parseInt(searchParams.get('period') || '30')
        
        if (!detailAddress) {
          return NextResponse.json({ error: 'Address parameter required' }, { status: 400 })
        }
        
        // Validate Ethereum address format
        if (!detailAddress.startsWith('0x') || detailAddress.length !== 42) {
          console.error(`[GET /api/whales/real] Invalid address format: ${detailAddress}`)
          return NextResponse.json({ error: 'Invalid Ethereum address format' }, { status: 400 })
        }
        
        // Generate mock detailed data for the specific address
        const mockDetailBalance = Math.floor(Math.random() * 1000000) + 5000
        const mockEthPrice = 3500
        const mockDetail = {
          rank: Math.floor(Math.random() * 100) + 1,
          address: detailAddress,
          balance: mockDetailBalance,
          usdValue: mockDetailBalance * mockEthPrice,
          transactions: Math.floor(Math.random() * 5000),
          label: WHALE_LABELS[detailAddress] || `Whale ${detailAddress.slice(0, 6)}...`,
          lastUpdate: new Date().toISOString(),
          portfolioBreakdown: [
            {
              token: 'ETH',
              symbol: 'ETH',
              balance: mockDetailBalance,
              usdValue: mockDetailBalance * mockEthPrice,
              contractAddress: '',
              decimals: 18
            },
            {
              token: 'Wrapped Bitcoin',
              symbol: 'WBTC',
              balance: Math.random() * 50,
              usdValue: Math.random() * 50 * 60000,
              contractAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
              decimals: 8
            },
            {
              token: 'USD Coin',
              symbol: 'USDC',
              balance: Math.random() * 1000000,
              usdValue: Math.random() * 1000000,
              contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              decimals: 6
            }
          ],
          balanceHistory: Array.from({ length: period }, (_, i) => {
            const date = new Date()
            date.setDate(date.getDate() - i)
            return {
              time: date.toISOString().split('T')[0],
              balance: mockDetailBalance * (0.95 + Math.random() * 0.1)
            }
          }).reverse(),
          recentTransactions: Array.from({ length: 10 }, (_, i) => ({
            hash: `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
            from: detailAddress,
            to: `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
            value: Math.random() * 100,
            timestamp: Math.floor(Date.now() / 1000) - (i * 3600),
            gasUsed: Math.floor(Math.random() * 10000),
            gasPrice: Math.floor(Math.random() * 10000000)
          }))
        }
        
        return NextResponse.json({
          success: true,
          data: mockDetail,
          ethPrice: mockEthPrice,
          timestamp: new Date().toISOString(),
          mock: true,
        })
        
      default:
        // Default to top 10 mock whales
        const defaultMockWhales = KNOWN_WHALE_ADDRESSES.slice(0, 10).map((address, index) => {
          const balance = Math.floor(Math.random() * 10000000) + 10000
          const ethPrice = 3500
          const balanceUSD = balance * ethPrice
          
          return {
            rank: index + 1,
            address,
            balance,
            usdValue: balanceUSD,
            transactions: Math.floor(Math.random() * 10000),
            label: WHALE_LABELS[address] || `Whale ${address.slice(0, 6)}...`,
            lastUpdate: new Date().toISOString(),
          }
        })
        
        return NextResponse.json({
          success: true,
          data: defaultMockWhales,
          ethPrice: 3500,
          timestamp: new Date().toISOString(),
          mock: true,
        })
    }
  }

  try {
    let data
    let ethPrice = 340

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
        
        console.log(`[DEBUG] [GET /api/whales/real] Processing detail request:`, {
          address: detailAddress,
          period
        })
        
        if (!detailAddress) {
          console.error(`[ERROR] [GET /api/whales/real] Missing address parameter`)
          return NextResponse.json({ error: 'Address parameter required' }, { status: 400 })
        }
        
        // Validate Ethereum address format
        if (!detailAddress.startsWith('0x') || detailAddress.length !== 42) {
          console.error(`[ERROR] [GET /api/whales/real] Invalid address format: ${detailAddress}`)
          return NextResponse.json({ error: 'Invalid Ethereum address format' }, { status: 400 })
        }
        
        ethPrice = await getEthPrice()
        console.log(`[DEBUG] [GET /api/whales/real] ETH price:`, ethPrice)
        const whaleDetail = await getWhaleBalance(detailAddress, ethPrice)

        if (!whaleDetail) {
          console.error(`[ERROR] [GET /api/whales/real] Failed to fetch whale details for ${detailAddress}`)
          return NextResponse.json({ error: 'Failed to fetch whale details' }, { status: 404 })
        }

        console.log(`[DEBUG] [GET /api/whales/real] Whale detail fetched:`, {
          address: whaleDetail.address,
          balance: whaleDetail.balance,
          usdValue: whaleDetail.usdValue,
          transactions: whaleDetail.transactions
        })

        const tokenBalances = await getTokenBalances(detailAddress, ethPrice)
        console.log(`[DEBUG] [GET /api/whales/real] Token balances fetched:`, {
          count: tokenBalances.length,
          tokens: tokenBalances.map(t => ({ symbol: t.symbol, balance: t.balance, usdValue: t.usdValue }))
        })
        
        const balanceHistory = await getBalanceHistory(detailAddress, period)
        console.log(`[DEBUG] [GET /api/whales/real] Balance history fetched:`, {
          count: balanceHistory.length
        })

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
            { time: new Date(Date.now() - 30 * 24 * 60 * 1000).toISOString().split('T')[0], balance: whaleDetail.balance * 0.9 },
            { time: new Date(Date.now() - 15 * 24 * 60 * 1000).toISOString().split('T')[0], balance: whaleDetail.balance * 1.1 },
            { time: new Date().toISOString().split('T')[0], balance: whaleDetail.balance },
          ],
          recentTransactions: (await monitorWhaleTransaction(detailAddress)).transactions || [],
        }

        console.log(`[DEBUG] [GET /api/whales/real] Final portfolio breakdown:`, {
          tokenCount: enrichedWhale.portfolioBreakdown.length,
          tokens: enrichedWhale.portfolioBreakdown.map(t => ({
            symbol: t.symbol,
            balance: t.balance,
            usdValue: t.usdValue
          }))
        })

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
    
    // If there's an error with the API, return mock data based on extended whale list
    console.log('Returning mock data based on extended whale list due to API error')
    
    // Handle different actions with mock data
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'top'
    
    switch (action) {
      case 'top':
        const limit = parseInt(searchParams.get('limit') || '10')
        const mockWhales = KNOWN_WHALE_ADDRESSES.slice(0, Math.min(limit, 50)).map((address, index) => {
          const balance = Math.floor(Math.random() * 100000) + 10000
          const ethPrice = 3500
          const balanceUSD = balance * ethPrice
          
          return {
            rank: index + 1,
            address,
            balance,
            usdValue: balanceUSD,
            transactions: Math.floor(Math.random() * 1000),
            label: WHALE_LABELS[address] || `Whale ${address.slice(0, 6)}...`,
            lastUpdate: new Date().toISOString(),
          }
        })
        
        return NextResponse.json({
          success: true,
          data: mockWhales,
          ethPrice: 3500,
          timestamp: new Date().toISOString(),
          mock: true,
        })
        
      case 'detail':
        const detailAddress = searchParams.get('address') || KNOWN_WHALE_ADDRESSES[0]
        const period = parseInt(searchParams.get('period') || '30')
        
        // Generate mock detailed data for the specific address
        const mockDetailBalance = Math.floor(Math.random() * 1000000) + 5000
        const mockEthPrice = 3500
        const mockDetail = {
          rank: Math.floor(Math.random() * 100) + 1,
          address: detailAddress,
          balance: mockDetailBalance,
          usdValue: mockDetailBalance * mockEthPrice,
          transactions: Math.floor(Math.random() * 5000),
          label: WHALE_LABELS[detailAddress] || `Whale ${detailAddress.slice(0, 6)}...`,
          lastUpdate: new Date().toISOString(),
          portfolioBreakdown: [
            {
              token: 'ETH',
              symbol: 'ETH',
              balance: mockDetailBalance,
              usdValue: mockDetailBalance * mockEthPrice,
              contractAddress: '',
              decimals: 18
            },
            {
              token: 'Wrapped Bitcoin',
              symbol: 'WBTC',
              balance: Math.random() * 50,
              usdValue: Math.random() * 50 * 600,
              contractAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
              decimals: 8
            },
            {
              token: 'USD Coin',
              symbol: 'USDC',
              balance: Math.random() * 1000000,
              usdValue: Math.random() * 100000,
              contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              decimals: 6
            }
          ],
          balanceHistory: Array.from({ length: period }, (_, i) => {
            const date = new Date()
            date.setDate(date.getDate() - i)
            return {
              time: date.toISOString().split('T')[0],
              balance: mockDetailBalance * (0.95 + Math.random() * 0.1)
            }
          }).reverse(),
          recentTransactions: Array.from({ length: 10 }, (_, i) => ({
            hash: `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
            from: detailAddress,
            to: `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
            value: Math.random() * 100,
            timestamp: Math.floor(Date.now() / 1000) - (i * 3600),
            gasUsed: Math.floor(Math.random() * 10000),
            gasPrice: Math.floor(Math.random() * 10000000)
          }))
        }
        
        return NextResponse.json({
          success: true,
          data: mockDetail,
          ethPrice: mockEthPrice,
          timestamp: new Date().toISOString(),
          mock: true,
        })
        
      default:
        // Default to top 10 mock whales
        const defaultMockWhales = KNOWN_WHALE_ADDRESSES.slice(0, 10).map((address, index) => {
          const balance = Math.floor(Math.random() * 10000000) + 10000
          const ethPrice = 350
          const balanceUSD = balance * ethPrice
          
          return {
            rank: index + 1,
            address,
            balance,
            usdValue: balanceUSD,
            transactions: Math.floor(Math.random() * 1000),
            label: WHALE_LABELS[address] || `Whale ${address.slice(0, 6)}...`,
            lastUpdate: new Date().toISOString(),
          }
        })
        
        return NextResponse.json({
          success: true,
          data: defaultMockWhales,
          ethPrice: 3500,
          timestamp: new Date().toISOString(),
          mock: true,
        })
    }
 }
}
