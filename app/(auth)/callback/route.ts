// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL para redirecionar após confirmação
  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/login'
  
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
}