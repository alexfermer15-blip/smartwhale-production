// app/(dashboard)/alerts/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import CreateAlertModal from './components/CreateAlertModal'

interface Alert {
  id: string
  alert_type: string
  condition_type: string
  target_value: number
  token_symbol?: string
  whale_address?: string
  is_active: boolean
  created_at: string
}

interface AlertHistory {
  id: string
  alert_type: string
  title: string
  message: string
  severity: string
  is_read: boolean
  triggered_at: string
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [history, setHistory] = useState<AlertHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'alerts' | 'history'>('alerts')

  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        window.location.href = '/login?redirectTo=/alerts'
        return
      }

      await Promise.all([fetchAlerts(), fetchHistory()])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts/list', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts)
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/alerts/history', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setHistory(data.history)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }

  const handleToggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/alerts/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ alertId, isActive: !isActive }),
      })

      if (response.ok) {
        await fetchAlerts()
      }
    } catch (error) {
      console.error('Error toggling alert:', error)
    }
  }

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) {
      return
    }

    try {
      const response = await fetch('/api/alerts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ alertId }),
      })

      if (response.ok) {
        await fetchAlerts()
      }
    } catch (error) {
      console.error('Error deleting alert:', error)
    }
  }

  const handleCreateAlert = async (alertData: {
    alertType: string
    conditionType: string
    targetValue?: number
    tokenSymbol?: string
    whaleAddress?: string
  }) => {
    try {
      const response = await fetch('/api/alerts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(alertData),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Alert created successfully!')
        await fetchAlerts()
      } else {
        alert(data.error || 'Failed to create alert')
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error creating alert:', error)
      throw error
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getAlertDescription = (alert: Alert) => {
    if (alert.alert_type === 'price') {
      return `${alert.token_symbol} price ${alert.condition_type} $${alert.target_value?.toLocaleString()}`
    } else if (alert.alert_type === 'whale') {
      return `Whale ${alert.whale_address?.slice(0, 10)}... activity`
    } else {
      return `Portfolio ${alert.condition_type} ${alert.target_value ? `${alert.target_value}%` : ''}`
    }
  }

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'price':
        return 'bg-blue-500/20 text-blue-400'
      case 'whale':
        return 'bg-purple-500/20 text-purple-400'
      case 'portfolio':
        return 'bg-green-500/20 text-green-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-500/20 text-red-400'
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'LOW':
        return 'bg-blue-500/20 text-blue-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Alerts</h1>
          <p className="text-gray-400">Manage your notifications and alerts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          + Create Alert
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-1">Total Alerts</p>
          <p className="text-3xl font-bold text-white">{alerts.length}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-1">Active</p>
          <p className="text-3xl font-bold text-green-400">
            {alerts.filter((a) => a.is_active).length}
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-1">Paused</p>
          <p className="text-3xl font-bold text-yellow-400">
            {alerts.filter((a) => !a.is_active).length}
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-1">Triggered Today</p>
          <p className="text-3xl font-bold text-blue-400">
            {history.filter((h) => {
              const today = new Date().toDateString()
              return new Date(h.triggered_at).toDateString() === today
            }).length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === 'alerts'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Active Alerts ({alerts.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === 'history'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          History ({history.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'alerts' ? (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
              <p className="text-gray-400 mb-4">No alerts configured yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Create Your First Alert
              </button>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 flex justify-between items-center hover:border-slate-600 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getAlertTypeColor(alert.alert_type)}`}>
                      {alert.alert_type.toUpperCase()}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        alert.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {alert.is_active ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </div>
                  <p className="text-white font-semibold mb-1">{getAlertDescription(alert)}</p>
                  <p className="text-sm text-gray-500">Created {formatDate(alert.created_at)}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleAlert(alert.id, alert.is_active)}
                    className={`px-3 py-1 rounded text-sm transition ${
                      alert.is_active
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {alert.is_active ? 'Pause' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center text-gray-400">
              No alert history yet
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-semibold">{item.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityBadge(item.severity)}`}>
                    {item.severity}
                  </span>
                </div>
                <p className="text-gray-300 mb-2">{item.message}</p>
                <p className="text-sm text-gray-500">{formatDate(item.triggered_at)}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Alert Modal */}
      <CreateAlertModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateAlert}
      />
    </div>
  )
}
