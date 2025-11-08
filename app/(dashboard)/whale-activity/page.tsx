'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY!

interface WatchlistItem {
  whale_address: string
  whale_label: string
}

interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  timeStamp: string
  whale_address: string
  whale_label: string
}

export default function WhaleActivityPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        fetchWatchlist(user.id)
      } else {
        setLoading(false)
      }
    })
  }, [])

  async function fetchWatchlist(userId: string) {
    try {
      const response = await fetch(`/api/whales/watchlist?user_id=${userId}`)
      const json = await response.json()
      
      if (json.success) {
        setWatchlist(json.data)
        await fetchAllTransactions(json.data)
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAllTransactions(watchlistItems: WatchlistItem[]) {
    const allTxs: Transaction[] = []

    for (const item of watchlistItems) {
      try {
        const response = await fetch(
          `https://api.etherscan.io/api?module=account&action=txlist&address=${item.whale_address}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc&apikey=${ETHERSCAN_API_KEY}`
        )
        const data = await response.json()

        if (data.result) {
          const txs = data.result.map((tx: any) => ({
            ...tx,
            whale_address: item.whale_address,
            whale_label: item.whale_label,
          }))
          allTxs.push(...txs)
        }
      } catch (error) {
        console.error(`Error fetching transactions for ${item.whale_address}:`, error)
      }
    }

    // Сортируем по времени
    allTxs.sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp))
    setTransactions(allTxs)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400 text-xl">⏳ Loading activity feed...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-gray-400 text-xl">Sign in to view whale activity feed</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">📊 Whale Activity Feed</h1>
        <p className="text-gray-400">Real-time transactions from your watchlist</p>
      </div>

      {watchlist.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🐋</div>
          <h3 className="text-xl font-bold text-white mb-2">No Whales in Watchlist</h3>
          <p className="text-gray-400 mb-4">Add whales to your watchlist to see their activity here</p>
          <button
            onClick={() => router.push('/whale-tracker')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Go to Whale Tracker
          </button>
        </div>
      ) : (
        <>
          {/* Watchlist Summary */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-3">Monitoring {watchlist.length} Whale(s)</h2>
            <div className="flex flex-wrap gap-2">
              {watchlist.map((item) => (
                <button
                  key={item.whale_address}
                  onClick={() => router.push(`/whale/${item.whale_address}`)}
                  className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded text-sm transition"
                >
                  {item.whale_label}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
            
            {transactions.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No recent transactions</div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx, index) => {
                  const isIncoming = tx.to?.toLowerCase() === tx.whale_address.toLowerCase()
                  const value = (parseFloat(tx.value) / 1e18).toFixed(4)
                  
                  return (
                    <div
                      key={`${tx.hash}-${index}`}
                      className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 hover:bg-slate-700/50 transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-blue-400 font-semibold">{tx.whale_label}</span>
                          <span
                            className={`ml-3 text-xs px-2 py-1 rounded ${
                              isIncoming
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {isIncoming ? '↓ IN' : '↑ OUT'}
                          </span>
                        </div>
                        <span className="text-gray-400 text-sm">
                          {new Date(parseInt(tx.timeStamp) * 1000).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <span className="text-gray-400">From: </span>
                          <span className="text-gray-300 font-mono">{tx.from.slice(0, 10)}...</span>
                          <span className="text-gray-400 mx-2">→</span>
                          <span className="text-gray-400">To: </span>
                          <span className="text-gray-300 font-mono">{tx.to.slice(0, 10)}...</span>
                        </div>
                        <span className={`font-bold ${isIncoming ? 'text-green-400' : 'text-red-400'}`}>
                          {value} ETH
                        </span>
                      </div>
                      
                      <a
                        href={`https://etherscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline text-xs mt-2 inline-block"
                      >
                        View on Etherscan →
                      </a>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
