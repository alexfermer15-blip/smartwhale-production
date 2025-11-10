// lib/services/etherscanService.ts

export class EtherscanService {
  private apiKey: string
  private baseUrl = 'https://api.etherscan.io/api'

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || ''
  }

  /**
   * Получить ERC-20 транзакции для кошелька
   */
  async getTokenTransfers(address: string, startBlock: number = 0) {
    try {
      const url = `${this.baseUrl}?module=account&action=tokentx&address=${address}&startblock=${startBlock}&endblock=99999999&sort=desc&apikey=${this.apiKey}`

      const response = await fetch(url, {
        next: { revalidate: 60 }
      })

      const data = await response.json()

      if (data.status !== '1') {
        throw new Error(data.message || 'Etherscan API error')
      }

      return data.result
    } catch (error) {
      console.error('Etherscan API error:', error)
      return []
    }
  }

  /**
   * Получить обычные ETH транзакции
   */
  async getTransactions(address: string, startBlock: number = 0) {
    try {
      const url = `${this.baseUrl}?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=99999999&sort=desc&apikey=${this.apiKey}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.status !== '1') {
        throw new Error(data.message)
      }

      return data.result
    } catch (error) {
      console.error('Error fetching transactions:', error)
      return []
    }
  }

  /**
   * Получить баланс кошелька
   */
  async getBalance(address: string): Promise<string> {
    try {
      const url = `${this.baseUrl}?module=account&action=balance&address=${address}&tag=latest&apikey=${this.apiKey}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.status !== '1') {
        throw new Error(data.message)
      }

      // Конвертируем из wei в ETH
      return (parseInt(data.result) / 1e18).toFixed(4)
    } catch (error) {
      console.error('Error fetching balance:', error)
      return '0'
    }
  }

  /**
   * Получить информацию о токене
   */
  async getTokenInfo(contractAddress: string) {
    try {
      const url = `${this.baseUrl}?module=token&action=tokeninfo&contractaddress=${contractAddress}&apikey=${this.apiKey}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.status !== '1') {
        throw new Error(data.message)
      }

      return data.result
    } catch (error) {
      console.error('Error fetching token info:', error)
      return null
    }
  }

  /**
   * Получить цену газа
   */
  async getGasPrice() {
    try {
      const url = `${this.baseUrl}?module=gastracker&action=gasoracle&apikey=${this.apiKey}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.status !== '1') {
        throw new Error(data.message)
      }

      return data.result
    } catch (error) {
      console.error('Error fetching gas price:', error)
      return null
    }
  }
}
