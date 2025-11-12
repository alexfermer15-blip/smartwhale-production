'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'

// Динамический импорт предотвращает проблемы с SSR для chart.js
const PriceChart = dynamic(() => import('@/components/PriceChart'), { ssr: false })

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
  chartData?: { date: string, value: number }[]
}

interface Props {
  signal: TradingSignal | null
  onClose: () => void
}

export default function SignalDetailsModal({ signal, onClose }: Props) {
  function getSignalColor(type: string) {
    switch (type) {
      case 'STRONG_BUY': return 'text-green-400'
      case 'BUY': return 'text-green-300'
      case 'HOLD': return 'text-yellow-300'
      case 'SELL': return 'text-red-300'
      case 'STRONG_SELL': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  function getSignalTitle(type: string) {
    switch (type) {
      case 'STRONG_BUY': return 'Strong Buy'
      case 'BUY': return 'Buy'
      case 'HOLD': return 'Hold'
      case 'SELL': return 'Sell'
      case 'STRONG_SELL': return 'Strong Sell'
      default: return type
    }
  }

  function getSourceText(source: string) {
    switch (source) {
      case 'whale_activity': return 'Whale Activity'
      case 'technical_analysis': return 'Technical'
      case 'volume_analysis': return 'Volume'
      case 'sentiment': return 'Sentiment'
      default: return source
    }
  }

  function formatDate(str: string) {
    const d = new Date(str)
    return d.toLocaleString()
  }

  // Закрытие по Esc
  React.useEffect(() => {
    if (!signal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [signal, onClose])

  return (
    <AnimatePresence>
      {signal && (
        <motion.div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-slate-900 rounded-2xl shadow-xl w-full max-w-xl p-8 relative border border-slate-700"
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl focus:outline-none"
              onClick={onClose}
              tabIndex={0}
              aria-label="Close"
            >
              ×
            </button>
            <div className="flex items-center gap-4 mb-4">
              {signal.tokenImage && (
                <img src={signal.tokenImage} alt={signal.tokenSymbol} className="w-12 h-12 rounded-full" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-2xl ${getSignalColor(signal.signalType)}`}>
                    {getSignalTitle(signal.signalType)}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-800 rounded text-white text-sm font-mono">{signal.tokenSymbol}</span>
                  <span className="text-gray-400 text-sm">{signal.tokenName}</span>
                </div>
                <span className="block text-gray-500 text-xs">Created: {formatDate(signal.createdAt)}</span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{signal.title}</h2>
            <p className="text-gray-300 mb-4">{signal.description}</p>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="p-2 rounded bg-slate-800 text-gray-400">
                Confidence: <span className="text-blue-400 font-semibold">{signal.confidence}%</span>
              </div>
              <div className="p-2 rounded bg-slate-800 text-gray-400">
                Source: <span className="font-semibold">{getSourceText(signal.source)}</span>
              </div>
              <div className="p-2 rounded bg-slate-800 text-gray-400 capitalize">
                Horizon: <span className="font-semibold">{signal.timeHorizon}-term</span>
              </div>
              {signal.category && (
                <div className="p-2 rounded bg-slate-800 text-gray-400">
                  Category: <span className="font-semibold">{signal.category}</span>
                </div>
              )}
            </div>
            <div className="mb-6 grid grid-cols-3 gap-6">
              <div className="bg-slate-800 p-4 rounded-xl text-center">
                <div className="text-xs text-gray-400 mb-1">Entry</div>
                <div className="font-bold text-base text-white">${signal.entryPrice.toLocaleString()}</div>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl text-center">
                <div className="text-xs text-gray-400 mb-1">Target</div>
                <div className="font-bold text-base text-green-400">${signal.targetPrice.toLocaleString()}</div>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl text-center">
                <div className="text-xs text-gray-400 mb-1">Stop Loss</div>
                <div className="font-bold text-base text-red-400">${signal.stopLoss.toLocaleString()}</div>
              </div>
            </div>
            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-1">Reasoning</div>
              <div className="text-gray-200">{signal.reasoning}</div>
            </div>
            {/* Добавлен график, если есть данные */}
            {signal.chartData && signal.chartData.length > 0 && (
              <div className="mb-2 pt-2">
                <div className="text-xs text-gray-400 mb-1">Price Chart</div>
                <PriceChart data={signal.chartData} />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
