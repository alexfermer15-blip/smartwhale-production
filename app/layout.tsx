import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import ClientLayout from '@/components/layout/ClientLayout'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#000000',
}

export const metadata: Metadata = {
  title: {
    default: 'SmartWhale - Track Whale Wallets & Predict Market Moves',
    template: '%s | SmartWhale',
  },
  description:
    'Real-time monitoring of institutional crypto holders with AI-powered insights and trading signals. Track Bitcoin & Ethereum whales, receive alerts, and make informed trading decisions.',
  keywords: [
    'crypto whale tracker',
    'bitcoin whale alerts',
    'ethereum whale tracker',
    'crypto trading signals',
    'whale wallet monitoring',
    'crypto market analysis',
    'blockchain analytics',
    'cryptocurrency intelligence',
    'smart money tracker',
    'institutional crypto tracking',
  ],
  authors: [{ name: 'SmartWhale Team', url: 'https://smartwhale.app' }],
  creator: 'SmartWhale',
  publisher: 'SmartWhale',
  metadataBase: new URL('https://smartwhale-production.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://smartwhale-production.vercel.app',
    siteName: 'SmartWhale',
    title: 'SmartWhale - Track Whale Wallets & Predict Market Moves',
    description:
      'Real-time whale activity monitoring with AI-powered trading signals. Track institutional crypto movements and stay ahead of the market.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SmartWhale - Crypto Whale Tracker',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@smartwhale',
    creator: '@smartwhale',
    title: 'SmartWhale - Track Whale Wallets',
    description:
      'Real-time whale activity monitoring with AI-powered trading signals',
    images: ['/twitter-image.png'],
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#000000',
      },
    ],
  },
  manifest: '/manifest.json',
  category: 'technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* DNS prefetch for analytics */}
        <link rel="dns-prefetch" href="https://vercel-analytics.com" />

        {/* Security headers */}
        <meta name="referrer" content="strict-origin-when-cross-origin" />

        {/* PWA tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="SmartWhale" />

        {/* Windows tiles */}
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className="bg-black text-white antialiased overflow-x-hidden">
        <ClientLayout>{children}</ClientLayout>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
