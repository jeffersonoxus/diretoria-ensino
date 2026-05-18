// app/(auth)/admin/layout.tsx
import { Sidebar } from '@/components/Sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar nível de acesso - diretivo ou administrativo podem acessar admin
  const { data: perfil } = await supabase
    .from('perfis')
    .select('nivel_acesso')
    .eq('email', user.email)
    .single()

  const nivelAcesso = perfil?.nivel_acesso
  const podeAcessarAdmin = nivelAcesso === 'diretivo' || nivelAcesso === 'administrativo'
  
  if (!podeAcessarAdmin) {
    redirect('/agenda')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="md:ml-64 min-h-screen">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}