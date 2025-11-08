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
  address: string
  balance: number
  chainId: number
  transactions: number
  verified: boolean
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
      const response = await fetch('/api/whales/real?action=top')
      const json = await response.json()
      if (json.success && json.data) {
        setWhales(json.data.slice(0, 10))
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Whale Tracker</h1>
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
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
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
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  #
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Address
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  ETH Balance
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {whales.map((whale, i) => (
                <tr key={i} className="hover:bg-slate-700/20 transition">
                  <td className="px-6 py-4 text-sm text-gray-400">{i + 1}</td>
                  <td className="px-6 py-4 text-sm text-white font-mono">
                    {whale.address.substring(0, 10)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-blue-400">
                    {whale.balance.toFixed(2)} ETH
                  </td>
                  <td className="px-6 py-4 text-sm text-green-400">
                    ${(whale.balance * 45000).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
