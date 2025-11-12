import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const days = searchParams.get('days') || '7'

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }

  try {
    // Без interval=hourly, CoinGecko сам вернёт нужную детализацию
    const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`
    const resp = await fetch(url)
    if (!resp.ok) {
      return NextResponse.json({ error: 'Failed to fetch from CoinGecko' }, { status: resp.status })
    }
    const data = await resp.json()
    return NextResponse.json({ prices: data.prices }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

