'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Plus, Pencil, Trash2, Calendar, MapPin, Truck, Car, X, Users, Eye, 
  Filter, Building2, AlertCircle, CheckCircle, List, ChevronDown, ChevronUp, 
  Clock, EyeOff, Eye as EyeIcon, User, CalendarDays, Clock as ClockIcon
} from "lucide-react"

// --- Interfaces ---
interface Usuario {
  id: string
  nome: string
  email: string
}

interface Acao {
  id: string
  descricao?: string
  pessoas?: string[]
  created_at: string
  created_by?: string
  updated_at?: string
  updated_by?: string
  tipo_acao_id?: string
  setor_id?: string
  setores_envolvidos?: string[]
  local?: string
  data_inicio?: string
  data_fim?: string
  necessita_transporte?: boolean
  status?: string
  dados_extras?: Record<string, any>
  observacoes?: string
  created_by_nome?: string
  updated_by_nome?: string
}

interface Setor {
  id: string
  nome: string
  descricao?: string
  pessoas: string[]
}

interface Local {
  id: string
  nome: string
  tipo: string
  endereco?: string
  ativo: boolean
}

interface ParametroExtra {
  id: string
  label: string
  tipo: 'text' | 'number' | 'boolean' | 'select' | 'multiselect'
  opcoes?: string[]
}

interface TipoAcao {
  id: string
  nome: string
  setores_ids: string[]
  parametros_extras: ParametroExtra[]
}

interface TimeOption {
  hora: string
  minuto: string
  label: string
}

const STATUS_OPCOES = ['Pendente', 'Realizada', 'Realizada Parcialmente', 'Cancelada', 'Reagendada']

// Gerar opções de horário (06:00 às 21:00)
const timeOptions: TimeOption[] = []
for (let hora = 6; hora <= 21; hora++) {
  const horaStr = String(hora).padStart(2, '0')
  timeOptions.push({ hora: horaStr, minuto: '00', label: `${horaStr}:00` })
  timeOptions.push({ hora: horaStr, minuto: '30', label: `${horaStr}:30` })
}

// Funções de data
const formatarDataParaBanco = (dataLocal: string): string => {
  if (!dataLocal) return ''
  const [datePart, timePart] = dataLocal.split('T')
  if (!datePart || !timePart) return ''
  const [ano, mes, dia] = datePart.split('-')
  const [horas, minutos] = timePart.split(':')
  const dataLocalObj = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), parseInt(horas), parseInt(minutos))
  return dataLocalObj.toISOString()
}

const formatarDataParaExibicao = (dataUTC: string): string => {
  if (!dataUTC) return ''
  const dataObj = new Date(dataUTC)
  if (isNaN(dataObj.getTime())) return ''
  return `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}-${String(dataObj.getDate()).padStart(2, '0')}T${String(dataObj.getHours()).padStart(2, '0')}:${String(dataObj.getMinutes()).padStart(2, '0')}`
}

const formatarDataParaExibicaoLista = (dataUTC: string): string => {
  if (!dataUTC) return ''
  const dataObj = new Date(dataUTC)
  if (isNaN(dataObj.getTime())) return ''
  return dataObj.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Componente de input de data
const DateOnlyInput = ({ value, onChange, label, required = false }: { value: string, onChange: (value: string) => void, label: string, required?: boolean }) => {
  const [dateValue, setDateValue] = useState('')
  const [timeValue, setTimeValue] = useState('08:00')

  useEffect(() => {
    if (value) {
      const [datePart, timePart] = value.split('T')
      setDateValue(datePart || '')
      if (timePart) setTimeValue(timePart)
      else setTimeValue('08:00')
    } else {
      setDateValue('')
      setTimeValue('08:00')
    }
  }, [value])

  const handleDateChange = (date: string) => {
    setDateValue(date)
    if (date && timeValue) {
      onChange(`${date}T${timeValue}`)
    }
  }

  const handleTimeChange = (time: string) => {
    setTimeValue(time)
    if (dateValue && time) {
      onChange(`${dateValue}T${time}`)
    }
  }

  const openCalendar = () => {
    const dateInput = document.getElementById(`${label.replace(/\s/g, '')}-date-input`)
    if (dateInput) {
      (dateInput as HTMLInputElement).showPicker()
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-gray-700">
        {label} {required && '*'}
      </label>
      <div className="flex gap-2">
        <div 
          className="relative flex-1 cursor-pointer"
          onClick={openCalendar}
        >
          <input
            id={`${label.replace(/\s/g, '')}-date-input`}
            type="date"
            value={dateValue}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer bg-white"
          />
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500 pointer-events-none" size={18} />
        </div>
        <select
          value={timeValue}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
        >
          {timeOptions.map((option) => (
            <option key={option.label} value={option.label}>{option.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default function AcoesPage() {
  const supabase = createClient()
  const [acoes, setAcoes] = useState<Acao[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [tiposAcoes, setTiposAcoes] = useState<TipoAcao[]>([])
  const [locais, setLocais] = useState<Local[]>([])
  const [userPerfilId, setUserPerfilId] = useState<string | null>(null)
  const [userNome, setUserNome] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userSetoresIds, setUserSetoresIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [editandoAcao, setEditandoAcao] = useState<Acao | null>(null)
  const [formExpandido, setFormExpandido] = useState(true)
  const [setorSelecionado, setSetorSelecionado] = useState<string | null>(null)
  const [mostrarListaAcoes, setMostrarListaAcoes] = useState(false)
  const [mostrarCamposPersonalizados, setMostrarCamposPersonalizados] = useState(false)
  const [mostrarMaisAcoes, setMostrarMaisAcoes] = useState(false)
  const [acoesVisiveis, setAcoesVisiveis] = useState<Acao[]>([])
  
  // Form State
  const [descricao, setDescricao] = useState('')
  const [pessoas, setPessoas] = useState<string[]>([])
  const [setoresSelecionados, setSetoresSelecionados] = useState<string[]>([])
  const [tipoAcaoId, setTipoAcaoId] = useState('')
  const [local, setLocal] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [necessitaTransporte, setNecessitaTransporte] = useState(false)
  const [status, setStatus] = useState('Pendente')
  const [dadosExtras, setDadosExtras] = useState<Record<string, any>>({})
  const [observacoes, setObservacoes] = useState('')

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
    if (userPerfilId && userSetoresIds.length > 0) {
      fetchAcoes()
      carregarTodosUsuarios()
      if (userSetoresIds.length === 1 && !setorSelecionado) {
        const setorId = userSetoresIds[0]
        setSetorSelecionado(setorId)
        carregarPessoasDoSetor(setorId)
      }
    }
  }, [userPerfilId, userSetoresIds])

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

  const getCurrentUserPerfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      setUserEmail(user.email || '')
      
      const { data: perfil } = await supabase
        .from('perfis')
        .select('id, nome, email')
        .eq('email', user.email)
        .single()
      
      if (perfil) {
        setUserPerfilId(perfil.id)
        setUserNome(perfil.nome || perfil.email?.split('@')[0] || 'Usuário')
        
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

  const carregarPessoasDoSetor = async (setorId: string) => {
    const setor = setores.find(s => s.id === setorId)
    if (setor?.pessoas && setor.pessoas.length > 0) {
      const { data: perfis } = await supabase
        .from('perfis')
        .select('id, nome, email')
        .in('id', setor.pessoas)
      
      if (perfis && perfis.length > 0) {
        const nomes = perfis.map(p => p.nome?.trim() || p.email)
        setPessoas(nomes)
      } else {
        setPessoas([])
      }
    } else {
      setPessoas([])
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
    if (!userSetoresIds.length) return
    const { data } = await supabase
      .from('acoes')
      .select('*')
      .in('setor_id', userSetoresIds)
      .order('created_at', { ascending: false })
    
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

  const toggleSetor = async (setorId: string) => {
    const isSelected = setoresSelecionados.includes(setorId)
    const setor = setores.find(s => s.id === setorId)
    
    if (isSelected) {
      setSetoresSelecionados(prev => prev.filter(id => id !== setorId))
      if (setor && setor.pessoas && setor.pessoas.length > 0) {
        const { data: perfis } = await supabase
          .from('perfis')
          .select('nome, email')
          .in('id', setor.pessoas)
        if (perfis) {
          const nomesParaRemover = perfis.map(p => p.nome?.trim() || p.email)
          const usuarioResponsavel = usuarios.find(u => u.id === userPerfilId)
          const nomeResponsavel = usuarioResponsavel?.nome?.trim() || usuarioResponsavel?.email
          
          if (nomeResponsavel && nomesParaRemover.includes(nomeResponsavel)) {
            const nomesFiltrados = nomesParaRemover.filter(n => n !== nomeResponsavel)
            setPessoas(prev => prev.filter(p => !nomesFiltrados.includes(p)))
          } else {
            setPessoas(prev => prev.filter(p => !nomesParaRemover.includes(p)))
          }
        }
      }
    } else {
      setSetoresSelecionados(prev => [...prev, setorId])
      if (setor && setor.pessoas && setor.pessoas.length > 0) {
        const { data: perfis } = await supabase
          .from('perfis')
          .select('nome, email')
          .in('id', setor.pessoas)
        if (perfis) {
          const nomesParaAdicionar = perfis.map(p => p.nome?.trim() || p.email)
          setPessoas(prev => [...new Set([...prev, ...nomesParaAdicionar])])
        }
      }
    }
  }

  const togglePessoa = (nomePessoa: string) => {
    const usuarioResponsavel = usuarios.find(u => u.id === userPerfilId)
    const nomeResponsavel = usuarioResponsavel?.nome?.trim() || usuarioResponsavel?.email
    
    if (nomePessoa === nomeResponsavel) {
      alert("Você não pode remover a si mesmo das pessoas envolvidas!")
      return
    }
    
    const setorPrincipal = setores.find(s => s.id === setorSelecionado)
    if (!setorPrincipal) return
    
    const buscarNomes = async () => {
      if (setorPrincipal.pessoas && setorPrincipal.pessoas.length > 0) {
        const { data: perfis } = await supabase
          .from('perfis')
          .select('nome, email')
          .in('id', setorPrincipal.pessoas)
        
        if (perfis) {
          const nomesDoSetorPrincipal = perfis.map(p => p.nome?.trim() || p.email)
          
          const pessoasSelecionadasDoPrincipal = pessoas.filter(p => 
            nomesDoSetorPrincipal.includes(p) && p !== nomeResponsavel
          )
          
          if (nomesDoSetorPrincipal.includes(nomePessoa) && 
              pessoasSelecionadasDoPrincipal.length === 0 && 
              pessoas.includes(nomePessoa)) {
            alert("Não é possível remover todas as pessoas do setor responsável pela ação!")
            return
          }
          
          setPessoas(prev => prev.includes(nomePessoa) ? prev.filter(p => p !== nomePessoa) : [...prev, nomePessoa])
        }
      }
    }
    
    buscarNomes()
  }

  const resetForm = () => {
    setEditandoAcao(null)
    setDescricao('')
    setPessoas([])
    setSetoresSelecionados([])
    setTipoAcaoId('')
    setLocal('')
    setDataInicio('')
    setDataFim('')
    setNecessitaTransporte(false)
    setStatus('Pendente')
    setDadosExtras({})
    setObservacoes('')
    setMostrarCamposPersonalizados(false)
    if (userSetoresIds.length === 1) {
      const setorId = userSetoresIds[0]
      setSetorSelecionado(setorId)
      carregarPessoasDoSetor(setorId)
    }
  }

  const salvarAcao = async () => {
    if (!setorSelecionado) return alert("Selecione um setor")
    if (!tipoAcaoId) return alert("Selecione o Tipo de Ação")

    const usuarioResponsavel = usuarios.find(u => u.id === userPerfilId)
    const nomeResponsavel = usuarioResponsavel?.nome?.trim() || usuarioResponsavel?.email
    
    let pessoasFinal = [...pessoas]
    if (nomeResponsavel && !pessoasFinal.includes(nomeResponsavel)) {
      pessoasFinal.push(nomeResponsavel)
    }

    const dadosComuns = {
      descricao, 
      pessoas: pessoasFinal, 
      setores_envolvidos: setoresSelecionados, 
      tipo_acao_id: tipoAcaoId,
      setor_id: setorSelecionado, 
      local, 
      data_inicio: dataInicio ? formatarDataParaBanco(dataInicio) : null,
      data_fim: dataFim ? formatarDataParaBanco(dataFim) : null, 
      necessita_transporte: necessitaTransporte,
      status, 
      dados_extras: dadosExtras, 
      observacoes
    }

    if (editandoAcao) {
      await supabase.from('acoes').update({ 
        ...dadosComuns, 
        updated_at: new Date().toISOString(), 
        updated_by: userPerfilId 
      }).eq('id', editandoAcao.id)
    } else {
      await supabase.from('acoes').insert([{ 
        ...dadosComuns, 
        created_at: new Date().toISOString(), 
        created_by: userPerfilId, 
        updated_at: new Date().toISOString(), 
        updated_by: userPerfilId 
      }])
    }
    
    resetForm()
    fetchAcoes()
  }

  const deleteAcao = async (id: string) => {
    if (!confirm("Tem certeza?")) return
    await supabase.from('acoes').delete().eq('id', id)
    fetchAcoes()
  }

  const carregarParaEdicao = (acao: Acao) => {
    setEditandoAcao(acao)
    setDescricao(acao.descricao || '')
    setPessoas(acao.pessoas || [])
    setSetoresSelecionados(acao.setores_envolvidos || [])
    setTipoAcaoId(acao.tipo_acao_id || '')
    setLocal(acao.local || '')
    setDataInicio(formatarDataParaExibicao(acao.data_inicio || ''))
    setDataFim(formatarDataParaExibicao(acao.data_fim || ''))
    setNecessitaTransporte(acao.necessita_transporte || false)
    setStatus(acao.status || 'Pendente')
    setDadosExtras(acao.dados_extras || {})
    setObservacoes(acao.observacoes || '')
    setSetorSelecionado(acao.setor_id || null)
    setFormExpandido(true)
    setMostrarCamposPersonalizados(true)
    window.scrollTo({ top: 150, behavior: 'smooth' })
  }

  const tipoAcaoSelecionado = tiposAcoes.find(ta => ta.id === tipoAcaoId)
  const setoresDisponiveis = setores.filter(s => userSetoresIds.includes(s.id))
  const setoresEnvolvidosDisponiveis = setores.filter(s => userSetoresIds.includes(s.id) && s.id !== setorSelecionado)

  if (loading) return <LoadingSpinner />
  if (userSetoresIds.length === 0) return <SemSetor userPerfilId={userPerfilId} userNome={userNome} />

  const getNomeExibicao = (usuario: Usuario) => {
    return usuario.nome?.trim() || usuario.email
  }

  const usuarioResponsavel = usuarios.find(u => u.id === userPerfilId)
  const nomeResponsavel = usuarioResponsavel?.nome?.trim() || usuarioResponsavel?.email

  return (
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">{editandoAcao ? 'Editar Ação' : 'Nova Ação'}</h2>
              {editandoAcao && (
                <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">Cancelar edição</button>
              )}
            </div>

            <div className="space-y-4">
              {setoresDisponiveis.length > 1 && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-5 rounded-xl border-2 border-amber-200">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Setor Responsável</label>
                  <select
                    value={setorSelecionado || ''}
                    onChange={(e) => {
                      const novoSetorId = e.target.value
                      setSetorSelecionado(novoSetorId)
                      carregarPessoasDoSetor(novoSetorId)
                    }}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Selecione um setor</option>
                    {setoresDisponiveis.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                </div>
              )}

              {setorSelecionado && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Ação *</label>
                    <select
                      value={tipoAcaoId}
                      onChange={(e) => setTipoAcaoId(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Selecione</option>
                      {tiposAcoes.filter(ta => ta.setores_ids?.includes(setorSelecionado)).map(ta => (
                        <option key={ta.id} value={ta.id}>{ta.nome}</option>
                      ))}
                    </select>
                  </div>

                  <textarea 
                    placeholder="Descrição da ação..." 
                    value={descricao} 
                    onChange={(e) => setDescricao(e.target.value)} 
                    rows={3} 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500" 
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <select value={local} onChange={(e) => setLocal(e.target.value)} className="p-3 border rounded-lg">
                      <option value="">Local (Escola)</option>
                      {locais.map(local => <option key={local.id} value={local.nome}>{local.nome}</option>)}
                    </select>

                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="p-3 border rounded-lg">
                      {STATUS_OPCOES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <DateOnlyInput value={dataInicio} onChange={setDataInicio} label="Data de Início" />
                    
                    <DateOnlyInput value={dataFim} onChange={setDataFim} label="Data de Término (opcional)" />

                    <div className="flex items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={necessitaTransporte} onChange={(e) => setNecessitaTransporte(e.target.checked)} className="accent-purple-600" />
                        <Car size={20} className="text-purple-600" />
                        <span>Necessita Transporte</span>
                      </label>
                    </div>
                  </div>

                  {setoresEnvolvidosDisponiveis.length > 0 && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Setores Envolvidos</label>
                      <div className="flex flex-wrap gap-2">
                        {setoresEnvolvidosDisponiveis.map(setor => (
                          <button
                            key={setor.id}
                            onClick={() => toggleSetor(setor.id)}
                            className={`px-3 py-1.5 rounded-full text-sm transition ${
                              setoresSelecionados.includes(setor.id) ? "bg-purple-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                            }`}
                          >
                            {setor.nome}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Pessoas Envolvidas</label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                      {usuarios.length > 0 ? (
                        usuarios.map(user => {
                          const nomeExibicao = getNomeExibicao(user)
                          const isSelected = pessoas.includes(nomeExibicao)
                          const isResponsavel = nomeExibicao === nomeResponsavel
                          return (
                            <button
                              key={user.id}
                              onClick={() => togglePessoa(nomeExibicao)}
                              className={`px-3 py-1.5 rounded-full text-sm transition ${
                                isSelected 
                                  ? "bg-amber-400 text-purple-900 font-medium shadow-sm" 
                                  : "bg-white text-gray-700 border hover:bg-gray-100"
                              } ${isResponsavel ? "ring-2 ring-purple-500 ring-offset-1" : ""}`}
                              title={isResponsavel ? "Responsável pela ação (não pode ser removido)" : ""}
                            >
                              {nomeExibicao} {isResponsavel && "⭐"}
                            </button>
                          )
                        })
                      ) : (
                        <p className="text-gray-500 text-sm p-2">Nenhuma pessoa encontrada</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      ⭐ Você é o responsável e não pode ser removido. As pessoas do setor responsável já estão selecionadas automaticamente.
                    </p>
                  </div>

                  {tipoAcaoSelecionado && tipoAcaoSelecionado.parametros_extras && tipoAcaoSelecionado.parametros_extras.length > 0 && (
                    <div className="border-t pt-4">
                      <button
                        onClick={() => setMostrarCamposPersonalizados(!mostrarCamposPersonalizados)}
                        className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium mb-3"
                      >
                        {mostrarCamposPersonalizados ? <EyeOff size={18} /> : <EyeIcon size={18} />}
                        {mostrarCamposPersonalizados ? 'Ocultar' : 'Mostrar'} Campos Específicos
                      </button>
                      
                      {mostrarCamposPersonalizados && (
                        <div className="space-y-3">
                          {tipoAcaoSelecionado.parametros_extras.map(param => (
                            <div key={param.id}>
                              <label className="block text-sm font-medium text-gray-700 mb-1">{param.label}</label>
                              {renderizarCampoExtra(param, dadosExtras, setDadosExtras)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <textarea 
                    placeholder="Observações..." 
                    value={observacoes} 
                    onChange={(e) => setObservacoes(e.target.value)} 
                    rows={2} 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500" 
                  />

                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={salvarAcao} 
                      disabled={!tipoAcaoId} 
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition font-medium shadow-md disabled:opacity-50"
                    >
                      {editandoAcao ? 'Atualizar' : 'Criar'} Ação
                    </button>
                    <button onClick={resetForm} className="px-6 py-3 border rounded-lg hover:bg-gray-50 transition">Limpar</button>
                  </div>
                </>
              )}
            </div>
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
          <button onClick={() => onEdit(acao)} className="p-2 text-gray-500 hover:text-purple-600 rounded-lg transition" title="Editar">
            <Pencil size={18} />
          </button>
          <button onClick={() => onDelete(acao.id)} className="p-2 text-gray-500 hover:text-red-600 rounded-lg transition" title="Excluir">
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

const renderizarCampoExtra = (param: ParametroExtra, dadosExtras: any, setDadosExtras: any) => {
  const valor = dadosExtras[param.label] ?? ''
  const atualizar = (novoValor: any) => setDadosExtras((prev: any) => ({ ...prev, [param.label]: novoValor }))

  switch (param.tipo) {
    case 'text':
      return <input type="text" value={valor} onChange={(e) => atualizar(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
    case 'number':
      return <input type="number" value={valor} onChange={(e) => atualizar(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
    case 'boolean':
      return (
        <div className="flex gap-2">
          <button onClick={() => atualizar(true)} className={`px-4 py-2 rounded-lg border transition ${valor === true ? 'bg-purple-600 text-white' : 'bg-white hover:bg-gray-50'}`}>Sim</button>
          <button onClick={() => atualizar(false)} className={`px-4 py-2 rounded-lg border transition ${valor === false ? 'bg-amber-400 text-purple-900' : 'bg-white hover:bg-gray-50'}`}>Não</button>
        </div>
      )
    case 'select':
      return (
        <select value={valor} onChange={(e) => atualizar(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
          <option value="">Selecione...</option>
          {param.opcoes?.map(op => <option key={op} value={op}>{op}</option>)}
        </select>
      )
    default:
      return null
  }
}