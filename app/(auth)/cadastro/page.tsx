// app/(auth)/cadastro/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { Sparkles } from 'lucide-react'

export default function CadastroPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      // Cadastro bem sucedido sem necessidade de confirmação
      if (data.user) {
        // Faz login automático após cadastro
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          // Se falhar o login automático, redireciona para o login
          router.push('/login?message=Conta criada com sucesso! Faça seu login.')
        } else {
          // Login automático bem sucedido, vai direto pro dashboard
          router.push('/dien')
          router.refresh()
        }
      }
    } catch (error: any) {
      console.error('Erro no cadastro:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="bg-purple-100 p-3 rounded-full">
            <Sparkles className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-800">
          Criar nova conta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Ou{' '}
          <Link href="/login" className="font-medium text-purple-600 hover:text-purple-500 transition-colors">
            entrar na sua conta existente
          </Link>
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-purple-100">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleCadastro}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />

            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />

            <Input
              label="Confirmar Senha"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Cadastrar
            </Button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-purple-100 py-4">
        <div className="text-center">
          <p className="text-gray-500 text-xs sm:text-sm">
            Desenvolvido por Jefferson
          </p>
        </div>
      </footer>
    </div>
  )
}