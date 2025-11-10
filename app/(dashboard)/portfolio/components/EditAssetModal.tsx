// app/(dashboard)/portfolio/components/EditAssetModal.tsx
'use client'

import { useState, useEffect } from 'react'

interface EditAssetModalProps {
  isOpen: boolean
  onClose: () => void
  asset: {
    symbol: string
    name: string
    amount: number
    price: number
  } | null
  onSave: (symbol: string, amount: number, price: number) => void
}

export default function EditAssetModal({ isOpen, onClose, asset, onSave }: EditAssetModalProps) {
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (asset) {
      setAmount(asset.amount.toString())
      setPrice(asset.price.toString())
    }
  }, [asset])

  const handleSave = async () => {
    if (!asset) return
    
    setLoading(true)
    try {
      await onSave(asset.symbol, parseFloat(amount), parseFloat(price))
      onClose()
    } catch (error) {
      console.error('Error saving asset:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !asset) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Edit {asset.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="0.00"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price (USD)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="0.00"
              step="0.01"
            />
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">New Value:</span>
              <span className="text-white font-semibold">
                ${(parseFloat(amount || '0') * parseFloat(price || '0')).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
