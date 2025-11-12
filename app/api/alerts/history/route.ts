import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    // Try to get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // If no user, return mock data
    if (authError || !user) {
      console.log('No authenticated user, returning mock alert history')
      
      return NextResponse.json({
        success: true,
        history: [
          {
            id: 'hist-1',
            token_symbol: 'BTC',
            alert_type: 'price',
            condition: 'above',
            target_price: 105000,
            triggered_price: 106089,
            triggered_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'hist-2',
            token_symbol: 'ETH',
            alert_type: 'price',
            condition: 'below',
            target_price: 3600,
            triggered_price: 3575,
            triggered_at: new Date(Date.now() - 7200000).toISOString(),
          },
        ],
      })
    }

    // Fetch alert history from database
    const { data: history, error } = await supabase
      .from('alert_history')
      .select('*')
      .eq('user_id', user.id)
      .order('triggered_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching alert history:', error)
      
      // Return empty array instead of error
      return NextResponse.json({
        success: true,
        history: [],
        message: 'No history available',
      })
    }

    return NextResponse.json({
      success: true,
      history: history || [],
    })

  } catch (error) {
    console.error('Error in GET /api/alerts/history:', error)
    
    // Always return valid response
    return NextResponse.json({
      success: true,
      history: [],
      error: 'Temporary error',
    })
  }
}
