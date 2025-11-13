'use client'

import { useState, useEffect } from 'react'

interface Alert {
  id: string
  wallet_address: string
  alert_type: string
  threshold: number | null
  notify_email: string | null
  is_active: boolean
  created_at: string
  triggered_at: string | null
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
      setError(null)
      const response = await fetch('/api/alerts/list')
      const data = await response.json()

      if (data.success) {
        setAlerts(data.data || [])
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
      const response = await fetch(`/api/alerts/delete?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAlerts(prev => prev.filter(alert => alert.id !== id))
      }
    } catch (err) {
      console.error('Error deleting alert:', err)
    }
  }

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'balance':
        return 'Balance Change'
      case 'price':
        return 'Price Alert'
      case 'transaction':
        return 'Large Transaction'
      case 'newtoken':
        return 'New Token'
      default:
        return type.toUpperCase()
    }
  }

  const getAlertDescription = (alert: Alert) => {
    switch (alert.alert_type) {
      case 'balance':
        return `Alert when balance changes by ${alert.threshold}%`
      case 'price':
        return `Alert when price reaches $${alert.threshold?.toLocaleString()}`
      case 'transaction':
        return `Alert for transactions over $${alert.threshold?.toLocaleString()}`
      case 'newtoken':
        return 'Alert when wallet purchases a new token'
      default:
        return 'Custom alert'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Whale Alerts</h1>
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
          <div>
            <h1 className="text-3xl font-bold text-white">Whale Alerts</h1>
            <p className="text-gray-400 mt-2">
              Manage notifications for whale wallet activity
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {alerts.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <p className="text-gray-400 text-lg mb-4">No alerts configured</p>
            <p className="text-gray-500 mb-6">
              Go to a whale portfolio page and click "Set Alert" to create your first notification
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-lg font-bold text-white">
                        {getAlertTypeLabel(alert.alert_type)}
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

                    <div className="text-gray-400 space-y-2">
                      <p className="text-white font-mono text-sm">
                        Wallet: {alert.wallet_address.slice(0, 10)}...
                        {alert.wallet_address.slice(-8)}
                      </p>
                      <p className="text-gray-300">{getAlertDescription(alert)}</p>
                      {alert.notify_email && (
                        <p className="text-sm text-gray-500">
                          📧 Notifications to: {alert.notify_email}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Created: {new Date(alert.created_at).toLocaleString()}
                      </p>
                      {alert.triggered_at && (
                        <p className="text-xs text-yellow-500">
                          Last triggered: {new Date(alert.triggered_at).toLocaleString()}
                        </p>
                      )}
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

        {/* Stats Summary */}
        {alerts.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Alerts</p>
              <p className="text-white text-2xl font-bold">{alerts.length}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Active Alerts</p>
              <p className="text-green-400 text-2xl font-bold">
                {alerts.filter(a => a.is_active).length}
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Paused Alerts</p>
              <p className="text-yellow-400 text-2xl font-bold">
                {alerts.filter(a => !a.is_active).length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
