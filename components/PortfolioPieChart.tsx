// components/PortfolioPieChart.tsx
'use client'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

type Props = {
  data: { token: string; symbol: string; usdValue: number }[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function PortfolioPieChart({ data }: Props) {
  if (!data || data.length === 0) return null

  // Берем топ-8 токенов, остальное в "Others"
  const sorted = [...data].sort((a, b) => b.usdValue - a.usdValue)
  const top8 = sorted.slice(0, 8)
  const others = sorted.slice(8).reduce((sum, t) => sum + t.usdValue, 0)
  
  const chartData = top8.map(t => ({
    name: t.symbol,
    value: t.usdValue
  }))
  
  if (others > 0) {
    chartData.push({ name: 'Others', value: others })
  }

  // Кастомная функция для лейблов
  const renderLabel = (entry: any) => {
    const percent = ((entry.value / chartData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(0)
    return `${entry.name} ${percent}%`
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1e293b', 
            border: '1px solid #475569',
            borderRadius: '8px',
            color: '#fff'
          }}
          formatter={(value: any) => `$${Number(value).toLocaleString()}`}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
