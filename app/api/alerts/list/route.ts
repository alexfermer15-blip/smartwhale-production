import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side operations
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

    // Fetch all active whale alerts from database
    const { data: alerts, error } = await supabase
      .from('whale_alerts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching alerts from database:', error)
      
      // Return empty array instead of failing completely
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Database temporarily unavailable',
      })
    }

    return NextResponse.json({
      success: true,
      data: alerts || [],
    })

  } catch (error) {
    console.error('Error in GET /api/alerts/list:', error)
    
    // Return graceful error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch alerts',
        details: error instanceof Error ? error.message : 'Unknown error',
        data: [], // Return empty array instead of failing
      },
      { status: 500 }
    )
  }
}
