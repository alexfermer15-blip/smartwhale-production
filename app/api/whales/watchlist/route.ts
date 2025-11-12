import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch user's watchlist
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    // Mock data (replace with real database query)
    const mockWatchlist = [
      {
        id: '1',
        whale_address: '0x00000000219ab540356cBB839Cbe05303d7705Fa',
        whale_label: 'ETH 2.0 Staking Contract',
        added_at: new Date().toISOString(),
      },
      {
        id: '2',
        whale_address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        whale_label: 'Wrapped ETH (WETH)',
        added_at: new Date().toISOString(),
      },
      {
        id: '3',
        whale_address: '0x0A4576045c6B7Fd1dFfbbB89e9c37673c9c73cF',
        whale_label: 'Kraken Exchange',
        added_at: new Date().toISOString(),
      },
    ]

    return NextResponse.json({ success: true, data: mockWatchlist })
  } catch (error) {
    console.error('Error fetching watchlist:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch watchlist' }, { status: 500 })
  }
}

// POST - Add whale to watchlist
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id, whale_address, whale_label } = body

    // In production: Insert into database
    return NextResponse.json({ success: true, message: 'Whale added to watchlist' })
  } catch (error) {
    console.error('Error adding to watchlist:', error)
    return NextResponse.json({ success: false, error: 'Failed to add whale' }, { status: 500 })
  }
}

// DELETE - Remove whale from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id, whale_address } = body

    // In production: Delete from database
    return NextResponse.json({ success: true, message: 'Whale removed from watchlist' })
  } catch (error) {
    console.error('Error removing from watchlist:', error)
    return NextResponse.json({ success: false, error: 'Failed to remove whale' }, { status: 500 })
  }
}
