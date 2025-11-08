import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Валидация Ethereum адреса
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// GET - получить все добавленные киты пользователя
export async function GET(request: Request) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
    console.error('Error fetching user whales:', error)
    return NextResponse.json(
      { error: 'Failed to fetch whales' },
      { status: 500 }
    )
  }
}

// POST - добавить новый кит
export async function POST(request: Request) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { address, name, notes } = await request.json()

    // Валидация
    if (!address || !isValidEthereumAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address' },
        { status: 400 }
      )
    }

    // Добавь кита
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
        return NextResponse.json(
          { error: 'This whale is already tracked' },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json({ success: true, data: data[0] }, { status: 201 })
  } catch (error) {
    console.error('Error adding whale:', error)
    return NextResponse.json(
      { error: 'Failed to add whale' },
      { status: 500 }
    )
  }
}

// DELETE - удалить кита
export async function DELETE(request: Request) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const whaleId = searchParams.get('id')

    if (!whaleId) {
      return NextResponse.json({ error: 'Whale ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_whales')
      .delete()
      .eq('id', whaleId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting whale:', error)
    return NextResponse.json(
      { error: 'Failed to delete whale' },
      { status: 500 }
    )
  }
}
