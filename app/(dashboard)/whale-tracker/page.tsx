'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Whale {
  id: string
  address: string
  balance: number
  transactions: number
  lastActive: string
  change24h: number
  portfolio: {
    btc: number
    eth: number
    sol: number
  }
}

export default function WhaleTrackerPage() {
  const [whales, setWhales] = useState<Whale[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, active, high-value

  useEffect(() => {
    fetchWhales()
  }, [filter])

  const fetchWhales = async () => {
    setLoading(true)
    try {
      // TODO: Replace with real API call
      const mockWhales: Whale[] = [
        {
          id: '1',
          address: '0x1234...5678',
          balance: 125000000,
          transactions: 2341,
          lastActive: '2 minutes ago',
          change24h: 12.5,
          portfolio: { btc: 45, eth: 28, sol: 15 },
        },
        {
          id: '2',
          address: '0x9876...5432',
          balance: 98500000,
          transactions: 1892,
          lastActive: '15 minutes ago',
          change24h: -5.2,
          portfolio: { btc: 60, eth: 25, sol: 8 },
        },
        {
          id: '3',
          address: '0x5555...6666',
          balance: 75200000,
          transactions: 1245,
          lastActive: '1 hour ago',
          change24h: 8.3,
          portfolio: { btc: 35, eth: 40, sol: 20 },
        },
      ]
      setWhales(mockWhales)
    } catch (error) {
      console.error('Error fetching whales:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Whale Tracker</h1>
          <p className="text-gray-400">Monitor top cryptocurrency whales in real-time</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
          Add Whale
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">Total Whales</p>
          <p className="text-3xl font-bold text-white">1,234</p>
          <p className="text-green-400 text-sm mt-2">↑ 12 new today</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">Total Volume</p>
          <p className="text-3xl font-bold text-white">$2.3B</p>
          <p className="text-green-400 text-sm mt-2">↑ +8.5%</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">Active 24h</p>
          <p className="text-3xl font-bold text-white">456</p>
          <p className="text-green-400 text-sm mt-2">↑ +23%</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">Avg Transaction</p>
          <p className="text-3xl font-bold text-white">$2.1M</p>
          <p className="text-red-400 text-sm mt-2">↓ -3.2%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'active', 'high-value'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg transition ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800/50 text-gray-400 hover:text-white'
            }`}
          >
            {f === 'all' ? 'All Whales' : f === 'active' ? 'Recently Active' : 'High Value'}
          </button>
        ))}
      </div>

      {/* Whales Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Address</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Balance</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Transactions</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Portfolio</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">24h Change</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Last Active</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    Loading whales...
                  </td>
                </tr>
              ) : (
                whales.map((whale) => (
                  <tr key={whale.id} className="hover:bg-slate-700/20 transition">
                    <td className="px-6 py-4 text-sm text-white font-mono">{whale.address}</td>
                    <td className="px-6 py-4 text-sm text-white">
                      ${(whale.balance / 1000000).toFixed(1)}M
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{whale.transactions.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <span className="text-yellow-400">₿ {whale.portfolio.btc}%</span>
                        <span className="text-blue-400">Ξ {whale.portfolio.eth}%</span>
                        <span className="text-purple-400">◎ {whale.portfolio.sol}%</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${whale.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {whale.change24h > 0 ? '↑' : '↓'} {Math.abs(whale.change24h)}%
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{whale.lastActive}</td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-blue-400 hover:text-blue-300 transition">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <p className="text-gray-400 text-sm">Showing 1-20 of 1,234 whales</p>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 text-gray-400 hover:text-white rounded transition">
            Previous
          </button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded transition">1</button>
          <button className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 text-gray-400 hover:text-white rounded transition">
            2
          </button>
          <button className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 text-gray-400 hover:text-white rounded transition">
            3
          </button>
          <button className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 text-gray-400 hover:text-white rounded transition">
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
