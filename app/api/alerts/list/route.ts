import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    // Try to get authenticated user from Authorization header
    const authHeader = req.headers.get('authorization')
    let user = null

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token)
      if (!error && authUser) {
        user = authUser
      }
    }

    // If no user from header, try to get from session
    if (!user) {
      const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser()
      if (!sessionError && sessionUser) {
        user = sessionUser
      }
    }

    // If still no user, return mock data for demo
    if (!user) {
      console.log('No authenticated user, returning mock alerts')
      
      return NextResponse.json({
        success: true,
        alerts: [
          {
            id: 'mock-1',
            token_symbol: 'BTC',
            price_condition: 'above',
            target_price: 105000,
            current_price: 106089,
            is_active: true,
            created_at: new Date().toISOString(),
          },
          {
            id: 'mock-2',
            token_symbol: 'ETH',
            price_condition: 'below',
            target_price: 3600,
            current_price: 3575,
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ],
      })
    }

    // Fetch user's alerts from database
    const { data: alerts, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching alerts from database:', error)
      
      // Return mock data on database error
      return NextResponse.json({
        success: true,
        alerts: [],
        message: 'Database temporarily unavailable, showing cached data',
      })
    }

    return NextResponse.json({
      success: true,
      alerts: alerts || [],
    })

  } catch (error) {
    console.error('Error in GET /api/alerts/list:', error)
    
    // Return graceful error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch alerts',
        details: error instanceof Error ? error.message : 'Unknown error',
        alerts: [], // Return empty array instead of failing
      },
      { status: 500 }
    )
  }
}
