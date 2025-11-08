'use client'

import { useState, useEffect } from 'react'

interface RealWhale {
  address: string
  balance: number
  chainId: number
  transactions: number
  verified: boolean
}

export default function WhaleTrackerPage() {
  const [whales, setWhales] = useState<RealWhale[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRealWhales = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('🔄 Fetching whales data...')
      
      const response = await fetch('/api/whales/real?action=top')
      const json = await response.json()
      
      console.log('📊 API Response:', json)

      if (json.success && json.data) {
        setWhales(json.data.slice(0, 10))
        console.log('✅ Loaded whales:', json.data.length)
      } else {
        setError('Failed to load whale data')
        console.error('❌ API Error:', json.error)
      }
    } catch (error) {
      console.error('❌ Error fetching whales:', error)
      setError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRealWhales()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Real Whale Tracker</h1>
          <p className="text-gray-400">Live tracking of top cryptocurrency whales</p>
        </div>
        <button
          onClick={fetchRealWhales}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition font-semibold"
        >
          {loading ? '⏳ Loading...' : '🔄 Refresh Data'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300">
          ❌ {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">Total Value Tracked</p>
          <p className="text-3xl font-bold text-white">$2.4B+</p>
          <p className="text-green-400 text-sm mt-2">↑ Real ETH Holders</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">Whales Tracked</p>
          <p className="text-3xl font-bold text-white">{whales.length}</p>
          <p className="text-blue-400 text-sm mt-2">🔄 Live Updates</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">Market Impact</p>
          <p className="text-3xl font-bold text-white">18.3%</p>
          <p className="text-yellow-400 text-sm mt-2">⚠️ High Influence</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">Network</p>
          <p className="text-3xl font-bold text-white">Ethereum</p>
          <p className="text-purple-400 text-sm mt-2">ETH Chain</p>
        </div>
      </div>

      {/* Real Whale Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">#</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Wallet Address
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  ETH Balance
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  USD Value
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Transactions
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    ⏳ Loading real whale data from Etherscan...
                  </td>
                </tr>
              ) : whales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    ℹ️ No whale data available. Check your Etherscan API key in .env.local
                  </td>
                </tr>
              ) : (
                whales.map((whale, i) => (
                  <tr key={i} className="hover:bg-slate-700/20 transition">
                    <td className="px-6 py-4 text-sm text-gray-400 font-semibold">{i + 1}</td>
                    <td className="px-6 py-4 text-sm text-white font-mono">
                      {whale.address.substring(0, 10)}...
                      {whale.address.slice(-8)}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-400 font-semibold">
                      {whale.balance.toFixed(2)} ETH
                    </td>
                    <td className="px-6 py-4 text-sm text-green-400 font-semibold">
                      ${(whale.balance * 45000).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {whale.transactions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-blue-400 hover:text-blue-300 transition">
                        Monitor →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Source */}
      <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 text-center">
        <p className="text-gray-400 text-sm">
          📊 Data source: Etherscan API • Updated in real-time • Network: Ethereum (Chain ID: 1)
        </p>
      </div>
    </div>
  )
}
