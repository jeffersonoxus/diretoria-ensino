// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Rate limiting simples (por IP)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const windowMs = 60 * 1000
  const maxRequests = 60
  const record = rateLimitMap.get(ip)
  if (record && record.resetAt > now) {
    record.count++
    if (record.count > maxRequests) {
      return new NextResponse('Muitas requisições. Tente novamente em 1 minuto.', { status: 429 })
    }
  } else {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
  }

  // Rotas públicas (acessíveis sem login)
  const publicRoutes = ['/', '/login', '/cadastro', '/auth/callback', '/compartilhar']
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))

  // Rotas protegidas
  const protectedRoutes = ['/agenda', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Redirecionar para login se tentar acessar rota protegida sem estar logado
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirecionar para /agenda se estiver logado e tentar acessar login/cadastro
  if (user && (pathname === '/login' || pathname === '/cadastro')) {
    return NextResponse.redirect(new URL('/agenda', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}