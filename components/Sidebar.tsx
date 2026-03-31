// components/Sidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Home, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  BarChart, 
  ShieldUser,
  BrainCircuit,
  Baby,
  BookOpen,
  GraduationCap,
  Palette,
  ClipboardCheck,
  Calendar,
  Smartphone
} from 'lucide-react';

interface User {
  email?: string
  user_metadata?: {
    avatar_url?: string
    name?: string
  }
}

export const Sidebar = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [perfil, setPerfil] = useState<{ id: string; nome: string } | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    getUser()
    getPerfil()
    
    // Verificar se é mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const getPerfil = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      const { data } = await supabase
        .from('perfis')
        .select('id, nome')
        .eq('email', user.email)
        .single()
      if (data) {
        setPerfil(data)
      }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Verificar se o usuário é admin
  const isAdmin = user?.email === 'admin@exemplo.com' || user?.email === 'jeffersonoxus@gmail.com'

  // Verificar se o usuário está em algum setor (para mostrar o app mobile)
  const [temSetor, setTemSetor] = useState(false)
  
  useEffect(() => {
    const verificarSetor = async () => {
      if (perfil?.id) {
        const { data } = await supabase
          .from('setores')
          .select('id')
          .contains('pessoas', [perfil.id])
        setTemSetor((data?.length || 0) > 0)
      }
    }
    verificarSetor()
  }, [perfil])

  const menuItems = [
    { href: '/dien', icon: Home, label: 'Dashboard', show: true },
    { href: '/dien/perfil', icon: User, label: 'Meu Perfil', show: true },
    { href: '/dien/acoes', icon: ClipboardCheck, label: 'Gerenciar Ações', show: true },
    { href: '/dien/avaliacoes_diagnosticas', icon: ClipboardCheck, label: 'Avaliações Diagnósticas', show: true },
    { href: '/app', icon: Smartphone, label: 'App Mobile', show: temSetor, external: true },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false)
    }
  }

  // Obter iniciais do email para avatar
  const getInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  return (
    <>
      {/* Botão do menu mobile */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 bg-[#7114dd] text-white rounded-lg md:hidden shadow-lg"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}

      {/* Overlay para mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white shadow-xl z-50
          transition-all duration-300 ease-in-out
          ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
          ${isMobile ? 'w-72' : 'w-72'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header com logo e botão fechar */}
          <div className="p-5 border-b bg-linear-to-r from-[#7114dd]/5 to-[#a94dff]/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-linear-to-br from-[#7114dd] to-[#a94dff] rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="font-bold text-xl text-gray-900">DIEN</span>
                  <p className="text-xs text-gray-500">Diretoria de Ensino</p>
                </div>
              </div>
              
              {isMobile && (
                <button
                  onClick={closeSidebar}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              )}
            </div>
          </div>

          {/* Info do usuário */}
          <div className="p-5 border-b bg-gray-50">
            <div className="flex items-center space-x-3">
              {/* Avatar com iniciais */}
              <div className="w-12 h-12 bg-linear-to-br from-[#7114dd] to-[#a94dff] rounded-full flex items-center justify-center shrink-0 shadow-md">
                {user?.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Avatar"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-base">
                    {getInitials()}
                  </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.user_metadata?.name || perfil?.nome || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || 'Carregando...'}
                </p>
                {perfil && (
                  <p className="text-xs text-[#7114dd] mt-1">
                    ID: {perfil.id.substring(0, 8)}...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Menu de navegação */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {menuItems.filter(item => item.show).map((item) => {
                const isActive = pathname === item.href || 
                  (item.href === '/app' && pathname?.startsWith('/app'))
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeSidebar}
                      className={`
                        flex items-center space-x-3 px-4 py-3 rounded-xl
                        transition-all duration-200 group
                        ${isActive 
                          ? 'bg-[#7114dd]/10 text-[#7114dd] shadow-sm' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-[#7114dd]'
                        }
                      `}
                    >
                      <item.icon className={`h-5 w-5 transition ${isActive ? 'text-[#7114dd]' : 'text-gray-400 group-hover:text-[#7114dd]'}`} />
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.external && (
                        <span className="ml-auto text-xs bg-[#ffa301] text-[#7114dd] px-2 py-0.5 rounded-full font-medium">
                          Mobile
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
              
              {/* Seção Admin separada */}
              {isAdmin && (
                <>
                  <div className="pt-4 mt-4 border-t">
                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Administração
                    </p>
                    <Link
                      href={'/admin'}
                      onClick={closeSidebar}
                      className={`
                        flex items-center space-x-3 px-4 py-3 rounded-xl
                        transition-all duration-200 group
                        ${pathname === '/admin'
                          ? 'bg-[#ffa301]/20 text-[#ffa301] shadow-sm' 
                          : 'text-gray-600 hover:bg-[#ffa301]/10 hover:text-[#ffa301]'
                        }
                      `}
                    >
                      <ShieldUser className={`h-5 w-5 transition ${pathname === '/admin' ? 'text-[#ffa301]' : 'text-gray-400 group-hover:text-[#ffa301]'}`} />
                      <span className="text-sm font-medium">Painel Admin</span>
                    </Link>
                  </div>
                </>
              )}
            </ul>
          </nav>

          {/* Botão de logout */}
          <div className="p-4 border-t mt-auto">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
            >
              <LogOut className="h-5 w-5 text-gray-400 group-hover:text-red-500 transition" />
              <span className="text-sm font-medium">Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}