// components/TransactionHistory.tsx
'use client'

import { useState, useEffect } from 'react'

interface Transaction {
  hash: string
  from: string
  to: string
  value: number
  timestamp: string
  gasUsed: number
  gasPrice: number
  gasCost: number
  isError: boolean
  type: 'IN' | 'OUT'
}

export default function TransactionHistory({ address }: { address: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(`/api/whales/transactions?address=${address}&limit=50`)
        const json = await response.json()
        
        if (json.success) {
          setTransactions(json.data)
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [address])

  if (loading) return <div>Loading transactions...</div>

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Transaction History</h3>
      
      <div className="space-y-2">
        {transactions.map((tx) => (
          <div
            key={tx.hash}
            className="bg-gray-800 p-4 rounded-lg flex justify-between items-center"
          >
            <div>
              <div className="text-sm text-gray-400">
                {new Date(tx.timestamp).toLocaleString()}
              </div>
              
              <div className="font-mono text-xs text-blue-400">
                <a
                  href={`https://etherscan.io/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {tx.hash.substring(0, 10)}...{tx.hash.slice(-8)}
                </a>
              </div>
            </div>

            <div className="text-right">
              <div className={`font-bold ${tx.type === 'OUT' ? 'text-red-400' : 'text-green-400'}`}>
                {tx.type === 'OUT' ? '-' : '+'}{tx.value.toFixed(4)} ETH
              </div>
              
              <div className="text-xs text-gray-500">
                Gas: {tx.gasCost.toFixed(6)} ETH
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
