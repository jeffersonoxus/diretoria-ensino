// app/auth/confirm/route.ts
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  // O parâmetro 'next' pode vir do email, mas vamos priorizar uma URL segura
  const next = searchParams.get('next') ?? '/login?confirmed=true'

  // URL para onde o usuário será redirecionado após a confirmação (ou em caso de erro)
  const redirectTo = new URL(next, request.url)
  // Garantimos que o redirecionamento seja para o mesmo domínio, evitando ataques open redirect
  if (!redirectTo.toString().startsWith(request.nextUrl.origin)) {
    // Se o 'next' apontar para um domínio estranho, ignoramos e vamos para o login
    redirectTo.pathname = '/login'
    redirectTo.search = '?confirmed=true'
  }

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // Se deu certo, redireciona para a página definida (por padrão, login com mensagem)
      return NextResponse.redirect(redirectTo)
    }
  }

  // Se algo deu errado, redireciona para o login com um erro
  return NextResponse.redirect(new URL('/login?error=Erro ao confirmar email', request.url))
}