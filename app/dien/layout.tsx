import { Sidebar } from '@/components/Sidebar'
import { createClient } from '@/lib/supabase/middleware'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Conteúdo principal com margem para o sidebar */}
      <main className="md:ml-64 min-h-screen">
        <div className="p-4 md:p-8">
          {/* Header mobile com título da página */}
          <div className="md:hidden mb-6">
            <h1 className="text-2xl text-center font-bold text-gray-900">
              Dashboard
            </h1>
          </div>
          
          {children}
        </div>
      </main>
    </div>
  )
}