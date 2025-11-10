// app/api/signals/action/route.ts
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
    const { signalId, action, entryPrice, positionSize, notes } = body

    if (!signalId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Проверяем, есть ли уже действие
    const { data: existing } = await supabase
      .from('user_signal_actions')
      .select('*')
      .eq('user_id', user.id)
      .eq('signal_id', signalId)
      .maybeSingle()

    if (existing) {
      // Обновляем существующее действие
      const { data: updated, error: updateError } = await supabase
        .from('user_signal_actions')
        .update({
          action,
          entry_price_actual: entryPrice,
          position_size: positionSize,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Action updated successfully',
        data: updated,
      })
    } else {
      // Создаём новое действие
      const { data: newAction, error: insertError } = await supabase
        .from('user_signal_actions')
        .insert({
          user_id: user.id,
          signal_id: signalId,
          action,
          entry_price_actual: entryPrice,
          position_size: positionSize,
          notes,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `Signal ${action} successfully`,
        data: newAction,
      })
    }
  } catch (error) {
    console.error('Error processing signal action:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - получить действия пользователя
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

    const { searchParams } = new URL(req.url)
    const signalId = searchParams.get('signalId')

    let query = supabase
      .from('user_signal_actions')
      .select('*')
      .eq('user_id', user.id)

    if (signalId) {
      query = query.eq('signal_id', signalId)
    }

    const { data: actions, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ actions: actions || [] })
  } catch (error) {
    console.error('Error fetching actions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
