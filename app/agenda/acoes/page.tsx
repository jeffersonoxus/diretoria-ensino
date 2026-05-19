'use client'

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { 
  Pencil, Trash2, Calendar, MapPin, Truck, Users, 
  List, ChevronDown, ChevronUp, 
  User, CalendarDays, Clock as ClockIcon, AlertCircle
} from "lucide-react"
import FormNovaAcao, { formatarDataParaExibicaoLista } from '@/components/FormNovaAcao'
import type { Acao as AcaoBase, Setor, TipoAcao, Usuario } from '@/components/FormNovaAcao'
import { showToast } from '@/components/ui/Toast'

interface Acao extends AcaoBase {
  created_by_nome?: string
  updated_by_nome?: string
}

interface Local {
  id: string
  nome: string
  tipo: string
  endereco?: string
  ativo: boolean
}



export default function AcoesPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [acoes, setAcoes] = useState<Acao[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [tiposAcoes, setTiposAcoes] = useState<TipoAcao[]>([])
  const [locais, setLocais] = useState<Local[]>([])
  const [userPerfilId, setUserPerfilId] = useState<string | null>(null)
  const [userNome, setUserNome] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userSetoresIds, setUserSetoresIds] = useState<string[]>([])
  const [userNivelAcesso, setUserNivelAcesso] = useState<string>('tecnico')
  const [loading, setLoading] = useState(true)
  const [editandoAcao, setEditandoAcao] = useState<Acao | null>(null)
  const [formExpandido, setFormExpandido] = useState(true)
  const [mostrarListaAcoes, setMostrarListaAcoes] = useState(false)
  const [mostrarMaisAcoes, setMostrarMaisAcoes] = useState(false)
  const [acoesVisiveis, setAcoesVisiveis] = useState<Acao[]>([])
  const [modalExcluir, setModalExcluir] = useState<{ id: string; status?: string } | null>(null)
  const [excluirCountdown, setExcluirCountdown] = useState(10)

  // Carregar dados iniciais
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchSetores()
      await fetchTiposAcoes()
      await fetchLocais()
      await getCurrentUserPerfil()
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (userPerfilId) {
      fetchAcoes()
      carregarTodosUsuarios()
    }
  }, [userPerfilId, userSetoresIds, userNivelAcesso])

  // Auto-carregar edição vindo do link da agenda
  useEffect(() => {
    const acaoId = searchParams.get('editarAcaoId')
    if (acaoId && acoes.length > 0) {
      const acao = acoes.find(a => a.id === acaoId)
      if (acao) {
        carregarParaEdicao(acao)
      }
    }
  }, [searchParams, acoes])

  useEffect(() => {
    const now = new Date()
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)
    const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const acoesDoMes = acoes.filter(acao => {
      const dataAcao = new Date(acao.created_at)
      return dataAcao >= inicioMes && dataAcao <= fimMes
    })
    
    setAcoesVisiveis(mostrarMaisAcoes ? acoes.slice(0, 50) : acoesDoMes.slice(0, 10))
  }, [acoes, mostrarMaisAcoes])

  // Countdown para exclusão
  useEffect(() => {
    if (modalExcluir && excluirCountdown > 0) {
      const timer = setTimeout(() => setExcluirCountdown(excluirCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [modalExcluir, excluirCountdown])

  const getCurrentUserPerfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      setUserEmail(user.email || '')
      
      const { data: perfil } = await supabase
        .from('perfis')
        .select('id, nome, email, nivel_acesso')
        .eq('email', user.email)
        .single()
       
      if (perfil) {
        setUserPerfilId(perfil.id)
        setUserNome(perfil.nome || perfil.email?.split('@')[0] || 'Usuário')
        setUserNivelAcesso(perfil.nivel_acesso || 'tecnico')
        
        const { data: setoresData } = await supabase.from('setores').select('*')
        const setoresDoUsuario = setoresData?.filter(setor => 
          setor.pessoas && setor.pessoas.includes(perfil.id)
        ) || []
        setUserSetoresIds(setoresDoUsuario.map(s => s.id))
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
    }
  }

  const carregarTodosUsuarios = async () => {
    const temAcessoAmplo = userNivelAcesso === 'gerencial' || userNivelAcesso === 'diretivo' || userNivelAcesso === 'administrativo'
    
    if (temAcessoAmplo) {
      const { data: perfis } = await supabase.from('perfis').select('id, nome, email')
      if (perfis) setUsuarios(perfis)
      return
    }
    
    if (userSetoresIds.length === 0) return
    
    const setoresDoUsuario = setores.filter(s => userSetoresIds.includes(s.id))
    const todosIds: string[] = []
    setoresDoUsuario.forEach(setor => {
      if (setor.pessoas && setor.pessoas.length > 0) {
        todosIds.push(...setor.pessoas)
      }
    })
    
    const idsUnicos = [...new Set(todosIds)]
    
    if (idsUnicos.length > 0) {
      const { data: perfis } = await supabase
        .from('perfis')
        .select('id, nome, email')
        .in('id', idsUnicos)
      
      if (perfis) {
        setUsuarios(perfis)
      }
    }
  }

  const fetchSetores = async () => {
    const { data } = await supabase.from('setores').select('*')
    if (data) setSetores(data)
  }

  const fetchTiposAcoes = async () => {
    const { data } = await supabase.from('tipo_acao').select('*')
    if (data) setTiposAcoes(data)
  }

  const fetchLocais = async () => {
    const { data } = await supabase
      .from('locais')
      .select('*')
      .eq('ativo', true)
      .order('nome')
    if (data) setLocais(data)
  }

  const fetchAcoes = async () => {
    const temAcessoAmplo = userNivelAcesso === 'gerencial' || userNivelAcesso === 'diretivo' || userNivelAcesso === 'administrativo'
    
    let query = supabase.from('acoes').select('*').order('created_at', { ascending: false })
    
    if (!temAcessoAmplo && userSetoresIds.length > 0) {
      query = query.in('setor_id', userSetoresIds)
    }
    
    const { data } = await query
    
    if (data) {
      const userIds = new Set<string>()
      data.forEach(acao => {
        if (acao.created_by) userIds.add(acao.created_by)
        if (acao.updated_by) userIds.add(acao.updated_by)
      })
      
      const { data: perfis } = await supabase
        .from('perfis')
        .select('id, nome, email')
        .in('id', Array.from(userIds))
      
      const nomeMap = new Map(perfis?.map(p => [p.id, p.nome?.trim() || p.email]))
      setAcoes(data.map(acao => ({
        ...acao,
        created_by_nome: nomeMap.get(acao.created_by) || 'Desconhecido',
        updated_by_nome: nomeMap.get(acao.updated_by) || 'Desconhecido'
      })))
    }
  }

  const resetForm = () => {
    setEditandoAcao(null)
    setFormExpandido(true)
  }

  const deleteAcao = async (id: string, status?: string) => {
    if (status === 'Cancelada' && userNivelAcesso !== 'administrativo') {
      showToast('Apenas usuários administrativos podem excluir ações canceladas', 'error')
      return
    }
    setModalExcluir({ id, status })
    setExcluirCountdown(10)
  }

  const confirmDelete = async () => {
    if (!modalExcluir) return
    try {
      await supabase.from('acoes').delete().eq('id', modalExcluir.id)
      setModalExcluir(null)
      fetchAcoes()
      showToast('Ação excluída com sucesso!')
    } catch (err: any) {
      showToast('Erro ao excluir: ' + (err.message || 'Erro desconhecido'), 'error')
    }
  }

  const carregarParaEdicao = (acao: Acao) => {
    setEditandoAcao(acao)
    setFormExpandido(true)
    window.scrollTo({ top: 150, behavior: 'smooth' })
  }

  const setoresDisponiveis = setores.filter(s => userSetoresIds.includes(s.id))

  const temAcessoAmplo = userNivelAcesso === 'gerencial' || userNivelAcesso === 'diretivo' || userNivelAcesso === 'administrativo'

  if (loading) return <LoadingSpinner />
  if (userSetoresIds.length === 0 && !temAcessoAmplo) return <SemSetor userPerfilId={userPerfilId} userNome={userNome} />

  const getNomeExibicao = (usuario: Usuario) => {
    return usuario.nome?.trim() || usuario.email
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Gerenciamento de Ações
          </h1>
          <p className="text-gray-500 mt-1">
            Olá, {userNome} • Setor: {setoresDisponiveis.map(s => s.nome).join(', ')}
          </p>
        </div>

        {formExpandido && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <FormNovaAcao
              setores={setores}
              tiposAcoes={tiposAcoes}
              locais={locais}
              usuarios={usuarios}
              userPerfilId={userPerfilId}
              userSetoresIds={userSetoresIds}
              userNivelAcesso={userNivelAcesso}
              editandoAcao={editandoAcao}
              titulo={editandoAcao ? 'Editar Ação' : 'Nova Ação'}
              onSave={(msg?: string) => {
                setEditandoAcao(null)
                fetchAcoes()
                showToast(msg || 'Ação salva!')
              }}
              onCancel={resetForm}
            />
          </div>
        )}

        {acoes.length > 0 && (
          <div className="mb-4">
            <button onClick={() => setMostrarListaAcoes(!mostrarListaAcoes)} className="w-full flex items-center justify-between bg-white rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <List size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Ações Cadastradas</h3>
                  <p className="text-sm text-gray-500">{acoes.filter(a => a.status === 'Pendente').length} pendente(s)</p>
                </div>
              </div>
              {mostrarListaAcoes ? <ChevronUp /> : <ChevronDown />}
            </button>

            {mostrarListaAcoes && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mt-2">
                <div className="space-y-4">
                  {acoesVisiveis.map(acao => (
                    <AcaoCard
                      key={acao.id}
                      acao={acao}
                      setores={setores}
                      tiposAcoes={tiposAcoes}
                      usuarios={usuarios}
                      onEdit={carregarParaEdicao}
                      onDelete={deleteAcao}
                    />
                  ))}
                </div>
                
                {acoes.length > 10 && !mostrarMaisAcoes && (
                  <button onClick={() => setMostrarMaisAcoes(true)} className="mt-4 text-purple-600 hover:text-purple-700 text-center w-full py-2">
                    Mostrar mais ({acoes.length - 10} ações anteriores)
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>

      {/* Modal de Exclusão com Confirmação */}
      {modalExcluir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4" onClick={() => setModalExcluir(null)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="text-red-600 mb-4">
              <AlertCircle size={56} className="mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Excluir Ação</h3>
            <p className="text-base text-gray-600 mb-8">Tem certeza que deseja excluir esta ação?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setModalExcluir(null)} className="px-5 py-3 text-sm font-bold text-amber-700 bg-amber-50 border-2 border-amber-300 rounded-xl hover:bg-amber-100 transition">
                Cancelar exclusão
              </button>
              <button
                disabled={excluirCountdown > 0}
                onClick={confirmDelete}
                className={`px-5 py-3 text-sm font-bold text-white rounded-xl transition ${
                  excluirCountdown > 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {excluirCountdown > 0 ? `Aguarde ${excluirCountdown}s` : 'Sim, excluir ação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
  </div>
)

const SemSetor = ({ userPerfilId, userNome }: { userPerfilId: string | null, userNome: string }) => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-red-600 mb-4">Acesso Restrito</h2>
      <p className="text-gray-600 mb-4">Você não está vinculado a nenhum setor.</p>
      <div className="mt-4 p-3 bg-gray-100 rounded-lg text-left">
        <p className="text-xs font-mono">ID: {userPerfilId}<br/>Nome: {userNome}</p>
      </div>
    </div>
  </div>
)

const AcaoCard = ({ acao, setores, tiposAcoes, usuarios, onEdit, onDelete }: any) => {
  const setorDaAcao = setores.find((s: any) => s.id === acao.setor_id)
  const setoresEnvolvidos = setores.filter((s: any) => acao.setores_envolvidos?.includes(s.id))
  
  const getNomeExibicao = (nome: string) => {
    if (nome && nome.trim()) return nome
    const usuario = usuarios.find((u: any) => u.nome === nome || u.email === nome)
    return usuario?.nome?.trim() || usuario?.email || nome
  }
  
  const dataCriacao = acao.created_at ? new Date(acao.created_at) : null
  const dataCriacaoFormatada = dataCriacao ? dataCriacao.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : ''
  
  const dataAtualizacao = acao.updated_at ? new Date(acao.updated_at) : null
  const dataAtualizacaoFormatada = dataAtualizacao ? dataAtualizacao.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : ''
  
  const foiAtualizada = acao.updated_at && acao.updated_at !== acao.created_at
  
  return (
    <div className="border rounded-xl p-5 hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <h3 className="font-bold text-lg">{tiposAcoes.find((t: any) => t.id === acao.tipo_acao_id)?.nome || 'Sem tipo'}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(acao.status)}`}>{acao.status}</span>
            {setorDaAcao && <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">🏢 {setorDaAcao.nome}</span>}
          </div>
          
          {acao.descricao && <p className="text-gray-600 mb-3">{acao.descricao}</p>}
          
          <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-500">
            {acao.local && <span className="flex items-center gap-1"><MapPin size={14} /> {acao.local}</span>}
            {acao.data_inicio && <span className="flex items-center gap-1"><Calendar size={14} /> Início: {formatarDataParaExibicaoLista(acao.data_inicio)}</span>}
            {acao.data_fim && <span className="flex items-center gap-1"><Calendar size={14} /> Término: {formatarDataParaExibicaoLista(acao.data_fim)}</span>}
            {acao.necessita_transporte && <span className="flex items-center gap-1 text-amber-600"><Truck size={14} /> Transporte</span>}
          </div>
          
          {setoresEnvolvidos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {setoresEnvolvidos.map((s: any) => <span key={s.id} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">🏢 {s.nome}</span>)}
            </div>
          )}
          
          {acao.pessoas && acao.pessoas.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {acao.pessoas.map((p: string, idx: number) => (
                <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded-full">👤 {getNomeExibicao(p)}</span>
              ))}
            </div>
          )}
          
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <User size={12} className="text-purple-500" />
                <span>Criado por: <span className="text-gray-600 font-medium">{acao.created_by_nome || 'Desconhecido'}</span></span>
                <CalendarDays size={12} className="text-purple-500 ml-1" />
                <span>em <span className="text-gray-600">{dataCriacaoFormatada}</span></span>
              </div>
              
              {foiAtualizada && (
                <div className="flex items-center gap-1.5">
                  <User size={12} className="text-amber-500" />
                  <span>Atualizado por: <span className="text-gray-600 font-medium">{acao.updated_by_nome || 'Desconhecido'}</span></span>
                  <ClockIcon size={12} className="text-amber-500 ml-1" />
                  <span>em <span className="text-gray-600">{dataAtualizacaoFormatada}</span></span>
                </div>
              )}
            </div>
          </div>
        </div>
        
          <div className="flex gap-2 ml-4">
            {acao.status !== 'Cancelada' && (
              <button onClick={() => onEdit(acao)} className="p-2 text-gray-500 hover:text-purple-600 rounded-lg transition" title="Editar">
                <Pencil size={18} />
              </button>
            )}
            <button onClick={() => onDelete(acao.id, acao.status)} className="p-2 text-gray-500 hover:text-red-600 rounded-lg transition" title="Excluir">
              <Trash2 size={18} />
            </button>
          </div>
      </div>
    </div>
  )
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    Realizada: 'bg-green-100 text-green-700',
    Cancelada: 'bg-red-100 text-red-700',
    Pendente: 'bg-yellow-100 text-yellow-700',
    'Realizada Parcialmente': 'bg-blue-100 text-blue-700',
    Reagendada: 'bg-purple-100 text-purple-700'
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}