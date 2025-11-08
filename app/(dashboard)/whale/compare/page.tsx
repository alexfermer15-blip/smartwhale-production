'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'

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
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#d88484', '#4a90e2', '#a8e460']

export default function WhaleComparePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [whales, setWhales] = useState<WhaleData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addressInput, setAddressInput] = useState('')

  useEffect(() => {
    const addresses = searchParams.get('addresses')?.split(',').filter(Boolean) || []
    
    if (addresses.length > 0) {
      fetchWhales(addresses)
    } else {
      setLoading(false)
    }
  }, [searchParams])

  async function fetchWhales(addresses: string[]) {
    setLoading(true)
    setError(null)

    try {
      const promises = addresses.map(async (address) => {
        const response = await fetch(`/api/whales/real?action=detail&address=${address}`)
        const json = await response.json()
        return json.success ? json.data : null
      })

      const results = await Promise.all(promises)
      const validWhales = results.filter((whale): whale is WhaleData => whale !== null)

      if (validWhales.length === 0) {
        setError('No valid whale addresses found')
      } else {
        setWhales(validWhales)
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  function addWhaleAddress() {
    if (!addressInput.trim()) return

    const currentAddresses = searchParams.get('addresses')?.split(',').filter(Boolean) || []
    
    if (currentAddresses.includes(addressInput.trim())) {
      alert('This address is already in comparison')
      return
    }

    const newAddresses = [...currentAddresses, addressInput.trim()]
    router.push(`/whale/compare?addresses=${newAddresses.join(',')}`)
    setAddressInput('')
  }

  function removeWhale(address: string) {
    const currentAddresses = searchParams.get('addresses')?.split(',').filter(Boolean) || []
    const newAddresses = currentAddresses.filter((addr) => addr !== address)
    
    if (newAddresses.length === 0) {
      router.push('/whale/compare')
      setWhales([])
    } else {
      router.push(`/whale/compare?addresses=${newAddresses.join(',')}`)
    }
  }

  // Подготовка данных для сравнительного графика
  const comparisonData = [
    {
      name: 'ETH Balance',
      ...Object.fromEntries(whales.map((whale, idx) => [`whale${idx}`, whale.balance])),
    },
    {
      name: 'USD Value',
      ...Object.fromEntries(whales.map((whale, idx) => [`whale${idx}`, whale.usdValue / 1000000])), // в миллионах
    },
    {
      name: 'Transactions',
      ...Object.fromEntries(whales.map((whale, idx) => [`whale${idx}`, whale.transactions])),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400 text-xl">⏳ Loading comparison...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/whale-tracker')}
          className="text-blue-400 hover:text-blue-300 mb-3 flex items-center gap-2"
        >
          ← Back to Tracker
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">📊 Whale Comparison</h1>
        <p className="text-gray-400">Compare multiple whale wallets side-by-side</p>
      </div>

      {/* Add Whale Address */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Add Whale to Compare</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addWhaleAddress()}
            placeholder="Enter whale address (0x...)"
            className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 outline-none"
          />
          <button
            onClick={addWhaleAddress}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Add
          </button>
        </div>
        {whales.length >= 5 && (
          <p className="text-yellow-400 text-sm mt-2">⚠️ Maximum 5 whales can be compared at once</p>
        )}
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
          ❌ {error}
        </div>
      )}

      {whales.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🐋</div>
          <h3 className="text-xl font-bold text-white mb-2">No Whales Added Yet</h3>
          <p className="text-gray-400">Add whale addresses above to start comparing</p>
        </div>
      ) : (
        <>
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {whales.map((whale, index) => (
              <div
                key={whale.address}
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 relative"
              >
                <button
                  onClick={() => removeWhale(whale.address)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-400 transition"
                  title="Remove from comparison"
                >
                  ✕
                </button>

                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white mb-1">{whale.label}</h3>
                  <p className="text-xs text-gray-400 font-mono break-all">
                    {whale.address.slice(0, 10)}...{whale.address.slice(-8)}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm">ETH Balance</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {whale.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">USD Value</p>
                    <p className="text-xl font-bold text-green-400">
                      ${whale.usdValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Transactions</p>
                    <p className="text-lg font-bold text-purple-400">{whale.transactions.toLocaleString()}</p>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/whale/${whale.address}`)}
                  className="w-full mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition"
                >
                  View Details →
                </button>
              </div>
            ))}
          </div>

          {/* Comparison Chart */}
          {whales.length >= 2 && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Comparison Overview</h2>
              <div style={{ height: 400 }}>
                <ResponsiveContainer>
                  <BarChart data={comparisonData}>
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                    <Legend />
                    {whales.map((whale, idx) => (
                      <Bar
                        key={whale.address}
                        dataKey={`whale${idx}`}
                        name={whale.label}
                        fill={COLORS[idx % COLORS.length]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Portfolio Comparison Table */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Portfolio Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left text-gray-400 px-3 py-2">Metric</th>
                    {whales.map((whale) => (
                      <th key={whale.address} className="text-left text-gray-400 px-3 py-2">
                        {whale.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-700/50">
                    <td className="text-white px-3 py-3 font-semibold">ETH Balance</td>
                    {whales.map((whale) => (
                      <td key={whale.address} className="text-blue-400 px-3 py-3">
                        {whale.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETH
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-slate-700/50">
                    <td className="text-white px-3 py-3 font-semibold">USD Value</td>
                    {whales.map((whale) => (
                      <td key={whale.address} className="text-green-400 px-3 py-3">
                        ${whale.usdValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-slate-700/50">
                    <td className="text-white px-3 py-3 font-semibold">Total Transactions</td>
                    {whales.map((whale) => (
                      <td key={whale.address} className="text-purple-400 px-3 py-3">
                        {whale.transactions.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-slate-700/50">
                    <td className="text-white px-3 py-3 font-semibold">Portfolio Tokens</td>
                    {whales.map((whale) => (
                      <td key={whale.address} className="text-gray-300 px-3 py-3">
                        {whale.portfolioBreakdown?.length || 1} tokens
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-slate-700/50">
                    <td className="text-white px-3 py-3 font-semibold">Rank</td>
                    {whales.map((whale) => (
                      <td key={whale.address} className="text-yellow-400 px-3 py-3">
                        #{whale.rank || 'N/A'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Individual Portfolio Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whales.map((whale, index) => (
              <div key={whale.address} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">{whale.label} Portfolio</h3>
                <div style={{ height: 250 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={whale.portfolioBreakdown?.map(token => ({
                          name: token.symbol,
                          value: token.usdValue
                        })) || []}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={80}
                        label
                      >
                        {(whale.portfolioBreakdown || []).map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
