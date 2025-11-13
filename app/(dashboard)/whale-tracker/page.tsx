'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AddWhaleModal from '../components/add-whale-modal'

interface CustomWhale {
  id: string
  address: string
  name: string
  notes: string
  created_at: string
}

interface Whale {
  address: string
  balance: number
  balanceUSD: number
  label?: string
}

interface WhaleStats {
  totalValue: number
  totalETH: number
  whaleCount: number
  marketImpact: number
  whales: Whale[]
}

export default function WhaleTrackerPage() {
  const router = useRouter()
  const [stats, setStats] = useState<WhaleStats | null>(null)
  const [customWhales, setCustomWhales] = useState<CustomWhale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchCustomWhales = async () => {
    try {
      const response = await fetch('/api/whales/custom')
      const json = await response.json()
      if (json.success) {
        setCustomWhales(json.data || [])
      }
    } catch (err) {
      console.error('Error fetching custom whales:', err)
    }
  }

  const fetchWhaleData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/whales')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      } else {
        setError(data.message || 'Failed to fetch whale data')
      }
    } catch (err) {
      setError('Failed to load whale data. Check your Etherscan API key in .env.local')
    } finally {
      setLoading(false)
    }
  }

  const handleAddWhale = async (data: { address: string; name: string; notes: string }) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/whales/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const json = await response.json()
        throw new Error(json.error || 'Failed to add whale')
      }
      await fetchCustomWhales()
      setShowModal(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add whale')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteWhale = async (whaleId: string) => {
    if (!confirm('Are you sure you want to delete this whale?')) return
    try {
      const response = await fetch(`/api/whales/custom?id=${whaleId}`, { method: 'DELETE' })
      if (response.ok) {
        setCustomWhales(customWhales.filter((w) => w.id !== whaleId))
      } else {
        const json = await response.json()
        throw new Error(json.error || 'Failed to delete whale')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete whale')
    }
  }

  useEffect(() => {
    fetchCustomWhales()
    fetchWhaleData()
  }, [])

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000_000) {
      return `$${(num / 1_000_000_000).toFixed(2)}B`
    } else if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2)}M`
    } else if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(2)}K`
    }
    return `$${num.toFixed(2)}`
  }

  const formatETH = (eth: number): string =>
    eth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const shortenAddress = (address: string): string =>
    `${address.substring(0, 6)}...${address.substring(address.length - 4)}`

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Whale Tracker</h1>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading whale data from Etherscan...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Real Whale Tracker</h1>
          <p className="text-gray-400">Track real whales + add custom addresses</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center gap-2"
          >
            <span>➕</span>
            <span>Add Custom Whale</span>
          </button>
          <button
            onClick={fetchWhaleData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50"
          >
            <span>🔄</span>
            <span>{loading ? 'Loading...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>
      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400 font-semibold mb-2">⚠️ Error</p>
          <p className="text-red-300 text-sm">{error}</p>
          <button
            onClick={fetchWhaleData}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition"
          >
            Retry
          </button>
        </div>
      )}
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition">
            <div className="text-sm text-gray-400 mb-2">Total Value Tracked</div>
            <div className="text-2xl font-bold text-white">{formatNumber(stats.totalValue)}</div>
            <div className="text-xs text-blue-400 mt-1">📊 Real ETH Holders</div>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 hover:border-green-500/50 transition">
            <div className="text-sm text-gray-400 mb-2">Whales Tracked</div>
            <div className="text-2xl font-bold text-white">{stats.whaleCount}</div>
            <div className="text-xs text-green-400 mt-1">🔵 Live Updates</div>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 hover:border-yellow-500/50 transition">
            <div className="text-sm text-gray-400 mb-2">Market Impact</div>
            <div className="text-2xl font-bold text-white">{stats.marketImpact.toFixed(3)}%</div>
            <div className="text-xs text-yellow-400 mt-1">⚡ High Influence</div>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 hover:border-purple-500/50 transition">
            <div className="text-sm text-gray-400 mb-2">Network</div>
            <div className="text-2xl font-bold text-white">Ethereum</div>
            <div className="text-xs text-purple-400 mt-1">🔗 ETH Chain</div>
          </div>
        </div>
      )}
      {/* Custom Whales */}
      {customWhales.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">📌 Your Custom Whales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customWhales.map((whale) => (
              <div
                key={whale.id}
                className="bg-slate-800/50 border border-green-500/30 rounded-lg p-4 hover:border-green-500/50 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-white font-semibold">{whale.name}</p>
                    <p className="text-gray-400 text-sm font-mono">
                      {shortenAddress(whale.address)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteWhale(whale.id)}
                    className="text-red-400 hover:text-red-300 transition text-sm"
                  >
                    ✕ Delete
                  </button>
                </div>
                {whale.notes && <p className="text-gray-400 text-sm">{whale.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Real Whales Table */}
      {stats && stats.whales.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">🐋 Real ETH Whales (Etherscan)</h2>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/50 border-b border-slate-700">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">#</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Label</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Wallet Address</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">ETH Balance</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">USD Value</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.whales.map((whale, index) => (
                    <tr
                      key={whale.address}
                      className="border-b border-slate-800 hover:bg-slate-800/30 transition"
                    >
                      <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/whale/${whale.address}`}
                          className="text-white font-medium hover:text-blue-400 transition"
                        >
                          {whale.label || 'Unknown Whale'}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/whale/${whale.address}`}
                          className="text-blue-400 hover:text-blue-300 transition font-mono text-sm"
                        >
                          {shortenAddress(whale.address)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-green-400 font-semibold">
                          {formatETH(whale.balance)} ETH
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-white font-semibold">
                          {formatNumber(whale.balanceUSD)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={`https://etherscan.io/address/${whale.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded text-sm transition"
                        >
                          View on Etherscan
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-800/30 border-t border-slate-700">
              <p className="text-xs text-gray-500 text-center">
                💾 Data source: Etherscan API V2 • Updated in real-time • Network: Ethereum (Chain ID: 1)
              </p>
            </div>
          </div>
        </div>
      )}
      {stats && stats.whales.length === 0 && !error && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-12 text-center">
          <p className="text-2xl mb-2">🐋</p>
          <p className="text-gray-400 text-lg mb-4">
            No whale data available. Check your Etherscan API key in .env.local
          </p>
          <button
            onClick={fetchWhaleData}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Retry
          </button>
        </div>
      )}
      <AddWhaleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddWhale}
        isLoading={isSubmitting}
      />
    </div>
  )
}
