import { type NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-key-min-32-chars-xxxxxxxxxx')

const protectedRoutes = ['/dashboard', '/profile', '/whale-tracker', '/portfolio', '/alerts', '/settings']
const publicRoutes = ['/', '/login', '/register', '/pricing', '/features', '/docs', '/blog']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Пропускаем публичные routes
  if (publicRoutes.includes(pathname) || pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Проверяем защищённые routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    try {
      // Проверяем Supabase auth через cookie
      const { data: { session } } = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/session`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            Authorization: `Bearer ${request.cookies.get('sb-auth-token')?.value || ''}`,
          },
        }
      )
        .then(res => res.json())
        .catch(() => ({ data: { session: null } }))

      if (!session) {
        // Redirect to login if no session
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Add user info to headers
      request.headers.set('x-user-id', session.user?.id || '')
      request.headers.set('x-user-email', session.user?.email || '')
    } catch (error) {
      console.error('Middleware auth error:', error)
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|.*\\..*|public).*)'],
}
