// app/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sparkles } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Navigation - apenas logo */}
      <nav className="px-4 py-4 sm:px-6 sm:py-6 flex justify-between items-center w-full">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text text-transparent">
            DIEN
          </h1>
        </div>
        {user && (
          <Link
            href="/dien"
            className="bg-purple-600 text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-full hover:bg-purple-700 transition-all shadow-md text-sm sm:text-base"
          >
            Dashboard
          </Link>
        )}
      </nav>

      {/* Container centralizado com cards de login/cadastro */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="max-w-md w-full mx-auto">
          {!user ? (
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-6 border border-purple-100">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                  Bem-vindo ao DIEN
                </h2>
                <p className="text-gray-500 text-sm sm:text-base">
                  Plataforma de gestão educacional
                </p>
              </div>

              <div className="space-y-4">
                <Link
                  href="/login"
                  className="block w-full bg-purple-600 text-white text-center px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all transform hover:scale-[1.02] active:scale-100 shadow-md"
                >
                  Entrar na plataforma
                </Link>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-400">ou</span>
                  </div>
                </div>

                <Link
                  href="/cadastro"
                  className="block w-full bg-gray-100 text-gray-700 text-center px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all transform hover:scale-[1.02] active:scale-100"
                >
                  Criar nova conta
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center border border-purple-100">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 break-all">
                Olá, {user.email}!
              </h2>
              <Link
                href="/dien"
                className="inline-block bg-purple-600 text-white px-6 py-3 sm:px-8 sm:py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all w-full sm:w-auto shadow-md"
              >
                Acessar Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer simplificado */}
      <footer className="bg-gray-50 border-t border-gray-200 py-6 sm:py-8 mt-auto">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500 text-xs sm:text-sm">
              Desenvolvido por Jefferson
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}