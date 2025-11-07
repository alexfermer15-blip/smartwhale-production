import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Add custom header with pathname for layout
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  // ⚠️ ОТКЛЮЧАЕМ ПРОВЕРКУ AUTH В MIDDLEWARE!
  // Вместо этого - проверку должна делать сама dashboard page component
  // (на client-side, где есть доступ к Supabase session)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/((?!_next|.*\\..*|public).*)'],
}
