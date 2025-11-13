'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import EditAssetModal from './components/EditAssetModal'
import AddAssetModal from './components/AddAssetModal'
import { AlertButton } from '@/components/AlertButton'

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
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    checkAuthAndFetchPortfolio()
    const interval = setInterval(() => {
      fetchPortfolio()
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const checkAuthAndFetchPortfolio = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
      await fetchPortfolio()
    } catch {
      setIsAuthenticated(false)
      await fetchPortfolio()
    }
  }

  const fetchPortfolio = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/whales/portfolio', {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (!data || !data.tokens || data.tokens.length === 0) {
        setAssets([])
        setStats({
          totalValue: 0,
          totalInvested: 0,
          gain: 0,
          gainPercent: 0,
          bestPerformer: 'N/A',
          worstPerformer: 'N/A',
        })
        return
      }
      const apiAssets: Asset[] = data.tokens.map((token: any) => ({
        symbol: token.tokenId,
        name: getAssetName(token.tokenId),
        amount: token.balance,
        price: token.priceUsd,
        value: token.valueUsd,
        change24h: 2.5,
        percentage: data.totalValueUsd > 0 ? (token.valueUsd / data.totalValueUsd) * 100 : 0,
      }))
      const totalValue = data.totalValueUsd || 0
      const totalInvested = data.totalInvestedUsd || 0
      setAssets(apiAssets)
      setStats({
        totalValue,
        totalInvested,
        gain: data.totalPnlUsd || 0,
        gainPercent: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0,
        bestPerformer: apiAssets[0]?.symbol || 'N/A',
        worstPerformer: apiAssets[apiAssets.length - 1]?.symbol || 'N/A',
      })
    } catch {
      setError('Failed to load portfolio data')
      setAssets([])
    } finally {
      setLoading(false)
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
      LINK: 'Chainlink',
      UNI: 'Uniswap',
      ATOM: 'Cosmos',
      LTC: 'Litecoin',
      XRP: 'Ripple',
      DOGE: 'Dogecoin',
      SHIB: 'Shiba Inu',
    }
    return names[symbol] || symbol
  }

  const handleEditClick = (asset: Asset) => {
    if (!isAuthenticated) {
      if (confirm('Please login to edit assets')) {
        window.location.href = '/login?redirectTo=/portfolio'
      }
      return
    }
    setEditingAsset(asset)
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = async (symbol: string) => {
    if (!confirm(`Are you sure you want to delete ${symbol}?`)) {
      return
    }
    try {
      const response = await fetch('/api/whales/portfolio/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ symbol }),
      })
      if (response.ok) {
        await fetchPortfolio()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete asset')
      }
    } catch {
      alert('Failed to delete asset')
    }
  }

  const handleAddAsset = async (symbol: string, amount: number, price: number) => {
    try {
      const response = await fetch('/api/whales/portfolio/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ symbol, amount, buyPrice: price }),
      })
      const data = await response.json()
      if (!response.ok) {
        alert(data.error || 'Failed to add asset')
        throw new Error(data.error)
      }
      await fetchPortfolio()
    } catch {
      // Silent
    }
  }

  const handleSaveAsset = async (symbol: string, amount: number, price: number) => {
    try {
      const response = await fetch('/api/whales/portfolio/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ symbol, amount, price }),
      })
      if (response.ok) {
        await fetchPortfolio()
      } else {
        alert('Failed to update asset')
      }
    } catch {
      alert('Failed to update asset')
    }
  }

  const handleAddClick = () => {
    if (!isAuthenticated) {
      if (confirm('Please login to add assets')) {
        window.location.href = '/login?redirectTo=/portfolio'
      }
      return
    }
    setIsAddModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-red-400 mb-4">{error}</p>
        <button 
          onClick={fetchPortfolio}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Portfolio</h1>
          <p className="text-gray-400">
            {isAuthenticated 
              ? 'Manage and track your cryptocurrency holdings' 
              : 'Demo portfolio - Login to manage your own'}
          </p>
        </div>
        {isAuthenticated ? (
          <button 
            onClick={handleAddClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Add Asset
          </button>
        ) : (
          <button 
            onClick={() => window.location.href = '/login?redirectTo=/portfolio'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Login
          </button>
        )}
      </div>

      {/* Main Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-600/50 rounded-lg p-8">
            <p className="text-gray-400 text-sm mb-2">Total Portfolio Value</p>
            <p className="text-4xl font-bold text-white mb-4">${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Invested</span>
                <span className="text-white">${stats.totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Gain</span>
                <span className={stats.gainPercent > 0 ? 'text-green-400' : 'text-red-400'}>
                  {stats.gainPercent > 0 ? '+' : ''}
                  ${stats.gain.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({stats.gainPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
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

      {/* Таблица */}
      {assets.length > 0 && (
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {assets.map((asset) => (
                  <tr key={asset.symbol} className="hover:bg-slate-700/20 transition">
                    <td className="px-6 py-4 text-sm text-white font-semibold">
                      {asset.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{asset.amount}</td>
                    <td className="px-6 py-4 text-sm text-white">${asset.price.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-white font-semibold">${asset.value.toLocaleString()}</td>
                    <td className={`px-6 py-4 text-sm ${asset.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.change24h > 0 ? '↑' : '↓'} {Math.abs(asset.change24h).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => handleEditClick(asset)}
                        className="text-blue-400 hover:text-blue-300 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(asset.symbol)}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        Delete
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <AlertButton token={asset.symbol} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <EditAssetModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        asset={editingAsset}
        onSave={handleSaveAsset}
      />
      <AddAssetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddAsset}
      />
    </div>
  )
}
