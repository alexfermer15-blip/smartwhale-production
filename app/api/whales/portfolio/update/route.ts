// app/api/whales/portfolio/update/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Авторизация
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { symbol, amount, price } = body

    if (!symbol || amount === undefined || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Получаем портфель пользователя
    const { data: portfolio } = await supabase
      .from('user_portfolios')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    // Обновляем или создаём актив
    const { data: existingAsset } = await supabase
      .from('portfolio_assets')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .eq('symbol', symbol)
      .single()

    if (existingAsset) {
      // Обновляем существующий
      const { error: updateError } = await supabase
        .from('portfolio_assets')
        .update({
          amount: amount,
          avg_buy_price: price,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAsset.id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    } else {
      // Создаём новый
      const { error: insertError } = await supabase
        .from('portfolio_assets')
        .insert({
          portfolio_id: portfolio.id,
          symbol: symbol,
          name: symbol === 'BTC' ? 'Bitcoin' : symbol === 'ETH' ? 'Ethereum' : 'Solana',
          amount: amount,
          avg_buy_price: price,
        })

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Asset updated successfully',
      data: { symbol, amount, price }
    })
  } catch (error) {
    console.error('Error updating portfolio:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
