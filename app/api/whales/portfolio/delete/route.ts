// app/api/whales/portfolio/delete/route.ts
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
    const { symbol } = body

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    // Получаем портфель пользователя
    const { data: portfolio } = await supabase
      .from('user_portfolios')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    // Удаляем актив
    const { error: deleteError } = await supabase
      .from('portfolio_assets')
      .delete()
      .eq('portfolio_id', portfolio.id)
      .eq('symbol', symbol)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Asset deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting asset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
