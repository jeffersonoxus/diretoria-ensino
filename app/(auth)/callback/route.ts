// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/login'

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Trocar o código pela sessão
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redireciona para o login com mensagem de sucesso
      const loginUrl = new URL(redirectTo, request.url)
      loginUrl.searchParams.set('confirmed', 'true')
      return NextResponse.redirect(loginUrl)
    }
  }

  // Se houver erro, volta para o login com mensagem de erro
  const errorUrl = new URL('/login', request.url)
  errorUrl.searchParams.set('error', 'Falha na confirmação do email')
  return NextResponse.redirect(errorUrl)
}