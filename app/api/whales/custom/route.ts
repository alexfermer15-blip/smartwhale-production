// app/api/whales/custom/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export async function GET() {
  try {
    const supabase = createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized',
          message: 'Please log in to view your custom whales'
        },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('user_whales')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    })
  } catch (error) {
    console.error('GET /api/whales/custom error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch custom whales',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Please log in to add custom whales',
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { address, name, notes } = body

    if (!address || !isValidEthereumAddress(address)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid address format',
          message: 'Please provide a valid Ethereum address',
        },
        { status: 400 }
      )
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
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: 'Duplicate address',
            message: 'This whale is already being tracked',
          },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json(
      {
        success: true,
        data,
        message: 'Whale added successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/whales/custom error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add whale',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const whaleId = searchParams.get('id')

    if (!whaleId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing whale ID',
        },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('user_whales')
      .delete()
      .eq('id', whaleId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Whale deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/whales/custom error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete whale',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
