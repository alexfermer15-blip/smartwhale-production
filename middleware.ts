import { type NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'secret')

const protectedRoutes = ['/dashboard', '/profile', '/settings']
const publicRoutes = ['/', '/login', '/register']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Пропускаем публичные routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Проверяем защищённые routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      // Verify JWT token (Supabase auth)
      const session = await jwtVerify(token, secret)
      request.headers.set('user', JSON.stringify(session.payload))
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|.*\\..*|public).*)'],
}
