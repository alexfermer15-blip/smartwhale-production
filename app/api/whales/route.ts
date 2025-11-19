// app/api/whales/route.ts
import { NextResponse } from 'next/server'
import { TOP_ETHEREUM_WHALES, WHALE_LABELS } from '../../../lib/whale-addresses'

export const dynamic = 'force-dynamic'

// Generate mock whale data using the extended whale addresses list
function generateMockWhaleData() {
  const mockWhales = TOP_ETHEREUM_WHALES.map((address, index) => {
    const balance = Math.floor(Math.random() * 10000000) + 10000 // Random balance between 100k-10M ETH
    const balanceUSD = balance * 3500 // Assuming $3500 ETH price
    const percentChange24h = (Math.random() * 10 - 5).toFixed(2) // Random change between -5% and +5%
    
    return {
      address,
      balance,
      balanceUSD,
      label: WHALE_LABELS[address] || `Whale ${address.slice(0, 6)}...`,
      percentChange24h: parseFloat(percentChange24h),
    }
  })

  const totalValue = mockWhales.reduce((sum, whale) => sum + whale.balanceUSD, 0)
  const totalETH = mockWhales.reduce((sum, whale) => sum + whale.balance, 0)

  return {
    whales: mockWhales, // Return all whales from the extended list
    totalValue,
    totalETH,
    whaleCount: mockWhales.length,
    marketImpact: Number(((totalValue / 100000 * 100)).toFixed(2)), // Percentage of total market cap
    ethPrice: 3500,
  }
}

export async function GET() {
  try {
    console.log('🐋 Whale API: Returning mock data based on extended whale list')
    
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const mockData = generateMockWhaleData()
    
    return NextResponse.json(
      {
        success: true,
        data: mockData,
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
