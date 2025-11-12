'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Alert {
  id: string
  token_symbol: string
  alert_type?: string
  price_condition: string
  target_price: number
  current_price?: number
  is_active: boolean
  created_at: string
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/alerts/list')
      const data = await response.json()

      if (data.success) {
        setAlerts(data.alerts || [])
      } else {
        setError(data.error || 'Failed to fetch alerts')
      }
    } catch (err) {
      console.error('Error fetching alerts:', err)
      setError('Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  const toggleAlert = async (id: string, currentState: boolean) => {
    try {
      const response = await fetch('/api/alerts/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentState }),
      })

      if (response.ok) {
        // Update local state
        setAlerts(prev =>
          prev.map(alert =>
            alert.id === id ? { ...alert, is_active: !currentState } : alert
          )
        )
      }
    } catch (err) {
      console.error('Error toggling alert:', err)
    }
  }

  const deleteAlert = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return

    try {
      const response = await fetch('/api/alerts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        setAlerts(prev => prev.filter(alert => alert.id !== id))
      }
    } catch (err) {
      console.error('Error deleting alert:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Price Alerts</h1>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Price Alerts</h1>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
            Create Alert
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {alerts.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg mb-4">No alerts configured</p>
            <p className="text-gray-500 mb-6">
              Create your first price alert to get notified
            </p>
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
              Create First Alert
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl font-bold text-white">
                        {alert.token_symbol}
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-900/30 text-blue-400 rounded">
                        {alert.alert_type?.toUpperCase() || 'PRICE'}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          alert.is_active
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {alert.is_active ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </div>

                    <div className="text-gray-400 space-y-1">
                      <p>
                        Alert when price goes{' '}
                        <span className="text-white font-semibold">
                          {alert.price_condition}
                        </span>{' '}
                        <span className="text-white font-semibold">
                          ${alert.target_price.toLocaleString()}
                        </span>
                      </p>
                      {alert.current_price && (
                        <p className="text-sm">
                          Current price:{' '}
                          <span className="text-gray-300">
                            ${alert.current_price.toLocaleString()}
                          </span>
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Created: {new Date(alert.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAlert(alert.id, alert.is_active)}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        alert.is_active
                          ? 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50'
                          : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                      }`}
                    >
                      {alert.is_active ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="px-4 py-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg font-medium transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
