'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import SignalDetailsModal from './SignalDetailsModal'
import { fetchPriceHistory } from '@/utils/fetchPriceHistory'

interface TradingSignal {
  id: string
  tokenSymbol: string
  tokenName: string
  tokenImage?: string
  signalType: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL'
  source: string
  confidence: number
  title: string
  description: string
  reasoning: string
  entryPrice: number
  targetPrice: number
  stopLoss: number
  timeHorizon: 'short' | 'medium' | 'long'
  createdAt: string
  category?: string
  chartData?: { date: string; value: number }[]
}

interface Stats {
  total: number
  strongBuy: number
  buy: number
  hold: number
  sell: number
  strongSell: number
  avgConfidence: number
}

interface UserAction {
  signal_id: string
  action: 'followed' | 'saved' | 'ignored'
  created_at: string
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<TradingSignal[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [filterToken, setFilterToken] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [userActions, setUserActions] = useState<Record<string, UserAction>>({})
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pushAlert, setPushAlert] = useState<{ message: string; details: TradingSignal[]; time: number } | null>(null)
  const [selectedSignal, setSelectedSignal] = useState<TradingSignal | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  const supabase = createClient()

  const categories = [
    { id: 'all', label: 'All Categories', emoji: '🌐' },
    { id: 'MEME', label: 'Meme Coins', emoji: '🐕' },
    { id: 'AI', label: 'AI & Data', emoji: '🤖' },
    { id: 'DEFI', label: 'DeFi', emoji: '💎' },
    { id: 'LAYER2', label: 'Layer 2', emoji: '⚡' },
    { id: 'OTHER', label: 'Other', emoji: '📦' },
  ]

  const availableTokens = Array.from(
    new Set(signals.map(s => s.tokenSymbol))
  ).sort()

  useEffect(() => {
    checkAuthAndFetchData()
    const intervalMain = setInterval(fetchSignals, 300000)
    const intervalAlerts = setInterval(checkForNewSignals, 20000)
    return () => {
      clearInterval(intervalMain)
      clearInterval(intervalAlerts)
    }
  }, [filterType, filterToken, filterCategory])

  useEffect(() => {
    if (pushAlert) {
      const timeout = setTimeout(() => setPushAlert(null), 7000)
      return () => clearTimeout(timeout)
    }
  }, [pushAlert])

  const checkForNewSignals = async () => {
    if (signals.length === 0) return
    const lastCreatedAt = signals[0]?.createdAt
    try {
      const params = new URLSearchParams()
      params.append('since', lastCreatedAt)
      if (filterType !== 'all') params.append('type', filterType)
      if (filterToken !== 'all') params.append('token', filterToken)
      if (filterCategory !== 'all') params.append('category', filterCategory)
      const res = await fetch(`/api/signals/generate?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (data.signals?.length > 0) {
          setPushAlert({
            message: `Найдено новых сигналов: ${data.signals.length}`,
            details: data.signals,
            time: Date.now()
          })
        }
      }
    } catch (e) { }
  }

  const checkAuthAndFetchData = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
      await fetchSignals()
      if (session) {
        await fetchUserActions()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSignals = async () => {
    try {
      const params = new URLSearchParams()
      if (filterType !== 'all') params.append('type', filterType)
      if (filterToken !== 'all') params.append('token', filterToken)
      if (filterCategory !== 'all') params.append('category', filterCategory)
      const response = await fetch(`/api/signals/generate?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSignals(data.signals)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching signals:', error)
    }
  }

  const fetchUserActions = async () => {
    try {
      const response = await fetch('/api/signals/action', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        const actionsMap: Record<string, UserAction> = {}
        data.actions.forEach((action: UserAction) => {
          actionsMap[action.signal_id] = action
        })
        setUserActions(actionsMap)
      }
    } catch (error) {
      console.error('Error fetching user actions:', error)
    }
  }

  const handleFollowSignal = async (signalId: string, signal: TradingSignal) => {
    if (!isAuthenticated) {
      window.alert('Please login to follow signals')
      return
    }
    try {
      const response = await fetch('/api/signals/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          signalId,
          action: 'followed',
          entryPrice: signal.entryPrice,
          notes: `Following ${signal.title}`,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        window.alert('Signal followed! Track it in your dashboard.')
        await fetchUserActions()
      } else {
        window.alert(data.error || 'Failed to follow signal')
      }
    } catch (error) {
      console.error('Error following signal:', error)
      window.alert('Failed to follow signal')
    }
  }

  const handleSaveSignal = async (signalId: string, signal: TradingSignal) => {
    if (!isAuthenticated) {
      window.alert('Please login to save signals')
      return
    }
    try {
      const response = await fetch('/api/signals/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          signalId,
          action: 'saved',
          notes: `Saved ${signal.title}`,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        window.alert('Signal saved!')
        await fetchUserActions()
      } else {
        window.alert(data.error || 'Failed to save signal')
      }
    } catch (error) {
      console.error('Error saving signal:', error)
      window.alert('Failed to save signal')
    }
  }

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'STRONG_BUY': return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'BUY': return 'bg-green-500/10 text-green-400 border-green-500/30'
      case 'HOLD': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'SELL': return 'bg-red-500/10 text-red-400 border-red-500/30'
      case 'STRONG_SELL': return 'bg-red-500/20 text-red-400 border-red-500/50'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'STRONG_BUY': return '🚀'
      case 'BUY': return '📈'
      case 'HOLD': return '⏸️'
      case 'SELL': return '📉'
      case 'STRONG_SELL': return '⚠️'
      default: return '❓'
    }
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'whale_activity': return { text: 'Whale Activity', color: 'bg-purple-500/20 text-purple-400' }
      case 'technical_analysis': return { text: 'Technical', color: 'bg-blue-500/20 text-blue-400' }
      case 'volume_analysis': return { text: 'Volume', color: 'bg-cyan-500/20 text-cyan-400' }
      case 'sentiment': return { text: 'Sentiment', color: 'bg-orange-500/20 text-orange-400' }
      default: return { text: 'Unknown', color: 'bg-gray-500/20 text-gray-400' }
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const minutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const handleSignalClick = async (signal: TradingSignal) => {
    setModalLoading(true)
    const chartData = await fetchPriceHistory(signal.tokenSymbol, 7)
    setSelectedSignal({ ...signal, chartData })
    setModalLoading(false)
  }

  const closeModal = () => setSelectedSignal(null)

  if (loading && signals.length === 0) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      {pushAlert && (
        <div className="fixed top-8 right-8 bg-blue-700 text-white px-4 py-3 rounded-lg z-40 shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-2xl">🔔</span>
          <div>
            <div className="font-semibold">{pushAlert.message}</div>
            <div className="text-xs opacity-70">{`(${pushAlert.details.map(s=>s.tokenSymbol).join(', ')})`}</div>
          </div>
          <button className="ml-4 text-white/80 hover:text-white" onClick={() => setPushAlert(null)}>✕</button>
        </div>
      )}

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Trading Signals</h1>
          <p className="text-gray-400">AI-powered signals based on whale activity & technical analysis</p>
        </div>
        <button
          onClick={fetchSignals}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
        >
          {loading ? '⏳' : '🔄'} Refresh Signals
        </button>
      </div>

      {loading && signals.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-sm text-blue-400">🔄 Updating signals...</p>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-slate-800/50 border border-green-500/30 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">Strong Buy</p>
            <p className="text-2xl font-bold text-green-400">{stats.strongBuy}</p>
          </div>
          <div className="bg-slate-800/50 border border-green-500/20 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">Buy</p>
            <p className="text-2xl font-bold text-green-400">{stats.buy}</p>
          </div>
          <div className="bg-slate-800/50 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">Hold</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.hold}</p>
          </div>
          <div className="bg-slate-800/50 border border-red-500/20 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">Sell</p>
            <p className="text-2xl font-bold text-red-400">{stats.sell}</p>
          </div>
          <div className="bg-slate-800/50 border border-red-500/30 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">Strong Sell</p>
            <p className="text-2xl font-bold text-red-400">{stats.strongSell}</p>
          </div>
          <div className="bg-slate-800/50 border border-blue-500/30 rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">Avg Confidence</p>
            <p className="text-2xl font-bold text-blue-400">{stats.avgConfidence.toFixed(0)}%</p>
          </div>
        </div>
      )}

      <div>
        <label className="text-sm text-gray-400 mb-2 block">Filter by Category</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setFilterCategory(category.id)}
              className={`
                px-4 py-2.5 rounded-lg font-medium transition-all duration-200
                flex items-center gap-2
                ${filterCategory === category.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                  : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 border border-slate-700/50'
                }
              `}
            >
              <span className="text-lg">{category.emoji}</span>
              <span>{category.label}</span>
              {filterCategory === category.id && (
                <span className="ml-1 bg-blue-500/30 px-2 py-0.5 rounded-full text-xs">
                  Active
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Signal Types</option>
          <option value="STRONG_BUY">Strong Buy</option>
          <option value="BUY">Buy</option>
          <option value="HOLD">Hold</option>
          <option value="SELL">Sell</option>
          <option value="STRONG_SELL">Strong Sell</option>
        </select>
        <select
          value={filterToken}
          onChange={(e) => setFilterToken(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Tokens</option>
          {availableTokens.map(token => (
            <option key={token} value={token}>{token}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {signals.map((signal) => {
          const sourceBadge = getSourceBadge(signal.source)
          const userAction = userActions[signal.id]
          return (
            <div
              key={signal.id}
              className={`bg-slate-800/50 border-2 rounded-lg p-6 hover:border-blue-500 hover:shadow-xl cursor-pointer transition ${getSignalColor(signal.signalType)}`}
              onClick={() => handleSignalClick(signal)}
              role="button"
              tabIndex={0}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {signal.tokenImage ? (
                    <img 
                      src={signal.tokenImage} 
                      alt={signal.tokenSymbol}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <span className="text-3xl">{getSignalIcon(signal.signalType)}</span>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-white">{signal.tokenSymbol}</h3>
                      {signal.category && signal.category !== 'OTHER' && (
                        <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-gray-300">
                          {signal.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {signal.tokenName || signal.tokenSymbol} • {formatTimeAgo(signal.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded text-sm font-semibold ${getSignalColor(signal.signalType)}`}
                  >
                    {signal.signalType.replace('_', ' ')}
                  </span>
                  <p className="text-sm text-gray-400 mt-1">{signal.confidence}% confidence</p>
                </div>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">{signal.title}</h4>
              <p className="text-gray-300 mb-4">{signal.description}</p>
              <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-400 mb-2">📝 Reasoning:</p>
                <p className="text-sm text-gray-300">{signal.reasoning}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Entry</p>
                  <p className="text-sm font-semibold text-white">
                    ${signal.entryPrice.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Target</p>
                  <p className="text-sm font-semibold text-green-400">
                    ${signal.targetPrice.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Stop Loss</p>
                  <p className="text-sm font-semibold text-red-400">
                    ${signal.stopLoss.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${sourceBadge.color}`}>
                    {sourceBadge.text}
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-700 text-gray-300 capitalize">
                    {signal.timeHorizon}-term
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFollowSignal(signal.id, signal) }}
                    className={`px-3 py-1 rounded text-sm transition ${
                      userAction?.action === 'followed'
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {userAction?.action === 'followed' ? '✓ Following' : 'Follow'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSaveSignal(signal.id, signal) }}
                    className={`px-3 py-1 rounded text-sm transition ${
                      userAction?.action === 'saved'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                  >
                    {userAction?.action === 'saved' ? '★ Saved' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {signals.length === 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
          <p className="text-gray-400">No signals matching your filters</p>
        </div>
      )}

      <SignalDetailsModal signal={selectedSignal} onClose={closeModal} />
      {modalLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[51]">
          <div className="bg-slate-800 text-white px-6 py-4 rounded-xl shadow-xl flex gap-3 items-center">
            <span className="animate-spin h-8 w-8 inline-block rounded-full border-t-4 border-b-4 border-blue-500"></span>
            <span>Loading chart data...</span>
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="h-10 bg-slate-700 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-slate-700 rounded w-96 animate-pulse"></div>
        </div>
        <div className="h-10 bg-slate-700 rounded w-40 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 animate-pulse">
            <div className="h-3 bg-slate-700 rounded w-16 mb-2"></div>
            <div className="h-8 bg-slate-700 rounded w-12"></div>
          </div>
        ))}
      </div>
      <div>
        <div className="h-4 bg-slate-700 rounded w-32 mb-2 animate-pulse"></div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-11 bg-slate-700 rounded-lg w-36 animate-pulse"></div>
          ))}
        </div>
      </div>
      <div className="flex gap-4">
        <div className="h-10 bg-slate-700 rounded-lg w-48 animate-pulse"></div>
        <div className="h-10 bg-slate-700 rounded-lg w-48 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <SignalCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

function SignalCardSkeleton() {
  return (
    <div className="bg-slate-800/50 border-2 border-slate-700/50 rounded-lg p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
          <div>
            <div className="h-5 bg-slate-700 rounded w-20 mb-2"></div>
            <div className="h-3 bg-slate-700 rounded w-32"></div>
          </div>
        </div>
        <div className="text-right">
          <div className="h-6 bg-slate-700 rounded w-24 mb-1"></div>
          <div className="h-3 bg-slate-700 rounded w-20"></div>
        </div>
      </div>
      <div className="h-5 bg-slate-700 rounded w-3/4 mb-2"></div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-slate-700 rounded w-full"></div>
        <div className="h-4 bg-slate-700 rounded w-5/6"></div>
      </div>
      <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
        <div className="h-3 bg-slate-700 rounded w-24 mb-2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-700 rounded w-full"></div>
          <div className="h-3 bg-slate-700 rounded w-4/5"></div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="h-3 bg-slate-700 rounded w-12 mb-1"></div>
            <div className="h-4 bg-slate-700 rounded w-16"></div>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <div className="h-6 bg-slate-700 rounded w-20"></div>
          <div className="h-6 bg-slate-700 rounded w-16"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 bg-slate-700 rounded w-16"></div>
          <div className="h-8 bg-slate-700 rounded w-14"></div>
        </div>
      </div>
    </div>
  )
}
