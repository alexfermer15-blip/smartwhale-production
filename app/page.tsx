export default function Home() {
  return (
    <main className="w-full bg-black">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-black to-black px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Main Heading */}
          <div className="mb-12 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
              SmartWhale
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-6 max-w-2xl mx-auto">
              Track whale wallets. <span className="text-blue-400">Predict market moves.</span>
            </p>
          </div>

          {/* Hero Card */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 md:p-12 mb-8 backdrop-blur max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Welcome to SmartWhale
            </h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
              Real-time monitoring of institutional crypto holders with AI-powered insights. 
              Stay ahead of the market with our advanced analytics platform designed for serious traders.
            </p>
            
            <div className="flex gap-4 flex-wrap">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 md:px-8 rounded-lg transition duration-300">
                Get Started Free
              </button>
              <button className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 md:px-8 rounded-lg border border-slate-600 transition duration-300">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Why Choose SmartWhale?</h2>
            <p className="text-lg text-gray-400">
              Institutional-grade analytics meets Apple-level design
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '🐋',
                title: 'Whale Tracking',
                desc: 'Monitor top crypto holders and their transactions in real-time with precision',
              },
              {
                icon: '📊',
                title: 'Advanced Charts',
                desc: '60fps animations with institutional-grade technical analysis and indicators',
              },
              {
                icon: '🤖',
                title: 'AI Insights',
                desc: 'Predictive analytics and sentiment analysis powered by advanced AI',
              },
              {
                icon: '🔔',
                title: 'Smart Alerts',
                desc: 'Get notified of whale movements and market signals instantly',
              },
              {
                icon: '⚡',
                title: 'Sub-100ms Speed',
                desc: 'Ultra-fast data delivery for competitive trading advantage',
              },
              {
                icon: '🎨',
                title: 'Premium Design',
                desc: 'Beautiful interface with seamless interactions and smooth animations',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 md:p-8 hover:border-blue-600/50 hover:bg-slate-800/70 transition duration-300 group"
              >
                <span className="text-4xl md:text-5xl mb-4 block group-hover:scale-110 transition duration-300">{feature.icon}</span>
                <h3 className="text-lg md:text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '$2.5B+', label: 'Total Tracked Holdings' },
              { number: '50K+', label: 'Active Users' },
              { number: '1M+', label: 'Transactions Daily' },
              { number: '99.99%', label: 'Uptime' },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">{stat.number}</p>
                <p className="text-gray-400 text-sm md:text-base">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Simple Pricing</h2>
            <p className="text-lg text-gray-400">
              Choose the plan that fits your trading style
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
            {[
              {
                name: 'Starter',
                price: '$29',
                description: 'Perfect for beginners',
                features: [
                  '5 watched wallets',
                  'Basic charts',
                  'Email alerts',
                  'Community support',
                  'Basic API access',
                ],
              },
              {
                name: 'Pro',
                price: '$99',
                description: 'For serious traders',
                featured: true,
                features: [
                  '50 watched wallets',
                  'Advanced analytics',
                  'Push + SMS alerts',
                  'Priority support',
                  'Full API access',
                  'Custom webhooks',
                ],
              },
              {
                name: 'Enterprise',
                price: '$299',
                description: 'For institutions',
                features: [
                  'Unlimited wallets',
                  'Custom dashboards',
                  'Dedicated support 24/7',
                  'Custom integrations',
                  'White-label solution',
                  'SLA guarantee',
                ],
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-xl border transition duration-300 p-6 md:p-8 relative ${
                  plan.featured
                    ? 'bg-blue-600/20 border-blue-600/50 md:scale-105'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}
              >
                {plan.featured && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-blue-600 text-white px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 mb-6 text-sm">{plan.description}</p>

                <div className="mb-8">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400">/month</span>
                </div>

                <ul className="space-y-3 md:space-y-4 mb-8">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start text-gray-300 text-sm md:text-base">
                      <span className="mr-3 text-blue-400 text-lg flex-shrink-0">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-lg font-bold transition duration-300 ${
                    plan.featured
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>

          {/* Pricing FAQ */}
          <div className="max-w-2xl mx-auto bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 md:p-8">
            <h3 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h3>
            <div className="space-y-4 md:space-y-6">
              <div>
                <p className="font-semibold text-white mb-2">Can I change my plan anytime?</p>
                <p className="text-gray-400 text-sm md:text-base">Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.</p>
              </div>
              <div>
                <p className="font-semibold text-white mb-2">Is there a free trial?</p>
                <p className="text-gray-400 text-sm md:text-base">Yes, all new users get a 14-day free trial with full access to the Starter plan.</p>
              </div>
              <div>
                <p className="font-semibold text-white mb-2">Do you offer refunds?</p>
                <p className="text-gray-400 text-sm md:text-base">We offer a 7-day money-back guarantee if you're not satisfied with our service.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600/20 to-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6">Ready to Trade Like a Pro?</h2>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Join thousands of traders who are already using SmartWhale to stay ahead of the market.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 md:py-4 px-8 md:px-12 rounded-lg transition duration-300 text-lg">
            Start Your Free Trial Now
          </button>
        </div>
      </section>
    </main>
  )
}
