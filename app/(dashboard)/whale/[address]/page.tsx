'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { createClient } from '@supabase/supabase-js'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface TokenBalance {
  token: string
  symbol: string
  balance: number
  usdValue: number
  contractAddress: string
  decimals: number
}

interface WhaleData {
  rank: number
  address: string
  balance: number
  usdValue: number
  transactions: number
  label: string
  lastUpdate: string
  portfolioBreakdown?: TokenBalance[]
  balanceHistory?: { time: string; balance: number }[]
  recentTransactions?: any[]
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#d88484', '#4a90e2', '#a8e460']

export default function WhalePortfolioPage() {
  const { address } = useParams()
  const router = useRouter()
  const [whale, setWhale] = useState<WhaleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [period, setPeriod] = useState<number>(30)
  const [txFilter, setTxFilter] = useState<string>('')
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'in' | 'out'>('all')
  
  // Watchlist states
  const [user, setUser] = useState<any>(null)
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [isTogglingWatchlist, setIsTogglingWatchlist] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      console.log('👤 User:', user?.email || 'Not signed in')
      setUser(user)
    })
  }, [])

  // Check if in watchlist
  useEffect(() => {
    if (user && address) {
      checkWatchlist()
    }
  }, [user, address])

  async function checkWatchlist() {
    if (!user || !address) return
    
    try {
      console.log('🔍 Checking watchlist for:', { user_id: user.id, address })
      
      const response = await fetch(`/api/whales/watchlist?user_id=${user.id}`)
      const json = await response.json()
      
      console.log('📋 Watchlist data:', json)
      
      if (json.success && json.data) {
        const exists = json.data.some((item: any) => 
          item.whale_address.toLowerCase() === (address as string).toLowerCase()
        )
        setIsInWatchlist(exists)
        console.log('✅ Is in watchlist:', exists)
      }
    } catch (error) {
      console.error('❌ Error checking watchlist:', error)
    }
  }

  async function toggleWatchlist() {
    if (!user) {
      alert('Please sign in to use watchlist')
      return
    }
    
    if (!whale) {
      alert('Whale data not loaded')
      return
    }

    setIsTogglingWatchlist(true)

    try {
      if (isInWatchlist) {
        // Remove from watchlist
        console.log('🗑️ Removing from watchlist:', address)
        
        const response = await fetch('/api/whales/watchlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            whale_address: address,
          }),
        })

        const json = await response.json()
        console.log('📤 Remove response:', json)

        if (json.success) {
          setIsInWatchlist(false)
          alert(`✅ ${whale.label} removed from watchlist`)
        } else {
          alert(`Failed to remove: ${json.error || 'Unknown error'}`)
        }
      } else {
        // Add to watchlist
        console.log('➕ Adding to watchlist:', {
          user_id: user.id,
          whale_address: address,
          whale_label: whale.label,
        })
        
        const response = await fetch('/api/whales/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            whale_address: address,
            whale_label: whale.label,
          }),
        })

        const json = await response.json()
        console.log('📤 Add response:', json)

        if (json.success) {
          setIsInWatchlist(true)
          alert(`✅ ${whale.label} added to watchlist!`)
        } else {
          if (json.error?.includes('Already in watchlist')) {
            setIsInWatchlist(true)
            alert('Already in watchlist')
          } else {
            alert(`Failed to add: ${json.error || 'Unknown error'}`)
          }
        }
      }
    } catch (error) {
      console.error('❌ Error toggling watchlist:', error)
      alert('Error updating watchlist')
    } finally {
      setIsTogglingWatchlist(false)
    }
  }

  // Export to CSV
  function exportToCSV() {
    if (!whale) return

    const csvData = [
      ['Metric', 'Value'],
      ['Address', whale.address],
      ['Label', whale.label],
      ['ETH Balance', whale.balance],
      ['USD Value', whale.usdValue],
      ['Transactions', whale.transactions],
      ['Last Update', whale.lastUpdate],
      [''],
      ['Portfolio Breakdown'],
      ['Token', 'Balance', 'USD Value'],
      ...(whale.portfolioBreakdown || []).map((token) => [
        token.symbol,
        token.balance,
        token.usdValue,
      ]),
    ]

    const csvContent = csvData.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `whale-${whale.address.slice(0, 10)}-${Date.now()}.csv`
    link.click()
  }

  // Export to PDF
  function exportToPDF() {
    if (!whale) return

    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text('Whale Portfolio Report', 14, 20)

    doc.setFontSize(12)
    doc.text(`Label: ${whale.label}`, 14, 30)
    doc.text(`Address: ${whale.address}`, 14, 37)
    doc.text(`ETH Balance: ${whale.balance.toFixed(2)} ETH`, 14, 44)
    doc.text(`USD Value: $${whale.usdValue.toLocaleString()}`, 14, 51)
    doc.text(`Transactions: ${whale.transactions.toLocaleString()}`, 14, 58)

    autoTable(doc, {
      startY: 70,
      head: [['Token', 'Balance', 'USD Value']],
      body: (whale.portfolioBreakdown || []).map((token) => [
        token.symbol,
        token.balance.toFixed(4),
        `$${token.usdValue.toLocaleString()}`,
      ]),
    })

    doc.save(`whale-${whale.address.slice(0, 10)}-${Date.now()}.pdf`)
  }

  // Social sharing
  function shareWhale(platform: 'twitter' | 'telegram' | 'copy') {
    if (!whale) return

    const url = window.location.href
    const text = `Check out this crypto whale: ${whale.label} with ${whale.balance.toFixed(2)} ETH ($${whale.usdValue.toLocaleString()})`

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
          '_blank'
        )
        break
      case 'telegram':
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
          '_blank'
        )
        break
      case 'copy':
        navigator.clipboard.writeText(`${text}\n${url}`)
        alert('Link copied to clipboard!')
        break
    }
    setShowShareModal(false)
  }

  useEffect(() => {
    async function fetchWhaleDetails() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/whales/real?action=detail&address=${address}&period=${period}`)
        const json = await response.json()

        if (json.success && json.data) {
          setWhale(json.data)
        } else {
          setError(json.error || 'Failed to load whale data')
        }
      } catch (err) {
        setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    if (address) {
      fetchWhaleDetails()
    }
  }, [address, period])

  const filteredTransactions = whale?.recentTransactions?.filter((tx) => {
    const matchesSearch = 
      tx.hash?.toLowerCase().includes(txFilter.toLowerCase()) ||
      tx.from?.toLowerCase().includes(txFilter.toLowerCase()) ||
      tx.to?.toLowerCase().includes(txFilter.toLowerCase())

    const matchesType = 
      txTypeFilter === 'all' ||
      (txTypeFilter === 'in' && tx.to?.toLowerCase() === (address as string)?.toLowerCase()) ||
      (txTypeFilter === 'out' && tx.from?.toLowerCase() === (address as string)?.toLowerCase())

    return matchesSearch && matchesType
  }) || []

  const chartData = whale?.portfolioBreakdown?.map(token => ({
    name: token.symbol,
    value: token.usdValue
  })) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400 text-xl">Loading whale portfolio...</p>
        </div>
      </div>
    )
  }

  if (error || !whale) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-red-400 text-xl">❌ {error || 'Whale not found'}</div>
        <button
          onClick={() => router.push('/whale-tracker')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          ← Back to Whale Tracker
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <button
            onClick={() => router.push('/whale-tracker')}
            className="text-blue-400 hover:text-blue-300 mb-3 flex items-center gap-2"
          >
            ← Back to Tracker
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">{whale.label || 'Whale Portfolio'}</h1>
          <p className="text-gray-400 font-mono text-sm break-all">{whale.address}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Watchlist Button */}
          {user && (
            <button
              onClick={toggleWatchlist}
              disabled={isTogglingWatchlist}
              className={`px-3 py-2 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${
                isInWatchlist
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              {isTogglingWatchlist ? '⏳' : isInWatchlist ? '⭐ In Watchlist' : '☆ Add to Watchlist'}
            </button>
          )}
          
          {/* Export Buttons */}
          <button
            onClick={exportToCSV}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition"
          >
            📄 CSV
          </button>
          <button
            onClick={exportToPDF}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
          >
            📑 PDF
          </button>
          
          {/* Share Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition"
          >
            🔗 Share
          </button>
          
          {/* Copy Address */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(whale.address)
              alert('Address copied!')
            }}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition"
          >
            📋 Copy
          </button>
          
          {/* Etherscan Link */}
          <a
            href={`https://etherscan.io/address/${whale.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
          >
            🔗 Etherscan
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">ETH Balance</p>
          <p className="text-3xl font-bold text-blue-400">
            {whale.balance?.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            ETH
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">USD Value</p>
          <p className="text-3xl font-bold text-green-400">
            ${whale.usdValue?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">Total Transactions</p>
          <p className="text-3xl font-bold text-purple-400">{whale.transactions?.toLocaleString()}</p>
        </div>
      </div>

      {/* Portfolio Breakdown */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Portfolio Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex items-center justify-center" style={{ height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">All Tokens</h3>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-900">
                  <tr>
                    <th className="text-left text-gray-400 px-3 py-2">Token</th>
                    <th className="text-left text-gray-400 px-3 py-2">Balance</th>
                    <th className="text-left text-gray-400 px-3 py-2">USD Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(whale.portfolioBreakdown || []).map((token, index) => (
                    <tr key={index} className="border-t border-slate-700/50">
                      <td className="text-white px-3 py-2">{token.symbol}</td>
                      <td className="text-blue-300 px-3 py-2">
                        {token.balance?.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </td>
                      <td className="text-green-300 px-3 py-2">
                        ${token.usdValue?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Balance History with Period Selector */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Balance Dynamics</h2>
          <div className="flex gap-2">
            {[7, 30, 90, 365].map((days) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`px-3 py-1 rounded text-sm transition ${
                  period === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={whale.balanceHistory || []}>
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
              <Line type="monotone" dataKey="balance" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions with Filters */}
      {whale.recentTransactions && whale.recentTransactions.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search..."
                value={txFilter}
                onChange={(e) => setTxFilter(e.target.value)}
                className="px-3 py-1 bg-slate-700 text-white rounded text-sm border border-slate-600 focus:border-blue-500 outline-none"
              />
              <select
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value as 'all' | 'in' | 'out')}
                className="px-3 py-1 bg-slate-700 text-white rounded text-sm border border-slate-600 outline-none"
              >
                <option value="all">All</option>
                <option value="in">Incoming</option>
                <option value="out">Outgoing</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-gray-400 px-3 py-2">Type</th>
                  <th className="text-left text-gray-400 px-3 py-2">Tx Hash</th>
                  <th className="text-left text-gray-400 px-3 py-2">From</th>
                  <th className="text-left text-gray-400 px-3 py-2">To</th>
                  <th className="text-left text-gray-400 px-3 py-2">Value (ETH)</th>
                  <th className="text-left text-gray-400 px-3 py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.slice(0, 20).map((tx: any, index) => {
                  const isIncoming = tx.to?.toLowerCase() === (address as string)?.toLowerCase()
                  return (
                    <tr key={index} className="border-t border-slate-700/50 hover:bg-slate-700/20">
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          isIncoming ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {isIncoming ? '↓ IN' : '↑ OUT'}
                        </span>
                      </td>
                      <td className="text-blue-400 font-mono px-3 py-2">
                        <a
                          href={`https://etherscan.io/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {tx.hash?.substring(0, 10)}...
                        </a>
                      </td>
                      <td className="text-gray-300 font-mono px-3 py-2 text-xs">
                        {tx.from?.substring(0, 8)}...
                      </td>
                      <td className="text-gray-300 font-mono px-3 py-2 text-xs">
                        {tx.to?.substring(0, 8)}...
                      </td>
                      <td className={`px-3 py-2 font-semibold ${isIncoming ? 'text-green-400' : 'text-red-400'}`}>
                        {(parseInt(tx.value) / 1e18).toFixed(4)}
                      </td>
                      <td className="text-gray-400 px-3 py-2 text-xs">
                        {new Date(parseInt(tx.timeStamp) * 1000).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {filteredTransactions.length === 0 && (
            <p className="text-center text-gray-400 py-8">No transactions match your filters</p>
          )}
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Share Whale Portfolio</h3>
            <div className="space-y-3">
              <button
                onClick={() => shareWhale('twitter')}
                className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                🐦 Share on Twitter
              </button>
              <button
                onClick={() => shareWhale('telegram')}
                className="w-full px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                ✈️ Share on Telegram
              </button>
              <button
                onClick={() => shareWhale('copy')}
                className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                📋 Copy Link
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full mt-4 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
