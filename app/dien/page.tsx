'use client'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'
import { 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Building2, 
  Truck, 
  Star, 
  Package,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
  Clock,
  List,
  Settings,
  Eye,
  Search
} from 'lucide-react'

interface TipoAcao {
  id: string
  nome: string
  setores_ids: string[]
  parametros_extras: Array<{
    id: string
    label: string
    tipo: string
    opcoes?: string[]
  }>
}

interface ParametroExtraFiltro {
  label: string
  tipo: string
  opcoes: string[]
  tipoAcaoId: string
}

export default function DashboardPage() {
  const supabase = createClient()
  const [acoes, setAcoes] = useState<any[]>([])
  const [setores, setSetores] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [tiposAcoes, setTiposAcoes] = useState<TipoAcao[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  
  // Filtros básicos
  const [filterSetor, setFilterSetor] = useState<string>('todos')
  const [filterTipoAcao, setFilterTipoAcao] = useState<string>('todos')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [filterUsuario, setFilterUsuario] = useState<string>('todos')
  const [filterDataInicio, setFilterDataInicio] = useState<string>('')
  const [filterDataFim, setFilterDataFim] = useState<string>('')
  const [filterTransporte, setFilterTransporte] = useState<string>('todos')
  
  // Filtros de campos extras (dinâmicos e contextuais)
  const [filtrosExtras, setFiltrosExtras] = useState<Record<string, string>>({})
  
  // Para controlar a exibição
  const [mostrarFiltrosExtras, setMostrarFiltrosExtras] = useState(false)
  const [expandirGraficosExtras, setExpandirGraficosExtras] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      // Buscar ações
      const { data: acoesData } = await supabase
        .from('acoes')
        .select('*')
        .order('data_inicio', { ascending: true })
      
      setAcoes(acoesData || [])
      
      // Buscar setores
      const { data: setoresData } = await supabase
        .from('setores')
        .select('id, nome')
      
      setSetores(setoresData || [])
      
      // Buscar usuários
      const { data: perfisData } = await supabase
        .from('perfis')
        .select('id, nome')
      
      setUsuarios(perfisData || [])
      
      // Buscar tipos de ação
      const { data: tiposData } = await supabase
        .from('tipo_acao')
        .select('*')
      
      setTiposAcoes(tiposData || [])
      
      setLoading(false)
    }
    fetchData()
  }, [])

  // Tipos de ação disponíveis baseados no setor selecionado
  const tiposAcaoDisponiveis = useMemo(() => {
    if (filterSetor === 'todos') {
      return tiposAcoes
    }
    return tiposAcoes.filter(tipo => 
      tipo.setores_ids?.includes(filterSetor)
    )
  }, [tiposAcoes, filterSetor])

  // Parâmetros extras do tipo de ação selecionado
  const parametrosExtrasDoTipo = useMemo(() => {
    if (filterTipoAcao === 'todos') return []
    const tipoSelecionado = tiposAcoes.find(t => t.id === filterTipoAcao)
    return tipoSelecionado?.parametros_extras || []
  }, [filterTipoAcao, tiposAcoes])

  // Extrair valores disponíveis para cada campo extra baseado nas ações filtradas
  const valoresExtrasDisponiveis = useMemo(() => {
    const valoresMap: Record<string, Set<string>> = {}
    
    // Primeiro, filtrar ações pelo setor e tipo de ação selecionados
    let acoesBase = acoes
    
    if (filterSetor !== 'todos') {
      acoesBase = acoesBase.filter(a => a.setor_id === filterSetor)
    }
    
    if (filterTipoAcao !== 'todos') {
      acoesBase = acoesBase.filter(a => a.tipo_acao_id === filterTipoAcao)
    }
    
    // Extrair valores dos campos extras
    acoesBase.forEach(acao => {
      const extras = acao.dados_extras || {}
      Object.entries(extras).forEach(([key, value]) => {
        if (!valoresMap[key]) valoresMap[key] = new Set()
        
        if (Array.isArray(value)) {
          value.forEach(v => valoresMap[key].add(String(v)))
        } else if (value !== null && value !== undefined) {
          valoresMap[key].add(String(value))
        }
      })
    })
    
    // Converter Set para array ordenado
    const result: Record<string, string[]> = {}
    Object.entries(valoresMap).forEach(([key, set]) => {
      result[key] = Array.from(set).sort()
    })
    
    return result
  }, [acoes, filterSetor, filterTipoAcao])

  // Construir filtros extras disponíveis (apenas do tipo de ação selecionado)
  const filtrosExtrasDisponiveis = useMemo(() => {
    if (filterTipoAcao === 'todos') return []
    
    return parametrosExtrasDoTipo
      .filter(param => {
        // Só mostrar se tiver valores disponíveis nas ações
        const valores = valoresExtrasDisponiveis[param.label]
        return valores && valores.length > 0
      })
      .map(param => ({
        label: param.label,
        tipo: param.tipo,
        opcoes: valoresExtrasDisponiveis[param.label] || [],
        tipoAcaoId: filterTipoAcao
      }))
  }, [parametrosExtrasDoTipo, valoresExtrasDisponiveis, filterTipoAcao])

  // Filtrar ações
  const acoesFiltradas = useMemo(() => {
    let filtradas = acoes
    
    if (filterSetor !== 'todos') {
      filtradas = filtradas.filter(a => a.setor_id === filterSetor)
    }
    
    if (filterTipoAcao !== 'todos') {
      filtradas = filtradas.filter(a => a.tipo_acao_id === filterTipoAcao)
    }
    
    if (filterStatus !== 'todos') {
      filtradas = filtradas.filter(a => a.status === filterStatus)
    }
    
    if (filterUsuario !== 'todos') {
      filtradas = filtradas.filter(a => {
        const pessoas = a.pessoas || []
        const usuario = usuarios.find(u => u.id === filterUsuario)
        return pessoas.includes(usuario?.nome)
      })
    }
    
    if (filterTransporte !== 'todos') {
      const necessita = filterTransporte === 'sim'
      filtradas = filtradas.filter(a => a.necessita_transporte === necessita)
    }
    
    if (filterDataInicio) {
      filtradas = filtradas.filter(a => {
        if (!a.data_inicio) return false
        return new Date(a.data_inicio) >= new Date(filterDataInicio)
      })
    }
    
    if (filterDataFim) {
      filtradas = filtradas.filter(a => {
        if (!a.data_fim) return false
        return new Date(a.data_fim) <= new Date(filterDataFim)
      })
    }
    
    // Filtros de campos extras
    Object.entries(filtrosExtras).forEach(([campo, valor]) => {
      if (valor && valor !== 'todos') {
        filtradas = filtradas.filter(a => {
          const extras = a.dados_extras || {}
          const valorExtras = extras[campo]
          
          if (valorExtras === undefined || valorExtras === null) return false
          
          if (Array.isArray(valorExtras)) {
            return valorExtras.some(v => String(v) === valor)
          }
          
          return String(valorExtras) === valor
        })
      }
    })
    
    return filtradas
  }, [acoes, filterSetor, filterTipoAcao, filterStatus, filterUsuario, filterTransporte, filterDataInicio, filterDataFim, usuarios, filtrosExtras])

  // Limpar todos os filtros
  const limparFiltros = () => {
    setFilterSetor('todos')
    setFilterTipoAcao('todos')
    setFilterStatus('todos')
    setFilterUsuario('todos')
    setFilterTransporte('todos')
    setFilterDataInicio('')
    setFilterDataFim('')
    setFiltrosExtras({})
  }

  // Limpar filtros extras
  const limparFiltrosExtras = () => {
    setFiltrosExtras({})
  }

  // Resetar tipo de ação quando setor mudar
  const handleSetorChange = (setorId: string) => {
    setFilterSetor(setorId)
    setFilterTipoAcao('todos')
    setFiltrosExtras({})
  }

  // Resetar filtros extras quando tipo de ação mudar
  const handleTipoAcaoChange = (tipoId: string) => {
    setFilterTipoAcao(tipoId)
    setFiltrosExtras({})
  }

  // Verificar se há filtros ativos
  const temFiltrosAtivos = filterSetor !== 'todos' || filterTipoAcao !== 'todos' || filterStatus !== 'todos' || 
                           filterUsuario !== 'todos' || filterTransporte !== 'todos' || filterDataInicio || filterDataFim ||
                           Object.keys(filtrosExtras).length > 0

  // Função para determinar o turno
  const determinarTurno = (dataHora: string | undefined): 'Manhã' | 'Tarde' | 'Noite' => {
    if (!dataHora) return 'Manhã'
    
    const data = new Date(dataHora)
    const hora = data.getHours()
    
    if (hora >= 5 && hora < 12) return 'Manhã'
    if (hora >= 12 && hora < 18) return 'Tarde'
    return 'Noite'
  }

  // Dados para o Cronograma
  const diasCalendario = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const data = new Date()
      data.setDate(data.getDate() + i)
      return data
    })
  }, [])

  const turnos = ['Manhã', 'Tarde', 'Noite']

  const acoesComTransporte = useMemo(() => {
    return acoesFiltradas.filter(a => a.necessita_transporte === true)
  }, [acoesFiltradas])

  const transportePorDiaTurno = useMemo(() => {
    const mapa: Record<string, any[]> = {}
    
    acoesComTransporte.forEach(acao => {
      if (!acao.data_inicio) return
      
      const data = new Date(acao.data_inicio)
      const dataKey = data.toDateString()
      const turno = determinarTurno(acao.data_inicio)
      const key = `${dataKey}_${turno}`
      
      if (!mapa[key]) {
        mapa[key] = []
      }
      
      mapa[key].push({
        id: acao.id,
        nome: acao.nome,
        local: acao.local,
        pessoas: acao.pessoas || [],
        horario: acao.data_inicio ? new Date(acao.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
      })
    })
    
    Object.keys(mapa).forEach(key => {
      mapa[key].sort((a, b) => {
        if (!a.horario) return 1
        if (!b.horario) return -1
        return a.horario.localeCompare(b.horario)
      })
    })
    
    return mapa
  }, [acoesComTransporte])

  // --- GRÁFICOS ---
  
  const dadosStatus = useMemo(() => {
    const statusMap: Record<string, { name: string, value: number, color: string }> = {
      'Pendente': { name: 'Pendente', value: 0, color: '#facc15' },
      'Realizada': { name: 'Realizada', value: 0, color: '#22c55e' },
      'Realizada Parcialmente': { name: 'Parcial', value: 0, color: '#3b82f6' },
      'Cancelada': { name: 'Cancelada', value: 0, color: '#ef4444' },
      'Reagendada': { name: 'Reagendada', value: 0, color: '#a855f7' }
    }
    
    acoesFiltradas.forEach(acao => {
      const status = acao.status || 'Pendente'
      if (statusMap[status]) {
        statusMap[status].value++
      }
    })
    
    return Object.values(statusMap).filter(d => d.value > 0)
  }, [acoesFiltradas])

  const dadosPorSetor = useMemo(() => {
    const setorMap: Record<string, { nome: string, total: number, realizadas: number, pendentes: number }> = {}
    
    acoesFiltradas.forEach(acao => {
      if (!setorMap[acao.setor_id]) {
        const setor = setores.find(s => s.id === acao.setor_id)
        setorMap[acao.setor_id] = {
          nome: setor?.nome || 'Sem setor',
          total: 0,
          realizadas: 0,
          pendentes: 0
        }
      }
      
      setorMap[acao.setor_id].total++
      
      if (acao.status === 'Realizada' || acao.status === 'Realizada Parcialmente') {
        setorMap[acao.setor_id].realizadas++
      } else if (acao.status === 'Pendente' || acao.status === 'Reagendada') {
        setorMap[acao.setor_id].pendentes++
      }
    })
    
    return Object.values(setorMap).sort((a, b) => b.total - a.total)
  }, [acoesFiltradas, setores])

  const dadosPorTipoAcao = useMemo(() => {
    const tipoCount: Record<string, number> = {}
    
    acoesFiltradas.forEach(acao => {
      const tipo = tiposAcoes.find(t => t.id === acao.tipo_acao_id)
      const nome = tipo?.nome || 'Sem tipo'
      tipoCount[nome] = (tipoCount[nome] || 0) + 1
    })
    
    return Object.entries(tipoCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [acoesFiltradas, tiposAcoes])

  const dadosPorTurno = useMemo(() => {
    const turnoCount: Record<'Manhã' | 'Tarde' | 'Noite', number> = { 
      Manhã: 0, 
      Tarde: 0, 
      Noite: 0 
    }
    
    acoesFiltradas.forEach(acao => {
      if (acao.data_inicio) {
        const turno = determinarTurno(acao.data_inicio)
        turnoCount[turno]++
      }
    })
    
    return Object.entries(turnoCount)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }))
  }, [acoesFiltradas])

  const dadosMensais = useMemo(() => {
    const meses: Record<string, { mes: string, total: number, realizadas: number }> = {}
    
    acoesFiltradas.forEach(acao => {
      const data = new Date(acao.created_at)
      const mesKey = `${data.getFullYear()}-${data.getMonth() + 1}`
      const mesNome = data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      
      if (!meses[mesKey]) {
        meses[mesKey] = { mes: mesNome, total: 0, realizadas: 0 }
      }
      
      meses[mesKey].total++
      
      if (acao.status === 'Realizada' || acao.status === 'Realizada Parcialmente') {
        meses[mesKey].realizadas++
      }
    })
    
    return Object.values(meses).sort((a, b) => {
      const dateA = new Date(a.mes)
      const dateB = new Date(b.mes)
      return dateA.getTime() - dateB.getTime()
    })
  }, [acoesFiltradas])

  const dadosParticipantes = useMemo(() => {
    const participanteCount: Record<string, number> = {}
    
    acoesFiltradas.forEach(acao => {
      const participantes = acao.pessoas || []
      participantes.forEach((pessoa: string) => {
        participanteCount[pessoa] = (participanteCount[pessoa] || 0) + 1
      })
    })
    
    return Object.entries(participanteCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [acoesFiltradas])

  // Gráficos dinâmicos para campos extras do tipo selecionado
  const graficosExtras = useMemo(() => {
    if (filterTipoAcao === 'todos') return []
    
    const graficos: Array<{ label: string, tipo: string, data: Array<{ name: string, value: number }> }> = []
    
    parametrosExtrasDoTipo.forEach(param => {
      const contagem: Record<string, number> = {}
      
      acoesFiltradas.forEach(acao => {
        const extras = acao.dados_extras || {}
        const valor = extras[param.label]
        
        if (valor !== undefined && valor !== null) {
          if (Array.isArray(valor)) {
            valor.forEach(v => {
              const chave = String(v)
              contagem[chave] = (contagem[chave] || 0) + 1
            })
          } else {
            const chave = String(valor)
            contagem[chave] = (contagem[chave] || 0) + 1
          }
        }
      })
      
      const data = Object.entries(contagem)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
      
      if (data.length > 0) {
        graficos.push({
          label: param.label,
          tipo: param.tipo,
          data: data.slice(0, 8)
        })
      }
    })
    
    return graficos
  }, [acoesFiltradas, parametrosExtrasDoTipo, filterTipoAcao])

  const COLORS = ['#7114dd', '#a94dff', '#ffa301', '#24cffd', '#22c55e', '#ef4444', '#facc15', '#3b82f6']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7114dd] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard de Ações</h1>
          <p className="text-gray-500 text-sm mt-1">Visão geral das atividades e análise por parâmetros</p>
        </div>
        
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <Filter size={18} className="text-gray-500" />
          <span className="text-sm font-medium">Filtros</span>
          {temFiltrosAtivos && (
            <span className="w-2 h-2 bg-[#7114dd] rounded-full"></span>
          )}
          {mostrarFiltros ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Painel de Filtros */}
      {mostrarFiltros && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Filtros Avançados</h3>
            {temFiltrosAtivos && (
              <button
                onClick={limparFiltros}
                className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <X size={14} /> Limpar todos os filtros
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Setor - Principal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building2 size={14} className="inline mr-1" />
                Setor *
              </label>
              <select
                value={filterSetor}
                onChange={(e) => handleSetorChange(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
              >
                <option value="todos">Todos os setores</option>
                {setores.map(setor => (
                  <option key={setor.id} value={setor.id}>{setor.nome}</option>
                ))}
              </select>
            </div>
            
            {/* Tipo de Ação - Depende do Setor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <List size={14} className="inline mr-1" />
                Tipo de Ação *
              </label>
              <select
                value={filterTipoAcao}
                onChange={(e) => handleTipoAcaoChange(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
                disabled={filterSetor === 'todos'}
              >
                <option value="todos">
                  {filterSetor === 'todos' ? 'Selecione um setor primeiro' : 'Todos os tipos'}
                </option>
                {tiposAcaoDisponiveis.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
                ))}
              </select>
              {filterSetor === 'todos' && (
                <p className="text-xs text-amber-600 mt-1">Selecione um setor para ver os tipos de ação</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
              >
                <option value="todos">Todos os status</option>
                <option value="Pendente">Pendente</option>
                <option value="Realizada">Realizada</option>
                <option value="Realizada Parcialmente">Realizada Parcialmente</option>
                <option value="Cancelada">Cancelada</option>
                <option value="Reagendada">Reagendada</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
              <select
                value={filterUsuario}
                onChange={(e) => setFilterUsuario(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
              >
                <option value="todos">Todos os responsáveis</option>
                {usuarios.map(usuario => (
                  <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Necessita Transporte</label>
              <select
                value={filterTransporte}
                onChange={(e) => setFilterTransporte(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
              >
                <option value="todos">Todos</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início (após)</label>
              <input
                type="date"
                value={filterDataInicio}
                onChange={(e) => setFilterDataInicio(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim (antes)</label>
              <input
                type="date"
                value={filterDataFim}
                onChange={(e) => setFilterDataFim(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
              />
            </div>
          </div>

          {/* Filtros de Campos Extras - SÓ APARECEM APÓS ESCOLHER SETOR E TIPO DE AÇÃO */}
          {filterSetor !== 'todos' && filterTipoAcao !== 'todos' && filtrosExtrasDisponiveis.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setMostrarFiltrosExtras(!mostrarFiltrosExtras)}
                className="flex items-center gap-2 text-sm font-medium text-[#7114dd] hover:text-[#a94dff] transition"
              >
                <Settings size={14} />
                Filtros por Campos Específicos da Ação
                {mostrarFiltrosExtras ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {Object.keys(filtrosExtras).length > 0 && (
                  <span className="ml-2 text-xs bg-[#7114dd] text-white px-2 py-0.5 rounded-full">
                    {Object.keys(filtrosExtras).length}
                  </span>
                )}
              </button>
              
              {mostrarFiltrosExtras && (
                <div className="mt-3">
                  {Object.keys(filtrosExtras).length > 0 && (
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={limparFiltrosExtras}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                      >
                        <X size={12} /> Limpar filtros extras
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtrosExtrasDisponiveis.map(campo => (
                      <div key={campo.label}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {campo.label}
                          {campo.tipo === 'boolean' && (
                            <span className="ml-1 text-xs text-gray-400">(Sim/Não)</span>
                          )}
                        </label>
                        <select
                          value={filtrosExtras[campo.label] || 'todos'}
                          onChange={(e) => {
                            const valor = e.target.value
                            if (valor === 'todos') {
                              const novosFiltros = { ...filtrosExtras }
                              delete novosFiltros[campo.label]
                              setFiltrosExtras(novosFiltros)
                            } else {
                              setFiltrosExtras({
                                ...filtrosExtras,
                                [campo.label]: valor
                              })
                            }
                          }}
                          className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
                        >
                          <option value="todos">Todos</option>
                          {campo.opcoes.map(opcao => (
                            <option key={opcao} value={opcao}>
                              {campo.tipo === 'boolean' ? (opcao === 'true' ? 'Sim' : 'Não') : opcao}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mensagem quando tipo de ação não tem campos extras */}
          {filterSetor !== 'todos' && filterTipoAcao !== 'todos' && parametrosExtrasDoTipo.length === 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">
                  Este tipo de ação não possui campos personalizados para filtrar.
                </p>
              </div>
            </div>
          )}

          {/* Mensagem quando não selecionou tipo de ação */}
          {filterSetor !== 'todos' && filterTipoAcao === 'todos' && (
            <div className="mt-4 pt-4 border-t">
              <div className="p-3 bg-amber-50 rounded-lg text-center border border-amber-200">
                <p className="text-sm text-amber-700">
                  ⚠️ Selecione um tipo de ação para visualizar filtros específicos.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cards Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#7114dd]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total de Ações</p>
              <p className="text-3xl font-bold text-gray-800">{acoesFiltradas.length}</p>
            </div>
            <Calendar size={32} className="text-[#7114dd] opacity-50" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Ações Realizadas</p>
              <p className="text-3xl font-bold text-green-600">
                {acoesFiltradas.filter(a => a.status === 'Realizada' || a.status === 'Realizada Parcialmente').length}
              </p>
            </div>
            <CheckCircle size={32} className="text-green-500 opacity-50" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Ações Pendentes</p>
              <p className="text-3xl font-bold text-yellow-600">
                {acoesFiltradas.filter(a => a.status === 'Pendente' || a.status === 'Reagendada').length}
              </p>
            </div>
            <AlertCircle size={32} className="text-yellow-500 opacity-50" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Ações com Transporte</p>
              <p className="text-3xl font-bold text-blue-600">
                {acoesFiltradas.filter(a => a.necessita_transporte === true).length}
              </p>
            </div>
            <Truck size={32} className="text-blue-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* CRONOGRAMA DE TRANSPORTE */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-linear-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Truck size={20} className="text-blue-600" />
                Cronograma de Transporte (Próximos 14 dias)
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Distribuição baseada no horário de início da ação
              </p>
            </div>
            <div className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
              {acoesComTransporte.length} ação(ões) programada(s)
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <div className="min-w-200">
            <div className="grid grid-cols-[100px_repeat(14,1fr)] bg-gray-50 border-b">
              <div className="p-3 font-bold text-xs text-gray-500">Turno</div>
              {diasCalendario.map((dia, idx) => (
                <div key={idx} className="p-3 text-center border-l border-gray-200">
                  <p className="text-[10px] uppercase font-bold text-blue-600">
                    {dia.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </p>
                  <p className="text-sm font-bold">{dia.getDate()}/{dia.getMonth() + 1}</p>
                </div>
              ))}
            </div>

            {turnos.map((turno) => (
              <div key={turno} className="grid grid-cols-[100px_repeat(14,1fr)] border-b last:border-0 hover:bg-gray-50 transition">
                <div className="p-4 flex items-center font-medium text-sm text-gray-600 bg-gray-50">
                  <Clock size={14} className="mr-2 text-gray-400" />
                  {turno}
                </div>
                {diasCalendario.map((dia, idx) => {
                  const dataKey = dia.toDateString()
                  const key = `${dataKey}_${turno}`
                  const acoesNoTurno = transportePorDiaTurno[key] || []
                  
                  return (
                    <div key={idx} className="p-2 border-l border-gray-100 min-h-20 hover:bg-blue-50/30 transition-colors">
                      {acoesNoTurno.map((acao, acaoIdx) => (
                        <div key={acaoIdx} className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-1 text-xs">
                          <p className="font-bold text-blue-700 truncate flex items-center gap-1">
                            {acao.nome}
                            {acao.horario && (
                              <span className="text-[9px] text-blue-500 font-normal">({acao.horario})</span>
                            )}
                          </p>
                          {acao.local && (
                            <p className="text-[10px] text-gray-600 flex items-center gap-1 mt-1">
                              <MapPin size={10} /> {acao.local}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        
        {acoesComTransporte.length === 0 && (
          <div className="p-8 text-center">
            <Truck size={40} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Nenhuma ação com transporte programada para os próximos 14 dias</p>
          </div>
        )}
      </div>

      {/* GRÁFICOS PRINCIPAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-[#7114dd]" />
            Status das Ações
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie 
                data={dadosStatus} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={100}
                label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {dadosStatus.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {dadosPorTurno.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-[#ffa301]" />
              Ações por Turno
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={dadosPorTurno} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={100}
                  label
                >
                  {dadosPorTurno.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {dadosPorTipoAcao.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <List size={20} className="text-[#24cffd]" />
              Ações por Tipo
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosPorTipoAcao} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#24cffd" name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {dadosPorSetor.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 size={20} className="text-[#7114dd]" />
              Ações por Setor
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosPorSetor} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="nome" />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#7114dd" name="Total" />
                <Bar dataKey="realizadas" fill="#22c55e" name="Realizadas" />
                <Bar dataKey="pendentes" fill="#facc15" name="Pendentes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {dadosMensais.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-[#a94dff]" />
              Tendência Mensal
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosMensais}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#7114dd" name="Total de Ações" strokeWidth={2} />
                <Line type="monotone" dataKey="realizadas" stroke="#22c55e" name="Ações Realizadas" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {dadosParticipantes.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={20} className="text-[#ffa301]" />
              Top 10 Participantes
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosParticipantes} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#ffa301" name="Quantidade de Ações" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* GRÁFICOS DOS CAMPOS EXTRAS - SÓ APARECEM APÓS ESCOLHER TIPO DE AÇÃO */}
      {filterTipoAcao !== 'todos' && graficosExtras.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setExpandirGraficosExtras(!expandirGraficosExtras)}
            className="w-full flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-all mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#7114dd]/10 rounded-full flex items-center justify-center">
                <Eye size={20} className="text-[#7114dd]" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">Análise por Campos Específicos</h3>
                <p className="text-sm text-gray-500">
                  {graficosExtras.length} {graficosExtras.length === 1 ? 'parâmetro' : 'parâmetros'} disponíveis para análise
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[#7114dd]">
              <span className="text-sm font-medium">
                {expandirGraficosExtras ? 'Ocultar' : 'Visualizar'}
              </span>
              {expandirGraficosExtras ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>

          {expandirGraficosExtras && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {graficosExtras.map((grafico, idx) => (
                <div key={grafico.label} className="bg-white p-6 rounded-xl shadow-sm border">
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Package size={20} className="text-[#24cffd]" />
                    {grafico.label}
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart 
                      data={grafico.data} 
                      layout={grafico.data.length > 5 ? "vertical" : "horizontal"}
                      margin={{ left: grafico.data.length > 5 ? 100 : 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      {grafico.data.length > 5 ? (
                        <>
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={100} />
                        </>
                      ) : (
                        <>
                          <XAxis dataKey="name" />
                          <YAxis type="number" />
                        </>
                      )}
                      <Tooltip />
                      <Bar dataKey="value" fill={COLORS[idx % COLORS.length]} name="Quantidade" />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Total: {grafico.data.reduce((sum, d) => sum + d.value, 0)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {acoesFiltradas.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Nenhuma ação encontrada para os filtros selecionados.</p>
          <p className="text-gray-400 text-sm mt-2">Ajuste os filtros ou crie novas ações para visualizar os dados.</p>
        </div>
      )}
    </div>
  )
}