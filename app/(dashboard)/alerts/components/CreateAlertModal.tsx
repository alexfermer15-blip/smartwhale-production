// app/(dashboard)/alerts/components/CreateAlertModal.tsx
'use client'

import { useState } from 'react'

interface CreateAlertModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (alertData: {
    alertType: string
    conditionType: string
    targetValue?: number
    tokenSymbol?: string
    whaleAddress?: string
  }) => Promise<void>
}

export default function CreateAlertModal({ isOpen, onClose, onSave }: CreateAlertModalProps) {
  const [alertType, setAlertType] = useState<'price' | 'whale' | 'portfolio'>('price')
  const [conditionType, setConditionType] = useState('above')
  const [targetValue, setTargetValue] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('BTC')
  const [whaleAddress, setWhaleAddress] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (alertType === 'price' && (!tokenSymbol || !targetValue)) {
      alert('Please fill in all required fields')
      return
    }

    if (alertType === 'whale' && !whaleAddress) {
      alert('Please enter a whale address')
      return
    }

    setLoading(true)
    try {
      await onSave({
        alertType,
        conditionType,
        targetValue: targetValue ? parseFloat(targetValue) : undefined,
        tokenSymbol: alertType === 'price' ? tokenSymbol : undefined,
        whaleAddress: alertType === 'whale' ? whaleAddress : undefined,
      })

      // Сбрасываем форму
      setAlertType('price')
      setConditionType('above')
      setTargetValue('')
      setTokenSymbol('BTC')
      setWhaleAddress('')
      onClose()
    } catch (error) {
      console.error('Error creating alert:', error)
      alert('Failed to create alert')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Create Alert</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Alert Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Alert Type
            </label>
            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value as 'price' | 'whale' | 'portfolio')}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="price">Price Alert</option>
              <option value="whale">Whale Movement Alert</option>
              <option value="portfolio">Portfolio Change Alert</option>
            </select>
          </div>

          {/* Price Alert Fields */}
          {alertType === 'price' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cryptocurrency
                </label>
                <select
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="ETH">Ethereum (ETH)</option>
                  <option value="SOL">Solana (SOL)</option>
                  <option value="BNB">Binance Coin (BNB)</option>
                  <option value="ADA">Cardano (ADA)</option>
                  <option value="DOT">Polkadot (DOT)</option>
                  <option value="AVAX">Avalanche (AVAX)</option>
                  <option value="MATIC">Polygon (MATIC)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Condition
                </label>
                <select
                  value={conditionType}
                  onChange={(e) => setConditionType(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="above">Price goes above</option>
                  <option value="below">Price goes below</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Price (USD)
                </label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="50000"
                  step="0.01"
                  min="0"
                />
              </div>
            </>
          )}

          {/* Whale Alert Fields */}
          {alertType === 'whale' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Whale Wallet Address
              </label>
              <input
                type="text"
                value={whaleAddress}
                onChange={(e) => setWhaleAddress(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="0xF977814e90dA44bFA03b6295A0616a897441aceC"
              />
              <p className="text-xs text-gray-500 mt-1">
                You'll be notified when this whale makes any transaction
              </p>
            </div>
          )}

          {/* Portfolio Alert Fields */}
          {alertType === 'portfolio' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Condition
                </label>
                <select
                  value={conditionType}
                  onChange={(e) => setConditionType(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="change">Portfolio value changes by</option>
                  <option value="above">Portfolio value goes above</option>
                  <option value="below">Portfolio value goes below</option>
                </select>
              </div>

              {conditionType === 'change' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Change Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="5"
                    step="0.1"
                    min="0"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Value (USD)
                  </label>
                  <input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="100000"
                    step="100"
                    min="0"
                  />
                </div>
              )}
            </>
          )}

          {/* Preview */}
          {(alertType === 'price' && tokenSymbol && targetValue) && (
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Preview:</p>
              <p className="text-white">
                Alert me when <span className="text-blue-400 font-semibold">{tokenSymbol}</span> price goes{' '}
                <span className="text-green-400 font-semibold">{conditionType}</span>{' '}
                <span className="text-yellow-400 font-semibold">${parseFloat(targetValue).toLocaleString()}</span>
              </p>
            </div>
          )}
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
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Alert'}
          </button>
        </div>
      </div>
    </div>
  )
}
