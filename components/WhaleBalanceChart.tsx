// components/WhaleBalanceChart.tsx
'use client'
import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

type DataPoint = {
  time: string
  balance: number
  usdValue?: number
}

type Props = {
  data: DataPoint[]
}

export default function WhaleBalanceChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        <p>No balance history available</p>
      </div>
    )
  }

  // Форматируем данные для графика
  const chartData = data.map(d => ({
    ...d,
    // Короткая дата для оси X
    date: new Date(d.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis 
          dataKey="date" 
          stroke="#94a3b8"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#94a3b8"
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => `${value.toFixed(2)}`}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1e293b', 
            border: '1px solid #475569',
            borderRadius: '8px',
            color: '#fff'
          }}
          labelStyle={{ color: '#94a3b8' }}
          formatter={(value: any) => [`${Number(value).toFixed(4)} ETH`, 'Balance']}
        />
        <Area 
          type="monotone" 
          dataKey="balance" 
          stroke="#3b82f6" 
          fillOpacity={1} 
          fill="url(#colorBalance)" 
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
