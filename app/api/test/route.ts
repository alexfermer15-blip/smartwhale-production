// app/api/test/route.ts
import { NextResponse } from 'next/server'
import { AlchemyService } from '@/lib/services/alchemyService'
import { EtherscanService } from '@/lib/services/etherscanService'

export async function GET() {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
    }

    // Test Alchemy
    try {
      const alchemy = new AlchemyService()
      const vitalikAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      const balance = await alchemy.getBalance(vitalikAddress)
      results.tests.alchemy = {
        status: 'success',
        balance: `${balance} ETH`,
      }
    } catch (error) {
      results.tests.alchemy = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    // Test Etherscan
    try {
      const etherscan = new EtherscanService()
      const gasPrice = await etherscan.getGasPrice()
      results.tests.etherscan = {
        status: 'success',
        gasPrice: gasPrice,
      }
    } catch (error) {
      results.tests.etherscan = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    // Test CoinGecko
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      )
      const data = await response.json()
      results.tests.coingecko = {
        status: 'success',
        btcPrice: `$${data.bitcoin.usd.toLocaleString()}`,
      }
    } catch (error) {
      results.tests.coingecko = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json(
      { error: 'Test failed', details: error },
      { status: 500 }
    )
  }
}
