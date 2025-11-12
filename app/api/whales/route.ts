// app/api/whales/route.ts
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MOCK_WHALE_DATA = {
  whales: [
    {
      address: '0x00000000219ab540356cBB839Cbe05303d7705Fa',
      balance: 34200000,
      balanceUSD: 119700000000,
      label: 'ETH 2.0 Staking Contract',
      percentChange24h: 2.3,
    },
    {
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      balance: 3150000,
      balanceUSD: 11025000000,
      label: 'Wrapped ETH (WETH)',
      percentChange24h: 0.5,
    },
    {
      address: '0xDA9dfA130Df4dE4673b89022EE50ff26f6EA73Cf',
      balance: 1520000,
      balanceUSD: 5320000000,
      label: 'Kraken Exchange',
      percentChange24h: -1.2,
    },
    {
      address: '0xBE0eB53F46cd790Cd82837007B7aBa1e7d7D0eF5',
      balance: 620000,
      balanceUSD: 2170000000,
      label: 'Binance Hot Wallet',
      percentChange24h: 1.8,
    },
    {
      address: '0x28C6c06298d514Db089934071355E5743bf21d60',
      balance: 510000,
      balanceUSD: 1785000000,
      label: 'Binance Cold Storage',
      percentChange24h: 0.1,
    },
    {
      address: '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549',
      balance: 385000,
      balanceUSD: 1347500000,
      label: 'Bitfinex Wallet',
      percentChange24h: -0.5,
    },
    {
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      balance: 320000,
      balanceUSD: 1120000000,
      label: 'Kraken Cold Storage',
      percentChange24h: 0.8,
    },
  ],
  totalValue: 142467500000,
  totalETH: 40705000,
  whaleCount: 7,
  marketImpact: 3.56,
  ethPrice: 3500,
}

export async function GET() {
  try {
    console.log('🐋 Whale API: Returning mock data')
    
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return NextResponse.json(
      {
        success: true,
        data: MOCK_WHALE_DATA,
        timestamp: new Date().toISOString(),
        mock: true,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  } catch (error) {
    console.error('❌ Whale API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch whale data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
