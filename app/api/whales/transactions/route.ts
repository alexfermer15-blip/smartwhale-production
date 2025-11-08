import { NextResponse } from 'next/server'

const ETHERSCAN_API_V2 = 'https://api.etherscan.io/v2/api'
const API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY

interface EtherscanTransaction {
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

interface EtherscanResponse {
  status: string
  message: string
  result: EtherscanTransaction[]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Validation
    if (!address) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Wallet address is required' 
        },
        { status: 400 }
      )
    }

    if (!API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Etherscan API key not configured',
          hint: 'Add NEXT_PUBLIC_ETHERSCAN_API_KEY to .env.local'
        },
        { status: 500 }
      )
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Ethereum address format'
        },
        { status: 400 }
      )
    }

    // Fetch transactions from Etherscan API V2
    const url = `${ETHERSCAN_API_V2}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${API_KEY}&chainid=1`

    const response = await fetch(url, {
      next: { revalidate: 30 }, // Cache for 30 seconds
    })

    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status}`)
    }

    const data: EtherscanResponse = await response.json()

    // Check for API errors
    if (data.status === '0' && data.message === 'NOTOK') {
      console.error('Etherscan API error:', data.result)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch transactions from Etherscan',
          details: data.result
        },
        { status: 500 }
      )
    }

    // Format transactions
    const formattedTransactions = data.result.map((tx) => {
      const valueEth = Number(tx.value) / 1e18
      const gasPriceGwei = Number(tx.gasPrice) / 1e9
      const gasCost = (Number(tx.gasUsed) * Number(tx.gasPrice)) / 1e18

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: valueEth,
        timestamp: new Date(Number(tx.timeStamp) * 1000).toISOString(),
        blockNumber: parseInt(tx.blockNumber),
        gasUsed: parseInt(tx.gasUsed),
        gasPrice: gasPriceGwei,
        gasCost: gasCost,
        isError: tx.isError === '1',
        type: tx.from.toLowerCase() === address.toLowerCase() ? 'OUT' : 'IN',
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedTransactions,
      count: formattedTransactions.length,
      address,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Transaction fetch error:', error)
    
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
