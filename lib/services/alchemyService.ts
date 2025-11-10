// lib/services/alchemyService.ts

export class AlchemyService {
  private apiUrl: string

  constructor() {
    this.apiUrl = process.env.ALCHEMY_HTTP_URL || ''
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

      // Конвертируем Wei в ETH
      const weiBalance = parseInt(data.result, 16)
      const ethBalance = (weiBalance / 1e18).toFixed(4)
      
      return ethBalance
    } catch (error) {
      console.error('Alchemy: Error fetching balance:', error)
      return '0'
    }
  }

  /**
   * Получить историю транзакций кошелька
   */
  async getAssetTransfers(address: string, fromBlock: string = '0x0') {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'alchemy_getAssetTransfers',
          params: [{
            fromBlock: fromBlock,
            toBlock: 'latest',
            fromAddress: address,
            category: ['external', 'erc20', 'erc721', 'erc1155'],
            maxCount: '0x64', // 100 транзакций
            excludeZeroValue: true,
          }],
          id: 1,
        }),
      })

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }

      return data.result.transfers || []
    } catch (error) {
      console.error('Alchemy: Error fetching transfers:', error)
      return []
    }
  }

  /**
   * Получить токены кошелька (ERC-20)
   */
  async getTokenBalances(address: string) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'alchemy_getTokenBalances',
          params: [address, 'erc20'],
          id: 1,
        }),
      })

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }

      return data.result.tokenBalances || []
    } catch (error) {
      console.error('Alchemy: Error fetching token balances:', error)
      return []
    }
  }

  /**
   * Получить метаданные токена
   */
  async getTokenMetadata(contractAddress: string) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'alchemy_getTokenMetadata',
          params: [contractAddress],
          id: 1,
        }),
      })

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }

      return data.result
    } catch (error) {
      console.error('Alchemy: Error fetching token metadata:', error)
      return null
    }
  }

  /**
   * Получить последний блок
   */
  async getLatestBlock() {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: ['latest', false],
          id: 1,
        }),
      })

      const data = await response.json()
      return data.result
    } catch (error) {
      console.error('Alchemy: Error fetching block:', error)
      return null
    }
  }

  /**
   * WebSocket для real-time данных
   */
  createWebSocket() {
    const wsUrl = this.apiUrl.replace('https://', 'wss://')
    return new WebSocket(wsUrl)
  }
}
