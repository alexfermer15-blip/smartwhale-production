'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getCryptoPrices, getHistoricalData } from '@/lib/crypto-api'

interface CryptoPrice {
  symbol: string
  name: string
  price: number
  change24h: number
  marketCap: number
  volume: number
}

export default function DashboardPage() {
  const [prices, setPrices] = useState<CryptoPrice[]>([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [portfolio, setPortfolio] = useState({
    btc: 0.5,
    eth: 5,
    sol: 100,
  })

  // Получаем данные при загрузке
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Получаем текущие цены
        const cryptoPrices = await getCryptoPrices()
        setPrices(cryptoPrices)

        // Получаем историю для графика
        const history = await getHistoricalData('bitcoin')
        setChartData(history)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Обновляем данные каждые 60 секунд
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  // Расчитываем портфель стоимость
  const btcPrice = prices[0]?.price || 0
  const ethPrice = prices[1]?.price || 0
  const solPrice = prices[2]?.price || 0

  const portfolioValue =
    portfolio.btc * btcPrice + portfolio.eth * ethPrice + portfolio.sol * solPrice

  const previousPortfolioValue =
    portfolio.btc * (prices[0]?.price || 43250) +
    portfolio.eth * (prices[1]?.price || 2350) +
    portfolio.sol * (prices[2]?.price || 103.2)

  const change = portfolioValue - previousPortfolioValue
  const changePercent = ((change / previousPortfolioValue) * 100).toFixed(2)

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
          <h2 className="text-lg font-semibold text-gray-400 mb-4">Portfolio Value</h2>
          <div className="space-y-6">
            <div>
              <p className="text-gray-400 text-sm mb-2">Total Value (USD)</p>
              <h3 className="text-5xl font-bold text-white">
                ${portfolioValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-gray-400 text-sm mb-1">24h Change</p>
                <p className={`text-2xl font-bold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {change >= 0 ? '+' : ''}{change.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">24h Change %</p>
                <p className={`text-2xl font-bold ${parseFloat(changePercent) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {parseFloat(changePercent) >= 0 ? '+' : ''}{changePercent}%
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Holdings</p>
                <p className="text-2xl font-bold text-blue-400">3 coins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:border-blue-600/50 transition">
          <h2 className="text-lg font-semibold text-gray-400 mb-6">Holdings</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">BTC Amount</p>
              <p className="text-3xl font-bold text-blue-400">{portfolio.btc}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">ETH Amount</p>
              <p className="text-3xl font-bold text-purple-400">{portfolio.eth}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">SOL Amount</p>
              <p className="text-3xl font-bold text-yellow-400">{portfolio.sol}</p>
            </div>
          </div>
        </div>

        {/* Balance History Chart */}
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
                  formatter={(value) => `$${value.toLocaleString()}`}
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
                      {price.change24h >= 0 ? '+' : ''}{price.change24h.toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-gray-400">
                    ${price.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </p>
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
          <div className="space-y-4">
            {prices.length > 0 && (
              <>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white">Bitcoin</span>
                    <span className="text-blue-400 font-bold">
                      ${(portfolio.btc * (prices[0]?.price || 0)).toLocaleString('en-US', {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${((portfolio.btc * (prices[0]?.price || 0)) / portfolioValue) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white">Ethereum</span>
                    <span className="text-purple-400 font-bold">
                      ${(portfolio.eth * (prices[1]?.price || 0)).toLocaleString('en-US', {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${((portfolio.eth * (prices[1]?.price || 0)) / portfolioValue) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white">Solana</span>
                    <span className="text-yellow-400 font-bold">
                      ${(portfolio.sol * (prices[2]?.price || 0)).toLocaleString('en-US', {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div
                      className="bg-yellow-600 h-2 rounded-full"
                      style={{
                        width: `${((portfolio.sol * (prices[2]?.price || 0)) / portfolioValue) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Whale Tracker */}
        <div className="md:col-span-1 bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:border-blue-600/50 transition">
          <h2 className="text-lg font-semibold text-gray-400 mb-4">Whale Alerts</h2>
          <div className="space-y-3">
            {[
              { whale: 'Whale #1', action: 'Sold 500 BTC', time: '10m ago', impact: 'high' },
              { whale: 'Whale #2', action: 'Bought 200 ETH', time: '25m ago', impact: 'medium' },
              { whale: 'Whale #3', action: 'Moved 1M SOL', time: '1h ago', impact: 'high' },
            ].map((item, i) => (
              <div key={i} className="p-3 bg-slate-700/30 rounded-lg border border-slate-700/50">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-white">{item.whale}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      item.impact === 'high'
                        ? 'bg-red-600/20 text-red-400'
                        : 'bg-yellow-600/20 text-yellow-400'
                    }`}
                  >
                    {item.impact.toUpperCase()}
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
