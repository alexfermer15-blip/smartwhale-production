// app/(dashboard)/whale-activity/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Activity {
  id: string
  whaleAddress: string
  whaleLabel: string
  txHash: string
  txType: 'buy' | 'sell' | 'transfer'
  tokenSymbol: string
  amount: string
  amountUsd: number
  fromAddress?: string
  toAddress?: string
  blockchain: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  timestamp: string
}

interface Stats {
  total: number
  totalValueUsd: number
  highSeverity: number
  mediumSeverity: number
  lowSeverity: number
}

export default function WhaleActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [txTypeFilter, setTxTypeFilter] = useState('all')
  const [blockchainFilter, setBlockchainFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')

  useEffect(() => {
    fetchActivities()

    // Автообновление каждые 30 секунд
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [txTypeFilter, blockchainFilter, severityFilter])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: txTypeFilter,
        blockchain: blockchainFilter,
        severity: severityFilter,
      })

      const response = await fetch(`/api/whales/activity?${params}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatUSD = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = Date.now()
    const then = new Date(timestamp).getTime()
    const diff = now - then

    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (minutes < 60) {
      return `${minutes}m ago`
    } else {
      return `${hours}h ago`
    }
  }

  const getTxTypeColor = (type: string) => {
    switch (type) {
      case 'buy':
        return 'text-green-400'
      case 'sell':
        return 'text-red-400'
      case 'transfer':
        return 'text-blue-400'
      default:
        return 'text-gray-400'
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

  if (loading && activities.length === 0) {
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
          <h1 className="text-4xl font-bold text-white mb-2">Whale Activity Feed</h1>
          <p className="text-gray-400">Real-time whale transactions and movements</p>
        </div>
        <button
          onClick={fetchActivities}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">Total Activities</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">Total Value</p>
            <p className="text-3xl font-bold text-white">{formatUSD(stats.totalValueUsd)}</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">High Severity</p>
            <p className="text-3xl font-bold text-red-400">{stats.highSeverity}</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">Medium Severity</p>
            <p className="text-3xl font-bold text-yellow-400">{stats.mediumSeverity}</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">Low Severity</p>
            <p className="text-3xl font-bold text-blue-400">{stats.lowSeverity}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Transaction Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Type</label>
            <select
              value={txTypeFilter}
              onChange={(e) => setTxTypeFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          {/* Blockchain Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Blockchain</label>
            <select
              value={blockchainFilter}
              onChange={(e) => setBlockchainFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Chains</option>
              <option value="ethereum">Ethereum</option>
              <option value="solana">Solana</option>
              <option value="binance">Binance Smart Chain</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
        </div>

        <div className="divide-y divide-slate-700/50">
          {activities.map((activity) => (
            <div key={activity.id} className="p-6 hover:bg-slate-700/20 transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      href={`/whale/${activity.whaleAddress}`}
                      className="text-lg font-semibold text-purple-400 hover:text-purple-300"
                    >
                      {activity.whaleLabel}
                    </Link>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityBadge(
                        activity.severity
                      )}`}
                    >
                      {activity.severity}
                    </span>
                  </div>

                  <p className="text-gray-300 mb-2">
                    <span className={`font-semibold ${getTxTypeColor(activity.txType)}`}>
                      {activity.txType.toUpperCase()}
                    </span>{' '}
                    {activity.amount} {activity.tokenSymbol} •{' '}
                    <span className="text-white font-semibold">{formatUSD(activity.amountUsd)}</span>
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>TX: {activity.txHash}</span>
                    <span>•</span>
                    <span className="capitalize">{activity.blockchain}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                </div>

                <a
                  href={`https://etherscan.io/tx/${activity.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
                >
                  View on Etherscan
                </a>
              </div>
            </div>
          ))}
        </div>

        {activities.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            No activities found matching your filters
          </div>
        )}
      </div>
    </div>
  )
}
