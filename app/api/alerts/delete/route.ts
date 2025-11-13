// app/api/alerts/delete/route.ts
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

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    
    // Get alert ID from query params
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    // Soft delete - set is_active to false instead of hard delete
    // This preserves data for analytics and allows users to restore alerts later
    const { error } = await supabase
      .from('whale_alerts')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Error deleting alert:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Alert deleted successfully',
    })

  } catch (error) {
    console.error('Error in DELETE /api/alerts/delete:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
