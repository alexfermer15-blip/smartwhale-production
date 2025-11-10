// app/api/market/chart/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Получаем данные за последние 7 дней
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7',
      { next: { revalidate: 300 } } // Cache 5 минут
    )

    if (!response.ok) {
      throw new Error('Failed to fetch chart data')
    }

    const data = await response.json()

    // Преобразуем данные для графика
    const chartData = data.prices.map((item: [number, number]) => ({
      timestamp: item[0],
      price: item[1],
    }))

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('Error fetching chart data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    )
  }
}
