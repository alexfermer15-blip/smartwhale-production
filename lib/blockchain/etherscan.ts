// lib/blockchain/etherscan.ts

const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY!
const ETHERSCAN_BASE_URL = 'https://api.etherscan.io/v2/api'

export interface EtherscanTransaction {
  blockNumber: string
  timeStamp: string
  hash: string
  from: string
  to: string
  value: string
  gas: string
  gasPrice: string
  gasUsed: string
  isError: string
}

export interface EtherscanBalance {
  account: string
  balance: string
}

/**
 * Получить баланс кошелька
 */
export async function getWalletBalance(address: string): Promise<number> {
  try {
    const response = await fetch(
      `${ETHERSCAN_BASE_URL}?chainid=1&module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`
    )
    const data = await response.json()

    if (data.status === '1' && data.result) {
      return parseFloat(data.result) / 1e18 // Convert Wei to ETH
    }

    return 0
  } catch (error) {
    console.error('Error fetching balance:', error)
    return 0
  }
}

/**
 * Получить балансы нескольких кошельков (до 20)
 */
export async function getMultipleBalances(addresses: string[]): Promise<Record<string, number>> {
  try {
    const addressList = addresses.slice(0, 20).join(',')
    const response = await fetch(
      `${ETHERSCAN_BASE_URL}?chainid=1&module=account&action=balancemulti&address=${addressList}&tag=latest&apikey=${ETHERSCAN_API_KEY}`
    )
    const data = await response.json()

    const balances: Record<string, number> = {}

    if (data.status === '1' && data.result) {
      data.result.forEach((item: EtherscanBalance) => {
        balances[item.account] = parseFloat(item.balance) / 1e18
      })
    }

    return balances
  } catch (error) {
    console.error('Error fetching multiple balances:', error)
    return {}
  }
}

/**
 * Получить последние транзакции кошелька
 */
export async function getWalletTransactions(
  address: string,
  startBlock: number = 0,
  endBlock: number = 99999999,
  page: number = 1,
  offset: number = 10
): Promise<EtherscanTransaction[]> {
  try {
    const response = await fetch(
      `${ETHERSCAN_BASE_URL}?chainid=1&module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${endBlock}&page=${page}&offset=${offset}&sort=desc&apikey=${ETHERSCAN_API_KEY}`
    )
    const data = await response.json()

    if (data.status === '1' && data.result) {
      return data.result
    }

    return []
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return []
  }
}

/**
 * Получить ERC-20 токен трансферы
 */
export async function getTokenTransfers(
  address: string,
  contractAddress?: string,
  page: number = 1,
  offset: number = 10
): Promise<any[]> {
  try {
    let url = `${ETHERSCAN_BASE_URL}?chainid=1&module=account&action=tokentx&address=${address}&page=${page}&offset=${offset}&sort=desc&apikey=${ETHERSCAN_API_KEY}`

    if (contractAddress) {
      url += `&contractaddress=${contractAddress}`
    }

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === '1' && data.result) {
      return data.result
    }

    return []
  } catch (error) {
    console.error('Error fetching token transfers:', error)
    return []
  }
}

/**
 * Получить информацию о транзакции
 */
export async function getTransaction(txHash: string): Promise<any | null> {
  try {
    const response = await fetch(
      `${ETHERSCAN_BASE_URL}?chainid=1&module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}`
    )
    const data = await response.json()

    if (data.result) {
      return data.result
    }

    return null
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return null
  }
}
