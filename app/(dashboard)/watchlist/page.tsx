'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY!

interface WatchlistItem {
  id: string
  whale_address: string
  whale_label: string
  added_at: string
  current_balance?: number
  current_usd_value?: number
  last_updated?: string
}

export default function WatchlistPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user || null)
    
    if (session?.user) {
      await fetchWatchlist(session.user.id)
    } else {
      setLoading(false)
    }
  }

  async function fetchWatchlist(userId: string) {
    setLoading(true)
    try {
      const response = await fetch(`/api/whales/watchlist?user_id=${userId}`)
      const json = await response.json()

      if (json.success) {
        const items = json.data as WatchlistItem[]
        await updateBalances(items)
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateBalances(items: WatchlistItem[]) {
    const updatedItems = await Promise.all(
      items.map(async (item) => {
        try {
          const response = await fetch(
            `https://api.etherscan.io/v2/api?chainid=1&module=account&action=balance&address=${item.whale_address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`
          )
          const data = await response.json()
          
          if (data.status === '1' && data.result) {
            const balance = parseFloat(data.result) / 1e18
            const ethPrice = 3400
            const usdValue = balance * ethPrice

            return {
              ...item,
              current_balance: balance,
              current_usd_value: usdValue,
              last_updated: new Date().toISOString(),
            }
          }
        } catch (error) {
          console.error(`Error fetching balance for ${item.whale_address}:`, error)
        }
        
        return {
          ...item,
          current_balance: 0,
          current_usd_value: 0,
          last_updated: new Date().toISOString(),
        }
      })
    )

    setWatchlist(updatedItems)
  }

  async function removeFromWatchlist(address: string) {
    if (!user) return

    const whale = watchlist.find(w => w.whale_address === address)
    const confirmRemove = confirm(`Remove ${whale?.whale_label || 'this whale'} from watchlist?`)
    if (!confirmRemove) return

    try {
      const response = await fetch('/api/whales/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          whale_address: address,
        }),
      })

      const json = await response.json()

      if (json.success) {
        await fetchWatchlist(user.id)
      } else {
        alert('Failed to remove from watchlist')
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      alert('Error removing from watchlist')
    }
  }

  async function refreshBalances() {
    if (!user) return
    setRefreshing(true)
    await fetchWatchlist(user.id)
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400 text-xl">Loading watchlist...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-gray-400 text-xl">Sign in to view your watchlist</div>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">⭐ My Watchlist</h1>
          <p className="text-gray-400">Track your favorite whale wallets</p>
        </div>
        <button
          onClick={refreshBalances}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className={refreshing ? 'animate-spin' : ''}>{refreshing ? '🔄' : '↻'}</span>
          <span>{refreshing ? 'Refreshing...' : 'Refresh Balances'}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="text-gray-400 text-sm mb-1">Total Whales</div>
          <div className="text-3xl font-bold text-white">{watchlist.length}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="text-gray-400 text-sm mb-1">Total ETH</div>
          <div className="text-3xl font-bold text-blue-400">
            {watchlist
              .reduce((sum, item) => sum + (item.current_balance || 0), 0)
              .toFixed(2)}{' '}
            ETH
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="text-gray-400 text-sm mb-1">Total USD Value</div>
          <div className="text-3xl font-bold text-green-400">
            $
            {watchlist
              .reduce((sum, item) => sum + (item.current_usd_value || 0), 0)
              .toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Watchlist Items */}
      {watchlist.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">⭐</div>
          <h3 className="text-xl font-bold text-white mb-2">No Whales in Watchlist</h3>
          <p className="text-gray-400 mb-4">
            Start tracking whales by adding them from the Whale Tracker
          </p>
          <button
            onClick={() => router.push('/whale-tracker')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Go to Whale Tracker
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {watchlist.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 hover:bg-slate-800/70 transition group"
            >
              <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{item.whale_label}</h3>
                  <p className="text-gray-400 text-sm font-mono break-all">{item.whale_address}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Added on {new Date(item.added_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => removeFromWatchlist(item.whale_address)}
                  className="px-3 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 rounded border border-red-600/20 hover:border-red-600/50 transition text-sm"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Current Balance</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {item.current_balance !== undefined
                      ? `${item.current_balance.toLocaleString()} ETH`
                      : '...'}
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">USD Value</div>
                  <div className="text-2xl font-bold text-green-400">
                    {item.current_usd_value !== undefined
                      ? `$${item.current_usd_value.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}`
                      : '...'}
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">Last Updated</div>
                  <div className="text-sm text-gray-300">
                    {item.last_updated
                      ? new Date(item.last_updated).toLocaleTimeString()
                      : 'Not updated'}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <a
                  href={`https://etherscan.io/address/${item.whale_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded transition text-sm"
                >
                  View on Etherscan ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
