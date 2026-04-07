// app/app/page.tsx
'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Search,
  RefreshCw,
  Building2,
  Loader2,
  MapPin,
  Home
} from "lucide-react"

interface Acao {
  id: string
  descricao?: string
  local?: string
  data_inicio?: string
  data_fim?: string
  status: string
  tipo_acao_id?: string
  setor_id?: string
  setor_nome?: string
  created_at: string
  updated_at?: string
}

interface Setor {
  id: string
  nome: string
  pessoas: string[]
}

export default function AppMobilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [acoes, setAcoes] = useState<Acao[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [userPerfilId, setUserPerfilId] = useState<string | null>(null)
  const [userSetores, setUserSetores] = useState<Setor[]>([])
  const [filtro, setFiltro] = useState<'pendentes' | 'todas'>('pendentes')
  const [busca, setBusca] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 1. Buscar usuário logado
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error("Usuário não logado")
      
      console.log("Usuário logado:", user.email)
      
      // 2. Buscar perfil do usuário
      const { data: perfil, error: perfilError } = await supabase
        .from('perfis')
        .select('id, nome')
        .eq('email', user.email)
        .single()
      
      if (perfilError) {
        console.error("Erro ao buscar perfil:", perfilError)
        throw new Error("Perfil não encontrado")
      }
      
      console.log("Perfil encontrado:", perfil)
      setUserPerfilId(perfil.id)
      setUserName(perfil.nome)
      
      // 3. Buscar setores onde o usuário está vinculado
      const { data: setoresData, error: setoresError } = await supabase
        .from('setores')
        .select('*')
      
      if (setoresError) throw setoresError
      
      console.log("Todos os setores:", setoresData)
      
      // Filtrar setores onde o usuário está no array 'pessoas'
      const setoresDoUsuario = setoresData?.filter(setor => {
        const pessoas = setor.pessoas || []
        return pessoas.includes(perfil.id)
      }) || []
      
      console.log("Setores do usuário:", setoresDoUsuario)
      setUserSetores(setoresDoUsuario)
      
      if (setoresDoUsuario.length === 0) {
        console.log("Usuário não está em nenhum setor")
        setAcoes([])
        setLoading(false)
        return
      }
      
      // 4. Buscar ações dos setores do usuário
      const setoresIds = setoresDoUsuario.map(s => s.id)
      console.log("Buscando ações para os setores:", setoresIds)
      
      const { data: acoesData, error: acoesError } = await supabase
        .from('acoes')
        .select('*')
        .in('setor_id', setoresIds)
        .order('data_inicio', { ascending: true })
        .order('created_at', { ascending: false })
      
      if (acoesError) throw acoesError
      
      console.log("Ações encontradas:", acoesData?.length || 0)
      console.log("Detalhes das ações:", acoesData)
      
      // Adicionar nome do setor a cada ação
      const acoesComSetor = acoesData?.map(acao => ({
        ...acao,
        setor_nome: setoresDoUsuario.find(s => s.id === acao.setor_id)?.nome
      })) || []
      
      setAcoes(acoesComSetor)
      
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      setError(error instanceof Error ? error.message : "Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Realizada':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Realizada' }
      case 'Pendente':
        return { icon: Clock, color: 'text-[#ffa301]', bg: 'bg-[#ffa301]/10', label: 'Pendente' }
      case 'Realizada Parcialmente':
        return { icon: AlertCircle, color: 'text-[#24cffd]', bg: 'bg-[#24cffd]/10', label: 'Parcial' }
      case 'Cancelada':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Cancelada' }
      case 'Reagendada':
        return { icon: RefreshCw, color: 'text-[#7114dd]', bg: 'bg-[#7114dd]/10', label: 'Reagendada' }
      default:
        return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100', label: status }
    }
  }

  const acoesFiltradas = acoes
    .filter(acao => {
      if (filtro === 'pendentes') {
        return acao.status === 'Pendente' || acao.status === 'Reagendada'
      }
      return true
    })
    

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-[#7114dd]/10 to-[#a94dff]/10 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-[#7114dd] mx-auto mb-4" />
          <p className="text-gray-600">Carregando ações...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-b from-[#7114dd]/10 to-[#a94dff]/10 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro ao carregar</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => carregarDados()}
            className="bg-[#7114dd] text-white px-6 py-3 rounded-xl hover:bg-[#a94dff] transition"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (userSetores.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-b from-[#7114dd]/10 to-[#a94dff]/10 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Restrito</h2>
          <p className="text-gray-600 mb-4">
            Você não está vinculado a nenhum setor.
          </p>
          <p className="text-sm text-gray-500">
            Entre em contato com o administrador para ser adicionado a um setor.
          </p>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left">
            <p className="text-xs font-mono text-gray-600">
              ID do Perfil: {userPerfilId || 'Não identificado'}<br/>
              Nome: {userName || 'Não identificado'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const pendentesCount = acoes.filter(a => a.status === 'Pendente' || a.status === 'Reagendada').length

  return (
    <div className="min-h-screen bg-purple-100 text-slate-700 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-6 sticky top-0 z-10 shadow-sm">
        {/* Botão Home */}
        <button
          onClick={() => router.push('/dien')}
          className="absolute top-6 right-4 p-2 hover:bg-gray-100 rounded-full transition"
        >
          <Home size={24} className="text-gray-600" />
        </button>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Olá, {userName}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {pendentesCount} {pendentesCount === 1 ? 'ação pendente' : 'ações pendentes'}
          </p>
          {userSetores.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {userSetores.map(setor => (
                <span key={setor.id} className="text-xs bg-[#7114dd]/10 text-[#7114dd] px-2 py-1 rounded-full">
                  🏢 {setor.nome}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="px-4 py-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar ação ou local..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#7114dd] focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setFiltro('pendentes')}
            className={`flex-1 py-2 rounded-xl font-medium transition ${
              filtro === 'pendentes'
                ? 'bg-[#7114dd] text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            Pendentes
            {pendentesCount > 0 && filtro === 'pendentes' && (
              <span className="ml-1 text-xs bg-white text-[#7114dd] rounded-full px-1.5 py-0.5">
                {pendentesCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFiltro('todas')}
            className={`flex-1 py-2 rounded-xl font-medium transition ${
              filtro === 'todas'
                ? 'bg-[#7114dd] text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            Todas
            <span className="ml-1 text-xs text-gray-400">
              ({acoes.length})
            </span>
          </button>
        </div>
      </div>

      {/* Lista de Ações */}
      <div className="px-4 space-y-3">
        {acoesFiltradas.length > 0 ? (
          acoesFiltradas.map((acao) => {
            const statusConfig = getStatusConfig(acao.status)
            const StatusIcon = statusConfig.icon
            const podeResponder = acao.status === 'Pendente' || acao.status === 'Reagendada'
            const dataAcao = acao.data_inicio ? new Date(acao.data_inicio) : null
            
            return (
              <div
                key={acao.id}
                onClick={() => podeResponder && router.push(`/app/responder/${acao.id}`)}
                className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all ${
                  podeResponder 
                    ? 'active:scale-98 cursor-pointer hover:shadow-md' 
                    : 'opacity-75'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    {acao.local && (
                      <p className="text-gray-500 text-sm flex items-center gap-1">
                        <MapPin size={14} />
                        {acao.local}
                      </p>
                    )}
                    {acao.setor_nome && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Building2 size={12} />
                        {acao.setor_nome}
                      </p>
                    )}
                  </div>
                  <div className={`px-2 py-1 rounded-full ${statusConfig.bg} flex items-center gap-1 ml-2`}>
                    <StatusIcon size={12} className={statusConfig.color} />
                    <span className={`text-xs font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
                
                {dataAcao && (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Calendar size={12} />
                    {dataAcao.toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
                
                {podeResponder && (
                  <div className="mt-3 flex items-center justify-end text-[#7114dd] text-sm font-medium">
                    Responder agora
                    <ChevronRight size={16} className="ml-1" />
                  </div>
                )}
                
                {!podeResponder && acao.status === 'Realizada' && (
                  <div className="mt-3 flex items-center justify-end text-green-500 text-xs">
                    <CheckCircle size={14} className="mr-1" />
                    Concluída
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500">Nenhuma ação encontrada</p>
            <p className="text-sm text-gray-400 mt-1">
              {filtro === 'pendentes' 
                ? 'Você não tem ações pendentes no momento' 
                : 'Não há ações registradas para seus setores'}
            </p>
            {filtro === 'pendentes' && acoes.length > 0 && (
              <button
                onClick={() => setFiltro('todas')}
                className="mt-4 text-[#7114dd] text-sm font-medium"
              >
                Ver todas as ações ({acoes.length})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}