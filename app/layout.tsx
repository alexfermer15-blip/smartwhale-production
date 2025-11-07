import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'SmartWhale - Track Whale Wallets & Predict Market Moves',
  description: 'Real-time monitoring of institutional crypto holders with AI-powered insights.',
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
    pathname.includes('/settings')

  const isAuthPage =
    pathname.includes('/login') ||
    pathname.includes('/register') ||
    pathname.includes('/forgot-password')

  const showHeader = !isDashboardPage && !isAuthPage
  const showPadding = showHeader

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-black text-white">
        {/* Show Header only on public pages */}
        {showHeader && <Header />}

        {/* Content with padding if Header is shown */}
        <div className={showPadding ? 'pt-16' : ''}>
          {children}
        </div>

        {/* Show Footer only on public pages */}
        {showHeader && <Footer />}
      </body>
    </html>
  )
}
