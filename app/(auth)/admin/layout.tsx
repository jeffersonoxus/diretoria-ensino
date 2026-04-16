// app/(auth)/admin/layout.tsx
import { Sidebar } from '@/components/Sidebar'
import { createClient } from '@/lib/supabase/middleware'
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

  // Verificar se é admin
  const isAdmin = user.email === 'admin@exemplo.com' || user.email === 'jeffersonoxus@gmail.com'
  
  if (!isAdmin) {
    redirect('/dien') // Redireciona usuários não-admin
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