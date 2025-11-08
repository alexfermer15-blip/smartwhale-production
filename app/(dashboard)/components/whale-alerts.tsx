'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

type AlertType = 'balance_increase' | 'balance_decrease' | 'large_transaction'

interface Alert {
  id: string
  user_id: string
  whale_address: string
  whale_label: string
  alert_type: AlertType
  threshold_value: number
  is_active: boolean
  created_at: string
}

interface NewAlert {
  whale_address: string
  whale_label: string
  alert_type: AlertType
  threshold_value: number
}

export default function WhaleAlerts() {
  const [user, setUser] = useState<any>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  
  const [newAlert, setNewAlert] = useState<NewAlert>({
    whale_address: '',
    whale_label: '',
    alert_type: 'balance_increase',
    threshold_value: 10,
  })

  useEffect(() => {
    // Получаем текущего пользователя
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        fetchAlerts(user.id)
      } else {
        setLoading(false)
      }
    })
  }, [])

  async function fetchAlerts(userId: string) {
    try {
      const response = await fetch(`/api/whales/alerts?user_id=${userId}`)
      const json = await response.json()
      if (json.success) {
        setAlerts(json.data)
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createAlert() {
    if (!user || !newAlert.whale_address) return

    try {
      const response = await fetch('/api/whales/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          ...newAlert,
        }),
      })

      if (response.ok) {
        setShowModal(false)
        setNewAlert({
          whale_address: '',
          whale_label: '',
          alert_type: 'balance_increase',
          threshold_value: 10,
        })
        await fetchAlerts(user.id)
      }
    } catch (error) {
      console.error('Error creating alert:', error)
    }
  }

  async function toggleAlert(id: string, is_active: boolean) {
    try {
      const response = await fetch('/api/whales/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !is_active }),
      })

      if (response.ok && user) {
        await fetchAlerts(user.id)
      }
    } catch (error) {
      console.error('Error toggling alert:', error)
    }
  }

  async function deleteAlert(id: string) {
    if (!confirm('Delete this alert?')) return

    try {
      const response = await fetch(`/api/whales/alerts?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok && user) {
        await fetchAlerts(user.id)
      }
    } catch (error) {
      console.error('Error deleting alert:', error)
    }
  }

  if (!user) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 text-center">
        <p className="text-gray-400">Sign in to create whale alerts</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">🔔 Whale Alerts</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          ➕ Create Alert
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8 text-center">
          <p className="text-gray-400">No alerts yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex justify-between items-center"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      alert.is_active ? 'bg-green-500' : 'bg-gray-500'
                    }`}
                  />
                  <h3 className="text-white font-semibold">{alert.whale_label}</h3>
                </div>
                <p className="text-gray-400 text-sm font-mono mb-1">{alert.whale_address}</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-blue-400">
                    {alert.alert_type === 'balance_increase' && '📈 Balance Increase'}
                    {alert.alert_type === 'balance_decrease' && '📉 Balance Decrease'}
                    {alert.alert_type === 'large_transaction' && '💸 Large Transaction'}
                  </span>
                  <span className="text-gray-400">Threshold: {alert.threshold_value}%</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleAlert(alert.id, alert.is_active)}
                  className={`px-3 py-1 rounded text-sm transition ${
                    alert.is_active
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  } text-white`}
                >
                  {alert.is_active ? 'Active' : 'Paused'}
                </button>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Alert Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Create New Alert</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Whale Address</label>
                <input
                  type="text"
                  value={newAlert.whale_address}
                  onChange={(e) => setNewAlert({ ...newAlert, whale_address: e.target.value })}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Label (Optional)</label>
                <input
                  type="text"
                  value={newAlert.whale_label}
                  onChange={(e) => setNewAlert({ ...newAlert, whale_label: e.target.value })}
                  placeholder="e.g., Binance Wallet"
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Alert Type</label>
                <select
                  value={newAlert.alert_type}
                  onChange={(e) =>
                    setNewAlert({
                      ...newAlert,
                      alert_type: e.target.value as AlertType,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 outline-none"
                >
                  <option value="balance_increase">📈 Balance Increase</option>
                  <option value="balance_decrease">📉 Balance Decrease</option>
                  <option value="large_transaction">💸 Large Transaction</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Threshold (%)</label>
                <input
                  type="number"
                  value={newAlert.threshold_value}
                  onChange={(e) =>
                    setNewAlert({ ...newAlert, threshold_value: parseFloat(e.target.value) })
                  }
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={createAlert}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Create Alert
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
