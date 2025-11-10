// app/api/alerts/history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем историю алертов
    const { data: history, error: historyError } = await supabase
      .from('alert_history')
      .select('*')
      .eq('user_id', user.id)
      .order('triggered_at', { ascending: false })
      .limit(50)

    if (historyError) {
      console.error('History fetch error:', historyError)
      return NextResponse.json({ error: historyError.message }, { status: 500 })
    }

    return NextResponse.json({ history: history || [] })
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
