// components/AlertModal.tsx
'use client'
import { useState } from 'react'
import { X } from 'lucide-react' // или любая иконка

type AlertType = 'balance' | 'price' | 'transaction' | 'newtoken'

type Props = {
  walletAddress: string
  onClose: () => void
}

export default function AlertModal({ walletAddress, onClose }: Props) {
  const [alertType, setAlertType] = useState<AlertType>('balance')
  const [threshold, setThreshold] = useState('')
  const [notifyEmail, setNotifyEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleCreateAlert = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/alerts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          alertType,
          threshold: parseFloat(threshold),
          notifyEmail,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setSuccess(true)
        setTimeout(() => onClose(), 1500)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-white mb-4">Create Alert</h2>
        <p className="text-sm text-gray-400 mb-6">
          Get notified when this whale performs certain actions
        </p>

        {success && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded text-green-400 text-sm">
            ✅ Alert created successfully!
          </div>
        )}

        <div className="space-y-4">
          {/* Alert Type */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Alert Type</label>
            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value as AlertType)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="balance">Balance Change</option>
              <option value="price">Price Alert</option>
              <option value="transaction">Large Transaction</option>
              <option value="newtoken">New Token Purchase</option>
            </select>
          </div>

          {/* Threshold */}
          {(alertType === 'balance' || alertType === 'price' || alertType === 'transaction') && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                {alertType === 'balance' && 'Balance Change (%)'}
                {alertType === 'price' && 'Target Price ($)'}
                {alertType === 'transaction' && 'Min Transaction Value ($)'}
              </label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder={
                  alertType === 'balance'
                    ? '5'
                    : alertType === 'price'
                    ? '100'
                    : '10000'
                }
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Email Notification */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Email Notification (optional)
            </label>
            <input
              type="email"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAlert}
              disabled={loading || !threshold}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded transition"
            >
              {loading ? 'Creating...' : 'Create Alert'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
