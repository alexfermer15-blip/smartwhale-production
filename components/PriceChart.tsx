'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

interface ChartPoint {
  date: string // ISO string или короткий формат
  value: number
}

interface Props {
  data: ChartPoint[]
}

export default function PriceChart({ data }: Props) {
  if (data.length === 0) return <div className="text-gray-400 text-center py-6">Нет данных для графика</div>
  const chartData = {
    labels: data.map((p) => p.date),
    datasets: [
      {
        label: 'Price',
        data: data.map((p) => p.value),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59,130,246,0.15)',
        pointRadius: 3,
        tension: 0.25,
        fill: true,
      },
    ],
  }
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      x: { display: true, ticks: { color: '#ccc' } },
      y: { display: true, beginAtZero: false, ticks: { color: '#ccc' } },
    },
  }
  return (
    <div className="p-0 pb-2">
      <Line data={chartData} options={options as any} height={120} />
    </div>
  )
}
