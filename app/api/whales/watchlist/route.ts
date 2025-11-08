import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('whale_watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user_id, whale_address, whale_label } = body

    if (!user_id || !whale_address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('whale_watchlist')
      .insert([{ user_id, whale_address, whale_label: whale_label || whale_address.slice(0, 10) }])
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data: data[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const address = searchParams.get('address')

  if (!userId || !address) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  try {
    const { error } = await supabase
      .from('whale_watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('whale_address', address)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 })
  }
}
