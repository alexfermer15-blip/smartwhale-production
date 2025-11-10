// app/api/whales/portfolio/add/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    console.log('🔐 Checking authentication...')

    // Проверяем авторизацию
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.email)

    const body = await req.json()
    const { symbol, amount, buyPrice } = body

    console.log('📝 Request body:', { symbol, amount, buyPrice })

    if (!symbol || amount === undefined || buyPrice === undefined) {
      console.error('❌ Missing fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('🔍 Looking for existing portfolio...')

    // Получаем или создаём портфель пользователя
    let { data: portfolio, error: portfolioError } = await supabase
      .from('user_portfolios')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (portfolioError) {
      console.error('❌ Portfolio fetch error:', portfolioError)
      return NextResponse.json({ error: portfolioError.message }, { status: 500 })
    }

    if (!portfolio) {
      console.log('📦 Creating new portfolio...')
      
      const { data: newPortfolio, error: createError } = await supabase
        .from('user_portfolios')
        .insert({
          user_id: user.id,
          wallet_address: null,
        })
        .select('id')
        .single()

      if (createError) {
        console.error('❌ Portfolio creation error:', createError)
        return NextResponse.json({ 
          error: 'Failed to create portfolio: ' + createError.message,
          details: createError
        }, { status: 500 })
      }

      if (!newPortfolio) {
        console.error('❌ No portfolio returned after creation')
        return NextResponse.json({ error: 'Failed to create portfolio' }, { status: 500 })
      }

      portfolio = newPortfolio
      console.log('✅ Portfolio created:', portfolio.id)
    } else {
      console.log('✅ Found existing portfolio:', portfolio.id)
    }

    console.log('🔍 Checking for existing asset...')

    // Проверяем, существует ли уже такой актив
    const { data: existingAsset, error: existError } = await supabase
      .from('portfolio_assets')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .eq('symbol', symbol)
      .maybeSingle()

    if (existError) {
      console.error('❌ Existing asset check error:', existError)
    }

    if (existingAsset) {
      console.log('⚠️ Asset already exists')
      return NextResponse.json(
        { error: `${symbol} already exists in your portfolio. Use Edit to modify it.` },
        { status: 400 }
      )
    }

    // Определяем имя актива
    const assetNames: Record<string, string> = {
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      SOL: 'Solana',
      BNB: 'Binance Coin',
      ADA: 'Cardano',
      DOT: 'Polkadot',
      AVAX: 'Avalanche',
      MATIC: 'Polygon',
    }

    const assetName = assetNames[symbol] || symbol

    console.log('➕ Inserting new asset:', { portfolio_id: portfolio.id, symbol, name: assetName, amount, buyPrice })

    // Добавляем новый актив
    const { data: newAsset, error: insertError } = await supabase
      .from('portfolio_assets')
      .insert({
        portfolio_id: portfolio.id,
        symbol: symbol,
        name: assetName,
        amount: amount,
        avg_buy_price: buyPrice,
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Insert error:', insertError)
      return NextResponse.json({ 
        error: 'Failed to insert asset: ' + insertError.message,
        details: insertError
      }, { status: 500 })
    }

    if (!newAsset) {
      console.error('❌ No asset returned after insert')
      return NextResponse.json({ error: 'Failed to insert asset' }, { status: 500 })
    }

    console.log('✅ Asset added successfully:', newAsset)

    return NextResponse.json({
      success: true,
      message: 'Asset added successfully',
      data: newAsset,
    })
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
