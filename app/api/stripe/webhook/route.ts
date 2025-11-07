import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutComplete(session)
        break

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object as Stripe.Subscription
        await handleSubscriptionCancel(deletedSub)
        break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId

  if (!userId) return

  // Update user subscription in database
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      status: 'active',
      plan: session.metadata?.plan || 'pro',
      updated_at: new Date().toISOString(),
    })
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId

  if (!userId) return

  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleSubscriptionCancel(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId

  if (!userId) return

  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}
