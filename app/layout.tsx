// app/layout.tsx
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'SmartWhale - Track Whale Wallets & Predict Market Moves',
  description: 'Real-time monitoring of institutional crypto holders with AI-powered insights and trading signals.',
  keywords: [
    'crypto whale tracker',
    'bitcoin whale alerts',
    'ethereum whale tracker',
    'crypto trading signals',
    'whale wallet monitoring',
    'crypto market analysis',
  ],
  authors: [{ name: 'SmartWhale Team' }],
  openGraph: {
    title: 'SmartWhale - Track Whale Wallets & Predict Market Moves',
    description: 'Real-time whale activity monitoring with AI-powered trading signals',
    url: 'https://smartwhale-production.vercel.app',
    siteName: 'SmartWhale',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SmartWhale Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SmartWhale - Track Whale Wallets',
    description: 'Real-time whale activity monitoring with AI-powered trading signals',
    images: ['/twitter-image.png'],
    creator: '@smartwhale',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get pathname from middleware header
  const headersList = headers()
  const pathname = headersList.get('x-pathname') || '/'

  // Determine if we should show the Header and Footer
  const isDashboardPage =
    pathname.includes('/dashboard') ||
    pathname.includes('/profile') ||
    pathname.includes('/whale-tracker') ||
    pathname.includes('/portfolio') ||
    pathname.includes('/alerts') ||
    pathname.includes('/settings') ||
    pathname.includes('/signals') ||
    pathname.includes('/watchlist') ||
    pathname.includes('/whale-activity')

  const isAuthPage =
    pathname.includes('/login') ||
    pathname.includes('/register') ||
    pathname.includes('/forgot-password')

  const showHeader = !isDashboardPage && !isAuthPage
  const showPadding = showHeader

  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-black text-white antialiased">
        {/* Show Header only on public pages */}
        {showHeader && <Header />}

        {/* Content with padding if Header is shown */}
        <div className={showPadding ? 'pt-16' : ''}>
          {children}
        </div>

        {/* Show Footer only on public pages */}
        {showHeader && <Footer />}

        {/* Vercel Analytics */}
        <Analytics />
        
        {/* Vercel Speed Insights */}
        <SpeedInsights />
      </body>
    </html>
  )
}
