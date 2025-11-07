import { NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const priceId = searchParams.get('price_id')

  if (!priceId) {
    return NextResponse.json({ error: 'Price ID required' }, { status: 400 })
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const session = await createCheckoutSession(
      user.id,
      priceId,
      user.email
    )

    return NextResponse.redirect(session.url || '', { status: 303 })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Checkout failed' },
      { status: 500 }
    )
  }
}
