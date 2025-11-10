// app/(dashboard)/portfolio/components/AddAssetModal.tsx
'use client'

import { useState } from 'react'

interface AddAssetModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (symbol: string, amount: number, price: number) => void
}

const AVAILABLE_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'SOL', name: 'Solana', icon: '◎' },
  { symbol: 'BNB', name: 'Binance Coin', icon: '🔸' },
  { symbol: 'ADA', name: 'Cardano', icon: '₳' },
  { symbol: 'DOT', name: 'Polkadot', icon: '●' },
  { symbol: 'AVAX', name: 'Avalanche', icon: '🔺' },
  { symbol: 'MATIC', name: 'Polygon', icon: '⬡' },
]

export default function AddAssetModal({ isOpen, onClose, onSave }: AddAssetModalProps) {
  const [selectedAsset, setSelectedAsset] = useState('')
  const [amount, setAmount] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!selectedAsset || !amount || !buyPrice) {
      alert('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      await onSave(selectedAsset, parseFloat(amount), parseFloat(buyPrice))
      // Закрываем модалку и очищаем поля
      setSelectedAsset('')
      setAmount('')
      setBuyPrice('')
      onClose()
    } catch (error) {
      console.error('Error saving asset:', error)
      alert('Failed to add asset')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedAsset('')
    setAmount('')
    setBuyPrice('')
    onClose()
  }

  if (!isOpen) return null

  const selectedAssetInfo = AVAILABLE_ASSETS.find(a => a.symbol === selectedAsset)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Add Asset</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Asset Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Asset
            </label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              <option value="" className="text-gray-400">Choose an asset...</option>
              {AVAILABLE_ASSETS.map((asset) => (
                <option key={asset.symbol} value={asset.symbol} className="text-white bg-slate-900">
                  {asset.icon} {asset.name} ({asset.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
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
              step="0.00000001"
              min="0"
            />
          </div>

          {/* Buy Price */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Average Buy Price (USD)
            </label>
            <input
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>

          {/* Preview */}
          {selectedAsset && amount && buyPrice && (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-400">Asset:</span>
                <span className="text-white font-semibold">
                  {selectedAssetInfo?.icon} {selectedAssetInfo?.name} ({selectedAsset})
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white font-semibold">{amount}</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-400">Buy Price:</span>
                <span className="text-white font-semibold">${parseFloat(buyPrice).toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-700 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Total Investment:</span>
                <span className="text-white font-bold text-lg">
                  ${(parseFloat(amount || '0') * parseFloat(buyPrice || '0')).toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
            disabled={loading || !selectedAsset || !amount || !buyPrice}
          >
            {loading ? 'Adding...' : 'Add Asset'}
          </button>
        </div>
      </div>
    </div>
  )
}
