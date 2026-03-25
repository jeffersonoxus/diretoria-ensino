'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

export const AuthStatus = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 rounded-lg">
        <p className="text-yellow-800">Não logado</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-green-50 rounded-lg">
      <p className="text-green-800 font-medium mb-2">
        Logado como: {user.email}
      </p>
      <p className="text-sm text-green-600 mb-3">
        ID: {user.id}
      </p>
      <button
        onClick={handleLogout}
        className="text-sm text-red-600 hover:text-red-800 font-medium"
      >
        Sair
      </button>
    </div>
  )
}