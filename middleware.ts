import { type NextRequest, NextResponse } from 'next/server'

const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/whale-tracker',
  '/portfolio',
  '/alerts',
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Проверяем защищённые routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Проверяем есть ли auth session
    const authToken = request.cookies.get('sb-auth-token')?.value

    if (!authToken) {
      // Redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|.*\\..*|public).*)'],
}
