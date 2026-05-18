'use client'

import { createClient } from '@/lib/supabase/client'

export type NivelAcesso = 'tecnico' | 'gerencial' | 'diretivo' | 'administrativo'

export const NIVEL_LABELS: Record<NivelAcesso, string> = {
  tecnico: 'Técnico',
  gerencial: 'Gerencial',
  diretivo: 'Diretivo',
  administrativo: 'Administrativo'
}

export const NIVEL_COLORS: Record<NivelAcesso, string> = {
  tecnico: 'bg-gray-100 text-gray-700',
  gerencial: 'bg-blue-100 text-blue-700',
  diretivo: 'bg-purple-100 text-purple-700',
  administrativo: 'bg-amber-100 text-amber-700'
}

export const NIVEL_DOT_COLORS: Record<NivelAcesso, string> = {
  tecnico: 'bg-gray-500',
  gerencial: 'bg-blue-500',
  diretivo: 'bg-purple-500',
  administrativo: 'bg-amber-500'
}

export function isAdmin(nivel: NivelAcesso | null | undefined): boolean {
  return nivel === 'diretivo' || nivel === 'administrativo'
}

export function isSuperAdmin(nivel: NivelAcesso | null | undefined): boolean {
  return nivel === 'administrativo'
}

export function temAcessoAmplo(nivel: NivelAcesso | null | undefined): boolean {
  return nivel === 'gerencial' || nivel === 'diretivo' || nivel === 'administrativo'
}

export function useNivelAcesso() {
  const supabase = createClient()
  
  const obterNivelAcesso = async (): Promise<NivelAcesso | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return null
    
    const { data: perfil } = await supabase
      .from('perfis')
      .select('nivel_acesso')
      .eq('email', user.email)
      .single()
    
    return perfil?.nivel_acesso || 'tecnico'
  }

  return { obterNivelAcesso }
}
