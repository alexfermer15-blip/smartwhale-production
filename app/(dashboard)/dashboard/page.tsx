'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface CryptoPrice {
  symbol: string
  name: string
  price: number
  change24h: number
}

interface HistoricalData {
  date: string
  price: number
}

interface PortfolioData {
  totalValue: number
  totalInvested: number
  totalGain: number
  gainPercent: number
  holdings: Array<{
    symbol: string
    name: string
    amount: number
    value: number
    percentage: number
  }>
}

export default function DashboardPage() {
  const [prices, setPrices] = useState<CryptoPrice[]>([])
  const [chartData, setChartData] = useState<HistoricalData[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // ВАЖНО: использовать createClient!
  const supabase = createClient()

  useEffect(() => {
    checkAuthAndFetchData()

    // Автообновление каждые 60 секунд
    const interval = setInterval(() => {
      fetchLivePrices()
      fetchPortfolioData()
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const checkAuthAndFetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)

      await Promise.all([
        fetchLivePrices(),
        fetchChartData(),
        fetchPortfolioData(),
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLivePrices = async () => {
    try {
      const response = await fetch('/api/market/prices')
      if (response.ok) {
        const data = await response.json()
        setPrices(data)
      }
    } catch (error) {
      console.error('Error fetching prices:', error)
    }
  }

  const fetchChartData = async () => {
    try {
      const response = await fetch('/api/market/chart')
      if (response.ok) {
        const rawData = await response.json()
        // Преобразуем данные для Recharts
        const formatted = rawData.map((item: { timestamp: number; price: number }) => ({
          date: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: Math.round(item.price),
        }))
        setChartData(formatted)
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
    }
  }

  const fetchPortfolioData = async () => {
    try {
      const response = await fetch('/api/whales/portfolio', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        if (data.tokens && data.tokens.length > 0) {
          const holdings = data.tokens.map((token: any) => ({
            symbol: token.tokenId,
            name: getAssetName(token.tokenId),
            amount: token.balance,
            value: token.valueUsd,
            percentage: (token.valueUsd / data.totalValueUsd) * 100,
          }))

          setPortfolio({
            totalValue: data.totalValueUsd || 0,
            totalInvested: data.totalInvestedUsd || 0,
            totalGain: data.totalPnlUsd || 0,
            gainPercent:
              data.totalInvestedUsd > 0
                ? ((data.totalValueUsd - data.totalInvestedUsd) / data.totalInvestedUsd) * 100
                : 0,
            holdings,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error)
    }
  }

  const getAssetName = (symbol: string): string => {
    const names: Record<string, string> = {
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      SOL: 'Solana',
      BNB: 'Binance Coin',
      ADA: 'Cardano',
      DOT: 'Polkadot',
      AVAX: 'Avalanche',
      MATIC: 'Polygon',
    }
    return names[symbol] || symbol
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Real-time portfolio overview with live prices</p>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Portfolio Overview - Big Card */}
        <div className="md:col-span-2 lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:border-blue-600/50 transition">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-gray-400">Portfolio Value</h2>
            {isAuthenticated && portfolio && (
              <Link
                href="/portfolio"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
              >
                View Portfolio
              </Link>
            )}
          </div>

          {isAuthenticated && portfolio ? (
            <div className="space-y-6">
              <div>
                <p className="text-gray-400 text-sm mb-2">Total Value (USD)</p>
                <h3 className="text-5xl font-bold text-white">
                  ${formatPrice(portfolio.totalValue)}
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Invested</p>
                  <p className="text-2xl font-bold text-white">
                    ${formatPrice(portfolio.totalInvested)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Gain</p>
                  <p
                    className={`text-2xl font-bold ${
                      portfolio.totalGain >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {portfolio.totalGain >= 0 ? '+' : ''}${formatPrice(portfolio.totalGain)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Gain %</p>
                  <p
                    className={`text-2xl font-bold ${
                      portfolio.gainPercent >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {portfolio.gainPercent >= 0 ? '+' : ''}
                    {portfolio.gainPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">Login to view your portfolio</p>
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition inline-block"
              >
                Login
              </Link>
            </div>
          )}
        </div>

        {/* Holdings Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:border-blue-600/50 transition">
          <h2 className="text-lg font-semibold text-gray-400 mb-6">Holdings</h2>
          {isAuthenticated && portfolio && portfolio.holdings.length > 0 ? (
            <div className="space-y-4">
              {portfolio.holdings.slice(0, 3).map((holding) => (
                <div key={holding.symbol}>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
                    {holding.name}
                  </p>
                  <p className="text-3xl font-bold text-blue-400">{holding.amount}</p>
                  <p className="text-sm text-gray-500">${formatPrice(holding.value)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No holdings</p>
          )}
        </div>

        {/* Bitcoin Chart */}
        <div className="md:col-span-2 lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:border-blue-600/50 transition">
          <h2 className="text-lg font-semibold text-gray-400 mb-4">Bitcoin Price (Last 7 Days)</h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400">Loading chart data...</p>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  formatter={(value) => `$${(value as number).toLocaleString()}`}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#3b82f6"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400">No chart data available</p>
            </div>
          )}
        </div>

        {/* Live Prices */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:border-blue-600/50 transition">
          <h2 className="text-lg font-semibold text-gray-400 mb-4">Live Prices</h2>
          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-400">Loading prices...</p>
            ) : prices.length > 0 ? (
              prices.map((price) => (
                <div
                  key={price.symbol}
                  className="p-3 bg-slate-700/30 rounded-lg border border-slate-700/50"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-white">{price.symbol}</span>
                    <span
                      className={`text-sm font-bold ${
                        price.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {price.change24h >= 0 ? '+' : ''}
                      {price.change24h.toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-gray-400">${formatPrice(price.price)}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400">Unable to load prices</p>
            )}
          </div>
        </div>

        {/* Holdings Breakdown */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:border-blue-600/50 transition">
          <h2 className="text-lg font-semibold text-gray-400 mb-4">Holdings Breakdown</h2>
          {isAuthenticated && portfolio && portfolio.holdings.length > 0 ? (
            <div className="space-y-4">
              {portfolio.holdings.slice(0, 3).map((holding, index) => {
                const colors = ['bg-blue-600', 'bg-purple-600', 'bg-yellow-600']
                return (
                  <div key={holding.symbol}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white">{holding.name}</span>
                      <span className="text-blue-400 font-bold">
                        ${formatPrice(holding.value)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2">
                      <div
                        className={`${colors[index % colors.length]} h-2 rounded-full`}
                        style={{ width: `${holding.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{holding.percentage.toFixed(1)}%</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No holdings</p>
          )}
        </div>

        {/* Whale Alerts */}
        <div className="md:col-span-1 bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:border-blue-600/50 transition">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-400">Whale Alerts</h2>
            <Link href="/whale-activity" className="text-blue-400 hover:text-blue-300 text-sm">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { whale: 'Whale #1', action: 'Sold 500 BTC', time: '10m ago', impact: 'HIGH' },
              { whale: 'Whale #2', action: 'Bought 200 ETH', time: '25m ago', impact: 'MEDIUM' },
              { whale: 'Whale #3', action: 'Moved 1M SOL', time: '1h ago', impact: 'HIGH' },
            ].map((item, i) => (
              <div key={i} className="p-3 bg-slate-700/30 rounded-lg border border-slate-700/50">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-white">{item.whale}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      item.impact === 'HIGH'
                        ? 'bg-red-600/20 text-red-400'
                        : 'bg-yellow-600/20 text-yellow-400'
                    }`}
                  >
                    {item.impact}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{item.action}</p>
                <p className="text-xs text-gray-500 mt-1">{item.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
