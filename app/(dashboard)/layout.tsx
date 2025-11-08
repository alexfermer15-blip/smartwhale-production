'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import NotificationsPanel from './notifications-panel'

interface NavItem {
  href: string
  label: string
  icon: string
  badge?: number
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)
  const [error, setError] = useState<string>('')
  const router = useRouter()
  const pathname = usePathname()

  // ✅ AUTH CHECK ON MOUNT
  useEffect(() => {
    const checkAuthAndFetchUser = async () => {
      try {
        // Check if session exists
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          setError('Session error')
          setIsAuthed(false)
          setLoading(false)
          return
        }

        if (!session) {
          console.log('❌ No session found, redirecting to login')
          setIsAuthed(false)
          setLoading(false)
          // Redirect after small delay to ensure state updates
          setTimeout(() => {
            router.push(`/login?redirect=${pathname}`)
          }, 100)
          return
        }

        console.log('✅ Session found:', session.user?.email)
        setIsAuthed(true)

        // Fetch user info
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          console.error('❌ User error:', userError)
          setError('Could not fetch user')
        } else if (user?.email) {
          console.log('✅ User loaded:', user.email)
          setUserEmail(user.email)
        }
      } catch (error) {
        console.error('❌ Auth check error:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
        setIsAuthed(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchUser()

    // ✅ LISTEN FOR AUTH CHANGES
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email)
      if (!session) {
        setIsAuthed(false)
        router.push('/login')
      } else {
        setIsAuthed(true)
        if (session.user?.email) {
          setUserEmail(session.user.email)
        }
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [router, pathname])

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out...')
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      console.log('✅ Logged out successfully')
      router.push('/login')
    } catch (error) {
      console.error('❌ Logout error:', error)
      setError('Logout failed')
    }
  }

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/whale-tracker', label: 'Whale Tracker', icon: '🐋', badge: 3 },
    { href: '/watchlist', label: 'My Watchlist', icon: '⭐' }, 
    { href: '/whale-activity', label: 'Activity Feed', icon: '📡' },
    { href: '/portfolio', label: 'Portfolio', icon: '📈' },
    { href: '/alerts', label: 'Alerts', icon: '🔔', badge: 2 },
    { href: '/profile', label: 'Settings', icon: '⚙️' },
  ]

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  // ✅ SHOW LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // ✅ SHOW ERROR STATE
  if (error && !isAuthed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // ✅ PREVENT RENDERING IF NOT AUTHED
  if (!isAuthed) {
    return null
  }

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur border-b border-slate-700/50 z-40 h-16 shadow-lg">
        <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition duration-200"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent hover:from-blue-300 hover:to-blue-500 transition"
          >
            <span>🐋</span>
            <span>SmartWhale</span>
          </Link>

          {/* Right Side - Notifications, Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notifications Panel */}
            <NotificationsPanel />

            {/* User Email (hidden on mobile) */}
            {userEmail && (
              <div className="hidden sm:flex items-center text-sm text-gray-400">
                <span className="truncate max-w-xs">{userEmail}</span>
              </div>
            )}

            {/* Profile Button */}
            <Link
              href="/profile"
              className="group relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-blue-500/50"
              title="Profile Settings"
            >
              <span className="text-lg">👤</span>
              <span className="absolute inset-0 rounded-full bg-blue-400 opacity-0 group-hover:opacity-20 transition-opacity"></span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-sm font-medium transition duration-200 border border-red-600/20 hover:border-red-600/50"
              title="Sign out"
            >
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">🚪</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-16 bottom-0 w-64 bg-gradient-to-b from-slate-900 to-black border-r border-slate-700/50 transform transition-transform duration-300 ease-in-out z-30 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 md:relative md:w-64 overflow-y-auto`}
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b border-slate-700/50">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Navigation
            </h3>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group relative flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-blue-600/30 to-blue-600/10 border border-blue-600/50 text-white shadow-lg shadow-blue-600/20'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </span>
                {item.badge && (
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white group-hover:bg-red-500 transition">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Divider */}
          <div className="my-4 mx-4 border-t border-slate-700/30"></div>

          {/* Logout Button for Mobile */}
          <div className="p-4">
            <button
              onClick={() => {
                setSidebarOpen(false)
                handleLogout()
              }}
              className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-red-600/20 to-red-600/10 hover:from-red-600/30 hover:to-red-600/20 border border-red-600/30 hover:border-red-600/50 text-red-400 hover:text-red-300 font-medium transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>

          {/* Footer Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/30 bg-gradient-to-t from-black to-transparent">
            <p className="text-xs text-gray-500 text-center">
              SmartWhale v1.0
              <br />
              <a
                href="mailto:support@smartwhale.app"
                className="text-blue-400 hover:text-blue-300 transition"
              >
                Need help?
              </a>
            </p>
          </div>
        </aside>

        {/* Overlay for Mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}

