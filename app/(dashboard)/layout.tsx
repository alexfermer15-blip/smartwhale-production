'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import NotificationsPanel from './notifications-panel'
import { LogOut, User, Mail } from 'lucide-react'

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
  const [userName, setUserName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)
  const [error, setError] = useState<string>('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // ✅ AUTH CHECK ON MOUNT
  useEffect(() => {
    const checkAuthAndFetchUser = async () => {
      try {
        const supabase = createClient()

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
          // Extract name from email (before @)
          setUserName(user.email.split('@')[0])
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
    const supabase = createClient()
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
          setUserName(session.user.email.split('@')[0])
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
      const supabase = createClient()
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
    { href: '/signals', label: 'Trading Signals', icon: '📈', badge: 6 },
    { href: '/watchlist', label: 'My Watchlist', icon: '⭐' },
    { href: '/whale-activity', label: 'Activity Feed', icon: '📡' },
    { href: '/portfolio', label: 'Portfolio', icon: '💼' },
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
      {/* Sidebar - Z-INDEX 50 */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-slate-900 to-black border-r border-slate-700/50 transform transition-transform duration-300 ease-in-out z-50 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 overflow-y-auto`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700/50">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent hover:from-blue-300 hover:to-blue-500 transition"
          >
            <span className="text-2xl">🐋</span>
            <span>SmartWhale</span>
          </Link>
        </div>

        {/* Sidebar Header */}
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
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

        {/* User Profile Card */}
        {userEmail && (
          <div className="px-4 py-3 mx-4 rounded-lg bg-gradient-to-r from-slate-800/50 to-slate-800/30 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {userName}
                </p>
                <p className="text-xs text-gray-400 truncate">{userEmail}</p>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="p-4">
          <button
            onClick={() => {
              setSidebarOpen(false)
              handleLogout()
            }}
            className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-red-600/20 to-red-600/10 hover:from-red-600/30 hover:to-red-600/20 border border-red-600/30 hover:border-red-600/50 text-red-400 hover:text-red-300 font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-auto p-4 border-t border-slate-700/30">
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

      {/* Top Navigation - Z-INDEX 40 */}
      <nav className="fixed top-0 left-0 md:left-64 right-0 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur border-b border-slate-700/50 z-40 h-16 shadow-lg">
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

          {/* Page Title */}
          <div className="flex-1 md:block hidden">
            <h1 className="text-lg font-semibold text-white">
              {pathname === '/dashboard' && 'Dashboard'}
              {pathname === '/whale-tracker' && 'Whale Tracker'}
              {pathname === '/signals' && 'Trading Signals'}
              {pathname === '/watchlist' && 'My Watchlist'}
              {pathname === '/whale-activity' && 'Activity Feed'}
              {pathname === '/portfolio' && 'Portfolio'}
              {pathname === '/alerts' && 'Alerts'}
              {pathname === '/profile' && 'Settings'}
            </h1>
          </div>

          {/* Right Side - Notifications & Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notifications Panel */}
            <NotificationsPanel />

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="group relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-blue-500/50"
                title="Profile Menu"
              >
                <User size={20} className="text-white" />
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-lg shadow-xl border border-slate-700/50 overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {userName}
                        </p>
                        <p className="text-xs text-gray-400">{userEmail}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition"
                    >
                      <User size={16} />
                      <span>Profile Settings</span>
                    </Link>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        handleLogout()
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-600/10 rounded-lg transition"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay for Mobile - Z-INDEX 30 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="md:ml-64 pt-16 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  )
}
