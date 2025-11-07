'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Plan {
  name: string
  price: number
  description: string
  features: string[]
  cta: string
  highlighted: boolean
  stripe_price_id: string
}

const PLANS: Plan[] = [
  {
    name: 'Starter',
    price: 0,
    description: 'Perfect for beginners',
    features: [
      '📊 5 whale addresses tracked',
      '💰 Basic portfolio tracking',
      '🔔 Email alerts (limited)',
      '📈 7-day price history',
      'Community support',
    ],
    cta: 'Get Started',
    highlighted: false,
    stripe_price_id: '',
  },
  {
    name: 'Pro',
    price: 29,
    description: 'For serious traders',
    features: [
      '🐋 100+ whale addresses tracked',
      '💰 Advanced portfolio analytics',
      '🔔 Real-time alerts (all types)',
      '📈 Complete price history',
      '🎯 Custom whale monitoring',
      '⚡ Priority support',
      'Discord community',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
    stripe_price_id: 'price_pro_monthly', // Replace with real Stripe ID
  },
  {
    name: 'Premium',
    price: 99,
    description: 'For institutions',
    features: [
      '🐋 Unlimited whale tracking',
      '💰 Advanced AI analytics',
      '🔔 Instant alerts (webhook)',
      '📈 Real-time data API access',
      '🎯 Personal account manager',
      '⚡ 24/7 priority support',
      'Private Discord channel',
      '📊 Custom reports',
      'White-label options',
    ],
    cta: 'Contact Sales',
    highlighted: false,
    stripe_price_id: 'price_premium_monthly', // Replace with real Stripe ID
  },
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const handleSubscribe = (plan: Plan) => {
    if (plan.price === 0) {
      window.location.href = '/register'
    } else {
      // Redirect to checkout
      window.location.href = `/api/stripe/checkout?price_id=${plan.stripe_price_id}`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black">
      {/* Header */}
      <div className="text-center py-16 px-4">
        <h1 className="text-5xl font-bold text-white mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          Choose the plan that fits your whale tracking needs
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              billingCycle === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              billingCycle === 'yearly'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:text-white'
            }`}
          >
            Yearly <span className="text-green-400 text-sm ml-2">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan, i) => (
            <div
              key={i}
              className={`rounded-2xl p-8 transition transform hover:scale-105 ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-blue-600/30 to-blue-600/10 border-2 border-blue-600 shadow-2xl shadow-blue-600/20'
                  : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50'
              }`}
            >
              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-8">
                {plan.price === 0 ? (
                  <div className="text-4xl font-bold text-white">Free</div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                    <span className="text-gray-400">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                  </div>
                )}
                {plan.price > 0 && (
                  <p className="text-green-400 text-sm mt-2">
                    {billingCycle === 'yearly'
                      ? `$${Math.round(plan.price * 12 * 0.8)}/year (Save 20%)`
                      : 'Cancel anytime'}
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleSubscribe(plan)}
                className={`w-full py-3 rounded-lg font-bold mb-8 transition ${
                  plan.highlighted
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {plan.cta}
              </button>

              {/* Features */}
              <div className="space-y-4">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <span className="text-green-400 text-xl">✓</span>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Popular Badge */}
              {plan.highlighted && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                    Most Popular ⭐
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          {[
            {
              q: 'Can I upgrade/downgrade anytime?',
              a: 'Yes! Change your plan at any time. We prorate charges.',
            },
            {
              q: 'Is there a free trial?',
              a: 'Pro plan includes 14-day free trial. No credit card required.',
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept all major credit cards via Stripe and crypto payments.',
            },
            {
              q: 'What if I cancel?',
              a: 'Cancel anytime. Your account stays active until end of billing cycle.',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6"
            >
              <h3 className="text-white font-semibold mb-2">{item.q}</h3>
              <p className="text-gray-400">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
