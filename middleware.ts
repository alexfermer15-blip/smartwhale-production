import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Исключение для публичного прокси (и любых публичных API/статических файлов)
  if (request.nextUrl.pathname.startsWith('/api/proxy/')) {
    console.log('PUBLIC PROXY BYPASSED:', request.nextUrl.pathname)
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Защищённые маршруты:
  const protectedPaths = ['/whale-tracker', '/dashboard', '/portfolio', '/alerts', '/settings']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !user) {
    console.log('PROTECTED REDIRECT TO LOGIN:', request.nextUrl.pathname)
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (request.nextUrl.pathname === '/login' && user) {
    console.log('LOGIN REDIRECT TO WHALE-TRACKER')
    const url = request.nextUrl.clone()
    url.pathname = '/whale-tracker'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
