'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { SkeletonCard, SkeletonTable } from '@/components/SkeletonLoader'
import AlertModal from '@/components/AlertModal'

const BalanceChart = dynamic(() => import('@/components/WhaleBalanceChart'), { ssr: false })
const PieChart = dynamic(() => import('@/components/PortfolioPieChart'), { ssr: false })

interface TokenBalance {
  token: string
  symbol: string
  balance: number
  usdValue: number
  contractAddress: string
  decimals?: number
}

interface WhaleData {
  address: string
  label?: string
  balance: number
  usdValue: number
  lastUpdate: string
  portfolioBreakdown: TokenBalance[]
  balanceHistory?: { time: string; balance: number }[]
  recentTransactions?: any[]
}

export default function WhalePortfolioPage() {
  const { address } = useParams<{ address: string }>()
  const router = useRouter()

  const [whale, setWhale] = useState<WhaleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'portfolio' | 'transactions'>('portfolio')

  const [search, setSearch] = useState('')
  const [showZero, setShowZero] = useState(false)
  const [sortKey, setSortKey] = useState<'token' | 'symbol' | 'balance' | 'usdValue'>('usdValue')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [copied, setCopied] = useState(false)
  const [note, setNote] = useState('')
  const [showAlertModal, setShowAlertModal] = useState(false)

  useEffect(() => {
    async function fetchWhaleDetails() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/whales/real?action=detail&address=${address}&period=30`)
        const json = await response.json()
        if (json.success && json.data) {
          setWhale(json.data)
        } else {
          setError(json.error || 'Failed to load whale data')
        }
      } catch (err: any) {
        setError(`Error: ${err.message || 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }
    if (address) {
      fetchWhaleDetails()
    }
  }, [address])

  const filteredTokens = useMemo(() => {
    if (!whale?.portfolioBreakdown) return []
    let tokens = whale.portfolioBreakdown
    if (!showZero) tokens = tokens.filter(t => t.balance !== 0)
    if (search.trim().length)
      tokens = tokens.filter(t =>
        (t.token + t.symbol).toLowerCase().includes(search.toLowerCase())
      )
    tokens = [...tokens].sort((a, b) => {
      if (sortKey === 'balance' || sortKey === 'usdValue') {
        return sortDir === 'asc' ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]
      }
      return sortDir === 'asc'
        ? `${a[sortKey]}`.localeCompare(`${b[sortKey]}`)
        : `${b[sortKey]}`.localeCompare(`${a[sortKey]}`)
    })
    return tokens
  }, [whale, search, sortKey, sortDir, showZero])

  const handleCopyAddress = () => {
    if (!whale?.address) return
    navigator.clipboard.writeText(whale.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const handleCopyContract = (contract: string) => {
    navigator.clipboard.writeText(contract)
  }

  const exportCSV = () => {
    if (!whale?.portfolioBreakdown) return
    const rows = [
      ['Token', 'Symbol', 'Balance', 'Value(USD)', 'Contract'],
      ...whale.portfolioBreakdown.map((t) => [
        t.token,
        t.symbol,
        t.balance,
        t.usdValue,
        t.contractAddress,
      ]),
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((x) => x.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const tempLink = document.createElement('a')
    tempLink.setAttribute('href', encodedUri)
    tempLink.setAttribute('download', `portfolio_${whale.address}.csv`)
    tempLink.click()
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <SkeletonCard />
        <SkeletonTable />
      </div>
    )
  }

  if (error || !whale) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
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
    <div className="max-w-7xl mx-auto px-4 space-y-8 pb-12">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pt-6">
        <div className="space-y-3">
          <button
            onClick={() => router.push('/whale-tracker')}
            className="text-blue-400 hover:text-blue-300 mb-2 flex items-center gap-2 transition"
          >
            ← Back to Tracker
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">
            {whale.label || 'Whale Portfolio'}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-gray-400 font-mono text-sm break-all">{whale.address}</p>
            <button
              onClick={handleCopyAddress}
              className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-blue-300 transition"
              title="Copy address"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <a
              href={`https://etherscan.io/address/${whale.address}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open on Etherscan"
              className="text-blue-400 underline text-xs hover:text-blue-300 transition"
            >
              Etherscan
            </a>
            <a
              href={`https://debank.com/profile/${whale.address}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open on Debank"
              className="text-green-400 underline text-xs hover:text-green-300 transition"
            >
              Debank
            </a>
          </div>
          <div className="max-w-md mt-3">
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="📝 Add note/tag for this whale..."
              className="w-full bg-slate-800 border border-slate-600 px-3 py-2 rounded text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* SUMMARY CARD */}
        <div className="rounded-xl bg-gradient-to-br from-blue-900/50 to-slate-900 border-2 border-blue-700/50 p-6 min-w-[280px] shadow-xl">
          <div className="text-sm text-gray-400 mb-1">Wallet Balance</div>
          <div className="text-white font-bold text-2xl mb-2">
            {whale.balance.toLocaleString('en-US', { maximumFractionDigits: 2 })} ETH
          </div>
          <div className="text-green-400 text-xl font-bold mb-2">
            ${whale.usdValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-gray-500">Last update: {whale.lastUpdate}</div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-4 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'portfolio'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Portfolio
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === 'transactions'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Transactions
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'portfolio' && (
        <>
          {/* CHARTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Portfolio Distribution</h3>
              <PieChart data={whale.portfolioBreakdown} />
            </div>

            {/* BALANCE HISTORY */}
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Balance History (30d)</h3>
              <div className="h-64">
                <BalanceChart data={whale.balanceHistory || []} />
              </div>
            </div>
          </div>

          {/* ACTION PANEL */}
          <div className="flex flex-wrap gap-3 items-center sticky top-0 z-10 bg-black/90 py-3 border-b border-slate-700">
            <input
              type="text"
              placeholder="Search token or symbol..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-800 border border-slate-600 px-3 py-2 rounded text-white w-60 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => setShowZero(s => !s)}
              className="text-xs px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white transition"
            >
              {showZero ? 'Hide Zero' : 'Show Zero'}
            </button>
            <button
              onClick={exportCSV}
              className="text-xs px-3 py-2 bg-green-700 hover:bg-green-600 rounded text-white transition"
            >
              Export CSV
            </button>
            <button
              onClick={() => setShowAlertModal(true)}
              className="text-xs px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white transition"
            >
              🔔 Set Alert
            </button>
            <a
              href={
                'https://twitter.com/intent/tweet?text=' +
                encodeURIComponent(
                  `Check out whale portfolio: ${whale.label || whale.address}\n\n${whale.balance} ETH (~$${whale.usdValue.toLocaleString()})`
                )
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-2 bg-blue-700 hover:bg-blue-600 rounded text-white transition"
            >
              Share on Twitter
            </a>
          </div>

          {/* PORTFOLIO TABLE */}
          <div className="overflow-x-auto rounded-xl border border-slate-700 shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900 sticky top-12 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-300">#</th>
                  <th
                    className="px-4 py-3 text-left text-gray-300 cursor-pointer hover:text-white transition"
                    onClick={() => {
                      setSortKey('token')
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
                    }}
                  >
                    Token
                  </th>
                  <th
                    className="px-4 py-3 text-left text-gray-300 cursor-pointer hover:text-white transition"
                    onClick={() => {
                      setSortKey('symbol')
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
                    }}
                  >
                    Symbol
                  </th>
                  <th
                    className="px-4 py-3 text-right text-gray-300 cursor-pointer hover:text-white transition"
                    onClick={() => {
                      setSortKey('balance')
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
                    }}
                  >
                    Balance
                  </th>
                  <th
                    className="px-4 py-3 text-right text-gray-300 cursor-pointer hover:text-white transition"
                    onClick={() => {
                      setSortKey('usdValue')
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
                    }}
                  >
                    Value (USD)
                  </th>
                  <th className="px-4 py-3 text-left text-gray-300">Contract</th>
                </tr>
              </thead>
              <tbody>
                {filteredTokens.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      No tokens found.
                    </td>
                  </tr>
                )}
                {filteredTokens.map((token, i) => (
                  <tr
                    key={token.contractAddress}
                    className="border-t border-slate-800 hover:bg-slate-900/60 transition"
                  >
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 text-white" title={token.token}>
                      {token.token}
                    </td>
                    <td className="px-4 py-3 font-mono text-blue-300">{token.symbol}</td>
                    <td className="px-4 py-3 text-right text-white" title={token.balance.toString()}>
                      {token.balance.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                    </td>
                    <td className="px-4 py-3 text-right text-green-400" title={`$${token.usdValue}`}>
                      ${token.usdValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-400">
                      <Link
                        href={`https://etherscan.io/token/${token.contractAddress}`}
                        className="text-blue-400 hover:underline transition"
                        target="_blank"
                        rel="noopener noreferrer"
                        title={token.contractAddress}
                      >
                        {token.contractAddress.substring(0, 8)}...{token.contractAddress.slice(-4)}
                      </Link>
                      <button
                        className="ml-2 px-1 py-0.5 text-xs bg-slate-700 text-blue-300 rounded hover:bg-slate-600 transition"
                        onClick={() => handleCopyContract(token.contractAddress)}
                        title="Copy contract address"
                      >
                        Copy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'transactions' && (
        <div>
          <h2 className="text-lg font-bold text-white mb-3">Activity Feed</h2>
          {whale.recentTransactions && whale.recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {whale.recentTransactions.map((tx: any) => (
                <div
                  key={tx.hash}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex flex-col md:flex-row md:items-center gap-3 hover:bg-slate-900/70 transition"
                >
                  <div className="font-mono text-xs text-gray-400 flex-1">
                    <a
                      href={`https://etherscan.io/tx/${tx.hash}`}
                      className="text-blue-400 hover:underline transition"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                    </a>
                  </div>
                  <div className="flex-1 text-white">{tx.action || tx.type || 'Transaction'}</div>
                  <div className="flex-1 text-green-400">{tx.value ? tx.value + ' ETH' : ''}</div>
                  <div className="flex-1 text-gray-500 text-xs">{tx.time || ''}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No recent transactions.</div>
          )}
        </div>
      )}

      {/* ALERT MODAL */}
      {showAlertModal && (
        <AlertModal
          walletAddress={whale.address}
          onClose={() => setShowAlertModal(false)}
        />
      )}
    </div>
  )
}

