import { NextResponse } from 'next/server'

// ✅ Добавь это в начало файла
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ETHERSCAN_API = 'https://api.etherscan.io/v2/api'
const API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY
const CHAIN_ID = 1

interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  timeStamp: string
  blockNumber: string
  gas: string
  gasPrice: string
  gasUsed: string
  isError: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json(
      { error: 'Address parameter is required' },
      { status: 400 }
    )
  }

  if (!API_KEY) {
    return NextResponse.json(
      { error: 'Etherscan API key not configured' },
      { status: 500 }
    )
  }

  try {
    const url = `${ETHERSCAN_API}?chainid=${CHAIN_ID}&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc&apikey=${API_KEY}`
    
    const response = await fetch(url, { 
      next: { revalidate: 60 } // Cache for 1 minute
    })
    
    const data = await response.json()

    if (data.status === '1' && Array.isArray(data.result)) {
      const transactions: Transaction[] = data.result.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        timeStamp: tx.timeStamp,
        blockNumber: tx.blockNumber,
        gas: tx.gas,
        gasPrice: tx.gasPrice,
        gasUsed: tx.gasUsed,
        isError: tx.isError || '0',
      }))

      return NextResponse.json({
        success: true,
        data: transactions,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: false,
      data: [],
      error: data.message || 'Failed to fetch transactions',
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
