// app/api/whales/activity/route.ts
import { NextRequest, NextResponse } from 'next/server'

interface Activity {
  id: string
  whaleAddress: string
  whaleLabel: string
  txHash: string
  txType: 'buy' | 'sell' | 'transfer'
  tokenSymbol: string
  amount: string
  amountUsd: number
  fromAddress?: string
  toAddress?: string
  blockchain: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  timestamp: string
}

// Mock данные для демонстрации
const generateMockActivities = (): Activity[] => {
  const now = Date.now()
  
  return [
    {
      id: '1',
      whaleAddress: '0xF977814e90dA44bFA03b6295A0616a897441aceC',
      whaleLabel: 'Binance Cold Wallet 5',
      txHash: '0xa1c0...3f5d',
      txType: 'sell',
      tokenSymbol: 'BTC',
      amount: '500',
      amountUsd: 51500000,
      fromAddress: '0xF977814e90dA44bFA03b6295A0616a897441aceC',
      toAddress: '0x28C6c06298d514Db089934071355E5743bf21d60',
      blockchain: 'ethereum',
      severity: 'HIGH',
      timestamp: new Date(now - 10 * 60 * 1000).toISOString(), // 10 min ago
    },
    {
      id: '2',
      whaleAddress: '0x28C6c06298d514Db089934071355E5743bf21d60',
      whaleLabel: 'Binance Cold Wallet 2',
      txHash: '0xb2d1...4g6e',
      txType: 'buy',
      tokenSymbol: 'ETH',
      amount: '10000',
      amountUsd: 35000000,
      fromAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      toAddress: '0x28C6c06298d514Db089934071355E5743bf21d60',
      blockchain: 'ethereum',
      severity: 'HIGH',
      timestamp: new Date(now - 25 * 60 * 1000).toISOString(), // 25 min ago
    },
    {
      id: '3',
      whaleAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      whaleLabel: 'Whale 0x742d...',
      txHash: '0xc3e2...5h7f',
      txType: 'transfer',
      tokenSymbol: 'ETH',
      amount: '5000',
      amountUsd: 17500000,
      fromAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      toAddress: '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549',
      blockchain: 'ethereum',
      severity: 'MEDIUM',
      timestamp: new Date(now - 45 * 60 * 1000).toISOString(), // 45 min ago
    },
    {
      id: '4',
      whaleAddress: '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549',
      whaleLabel: 'Whale 0x21a3...',
      txHash: '0xd4f3...6i8g',
      txType: 'buy',
      tokenSymbol: 'SOL',
      amount: '50000',
      amountUsd: 8150000,
      fromAddress: '0x2FAF487A4414Fe77e2327F0bf4AE2a264a776046',
      toAddress: '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549',
      blockchain: 'solana',
      severity: 'MEDIUM',
      timestamp: new Date(now - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    },
    {
      id: '5',
      whaleAddress: '0x2FAF487A4414Fe77e2327F0bf4AE2a264a776046',
      whaleLabel: 'Whale 0x2FAF...',
      txHash: '0xe5g4...7j9h',
      txType: 'sell',
      tokenSymbol: 'BNB',
      amount: '1000',
      amountUsd: 645000,
      fromAddress: '0x2FAF487A4414Fe77e2327F0bf4AE2a264a776046',
      toAddress: '0xF977814e90dA44bFA03b6295A0616a897441aceC',
      blockchain: 'binance',
      severity: 'LOW',
      timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
    {
      id: '6',
      whaleAddress: '0xF977814e90dA44bFA03b6295A0616a897441aceC',
      whaleLabel: 'Binance Cold Wallet 5',
      txHash: '0xf6h5...8k0i',
      txType: 'transfer',
      tokenSymbol: 'USDT',
      amount: '10000000',
      amountUsd: 10000000,
      fromAddress: '0xF977814e90dA44bFA03b6295A0616a897441aceC',
      toAddress: '0x28C6c06298d514Db089934071355E5743bf21d60',
      blockchain: 'ethereum',
      severity: 'HIGH',
      timestamp: new Date(now - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    },
  ]
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const txType = searchParams.get('type') // 'buy', 'sell', 'transfer', or 'all'
    const blockchain = searchParams.get('blockchain') || 'all'
    const severity = searchParams.get('severity') || 'all'

    // Генерируем mock данные
    let activities = generateMockActivities()

    // Фильтруем по типу транзакции
    if (txType && txType !== 'all') {
      activities = activities.filter(a => a.txType === txType)
    }

    // Фильтруем по блокчейну
    if (blockchain && blockchain !== 'all') {
      activities = activities.filter(a => a.blockchain === blockchain)
    }

    // Фильтруем по severity
    if (severity && severity !== 'all') {
      activities = activities.filter(a => a.severity === severity)
    }

    // Статистика
    const stats = {
      total: activities.length,
      totalValueUsd: activities.reduce((sum, a) => sum + a.amountUsd, 0),
      highSeverity: activities.filter(a => a.severity === 'HIGH').length,
      mediumSeverity: activities.filter(a => a.severity === 'MEDIUM').length,
      lowSeverity: activities.filter(a => a.severity === 'LOW').length,
    }

    return NextResponse.json({
      activities,
      stats,
    })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}
