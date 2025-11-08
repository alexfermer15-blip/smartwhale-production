import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface Alert {
  id: string
  user_id: string
  whale_address: string
  whale_label: string
  alert_type: 'balance_increase' | 'balance_decrease' | 'large_transaction'
  threshold_value: number
  is_active: boolean
  created_at: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('whale_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || [],
    })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user_id, whale_address, whale_label, alert_type, threshold_value } = body

    if (!user_id || !whale_address || !alert_type || threshold_value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('whale_alerts')
      .insert([
        {
          user_id,
          whale_address,
          whale_label: whale_label || whale_address.slice(0, 10),
          alert_type,
          threshold_value,
          is_active: true,
        },
      ])
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data[0],
    })
  } catch (error) {
    console.error('Error creating alert:', error)
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Alert ID required' }, { status: 400 })
  }

  try {
    const { error } = await supabase
      .from('whale_alerts')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting alert:', error)
    return NextResponse.json(
      { error: 'Failed to delete alert' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, is_active } = body

    if (!id || is_active === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('whale_alerts')
      .update({ is_active })
      .eq('id', id)
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data[0],
    })
  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    )
  }
}
