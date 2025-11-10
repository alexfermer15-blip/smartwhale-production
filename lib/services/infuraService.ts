// lib/services/infuraService.ts

export class InfuraService {
  private apiUrl: string

  constructor() {
    this.apiUrl = process.env.INFURA_HTTP_URL || ''
  }

  /**
   * Получить баланс ETH кошелька
   */
  async getBalance(address: string): Promise<string> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1,
        }),
      })

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }

      // Конвертируем из Wei в ETH
      const weiBalance = parseInt(data.result, 16)
      const ethBalance = (weiBalance / 1e18).toFixed(4)
      
      return ethBalance
    } catch (error) {
      console.error('Error fetching balance:', error)
      return '0'
    }
  }

  /**
   * Получить последние транзакции блока
   */
  async getLatestBlock() {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: ['latest', true],
          id: 1,
        }),
      })

      const data = await response.json()
      return data.result
    } catch (error) {
      console.error('Error fetching block:', error)
      return null
    }
  }

  /**
   * Получить транзакцию по хешу
   */
  async getTransaction(txHash: string) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionByHash',
          params: [txHash],
          id: 1,
        }),
      })

      const data = await response.json()
      return data.result
    } catch (error) {
      console.error('Error fetching transaction:', error)
      return null
    }
  }

  /**
   * Получить количество транзакций кошелька
   */
  async getTransactionCount(address: string): Promise<number> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionCount',
          params: [address, 'latest'],
          id: 1,
        }),
      })

      const data = await response.json()
      return parseInt(data.result, 16)
    } catch (error) {
      console.error('Error fetching transaction count:', error)
      return 0
    }
  }
}
