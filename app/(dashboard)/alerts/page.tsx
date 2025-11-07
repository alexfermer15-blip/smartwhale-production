'use client'

import { useState } from 'react'

interface Alert {
  id: string
  type: 'price' | 'whale' | 'volume'
  asset: string
  condition: string
  value: string
  status: 'active' | 'inactive'
  triggered: number
  createdAt: string
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'price',
      asset: 'BTC',
      condition: 'Price falls below',
      value: '$100,000',
      status: 'active',
      triggered: 0,
      createdAt: '2 days ago',
    },
    {
      id: '2',
      type: 'whale',
      asset: 'ETH',
      condition: 'Large whale transaction',
      value: '>$5M',
      status: 'active',
      triggered: 3,
      createdAt: '5 days ago',
    },
    {
      id: '3',
      type: 'volume',
      asset: 'SOL',
      condition: 'Volume spike',
      value: '> 200% avg',
      status: 'inactive',
      triggered: 1,
      createdAt: '1 week ago',
    },
  ])

  const [showForm, setShowForm] = useState(false)

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === id
        ? { ...alert, status: alert.status === 'active' ? 'inactive' : 'active' }
        : alert
    ))
  }

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Alerts</h1>
          <p className="text-gray-400">Set up custom alerts for prices, whales, and volume</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          Create Alert
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">New Alert</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Asset</label>
              <select className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white">
                <option>Bitcoin (BTC)</option>
                <option>Ethereum (ETH)</option>
                <option>Solana (SOL)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Alert Type</label>
              <select className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white">
                <option>Price Alert</option>
                <option>Whale Movement</option>
                <option>Volume Spike</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Condition</label>
              <select className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white">
                <option>Falls Below</option>
                <option>Rises Above</option>
                <option>Equals</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Value</label>
              <input
                type="text"
                placeholder="e.g., 100000"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
              Create Alert
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">Active Alerts</p>
          <p className="text-3xl font-bold text-white">2</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">Triggered This Week</p>
          <p className="text-3xl font-bold text-green-400">4</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">Total Alerts</p>
          <p className="text-3xl font-bold text-white">{alerts.length}</p>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Asset</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Condition</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Value</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Triggered</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {alerts.map(alert => (
                <tr key={alert.id} className="hover:bg-slate-700/20 transition">
                  <td className="px-6 py-4 text-sm text-white font-semibold">{alert.asset}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      alert.type === 'price' ? 'bg-blue-600/20 text-blue-400' :
                      alert.type === 'whale' ? 'bg-purple-600/20 text-purple-400' :
                      'bg-yellow-600/20 text-yellow-400'
                    }`}>
                      {alert.type === 'price' ? '📊' : alert.type === 'whale' ? '🐋' : '📈'} {alert.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{alert.condition}</td>
                  <td className="px-6 py-4 text-sm text-white font-mono">{alert.value}</td>
                  <td className="px-6 py-4 text-sm text-green-400">{alert.triggered}x</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => toggleAlert(alert.id)}
                      className={`px-2 py-1 rounded text-xs font-semibold transition ${
                        alert.status === 'active'
                          ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                          : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                      }`}
                    >
                      {alert.status === 'active' ? '✓ Active' : '✗ Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button className="text-blue-400 hover:text-blue-300 transition">Edit</button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-red-400 hover:text-red-300 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert History */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Triggers</h3>
        <div className="space-y-3">
          {[
            { asset: 'ETH', type: 'whale', message: 'Large whale transaction detected - $5.2M transfer', time: '2 hours ago' },
            { asset: 'BTC', type: 'price', message: 'Price spike detected - reached $105,000', time: '6 hours ago' },
            { asset: 'SOL', type: 'volume', message: 'Volume spike - 300% above average', time: '1 day ago' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 pb-3 border-b border-slate-700/50">
              <div className="text-2xl">
                {item.type === 'price' ? '📊' : item.type === 'whale' ? '🐋' : '📈'}
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">{item.asset} - {item.message}</p>
                <p className="text-gray-400 text-sm">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
