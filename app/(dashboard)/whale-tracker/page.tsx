'use client'

import { useState, useEffect } from 'react'
import AddWhaleModal from '../components/add-whale-modal'

interface CustomWhale {
  id: string
  address: string
  name: string
  notes: string
  created_at: string
}

interface RealWhale {
  rank: number
  address: string
  balance: number
  usdValue: number
  transactions: number
  label: string
  lastUpdate: string
}

export default function WhaleTrackerPage() {
  const [whales, setWhales] = useState<RealWhale[]>([])
  const [customWhales, setCustomWhales] = useState<CustomWhale[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Загрузи добавленных китов
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

  // Загрузи реальных китов
  const fetchRealWhales = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/whales/real?action=top&limit=50')
      const json = await response.json()
      
      if (json.success && json.data) {
        setWhales(json.data)
      } else {
        setError(json.error || 'Failed to fetch whale data')
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Добавь нового кита
  const handleAddWhale = async (data: {
    address: string
    name: string
    notes: string
  }) => {
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
    } finally {
      setIsSubmitting(false)
    }
  }

  // Удали кита
  const handleDeleteWhale = async (whaleId: string) => {
    if (!confirm('Are you sure?')) return

    try {
      const response = await fetch(`/api/whales/custom?id=${whaleId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCustomWhales(customWhales.filter((w) => w.id !== whaleId))
      }
    } catch (err) {
      console.error('Error deleting whale:', err)
    }
  }

  useEffect(() => {
    fetchCustomWhales()
    fetchRealWhales()
  }, [])

  // Вычисляем общую стоимость
  const totalValue = whales.reduce((sum, whale) => sum + (whale.usdValue || 0), 0)
  const totalValueFormatted = totalValue > 1e9 
    ? `$${(totalValue / 1e9).toFixed(1)}B+` 
    : `$${(totalValue / 1e6).toFixed(0)}M+`

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Real Whale Tracker</h1>
          <p className="text-gray-400">
            Track real whales + add custom addresses
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold"
          >
            ➕ Add Custom Whale
          </button>
          <button
            onClick={fetchRealWhales}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition font-semibold"
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh Data'}
          </button>
        </div>
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
          <p className="text-3xl font-bold text-white">{totalValueFormatted}</p>
          <p className="text-green-400 text-sm mt-2">↑ Real ETH Holders</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">Whales Tracked</p>
          <p className="text-3xl font-bold text-white">{whales.length}</p>
          <p className="text-blue-400 text-sm mt-2">📡 Live Updates</p>
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

      {/* Custom Whales Section */}
      {customWhales.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">📌 Your Custom Whales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customWhales.map((whale) => (
              <div
                key={whale.id}
                className="bg-slate-800/50 border border-green-500/30 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-white font-semibold">{whale.name}</p>
                    <p className="text-gray-400 text-sm font-mono">
                      {whale.address.substring(0, 10)}...
                      {whale.address.slice(-8)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteWhale(whale.id)}
                    className="text-red-400 hover:text-red-300 transition text-sm"
                  >
                    ✕ Delete
                  </button>
                </div>
                {whale.notes && (
                  <p className="text-gray-400 text-sm">{whale.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real Whales Section */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white">
          🌊 Real ETH Whales (Etherscan)
        </h2>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Label
                  </th>
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
                    <tr key={whale.address} className="hover:bg-slate-700/20 transition">
                      <td className="px-6 py-4 text-sm text-gray-400 font-semibold">
                        {whale.rank || i + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-purple-400 font-medium">
                        {whale.label || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-white font-mono">
                        {whale.address?.substring(0, 6)}...
                        {whale.address?.slice(-4)}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-400 font-semibold">
                        {whale.balance?.toLocaleString(undefined, { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        }) || '0.00'} ETH
                      </td>
                      <td className="px-6 py-4 text-sm text-green-400 font-semibold">
                        ${whale.usdValue?.toLocaleString(undefined, { 
                          maximumFractionDigits: 0 
                        }) || '0'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {whale.transactions?.toLocaleString() || '0'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Data Source */}
      <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 text-center">
        <p className="text-gray-400 text-sm">
          📊 Data source: Etherscan API V2 • Updated in real-time • Network: Ethereum (Chain ID: 1)
        </p>
      </div>

      {/* Modal */}
      <AddWhaleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddWhale}
        isLoading={isSubmitting}
      />
    </div>
  )
}
