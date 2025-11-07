import { type NextRequest, NextResponse } from 'next/server'

const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/whale-tracker',
  '/portfolio',
  '/alerts',
  '/settings',
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Add custom header with pathname for layout
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  // Проверяем защищённые routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const authToken = request.cookies.get('sb-auth-token')?.value

    if (!authToken) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/((?!_next|.*\\..*|public).*)'],
}
