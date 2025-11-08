import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Валидация Ethereum адреса
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// =============================================
// GET - Получить все custom whales пользователя
// =============================================
export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Получаем пользователя из session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Проверка авторизации
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized',
          message: 'Please log in to view your custom whales'
        },
        { status: 401 }
      )
    }

    // Получаем custom whales из БД
    const { data, error } = await supabase
      .from('user_whales')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      throw error
    }

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

// =============================================
// POST - Добавить нового custom whale
// =============================================
export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Проверка авторизации
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Please log in to add custom whales',
        },
        { status: 401 }
      )
    }

    // Парсинг данных из request body
    const body = await request.json()
    const { address, name, notes } = body

    // Валидация адреса
    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: 'Wallet address is required',
        },
        { status: 400 }
      )
    }

    if (!isValidEthereumAddress(address)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid address format',
          message: 'Please provide a valid Ethereum address (0x...)',
        },
        { status: 400 }
      )
    }

    // Проверяем, не добавлен ли уже этот адрес
    const { data: existing } = await supabase
      .from('user_whales')
      .select('id')
      .eq('user_id', user.id)
      .eq('address', address.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Duplicate address',
          message: 'This whale address is already being tracked',
        },
        { status: 400 }
      )
    }

    // Добавляем в БД
    const { data, error } = await supabase
      .from('user_whales')
      .insert({
        user_id: user.id,
        address: address.toLowerCase(),
        name: name || `Whale ${address.substring(0, 6)}...${address.slice(-4)}`,
        notes: notes || '',
        chain_id: 1,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      
      // Обработка специфических ошибок PostgreSQL
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

// =============================================
// DELETE - Удалить custom whale
// =============================================
export async function DELETE(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Проверка авторизации
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Please log in to delete custom whales',
        },
        { status: 401 }
      )
    }

    // Получаем ID из query params
    const { searchParams } = new URL(request.url)
    const whaleId = searchParams.get('id')

    if (!whaleId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing parameter',
          message: 'Whale ID is required',
        },
        { status: 400 }
      )
    }

    // Удаляем whale (только если принадлежит текущему пользователю)
    const { error } = await supabase
      .from('user_whales')
      .delete()
      .eq('id', whaleId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Database error:', error)
      throw error
    }

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
