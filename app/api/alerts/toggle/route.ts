// app/api/alerts/toggle/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { alertId, isActive } = body

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('user_alerts')
      .update({ is_active: isActive })
      .eq('id', alertId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Alert updated successfully',
    })
  } catch (error) {
    console.error('Error toggling alert:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
