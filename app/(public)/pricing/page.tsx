'use client'

import Link from 'next/link'

const plans = [
  {
    name: 'Free',
    price: 0,
    description: 'Get started with basic features',
    features: [
      '📊 Dashboard with basic charts',
      '🐋 Whale tracker (limited)',
      '📈 Portfolio tracking',
      'Email support',
    ],
    cta: 'Get Started',
    ctaLink: '/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 29,
    description: 'Advanced features for serious traders',
    features: [
      'Everything in Free',
      '🐋 Unlimited whale tracking',
      '🔔 Real-time alerts',
      '📊 Advanced analytics',
      'Priority email support',
      'API access',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/subscribe?plan=pro',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 99,
    description: 'Custom solutions for institutions',
    features: [
      'Everything in Pro',
      '🚀 Custom integrations',
      '👥 Team seats',
      '📞 Priority phone support',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    ctaLink: 'mailto:sales@smartwhale.app',
    highlighted: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white py-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-400">Choose the perfect plan for your trading needs</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition transform hover:scale-105 ${
                plan.highlighted
                  ? 'bg-blue-600/20 border-2 border-blue-500'
                  : 'bg-slate-800/50 border border-slate-700'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-gray-400 mb-4">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-gray-400">/month</span>
              </div>

              <Link
                href={plan.ctaLink}
                className={`block text-center w-full py-3 rounded-lg font-bold transition mb-8 ${
                  plan.highlighted
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="text-gray-400 flex items-center">
                    <span className="mr-3">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
