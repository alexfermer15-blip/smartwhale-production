import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('user_whales')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { address, name, notes } = await request.json()

    if (!address || !isValidEthereumAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('user_whales')
      .insert({
        user_id: user.id,
        address: address.toLowerCase(),
        name: name || `Whale ${address.substring(0, 6)}...`,
        notes: notes || '',
        chain_id: 1,
      })
      .select()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already tracked' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ success: true, data: data[0] }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to add' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const whaleId = searchParams.get('id')

    if (!whaleId) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_whales')
      .delete()
      .eq('id', whaleId)
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
