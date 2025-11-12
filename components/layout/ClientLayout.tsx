// components/layout/ClientLayout.tsx
'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isDashboardPage =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/whale-tracker') ||
    pathname.startsWith('/portfolio') ||
    pathname.startsWith('/alerts') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/signals') ||
    pathname.startsWith('/watchlist') ||
    pathname.startsWith('/whale-activity')

  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password')

  const showHeader = !isDashboardPage && !isAuthPage
  const showPadding = showHeader

  return (
    <>
      {showHeader && <Header />}
      <div className={showPadding ? 'pt-16' : ''}>{children}</div>
      {showHeader && <Footer />}
    </>
  )
}
