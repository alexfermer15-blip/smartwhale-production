// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Создаём response
  const res = NextResponse.next()

  // Создаём Supabase клиент для middleware
  // Это важно для обновления cookies и передачи session в API routes
  const supabase = createMiddlewareClient({ req: request, res })

  // Обновляем сессию (это обновит cookies автоматически)
  await supabase.auth.getSession()

  // Добавляем custom header с pathname
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  // Возвращаем response с обновлёнными cookies и headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
    // Важно! Передаём cookies из supabase response
    headers: res.headers,
  })
}

export const config = {
  matcher: ['/((?!_next|_static|_vercel|.*\\..*|public).*)'],
}
