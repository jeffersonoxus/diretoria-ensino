'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function PerfilPage() {
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setName(user?.user_metadata?.name || '')
  }

  const updateProfile = async () => {
    setLoading(true)
    setMessage(null)
    
    try {
      // 1. Atualiza usuário em auth
      const { error: authError } = await supabase.auth.updateUser({
        data: { name }
      })
      if (authError) throw authError

      // 2. Atualiza a tabela perfil
      const {error: dbError} = await supabase
        .from('perfis')
        .update({nome: name}) // Coluna 'nome' da tabela
        .eq('email', user.email) // Atualiza apenas o logado
      if (dbError) throw dbError

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 md:hidden">
        Meu Perfil
      </h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-bold text-xl">
              {user.email?.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {name || 'Usuário'}
            </h2>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); updateProfile(); }} className="space-y-4">
          <Input
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome completo"
          />

          <Input
            label="Email"
            value={user.email}
            disabled
            className="bg-gray-50"
          />

          {message && (
            <div className={`p-3 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
          >
            Salvar alterações
          </Button>
        </form>
      </div>
    </div>
  )
}