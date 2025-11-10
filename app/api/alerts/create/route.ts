// app/api/alerts/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

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
    const { alertType, conditionType, targetValue, tokenSymbol, whaleAddress } = body

    if (!alertType || !conditionType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Создаём алерт
    const { data: newAlert, error: insertError } = await supabase
      .from('user_alerts')
      .insert({
        user_id: user.id,
        alert_type: alertType,
        condition_type: conditionType,
        target_value: targetValue,
        token_symbol: tokenSymbol,
        whale_address: whaleAddress,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Alert created successfully',
      data: newAlert,
    })
  } catch (error) {
    console.error('Error creating alert:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
