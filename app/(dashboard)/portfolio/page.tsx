'use client'

import { useState, useEffect } from 'react'

interface Asset {
  symbol: string
  name: string
  amount: number
  price: number
  value: number
  change24h: number
  percentage: number
}

interface PortfolioStats {
  totalValue: number
  totalInvested: number
  gain: number
  gainPercent: number
  bestPerformer: string
  worstPerformer: string
}

export default function PortfolioPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [stats, setStats] = useState<PortfolioStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const fetchPortfolio = async () => {
    setLoading(true)
    try {
      // Mock data - replace with real API
      const mockAssets: Asset[] = [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          amount: 0.5,
          price: 103899,
          value: 51949.5,
          change24h: 2.73,
          percentage: 60.6,
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          amount: 5,
          price: 3456.08,
          value: 17280.4,
          change24h: 4.13,
          percentage: 20.1,
        },
        {
          symbol: 'SOL',
          name: 'Solana',
          amount: 100,
          price: 163.34,
          value: 16334,
          change24h: 4.7,
          percentage: 19.0,
        },
      ]

      const totalValue = mockAssets.reduce((sum, asset) => sum + asset.value, 0)
      const totalInvested = totalValue * 0.85 // Mock calculation

      setAssets(mockAssets)
      setStats({
        totalValue,
        totalInvested,
        gain: totalValue - totalInvested,
        gainPercent: ((totalValue - totalInvested) / totalInvested) * 100,
        bestPerformer: 'SOL',
        worstPerformer: 'BTC',
      })
    } catch (error) {
      console.error('Error fetching portfolio:', error)
    } finally {
      setLoading(false)
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
          <h1 className="text-3xl font-bold text-white mb-2">Portfolio</h1>
          <p className="text-gray-400">Manage and track your cryptocurrency holdings</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
          Add Wallet
        </button>
      </div>

      {/* Main Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Value */}
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-600/50 rounded-lg p-8">
            <p className="text-gray-400 text-sm mb-2">Total Portfolio Value</p>
            <p className="text-4xl font-bold text-white mb-4">${stats.totalValue.toFixed(2)}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Invested</span>
                <span className="text-white">${stats.totalInvested.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Gain</span>
                <span className={stats.gainPercent > 0 ? 'text-green-400' : 'text-red-400'}>
                  {stats.gainPercent > 0 ? '+' : ''}
                  ${stats.gain.toFixed(2)} ({stats.gainPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-600/5 border border-purple-600/50 rounded-lg p-8">
            <p className="text-gray-400 text-sm mb-4">Performance Metrics</p>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Best Performer</span>
                  <span className="text-green-400 font-semibold">{stats.bestPerformer}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full w-4/5 bg-green-500"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Worst Performer</span>
                  <span className="text-red-400 font-semibold">{stats.worstPerformer}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full w-2/5 bg-red-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allocation Chart */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8">
        <h3 className="text-xl font-semibold text-white mb-6">Portfolio Allocation</h3>
        <div className="flex items-center justify-between gap-8">
          {/* Pie Chart */}
          <div className="flex-1">
            <svg viewBox="0 0 200 200" className="w-full h-64">
              {/* BTC Segment - 60.6% */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#FBBF24"
                strokeWidth="40"
                strokeDasharray={`${(60.6 * 2 * Math.PI * 80) / 100} ${2 * Math.PI * 80}`}
                transform="rotate(-90 100 100)"
              />
              {/* ETH Segment - 20.1% */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#60A5FA"
                strokeWidth="40"
                strokeDasharray={`${(20.1 * 2 * Math.PI * 80) / 100} ${2 * Math.PI * 80}`}
                strokeDashoffset={`${-(60.6 * 2 * Math.PI * 80) / 100}`}
                transform="rotate(-90 100 100)"
              />
              {/* SOL Segment - 19.0% */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#A78BFA"
                strokeWidth="40"
                strokeDasharray={`${(19.0 * 2 * Math.PI * 80) / 100} ${2 * Math.PI * 80}`}
                strokeDashoffset={`${-((60.6 + 20.1) * 2 * Math.PI * 80) / 100}`}
                transform="rotate(-90 100 100)"
              />
              <circle cx="100" cy="100" r="40" fill="#0F172A" />
            </svg>
          </div>

          {/* Legend */}
          <div className="space-y-4">
            {assets.map((asset) => (
              <div key={asset.symbol} className="flex items-center gap-4">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    backgroundColor:
                      asset.symbol === 'BTC'
                        ? '#FBBF24'
                        : asset.symbol === 'ETH'
                          ? '#60A5FA'
                          : '#A78BFA',
                  }}
                ></div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{asset.name}</p>
                  <p className="text-gray-400 text-sm">{asset.percentage.toFixed(1)}%</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">${asset.value.toFixed(2)}</p>
                  <p
                    className={`text-sm ${asset.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {asset.change24h > 0 ? '+' : ''}
                    {asset.change24h.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Asset</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Value</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">24h Change</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {assets.map((asset) => (
                <tr key={asset.symbol} className="hover:bg-slate-700/20 transition">
                  <td className="px-6 py-4 text-sm text-white font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {asset.symbol === 'BTC' ? '₿' : asset.symbol === 'ETH' ? 'Ξ' : '◎'}
                      </span>
                      {asset.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{asset.amount}</td>
                  <td className="px-6 py-4 text-sm text-white">${asset.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-white font-semibold">
                    ${asset.value.toFixed(2)}
                  </td>
                  <td className={`px-6 py-4 text-sm ${asset.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {asset.change24h > 0 ? '↑' : '↓'} {Math.abs(asset.change24h).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-blue-400 hover:text-blue-300 transition">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
