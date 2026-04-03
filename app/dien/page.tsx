'use client'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useMemo, useRef } from 'react'
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
  Search,
  Car,
  Printer,
  Download,
  FileText,
  PlusCircle,
  MinusCircle
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

export default function DashboardPage() {
  const supabase = createClient()
  const printRef = useRef<HTMLDivElement>(null)
  const [acoes, setAcoes] = useState<any[]>([])
  const [setores, setSetores] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [tiposAcoes, setTiposAcoes] = useState<TipoAcao[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [mostrarImpressao, setMostrarImpressao] = useState(false)
  
  // Filtros de impressão
  const [tipoRelatorio, setTipoRelatorio] = useState<'todas' | 'porSetor' | 'porAcao' | 'porSetorEAcao'>('todas')
  const [setorRelatorio, setSetorRelatorio] = useState<string>('')
  const [tipoAcaoRelatorio, setTipoAcaoRelatorio] = useState<string>('')
  
  // Filtro de período independente
  const [incluirPeriodo, setIncluirPeriodo] = useState(false)
  const [dataInicioRelatorio, setDataInicioRelatorio] = useState<string>('')
  const [dataFimRelatorio, setDataFimRelatorio] = useState<string>('')
  
  // Campos opcionais para impressão
  const [incluirDescricao, setIncluirDescricao] = useState(false)
  const [incluirObservacoes, setIncluirObservacoes] = useState(false)
  
  // Estado para navegação do calendário semanal
  const [semanaInicio, setSemanaInicio] = useState(() => {
    const hoje = new Date()
    const diaSemana = hoje.getDay()
    const inicio = new Date(hoje)
    inicio.setDate(hoje.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1))
    inicio.setHours(0, 0, 0, 0)
    return inicio
  })
  
  // Filtros básicos
  const [filterSetor, setFilterSetor] = useState<string>('todos')
  const [filterTipoAcao, setFilterTipoAcao] = useState<string>('todos')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [filterUsuario, setFilterUsuario] = useState<string>('todos')
  const [filterDataInicio, setFilterDataInicio] = useState<string>('')
  const [filterDataFim, setFilterDataFim] = useState<string>('')
  const [filterTransporte, setFilterTransporte] = useState<string>('todos')
  
  // Filtros de campos extras
  const [filtrosExtras, setFiltrosExtras] = useState<Record<string, string>>({})
  
  // Para controlar a exibição
  const [mostrarFiltrosExtras, setMostrarFiltrosExtras] = useState(false)
  const [expandirGraficosExtras, setExpandirGraficosExtras] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      const { data: acoesData } = await supabase
        .from('acoes')
        .select('*')
        .order('data_inicio', { ascending: true })
      
      setAcoes(acoesData || [])
      
      const { data: setoresData } = await supabase
        .from('setores')
        .select('id, nome')
      
      setSetores(setoresData || [])
      
      const { data: perfisData } = await supabase
        .from('perfis')
        .select('id, nome')
      
      setUsuarios(perfisData || [])
      
      const { data: tiposData } = await supabase
        .from('tipo_acao')
        .select('*')
      
      setTiposAcoes(tiposData || [])
      
      setLoading(false)
    }
    fetchData()
  }, [])

  // Gerar dias da semana atual (segunda a domingo)
  const diasDaSemana = useMemo(() => {
    const dias = []
    for (let i = 0; i < 7; i++) {
      const dia = new Date(semanaInicio)
      dia.setDate(semanaInicio.getDate() + i)
      dias.push(dia)
    }
    return dias
  }, [semanaInicio])

  // Navegação da semana
  const semanaAnterior = () => {
    const novaData = new Date(semanaInicio)
    novaData.setDate(semanaInicio.getDate() - 7)
    setSemanaInicio(novaData)
  }

  const proximaSemana = () => {
    const novaData = new Date(semanaInicio)
    novaData.setDate(semanaInicio.getDate() + 7)
    setSemanaInicio(novaData)
  }

  const semanaAtual = () => {
    const hoje = new Date()
    const diaSemana = hoje.getDay()
    const inicio = new Date(hoje)
    inicio.setDate(hoje.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1))
    inicio.setHours(0, 0, 0, 0)
    setSemanaInicio(inicio)
  }

  const mesAnterior = () => {
    const novaData = new Date(semanaInicio)
    novaData.setMonth(semanaInicio.getMonth() - 1)
    setSemanaInicio(novaData)
  }

  const proximoMes = () => {
    const novaData = new Date(semanaInicio)
    novaData.setMonth(semanaInicio.getMonth() + 1)
    setSemanaInicio(novaData)
  }

  // Função para determinar o turno
  const determinarTurno = (dataHora: string | undefined): 'Manhã' | 'Tarde' | 'Noite' => {
    if (!dataHora) return 'Manhã'
    const data = new Date(dataHora)
    const hora = data.getHours()
    if (hora >= 5 && hora < 12) return 'Manhã'
    if (hora >= 12 && hora < 18) return 'Tarde'
    return 'Noite'
  }

  const turnos = ['Manhã', 'Tarde', 'Noite']

  // Tipos de ação disponíveis
  const tiposAcaoDisponiveis = useMemo(() => {
    if (filterSetor === 'todos') return tiposAcoes
    return tiposAcoes.filter(tipo => tipo.setores_ids?.includes(filterSetor))
  }, [tiposAcoes, filterSetor])

  // Parâmetros extras do tipo de ação selecionado
  const parametrosExtrasDoTipo = useMemo(() => {
    if (filterTipoAcao === 'todos') return []
    const tipoSelecionado = tiposAcoes.find(t => t.id === filterTipoAcao)
    return tipoSelecionado?.parametros_extras || []
  }, [filterTipoAcao, tiposAcoes])

  // Extrair valores disponíveis para cada campo extra
  const valoresExtrasDisponiveis = useMemo(() => {
    const valoresMap: Record<string, Set<string>> = {}
    let acoesBase = acoes
    
    if (filterSetor !== 'todos') {
      acoesBase = acoesBase.filter(a => a.setor_id === filterSetor)
    }
    if (filterTipoAcao !== 'todos') {
      acoesBase = acoesBase.filter(a => a.tipo_acao_id === filterTipoAcao)
    }
    
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
    
    const result: Record<string, string[]> = {}
    Object.entries(valoresMap).forEach(([key, set]) => {
      result[key] = Array.from(set).sort()
    })
    return result
  }, [acoes, filterSetor, filterTipoAcao])

  // Filtros extras disponíveis
  const filtrosExtrasDisponiveis = useMemo(() => {
    if (filterTipoAcao === 'todos') return []
    return parametrosExtrasDoTipo
      .filter(param => {
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

  // Ações com transporte
  const acoesComTransporte = useMemo(() => {
    return acoesFiltradas.filter(a => a.necessita_transporte === true)
  }, [acoesFiltradas])

  // Mapa de ações por dia e turno para o calendário semanal
  const acoesPorDiaTurno = useMemo(() => {
    const mapa: Record<string, any[]> = {}
    
    acoesFiltradas.forEach(acao => {
      if (!acao.data_inicio) return
      const data = new Date(acao.data_inicio)
      const dataKey = data.toDateString()
      const turno = determinarTurno(acao.data_inicio)
      const key = `${dataKey}_${turno}`
      
      if (!mapa[key]) mapa[key] = []
      
      mapa[key].push({
        id: acao.id,
        status: acao.status || 'Pendente',
        local: acao.local,
        pessoas: acao.pessoas || [],
        horario: new Date(acao.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        setor_id: acao.setor_id,
        created_by: acao.created_by,
        necessita_transporte: acao.necessita_transporte,
        descricao: acao.descricao,
        tipo_acao_id: acao.tipo_acao_id
      })
    })
    
    Object.keys(mapa).forEach(key => {
      mapa[key].sort((a, b) => a.horario.localeCompare(b.horario))
    })
    
    return mapa
  }, [acoesFiltradas])

  // Dados para relatório de impressão
  const dadosParaRelatorio = useMemo(() => {
    let dados = [...acoesFiltradas]
    
    if (tipoRelatorio === 'porSetor' && setorRelatorio) {
      dados = dados.filter(a => a.setor_id === setorRelatorio)
    } else if (tipoRelatorio === 'porAcao' && tipoAcaoRelatorio) {
      dados = dados.filter(a => a.tipo_acao_id === tipoAcaoRelatorio)
    } else if (tipoRelatorio === 'porSetorEAcao' && setorRelatorio && tipoAcaoRelatorio) {
      dados = dados.filter(a => a.setor_id === setorRelatorio && a.tipo_acao_id === tipoAcaoRelatorio)
    }
    
    // Aplicar filtro de período se estiver ativo
    if (incluirPeriodo && dataInicioRelatorio && dataFimRelatorio) {
      dados = dados.filter(a => {
        if (!a.data_inicio) return false
        const dataAcao = new Date(a.data_inicio)
        return dataAcao >= new Date(dataInicioRelatorio) && dataAcao <= new Date(dataFimRelatorio)
      })
    }
    
    return dados
  }, [acoesFiltradas, tipoRelatorio, setorRelatorio, tipoAcaoRelatorio, incluirPeriodo, dataInicioRelatorio, dataFimRelatorio])

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

  const limparFiltrosExtras = () => setFiltrosExtras({})

  const limparFiltrosRelatorio = () => {
    setTipoRelatorio('todas')
    setSetorRelatorio('')
    setTipoAcaoRelatorio('')
    setIncluirPeriodo(false)
    setDataInicioRelatorio('')
    setDataFimRelatorio('')
    setIncluirDescricao(false)
    setIncluirObservacoes(false)
  }

  const handleSetorChange = (setorId: string) => {
    setFilterSetor(setorId)
    setFilterTipoAcao('todos')
    setFiltrosExtras({})
  }

  const handleTipoAcaoChange = (tipoId: string) => {
    setFilterTipoAcao(tipoId)
    setFiltrosExtras({})
  }

  const temFiltrosAtivos = filterSetor !== 'todos' || filterTipoAcao !== 'todos' || filterStatus !== 'todos' || 
                           filterUsuario !== 'todos' || filterTransporte !== 'todos' || filterDataInicio || filterDataFim ||
                           Object.keys(filtrosExtras).length > 0

  // Função para imprimir
  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return
    
    const originalTitle = document.title
    const tipoAcaoNome = tipoAcaoRelatorio ? tiposAcoes.find(t => t.id === tipoAcaoRelatorio)?.nome : ''
    const setorNome = setorRelatorio ? setores.find(s => s.id === setorRelatorio)?.nome : ''
    
    document.title = `Relatório de Ações - ${new Date().toLocaleDateString('pt-BR')}`
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Relatório de Ações</title>
            <meta charset="utf-8" />
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                color: #333;
                font-size: 12px;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #7114dd;
                padding-bottom: 10px;
              }
              .header h1 {
                color: #7114dd;
                margin: 0;
                font-size: 18px;
              }
              .header p {
                margin: 5px 0;
                color: #666;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
                vertical-align: top;
              }
              th {
                background-color: #7114dd;
                color: white;
                font-weight: bold;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 10px;
                border-top: 1px solid #ddd;
                font-size: 10px;
                color: #999;
              }
              .descricao-cell, .observacoes-cell {
                max-width: 300px;
                white-space: pre-wrap;
                word-wrap: break-word;
              }
              @media print {
                body {
                  margin: 0;
                  padding: 10px;
                }
                .no-print {
                  display: none;
                }
                th, td {
                  padding: 4px;
                }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
    
    document.title = originalTitle
    setMostrarImpressao(false)
  }

  // Função para exportar CSV
  const handleExportCSV = () => {
    const dados = dadosParaRelatorio
    
    // Definir cabeçalhos baseados nos campos selecionados
    const headers = ['#', 'Tipo de Ação', 'Setor', 'Status', 'Local', 'Data']
    if (incluirDescricao) headers.push('Descrição')
    if (incluirObservacoes) headers.push('Observações')
    
    const csvRows = [headers.join(',')]
    
    dados.forEach((acao, index) => {
      const tipo = tiposAcoes.find(t => t.id === acao.tipo_acao_id)?.nome || 'N/A'
      const setor = setores.find(s => s.id === acao.setor_id)?.nome || 'N/A'
      const dataInicio = acao.data_inicio ? new Date(acao.data_inicio).toLocaleDateString('pt-BR') : 'N/A'
      
      const row = [
        index + 1,
        `"${tipo.replace(/"/g, '""')}"`,
        `"${setor.replace(/"/g, '""')}"`,
        acao.status || 'Pendente',
        `"${(acao.local || 'N/A').replace(/"/g, '""')}"`,
        `"${dataInicio}"`
      ]
      
      if (incluirDescricao) {
        const descricao = (acao.descricao || '').replace(/"/g, '""').replace(/\n/g, ' ')
        row.push(`"${descricao}"`)
      }
      if (incluirObservacoes) {
        const observacoes = (acao.observacoes || '').replace(/"/g, '""').replace(/\n/g, ' ')
        row.push(`"${observacoes}"`)
      }
      
      csvRows.push(row.join(','))
    })
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio_acoes_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Gráficos
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
      if (statusMap[status]) statusMap[status].value++
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
    return Object.entries(tipoCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [acoesFiltradas, tiposAcoes])

  const dadosPorTurno = useMemo(() => {
    const turnoCount: Record<'Manhã' | 'Tarde' | 'Noite', number> = { Manhã: 0, Tarde: 0, Noite: 0 }
    acoesFiltradas.forEach(acao => {
      if (acao.data_inicio) turnoCount[determinarTurno(acao.data_inicio)]++
    })
    return Object.entries(turnoCount).filter(([_, value]) => value > 0).map(([name, value]) => ({ name, value }))
  }, [acoesFiltradas])

  const dadosMensais = useMemo(() => {
    const meses: Record<string, { mes: string, total: number, realizadas: number }> = {}
    acoesFiltradas.forEach(acao => {
      const data = new Date(acao.created_at)
      const mesKey = `${data.getFullYear()}-${data.getMonth() + 1}`
      const mesNome = data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      if (!meses[mesKey]) meses[mesKey] = { mes: mesNome, total: 0, realizadas: 0 }
      meses[mesKey].total++
      if (acao.status === 'Realizada' || acao.status === 'Realizada Parcialmente') meses[mesKey].realizadas++
    })
    return Object.values(meses).sort((a, b) => new Date(a.mes).getTime() - new Date(b.mes).getTime())
  }, [acoesFiltradas])

  const dadosParticipantes = useMemo(() => {
    const participanteCount: Record<string, number> = {}
    acoesFiltradas.forEach(acao => {
      const participantes = acao.pessoas || []
      participantes.forEach((pessoa: string) => participanteCount[pessoa] = (participanteCount[pessoa] || 0) + 1)
    })
    return Object.entries(participanteCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10)
  }, [acoesFiltradas])

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
            valor.forEach(v => contagem[String(v)] = (contagem[String(v)] || 0) + 1)
          } else {
            contagem[String(valor)] = (contagem[String(valor)] || 0) + 1
          }
        }
      })
      const data = Object.entries(contagem).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)
      if (data.length > 0) graficos.push({ label: param.label, tipo: param.tipo, data })
    })
    return graficos
  }, [acoesFiltradas, parametrosExtrasDoTipo, filterTipoAcao])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Realizada': return 'border-green-500 bg-green-50'
      case 'Realizada Parcialmente': return 'border-blue-500 bg-blue-50'
      case 'Cancelada': return 'border-red-500 bg-red-50'
      case 'Reagendada': return 'border-purple-500 bg-purple-50'
      default: return 'border-yellow-500 bg-yellow-50'
    }
  }

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
    <div className="space-y-6 p-6 text-slate-700 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard de Ações</h1>
          <p className="text-gray-500 text-sm mt-1">Visão geral das atividades e análise por parâmetros</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMostrarImpressao(!mostrarImpressao)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <Printer size={18} className="text-gray-500" />
            <span className="text-sm font-medium">Relatórios</span>
          </button>
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <Filter size={18} className="text-gray-500" />
            <span className="text-sm font-medium">Filtros</span>
            {temFiltrosAtivos && <span className="w-2 h-2 bg-[#7114dd] rounded-full"></span>}
            {mostrarFiltros ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Modal de Impressão/Relatório */}
      {mostrarImpressao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Printer size={24} className="text-[#7114dd]" />
                Gerar Relatório
              </h2>
              <button onClick={() => setMostrarImpressao(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Filtros do Relatório */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b pb-2">Filtros do Relatório</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Filtro</label>
                  <select
                    value={tipoRelatorio}
                    onChange={(e) => {
                      setTipoRelatorio(e.target.value as any)
                      setSetorRelatorio('')
                      setTipoAcaoRelatorio('')
                    }}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
                  >
                    <option value="todas">Todas as ações</option>
                    <option value="porSetor">Por setor</option>
                    <option value="porAcao">Por tipo de ação</option>
                    <option value="porSetorEAcao">Por setor e tipo de ação</option>
                  </select>
                </div>
                
                {(tipoRelatorio === 'porSetor' || tipoRelatorio === 'porSetorEAcao') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Setor</label>
                    <select
                      value={setorRelatorio}
                      onChange={(e) => setSetorRelatorio(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
                    >
                      <option value="">Selecione um setor</option>
                      {setores.map(setor => (
                        <option key={setor.id} value={setor.id}>{setor.nome}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {(tipoRelatorio === 'porAcao' || tipoRelatorio === 'porSetorEAcao') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Ação</label>
                    <select
                      value={tipoAcaoRelatorio}
                      onChange={(e) => setTipoAcaoRelatorio(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
                    >
                      <option value="">Selecione um tipo de ação</option>
                      {tiposAcoes.map(tipo => (
                        <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              {/* Filtro de Período Independente */}
              <div className="space-y-4">
                <button
                  onClick={() => setIncluirPeriodo(!incluirPeriodo)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition ${
                    incluirPeriodo ? 'border-[#7114dd] bg-[#7114dd]/5' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {incluirPeriodo ? <CheckCircle size={18} className="text-[#7114dd]" /> : <PlusCircle size={18} className="text-gray-400" />}
                    <span className="text-sm font-medium">Filtrar por Período</span>
                  </div>
                  <span className="text-xs text-gray-400">Opcional</span>
                </button>
                
                {incluirPeriodo && (
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                      <input
                        type="date"
                        value={dataInicioRelatorio}
                        onChange={(e) => setDataInicioRelatorio(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
                      <input
                        type="date"
                        value={dataFimRelatorio}
                        onChange={(e) => setDataFimRelatorio(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Campos Opcionais */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b pb-2">Campos Opcionais</h3>
                
                <div className="space-y-2">
                  <button
                    onClick={() => setIncluirDescricao(!incluirDescricao)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition ${
                      incluirDescricao ? 'border-[#7114dd] bg-[#7114dd]/5' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {incluirDescricao ? <CheckCircle size={18} className="text-[#7114dd]" /> : <PlusCircle size={18} className="text-gray-400" />}
                      <span className="text-sm font-medium">Incluir Descrição</span>
                    </div>
                    <span className="text-xs text-gray-400">Campo opcional</span>
                  </button>
                  
                  <button
                    onClick={() => setIncluirObservacoes(!incluirObservacoes)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition ${
                      incluirObservacoes ? 'border-[#7114dd] bg-[#7114dd]/5' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {incluirObservacoes ? <CheckCircle size={18} className="text-[#7114dd]" /> : <PlusCircle size={18} className="text-gray-400" />}
                      <span className="text-sm font-medium">Incluir Observações</span>
                    </div>
                    <span className="text-xs text-gray-400">Campo opcional</span>
                  </button>
                </div>
              </div>
              
              {/* Resumo */}
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>{dadosParaRelatorio.length}</strong> ações encontradas
                </p>
              </div>
              
              {/* Botões de Ação */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handlePrint}
                  disabled={dadosParaRelatorio.length === 0 || 
                    ((tipoRelatorio === 'porSetor' || tipoRelatorio === 'porSetorEAcao') && !setorRelatorio) ||
                    ((tipoRelatorio === 'porAcao' || tipoRelatorio === 'porSetorEAcao') && !tipoAcaoRelatorio) ||
                    (incluirPeriodo && (!dataInicioRelatorio || !dataFimRelatorio))}
                  className="flex-1 bg-[#7114dd] text-white px-4 py-2 rounded-lg hover:bg-[#a94dff] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Printer size={18} /> Imprimir
                </button>
                <button
                  onClick={handleExportCSV}
                  disabled={dadosParaRelatorio.length === 0 ||
                    ((tipoRelatorio === 'porSetor' || tipoRelatorio === 'porSetorEAcao') && !setorRelatorio) ||
                    ((tipoRelatorio === 'porAcao' || tipoRelatorio === 'porSetorEAcao') && !tipoAcaoRelatorio) ||
                    (incluirPeriodo && (!dataInicioRelatorio || !dataFimRelatorio))}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Exportar CSV
                </button>
              </div>
              
              <button
                onClick={limparFiltrosRelatorio}
                className="w-full text-sm text-gray-500 hover:text-red-500 transition flex items-center justify-center gap-1"
              >
                <X size={14} /> Limpar todos os filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo para impressão (oculto na tela) */}
      <div ref={printRef} className="hidden">
        <div className="header">
          <h1>Relatório de Ações</h1>
          <p>Data de emissão: {new Date().toLocaleString('pt-BR')}</p>
          {tipoRelatorio === 'porSetor' && setorRelatorio && (
            <p>Setor: {setores.find(s => s.id === setorRelatorio)?.nome}</p>
          )}
          {tipoRelatorio === 'porAcao' && tipoAcaoRelatorio && (
            <p>Tipo de Ação: {tiposAcoes.find(t => t.id === tipoAcaoRelatorio)?.nome}</p>
          )}
          {tipoRelatorio === 'porSetorEAcao' && setorRelatorio && tipoAcaoRelatorio && (
            <p>Setor: {setores.find(s => s.id === setorRelatorio)?.nome} | Tipo: {tiposAcoes.find(t => t.id === tipoAcaoRelatorio)?.nome}</p>
          )}
          {incluirPeriodo && dataInicioRelatorio && dataFimRelatorio && (
            <p>Período: {new Date(dataInicioRelatorio).toLocaleDateString('pt-BR')} a {new Date(dataFimRelatorio).toLocaleDateString('pt-BR')}</p>
          )}
        </div>
        
        <table>
          <thead>
            <tr style={{ fontWeight: 'bold' }}>
              <th style={{ fontWeight: 'bold' }}>#</th>
              <th style={{ fontWeight: 'bold' }}>Tipo de Ação</th>
              <th style={{ fontWeight: 'bold' }}>Setor</th>
              <th style={{ fontWeight: 'bold' }}>Status</th>
              <th style={{ fontWeight: 'bold' }}>Local</th>
              <th style={{ fontWeight: 'bold' }}>Data</th>
              {incluirDescricao && <th style={{ fontWeight: 'bold' }}>Descrição</th>}
              {incluirObservacoes && <th style={{ fontWeight: 'bold' }}>Observações</th>}
            </tr>
          </thead>
          <tbody>
            {dadosParaRelatorio.map((acao, index) => {
              const tipo = tiposAcoes.find(t => t.id === acao.tipo_acao_id)?.nome || 'N/A'
              const setor = setores.find(s => s.id === acao.setor_id)?.nome || 'N/A'
              const dataInicio = acao.data_inicio ? new Date(acao.data_inicio).toLocaleDateString('pt-BR') : 'N/A'
              return (
                <tr key={acao.id}>
                  <td style={{ textAlign: 'center' }}>{index + 1}</td>
                  <td>{tipo}</td>
                  <td>{setor}</td>
                  <td>{acao.status || 'Pendente'}</td>
                  <td>{acao.local || 'N/A'}</td>
                  <td>{dataInicio}</td>
                  {incluirDescricao && <td className="descricao-cell">{acao.descricao || '-'}</td>}
                  {incluirObservacoes && <td className="observacoes-cell">{acao.observacoes || '-'}</td>}
                </tr>
              )
            })}
          </tbody>
        </table>
        
        <div className="footer">
          <p>Total de ações: {dadosParaRelatorio.length}</p>
          <p>Sistema de Gerenciamento de Ações</p>
        </div>
      </div>

      {/* Painel de Filtros */}
      {mostrarFiltros && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Filtros Avançados</h3>
            {temFiltrosAtivos && (
              <button onClick={limparFiltros} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
                <X size={14} /> Limpar todos os filtros
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building2 size={14} className="inline mr-1" /> Setor
              </label>
              <select
                value={filterSetor}
                onChange={(e) => handleSetorChange(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
              >
                <option value="todos">Todos os setores</option>
                {setores.map(setor => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <List size={14} className="inline mr-1" /> Tipo de Ação
              </label>
              <select
                value={filterTipoAcao}
                onChange={(e) => handleTipoAcaoChange(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
                disabled={filterSetor === 'todos'}
              >
                <option value="todos">{filterSetor === 'todos' ? 'Selecione um setor primeiro' : 'Todos os tipos'}</option>
                {tiposAcaoDisponiveis.map(tipo => <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>)}
              </select>
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
                {usuarios.map(usuario => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
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
              <input type="date" value={filterDataInicio} onChange={(e) => setFilterDataInicio(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim (antes)</label>
              <input type="date" value={filterDataFim} onChange={(e) => setFilterDataFim(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]" />
            </div>
          </div>

          {filterSetor !== 'todos' && filterTipoAcao !== 'todos' && filtrosExtrasDisponiveis.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <button onClick={() => setMostrarFiltrosExtras(!mostrarFiltrosExtras)} className="flex items-center gap-2 text-sm font-medium text-[#7114dd] hover:text-[#a94dff] transition">
                <Settings size={14} /> Filtros por Campos Específicos
                {mostrarFiltrosExtras ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {Object.keys(filtrosExtras).length > 0 && <span className="ml-2 text-xs bg-[#7114dd] text-white px-2 py-0.5 rounded-full">{Object.keys(filtrosExtras).length}</span>}
              </button>
              {mostrarFiltrosExtras && (
                <div className="mt-3">
                  {Object.keys(filtrosExtras).length > 0 && (
                    <div className="flex justify-end mb-2">
                      <button onClick={limparFiltrosExtras} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><X size={12} /> Limpar filtros extras</button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtrosExtrasDisponiveis.map(campo => (
                      <div key={campo.label}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{campo.label}</label>
                        <select
                          value={filtrosExtras[campo.label] || 'todos'}
                          onChange={(e) => {
                            const valor = e.target.value
                            if (valor === 'todos') {
                              const novosFiltros = { ...filtrosExtras }
                              delete novosFiltros[campo.label]
                              setFiltrosExtras(novosFiltros)
                            } else {
                              setFiltrosExtras({ ...filtrosExtras, [campo.label]: valor })
                            }
                          }}
                          className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
                        >
                          <option value="todos">Todos</option>
                          {campo.opcoes.map(opcao => <option key={opcao} value={opcao}>{campo.tipo === 'boolean' ? (opcao === 'true' ? 'Sim' : 'Não') : opcao}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cards Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#7114dd]">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Total de Ações</p><p className="text-3xl font-bold text-gray-800">{acoesFiltradas.length}</p></div>
            <Calendar size={32} className="text-[#7114dd] opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Ações Realizadas</p><p className="text-3xl font-bold text-green-600">{acoesFiltradas.filter(a => a.status === 'Realizada' || a.status === 'Realizada Parcialmente').length}</p></div>
            <CheckCircle size={32} className="text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Ações Pendentes</p><p className="text-3xl font-bold text-yellow-600">{acoesFiltradas.filter(a => a.status === 'Pendente' || a.status === 'Reagendada').length}</p></div>
            <AlertCircle size={32} className="text-yellow-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-500 text-sm">Ações com Transporte</p><p className="text-3xl font-bold text-blue-600">{acoesComTransporte.length}</p></div>
            <Car size={32} className="text-blue-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* AGENDA SEMANAL */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Calendar size={20} className="text-indigo-600" />
                Agenda Semanal
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {semanaInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} — {new Date(semanaInicio.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Select de setor */}
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-gray-400" />
                <select
                  value={filterSetor}
                  onChange={(e) => handleSetorChange(e.target.value)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="todos">Todos os setores</option>
                  {setores.map(setor => (
                    <option key={setor.id} value={setor.id}>{setor.nome}</option>
                  ))}
                </select>
              </div>
              
              {/* Navegação */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button onClick={semanaAnterior} className="px-2 py-1.5 text-sm rounded-md hover:bg-white transition">←</button>
                <button onClick={semanaAtual} className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white shadow-sm">Hoje</button>
                <button onClick={proximaSemana} className="px-2 py-1.5 text-sm rounded-md hover:bg-white transition">→</button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <div className="min-w-225">
            {/* Cabeçalho dos dias */}
            <div className="grid" style={{ gridTemplateColumns: `90px repeat(7, 1fr)` }}>
              <div className="p-3 bg-gray-100 border-b border-gray-300 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                Turno
              </div>
              {diasDaSemana.map((dia, idx) => {
                const isToday = dia.toDateString() === new Date().toDateString()
                return (
                  <div key={idx} className={`p-3 text-center border-b border-gray-300 ${isToday ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      {dia.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                    </p>
                    <p className={`text-base font-bold mt-1 ${isToday ? 'text-indigo-700' : 'text-gray-700'}`}>
                      {dia.getDate()}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Linhas dos turnos - ZEBRA STRIPING */}
            {turnos.map((turno, turnoIndex) => {
              const bgColor = turnoIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              
              return (
                <div key={turno} className="grid" style={{ gridTemplateColumns: `90px repeat(7, 1fr)` }}>
                  {/* Coluna do turno */}
                  <div className={`p-3 flex items-center justify-center gap-2 text-sm font-medium border-b border-gray-200 ${bgColor}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      turno === 'Manhã' ? 'bg-amber-100 text-amber-600' :
                      turno === 'Tarde' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'
                    }`}>
                      <Clock size={14} />
                    </div>
                    <span className="text-gray-700">{turno}</span>
                  </div>
                  
                  {/* Células dos dias */}
                  {diasDaSemana.map((dia, idx) => {
                    const dataKey = dia.toDateString()
                    const key = `${dataKey}_${turno}`
                    const acoesNoTurno = acoesPorDiaTurno[key] || []
                    const isToday = dia.toDateString() === new Date().toDateString()
                    
                    return (
                      <div 
                        key={idx} 
                        className={`p-1.5 border-b border-gray-200 ${idx !== 6 ? 'border-r border-gray-100' : ''} ${bgColor} ${isToday ? 'border-l-2 border-l-indigo-400' : ''}`}
                      >
                        <div className="space-y-1.5 min-h-32.5">
                          {acoesNoTurno.length === 0 ? (
                            <div className="h-full flex items-center justify-center py-6">
                              <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                            </div>
                          ) : (
                            acoesNoTurno.map((acao, acaoIdx) => {
                              const setorCriador = setores.find(s => s.id === acao.setor_id)
                              const tipoAcao = tiposAcoes.find(t => t.id === acao.tipo_acao_id)
                              const nomeTipo = tipoAcao?.nome || 'Ação'
                              const acaoOriginal = acoes.find(a => a.id === acao.id)
                              
                              const borderColor = 
                                acao.status === 'Realizada' ? 'border-l-green-500' :
                                acao.status === 'Realizada Parcialmente' ? 'border-l-blue-500' :
                                acao.status === 'Cancelada' ? 'border-l-red-500' :
                                acao.status === 'Reagendada' ? 'border-l-purple-500' : 'border-l-amber-500'
                              
                              return (
                                <div 
                                  key={acaoIdx} 
                                  onClick={() => {
                                    // Modal de detalhes
                                    const modal = document.createElement('div')
                                    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
                                    modal.innerHTML = `
                                      <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                        <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                                          <h2 class="text-xl font-bold text-gray-800">Detalhes da Ação</h2>
                                          <button class="text-gray-400 hover:text-gray-600 text-2xl close-modal">&times;</button>
                                        </div>
                                        <div class="p-6 space-y-4">
                                          <div class="grid grid-cols-2 gap-4">
                                            <div>
                                              <label class="text-xs text-gray-400 uppercase">Tipo de Ação</label>
                                              <p class="font-medium text-gray-800">${nomeTipo}</p>
                                            </div>
                                            <div>
                                              <label class="text-xs text-gray-400 uppercase">Status</label>
                                              <p class="inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                                acao.status === 'Realizada' ? 'bg-green-100 text-green-700' :
                                                acao.status === 'Realizada Parcialmente' ? 'bg-blue-100 text-blue-700' :
                                                acao.status === 'Cancelada' ? 'bg-red-100 text-red-700' :
                                                acao.status === 'Reagendada' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                                              }">${acao.status || 'Pendente'}</p>
                                            </div>
                                            <div>
                                              <label class="text-xs text-gray-400 uppercase">Setor</label>
                                              <p class="text-gray-700">${setorCriador?.nome || 'N/I'}</p>
                                            </div>
                                            <div>
                                              <label class="text-xs text-gray-400 uppercase">Data/Hora</label>
                                              <p class="text-gray-700">${new Date(acaoOriginal?.data_inicio).toLocaleString('pt-BR') || 'N/A'}</p>
                                            </div>
                                            <div>
                                              <label class="text-xs text-gray-400 uppercase">Local</label>
                                              <p class="text-gray-700">${acao.local || 'Não informado'}</p>
                                            </div>
                                            <div>
                                              <label class="text-xs text-gray-400 uppercase">Transporte</label>
                                              <p class="text-gray-700">${acao.necessita_transporte ? 'Sim' : 'Não'}</p>
                                            </div>
                                            <div class="col-span-2">
                                              <label class="text-xs text-gray-400 uppercase">Participantes</label>
                                              <p class="text-gray-700">${(acao.pessoas || []).join(', ') || 'Nenhum'}</p>
                                            </div>
                                            <div class="col-span-2">
                                              <label class="text-xs text-gray-400 uppercase">Descrição</label>
                                              <div class="mt-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">${(acaoOriginal?.descricao || 'Sem descrição').replace(/\n/g, '<br>')}</div>
                                            </div>
                                            <div class="col-span-2">
                                              <label class="text-xs text-gray-400 uppercase">Observações</label>
                                              <div class="mt-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">${(acaoOriginal?.observacoes || 'Sem observações').replace(/\n/g, '<br>')}</div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    `
                                    document.body.appendChild(modal)
                                    modal.querySelector('.close-modal')?.addEventListener('click', () => modal.remove())
                                    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })
                                  }}
                                  className={`rounded-md p-2 text-xs border-l-4 ${borderColor} bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group hover:scale-[1.02]`}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1">
                                      <Clock size={10} className="text-gray-400" />
                                      <span className="text-[10px] font-mono font-medium text-gray-600">{acao.horario}</span>
                                    </div>
                                    {acao.necessita_transporte && (
                                      <Car size={12} className="text-blue-500" />
                                    )}
                                  </div>
                                  
                                  <p className="text-[11px] font-semibold text-gray-800 mb-1 line-clamp-2 leading-tight">
                                    {nomeTipo.length > 30 ? nomeTipo.substring(0, 30) + '…' : nomeTipo}
                                  </p>
                                  
                                  {acao.local && (
                                    <div className="flex items-center gap-1 mb-1 text-gray-500">
                                      <MapPin size={9} />
                                      <span className="text-[9px] truncate">
                                        {acao.local.length > 22 ? acao.local.substring(0, 22) + '…' : acao.local}
                                      </span>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <Building2 size={9} />
                                    <span className="text-[9px] truncate">
                                      {setorCriador?.nome?.length > 18 ? setorCriador.nome.substring(0, 18) + '…' : setorCriador?.nome || 'N/I'}
                                    </span>
                                  </div>
                                  
                                  
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Legenda de status */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-500">Status:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-gray-600">Pendente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600">Realizada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">Parcial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600">Cancelada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-gray-600">Reagendada</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Car size={12} />
              <span>Transporte</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
              <span>Clique para detalhes</span>
            </div>
          </div>
        </div>
        
        {/* Mensagem vazia */}
        {acoesFiltradas.filter(a => {
          const dataInicio = a.data_inicio ? new Date(a.data_inicio) : null
          if (!dataInicio) return false
          const fimSemana = new Date(semanaInicio)
          fimSemana.setDate(semanaInicio.getDate() + 7)
          return dataInicio >= semanaInicio && dataInicio < fimSemana
        }).length === 0 && (
          <div className="py-16 text-center">
            <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Nenhuma ação agendada para esta semana</p>
            <p className="text-xs text-gray-300 mt-1">Tente selecionar outro setor ou período</p>
          </div>
        )}
      </div>

      {/* GRÁFICOS PRINCIPAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><CheckCircle size={20} className="text-[#7114dd]" /> Status das Ações</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart><Pie data={dadosStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}>{dadosStatus.map((entry, index) => <Cell key={index} fill={entry.color} />)}</Pie><Tooltip /><Legend /></PieChart>
          </ResponsiveContainer>
        </div>

        {dadosPorTurno.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock size={20} className="text-[#ffa301]" /> Ações por Turno</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart><Pie data={dadosPorTurno} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>{dadosPorTurno.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {dadosPorTipoAcao.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><List size={20} className="text-[#24cffd]" /> Ações por Tipo</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosPorTipoAcao} layout="vertical" margin={{ left: 80 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis type="category" dataKey="name" width={100} /><Tooltip /><Bar dataKey="value" fill="#24cffd" name="Quantidade" /></BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {dadosPorSetor.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Building2 size={20} className="text-[#7114dd]" /> Ações por Setor</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosPorSetor} layout="vertical" margin={{ left: 80 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis type="category" dataKey="nome" /><Tooltip /><Legend /><Bar dataKey="total" fill="#7114dd" name="Total" /><Bar dataKey="realizadas" fill="#22c55e" name="Realizadas" /><Bar dataKey="pendentes" fill="#facc15" name="Pendentes" /></BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {dadosMensais.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-[#a94dff]" /> Tendência Mensal</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosMensais}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mes" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="total" stroke="#7114dd" name="Total" strokeWidth={2} /><Line type="monotone" dataKey="realizadas" stroke="#22c55e" name="Realizadas" strokeWidth={2} /></LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {dadosParticipantes.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Users size={20} className="text-[#ffa301]" /> Top 10 Participantes</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosParticipantes} layout="vertical" margin={{ left: 100 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis type="category" dataKey="name" width={100} /><Tooltip /><Bar dataKey="value" fill="#ffa301" name="Quantidade" /></BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* GRÁFICOS DOS CAMPOS EXTRAS */}
      {filterTipoAcao !== 'todos' && graficosExtras.length > 0 && (
        <div className="mt-6">
          <button onClick={() => setExpandirGraficosExtras(!expandirGraficosExtras)} className="w-full flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-all mb-4">
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-[#7114dd]/10 rounded-full flex items-center justify-center"><Eye size={20} className="text-[#7114dd]" /></div><div className="text-left"><h3 className="font-semibold text-gray-800">Análise por Campos Específicos</h3><p className="text-sm text-gray-500">{graficosExtras.length} {graficosExtras.length === 1 ? 'parâmetro' : 'parâmetros'} disponíveis</p></div></div>
            <div className="flex items-center gap-2 text-[#7114dd]"><span className="text-sm font-medium">{expandirGraficosExtras ? 'Ocultar' : 'Visualizar'}</span>{expandirGraficosExtras ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
          </button>
          {expandirGraficosExtras && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {graficosExtras.map((grafico, idx) => (
                <div key={grafico.label} className="bg-white p-6 rounded-xl shadow-sm border">
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Package size={20} className="text-[#24cffd]" /> {grafico.label}</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={grafico.data} layout={grafico.data.length > 5 ? "vertical" : "horizontal"} margin={{ left: grafico.data.length > 5 ? 100 : 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      {grafico.data.length > 5 ? (<><XAxis type="number" /><YAxis type="category" dataKey="name" width={100} /></>) : (<><XAxis dataKey="name" /><YAxis type="number" /></>)}
                      <Tooltip /><Bar dataKey="value" fill={COLORS[idx % COLORS.length]} name="Quantidade" />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-gray-400 text-center mt-2">Total: {grafico.data.reduce((sum, d) => sum + d.value, 0)}</p>
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
        </div>
      )}
    </div>
  )
}