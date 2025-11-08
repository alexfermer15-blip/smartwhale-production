'use client'

import { useState } from 'react'

interface AddWhaleModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { address: string; name: string; notes: string }) => Promise<void>
  isLoading: boolean
}

export default function AddWhaleModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: AddWhaleModalProps) {
  const [address, setAddress] = useState('')
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!address.trim()) {
      setError('Address is required')
      return
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setError('Invalid Ethereum address format')
      return
    }

    try {
      await onSubmit({
        address: address.toLowerCase(),
        name: name || `Whale ${address.substring(0, 6)}...`,
        notes,
      })

      setAddress('')
      setName('')
      setNotes('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add whale')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 max-w-md w-full mx-4 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Add Custom Whale</h2>
          <p className="text-gray-400 text-sm mt-1">
            Track any Ethereum wallet address
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Wallet Address *
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f..."
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter a valid Ethereum address (42 characters)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Whale Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Vitalik's Wallet"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this whale..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
              ❌ {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition font-semibold"
            >
              {isLoading ? '⏳ Adding...' : '✅ Add Whale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
