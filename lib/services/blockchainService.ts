// lib/services/blockchainService.ts
import { AlchemyService } from './alchemyService'
import { EtherscanService } from './etherscanService'
import { InfuraService } from './infuraService'

export class BlockchainService {
  private alchemy: AlchemyService
  private etherscan: EtherscanService
  private infura: InfuraService

  constructor() {
    this.alchemy = new AlchemyService()
    this.etherscan = new EtherscanService()
    this.infura = new InfuraService()
  }

  /**
   * Получить баланс с fallback
   */
  async getBalance(address: string): Promise<string> {
    try {
      // Сначала пробуем Alchemy
      return await this.alchemy.getBalance(address)
    } catch (error) {
      console.error('Alchemy failed, trying Infura...')
      try {
        return await this.infura.getBalance(address)
      } catch (error2) {
        console.error('Infura failed, trying Etherscan...')
        return await this.etherscan.getBalance(address)
      }
    }
  }

  /**
   * Получить транзакции с приоритетом Alchemy
   */
  async getTransactions(address: string) {
    try {
      return await this.alchemy.getAssetTransfers(address)
    } catch (error) {
      console.error('Alchemy failed, using Etherscan...')
      return await this.etherscan.getTransactions(address)
    }
  }

  /**
   * Получить токены кошелька
   */
  async getTokenBalances(address: string) {
    return await this.alchemy.getTokenBalances(address)
  }

  /**
   * Получить цену газа
   */
  async getGasPrice() {
    return await this.etherscan.getGasPrice()
  }
}
