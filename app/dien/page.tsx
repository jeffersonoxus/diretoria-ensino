// app/(auth)/dien/page.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'
import { 
  Calendar, CheckCircle, AlertCircle, TrendingUp, Users, Building2, 
  Sunrise, Sun, Moon, Package, Filter, X, ChevronDown, ChevronUp, 
  MapPin, Clock, Settings, Eye, Car, Printer, Download, PlusCircle,
  User, CalendarDays, School, List, LogOut
} from 'lucide-react'
import { useRouter } from 'next/navigation'

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

interface Local {
  id: string
  nome: string
  tipo: string
  endereco?: string
  ativo: boolean
}

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)
  
  // ===== CONTROLE DE ACESSO =====
  const [userPerfilId, setUserPerfilId] = useState<string | null>(null)
  const [userNome, setUserNome] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userSetoresIds, setUserSetoresIds] = useState<string[]>([])
  const [loadingAcesso, setLoadingAcesso] = useState(true)
  
  // ===== STATES EXISTENTES =====
  const [acoes, setAcoes] = useState<any[]>([])
  const [setores, setSetores] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [tiposAcoes, setTiposAcoes] = useState<TipoAcao[]>([])
  const [locais, setLocais] = useState<Array<{ id: string; nome: string }>>([])
  const [loading, setLoading] = useState(true)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [mostrarImpressao, setMostrarImpressao] = useState(false)
  
  // Filtros de impressão
  const [tipoRelatorio, setTipoRelatorio] = useState<'todas' | 'porSetor' | 'porAcao' | 'porSetorEAcao'>('todas')
  const [setorRelatorio, setSetorRelatorio] = useState<string>('')
  const [tipoAcaoRelatorio, setTipoAcaoRelatorio] = useState<string>('')
  const [incluirPeriodo, setIncluirPeriodo] = useState(false)
  const [dataInicioRelatorio, setDataInicioRelatorio] = useState<string>('')
  const [dataFimRelatorio, setDataFimRelatorio] = useState<string>('')
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
  const [filterLocal, setFilterLocal] = useState<string>('')
  const [filterDataInicio, setFilterDataInicio] = useState<string>('')
  const [filterDataFim, setFilterDataFim] = useState<string>('')
  const [filterTransporte, setFilterTransporte] = useState<string>('todos')
  
  // Filtros de campos extras
  const [filtrosExtras, setFiltrosExtras] = useState<Record<string, string>>({})
  const [mostrarFiltrosExtras, setMostrarFiltrosExtras] = useState(false)
  const [expandirGraficosExtras, setExpandirGraficosExtras] = useState(false)
  const [modalAcao, setModalAcao] = useState<any>(null)

  // ===== FUNÇÃO DE LOGOUT =====
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ===== VERIFICAR ACESSO DO USUÁRIO =====
  const verificarAcessoUsuario = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
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
      console.error('Erro ao verificar acesso:', error)
    } finally {
      setLoadingAcesso(false)
    }
  }

  // ===== CARREGAR DADOS APENAS DOS SETORES DO USUÁRIO =====
  const carregarDados = async () => {
    if (userSetoresIds.length === 0) return
    
    setLoading(true)
    
    const [acoesRes, setoresRes, perfisRes, tiposRes, locaisRes] = await Promise.all([
      supabase.from('acoes').select('*').in('setor_id', userSetoresIds).order('data_inicio', { ascending: true }),
      supabase.from('setores').select('*').in('id', userSetoresIds),
      supabase.from('perfis').select('id, nome'),
      supabase.from('tipo_acao').select('*'),
      supabase.from('locais').select('*').eq('ativo', true).order('nome')
    ])
    
    setAcoes(acoesRes.data || [])
    setSetores(setoresRes.data || [])
    setUsuarios(perfisRes.data || [])
    setTiposAcoes(tiposRes.data || [])
    setLocais(locaisRes.data || [])
    
    setLoading(false)
  }

  // ===== EFECTS =====
  useEffect(() => {
    verificarAcessoUsuario()
  }, [])

  useEffect(() => {
    if (!loadingAcesso && userSetoresIds.length > 0) {
      carregarDados()
    }
  }, [loadingAcesso, userSetoresIds])

  // Helper para nome do usuário
  const getUsuarioNome = (userId: string) => {
    const usuario = usuarios.find(u => u.id === userId)
    return usuario?.nome || 'Sistema'
  }

  // Limitar navegação do calendário
  const podeNavegar = (direcao: 'anterior' | 'proximo') => {
    const dataAtual = new Date(semanaInicio)
    const hoje = new Date()
    const limiteAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
    const limiteProximo = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0)
    
    if (direcao === 'anterior') {
      return dataAtual >= limiteAnterior
    } else {
      const ultimoDiaSemana = new Date(dataAtual)
      ultimoDiaSemana.setDate(dataAtual.getDate() + 6)
      return ultimoDiaSemana <= limiteProximo
    }
  }

  const semanaAnterior = () => {
    if (!podeNavegar('anterior')) return
    const novaData = new Date(semanaInicio)
    novaData.setDate(semanaInicio.getDate() - 7)
    setSemanaInicio(novaData)
  }

  const proximaSemana = () => {
    if (!podeNavegar('proximo')) return
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

  const determinarTurno = (dataHora: string | undefined): 'Manhã' | 'Tarde' | 'Noite' => {
    if (!dataHora) return 'Manhã'
    const hora = new Date(dataHora).getHours()
    if (hora >= 5 && hora < 12) return 'Manhã'
    if (hora >= 12 && hora < 18) return 'Tarde'
    return 'Noite'
  }

  const turnos = ['Manhã', 'Tarde', 'Noite']

  // Tipos de ação disponíveis para o setor selecionado
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
    if (filterLocal) {
      filtradas = filtradas.filter(a => 
        a.local && a.local.toLowerCase().includes(filterLocal.toLowerCase())
      )
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
  }, [acoes, filterSetor, filterTipoAcao, filterStatus, filterUsuario, filterLocal, filterTransporte, filterDataInicio, filterDataFim, usuarios, filtrosExtras])

  // Ações com transporte
  const acoesComTransporte = useMemo(() => {
    return acoesFiltradas.filter(a => a.necessita_transporte === true)
  }, [acoesFiltradas])

  // Mapa de ações por dia e turno
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

  // Dados para relatório
  const dadosParaRelatorio = useMemo(() => {
    let dados = [...acoesFiltradas]
    
    if (tipoRelatorio === 'porSetor' && setorRelatorio) {
      dados = dados.filter(a => a.setor_id === setorRelatorio)
    } else if (tipoRelatorio === 'porAcao' && tipoAcaoRelatorio) {
      dados = dados.filter(a => a.tipo_acao_id === tipoAcaoRelatorio)
    } else if (tipoRelatorio === 'porSetorEAcao' && setorRelatorio && tipoAcaoRelatorio) {
      dados = dados.filter(a => a.setor_id === setorRelatorio && a.tipo_acao_id === tipoAcaoRelatorio)
    }
    
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
    setFilterLocal('')
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
                           filterUsuario !== 'todos' || filterLocal !== '' || filterTransporte !== 'todos' || 
                           filterDataInicio !== '' || filterDataFim !== '' || Object.keys(filtrosExtras).length > 0

  // Função para imprimir
  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Relatório de Ações</title>
            <meta charset="utf-8" />
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
              .header { text-align: center; margin-bottom: 20px; }
              .header h1 { color: #7114dd; margin: 0; font-size: 18px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
              th { background-color: #7114dd; color: white; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .footer { text-align: center; margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 10px; color: #999; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Relatório de Ações</h1>
              <p>Data de emissão: ${new Date().toLocaleString('pt-BR')}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Tipo</th><th>Setor</th><th>Status</th><th>Local</th><th>Data</th>
                  ${incluirDescricao ? '<th>Descrição</th>' : ''}
                  ${incluirObservacoes ? '<th>Observações</th>' : ''}
                </tr>
              </thead>
              <tbody>
                ${dadosParaRelatorio.map((acao, index) => {
                  const tipo = tiposAcoes.find(t => t.id === acao.tipo_acao_id)?.nome || 'N/A'
                  const setor = setores.find(s => s.id === acao.setor_id)?.nome || 'N/A'
                  const dataInicio = acao.data_inicio ? new Date(acao.data_inicio).toLocaleDateString('pt-BR') : 'N/A'
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${tipo}</td>
                      <td>${setor}</td>
                      <td>${acao.status || 'Pendente'}</td>
                      <td>${acao.local || 'N/A'}</td>
                      <td>${dataInicio}</td>
                      ${incluirDescricao ? `<td>${acao.descricao || '-'}</td>` : ''}
                      ${incluirObservacoes ? `<td>${acao.observacoes || '-'}</td>` : ''}
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
            <div class="footer">
              <p>Total de ações: ${dadosParaRelatorio.length}</p>
              <p>Sistema de Gerenciamento de Ações - DIEN</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
    setMostrarImpressao(false)
  }

  const handleExportCSV = () => {
    const dados = dadosParaRelatorio
    const headers = ['#', 'Tipo de Ação', 'Setor', 'Status', 'Local', 'Data']
    if (incluirDescricao) headers.push('Descrição')
    if (incluirObservacoes) headers.push('Observações')
    
    const csvRows = [headers.join(',')]
    
    dados.forEach((acao, index) => {
      const tipo = tiposAcoes.find(t => t.id === acao.tipo_acao_id)?.nome || 'N/A'
      const setor = setores.find(s => s.id === acao.setor_id)?.nome || 'N/A'
      const dataInicio = acao.data_inicio ? new Date(acao.data_inicio).toLocaleDateString('pt-BR') : 'N/A'
      
      const row = [index + 1, `"${tipo.replace(/"/g, '""')}"`, `"${setor.replace(/"/g, '""')}"`, acao.status || 'Pendente', `"${(acao.local || 'N/A').replace(/"/g, '""')}"`, `"${dataInicio}"`]
      
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
    return Object.values(setorMap).sort((a, b) => b.total - a.total).slice(0, 8)
  }, [acoesFiltradas, setores])

  const dadosPorTipoAcao = useMemo(() => {
    const tipoCount: Record<string, number> = {}
    acoesFiltradas.forEach(acao => {
      const tipo = tiposAcoes.find(t => t.id === acao.tipo_acao_id)
      const nome = tipo?.nome || 'Sem tipo'
      tipoCount[nome] = (tipoCount[nome] || 0) + 1
    })
    return Object.entries(tipoCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)
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
    return Object.values(meses).slice(-6)
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

  // Gerar dias da semana
  const diasDaSemana = useMemo(() => {
    const dias = []
    for (let i = 0; i < 7; i++) {
      const dia = new Date(semanaInicio)
      dia.setDate(semanaInicio.getDate() + i)
      dias.push(dia)
    }
    return dias
  }, [semanaInicio])

  // ===== COMPONENTE DE ACESSO NEGADO =====
  const SemAcesso = () => (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-red-600 mb-3">Acesso Restrito</h2>
        <p className="text-gray-600 mb-2">
          Olá, {userNome || 'Usuário'}! 👋
        </p>
        <p className="text-gray-500 mb-6">
          Você não está vinculado a nenhum setor no sistema.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 text-left border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">🔒 Para acessar o dashboard:</p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            <li>Entre em contato com o administrador</li>
            <li>Solicite que seu usuário seja adicionado a um setor</li>
            <li>Após vincular, recarregue a página</li>
          </ul>
        </div>
        <button
          onClick={handleLogout}
          className="mt-6 flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
        >
          <LogOut size={18} /> Sair
        </button>
      </div>
    </div>
  )

  // ===== VERIFICAÇÃO DE ACESSO =====
  if (loadingAcesso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  if (userSetoresIds.length === 0) {
    return <SemAcesso />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  // ===== RENDERIZAÇÃO PRINCIPAL DO DASHBOARD =====
  return (
    <div className="space-y-6 p-6 text-slate-700 bg-gradient-to-br from-purple-50 via-white to-indigo-50 min-h-screen">
      {/* Header com botão de logout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard de Ações</h1>
          <p className="text-gray-500 text-sm mt-1">
            Visão geral das atividades • {userNome} • 
            Setor(es): {setores.map(s => s.nome).join(', ')}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMostrarImpressao(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm">
            <Printer size={18} className="text-gray-500" />
            <span className="text-sm font-medium">Relatórios</span>
          </button>
          <button onClick={() => setMostrarFiltros(!mostrarFiltros)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm">
            <Filter size={18} className="text-gray-500" />
            <span className="text-sm font-medium">Filtros</span>
            {temFiltrosAtivos && <span className="w-2 h-2 bg-purple-600 rounded-full"></span>}
            {mostrarFiltros ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition shadow-sm">
            <LogOut size={18} />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </div>

      {/* Modal de Impressão/Relatório */}
      {mostrarImpressao && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Printer size={24} className="text-purple-600" />
                Gerar Relatório
              </h2>
              <button onClick={() => setMostrarImpressao(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b pb-2">Filtros do Relatório</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Filtro</label>
                  <select value={tipoRelatorio} onChange={(e) => { setTipoRelatorio(e.target.value as any); setSetorRelatorio(''); setTipoAcaoRelatorio(''); }} className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="todas">Todas as ações</option>
                    <option value="porSetor">Por setor</option>
                    <option value="porAcao">Por tipo de ação</option>
                    <option value="porSetorEAcao">Por setor e tipo de ação</option>
                  </select>
                </div>
                
                {(tipoRelatorio === 'porSetor' || tipoRelatorio === 'porSetorEAcao') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Setor</label>
                    <select value={setorRelatorio} onChange={(e) => setSetorRelatorio(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg">
                      <option value="">Selecione um setor</option>
                      {setores.map(setor => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}
                    </select>
                  </div>
                )}
                
                {(tipoRelatorio === 'porAcao' || tipoRelatorio === 'porSetorEAcao') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Ação</label>
                    <select value={tipoAcaoRelatorio} onChange={(e) => setTipoAcaoRelatorio(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg">
                      <option value="">Selecione um tipo de ação</option>
                      {tiposAcoes.map(tipo => <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>)}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <button onClick={() => setIncluirPeriodo(!incluirPeriodo)} className={`w-full flex items-center justify-between p-3 rounded-lg border transition ${incluirPeriodo ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3">{incluirPeriodo ? <CheckCircle size={18} className="text-purple-600" /> : <PlusCircle size={18} className="text-gray-400" />}<span className="text-sm font-medium">Filtrar por Período</span></div>
                </button>
                {incluirPeriodo && (
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label><input type="date" value={dataInicioRelatorio} onChange={(e) => setDataInicioRelatorio(e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label><input type="date" value={dataFimRelatorio} onChange={(e) => setDataFimRelatorio(e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b pb-2">Campos Opcionais</h3>
                <div className="space-y-2">
                  <button onClick={() => setIncluirDescricao(!incluirDescricao)} className={`w-full flex items-center justify-between p-3 rounded-lg border transition ${incluirDescricao ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3">{incluirDescricao ? <CheckCircle size={18} className="text-purple-600" /> : <PlusCircle size={18} className="text-gray-400" />}<span className="text-sm font-medium">Incluir Descrição</span></div>
                  </button>
                  <button onClick={() => setIncluirObservacoes(!incluirObservacoes)} className={`w-full flex items-center justify-between p-3 rounded-lg border transition ${incluirObservacoes ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3">{incluirObservacoes ? <CheckCircle size={18} className="text-purple-600" /> : <PlusCircle size={18} className="text-gray-400" />}<span className="text-sm font-medium">Incluir Observações</span></div>
                  </button>
                </div>
              </div>
              
              <div className="pt-4 border-t"><p className="text-sm text-gray-600 mb-2"><strong>{dadosParaRelatorio.length}</strong> ações encontradas</p></div>
              
              <div className="flex gap-3 pt-4">
                <button onClick={handlePrint} disabled={dadosParaRelatorio.length === 0} className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"><Printer size={18} /> Imprimir</button>
                <button onClick={handleExportCSV} disabled={dadosParaRelatorio.length === 0} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"><Download size={18} /> Exportar CSV</button>
              </div>
              
              <button onClick={limparFiltrosRelatorio} className="w-full text-sm text-gray-500 hover:text-red-500 transition flex items-center justify-center gap-1"><X size={14} /> Limpar todos os filtros</button>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo para impressão (escondido) */}
      <div ref={printRef} className="hidden"></div>

      {/* Painel de Filtros */}
      {mostrarFiltros && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Filtros Avançados</h3>
            {temFiltrosAtivos && <button onClick={limparFiltros} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"><X size={14} /> Limpar todos</button>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"><Building2 size={14} className="inline mr-1" /> Setor</label>
              <select value={filterSetor} onChange={(e) => handleSetorChange(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="todos">Todos os setores</option>
                {setores.map(setor => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"><List size={14} className="inline mr-1" /> Tipo de Ação</label>
              <select value={filterTipoAcao} onChange={(e) => handleTipoAcaoChange(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" disabled={filterSetor === 'todos'}>
                <option value="todos">{filterSetor === 'todos' ? 'Selecione um setor primeiro' : 'Todos os tipos'}</option>
                {tiposAcaoDisponiveis.map(tipo => <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg">
                <option value="todos">Todos</option><option>Pendente</option><option>Realizada</option><option>Realizada Parcialmente</option><option>Cancelada</option><option>Reagendada</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"><School size={14} className="inline mr-1" /> Local (Escola)</label>
              <select value={filterLocal} onChange={(e) => setFilterLocal(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg">
                <option value="">Todos os locais</option>
                {locais.map(local => <option key={local.id} value={local.nome}>{local.nome}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
              <select value={filterUsuario} onChange={(e) => setFilterUsuario(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg">
                <option value="todos">Todos</option>
                {usuarios.map(usuario => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"><Car size={14} className="inline mr-1" /> Transporte</label>
              <select value={filterTransporte} onChange={(e) => setFilterTransporte(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg">
                <option value="todos">Todos</option><option value="sim">Sim</option><option value="nao">Não</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início (após)</label>
              <input type="date" value={filterDataInicio} onChange={(e) => setFilterDataInicio(e.target.value)} className="w-full p-2 border rounded-lg" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim (antes)</label>
              <input type="date" value={filterDataFim} onChange={(e) => setFilterDataFim(e.target.value)} className="w-full p-2 border rounded-lg" />
            </div>
          </div>

          {filterSetor !== 'todos' && filterTipoAcao !== 'todos' && filtrosExtrasDisponiveis.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <button onClick={() => setMostrarFiltrosExtras(!mostrarFiltrosExtras)} className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition">
                <Settings size={14} /> Filtros por Campos Específicos {mostrarFiltrosExtras ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {Object.keys(filtrosExtras).length > 0 && <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">{Object.keys(filtrosExtras).length}</span>}
              </button>
              {mostrarFiltrosExtras && (
                <div className="mt-3">
                  {Object.keys(filtrosExtras).length > 0 && <div className="flex justify-end mb-2"><button onClick={limparFiltrosExtras} className="text-xs text-red-500">Limpar filtros extras</button></div>}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtrosExtrasDisponiveis.map(campo => (
                      <div key={campo.label}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{campo.label}</label>
                        <select value={filtrosExtras[campo.label] || 'todos'} onChange={(e) => {
                          const valor = e.target.value
                          if (valor === 'todos') { const novos = { ...filtrosExtras }; delete novos[campo.label]; setFiltrosExtras(novos) }
                          else setFiltrosExtras({ ...filtrosExtras, [campo.label]: valor })
                        }} className="w-full p-2 border rounded-lg">
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
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-purple-600"><div><p className="text-gray-700 font-bold text-sm">Total de Ações</p><p className="text-3xl font-bold text-gray-800">{acoesFiltradas.length}</p></div><Calendar size={32} className="float-right text-purple-600 opacity-50" /></div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-500"><div><p className="text-gray-700 font-bold text-sm">Ações Realizadas</p><p className="text-3xl font-bold text-green-600">{acoesFiltradas.filter(a => a.status === 'Realizada' || a.status === 'Realizada Parcialmente').length}</p></div><CheckCircle size={32} className="float-right text-green-500" /></div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-yellow-400"><div><p className="text-gray-700 font-bold text-sm">Ações Pendentes</p><p className="text-3xl font-bold text-yellow-500">{acoesFiltradas.filter(a => a.status === 'Pendente' || a.status === 'Reagendada').length}</p></div><AlertCircle size={32} className="float-right text-yellow-400" /></div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-blue-500"><div><p className="text-gray-700 font-bold text-sm">Ações com Transporte</p><p className="text-3xl font-bold text-blue-600">{acoesComTransporte.length}</p></div><Car size={32} className="float-right text-blue-500" /></div>
      </div>

      {/* AGENDA SEMANAL */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-semibold text-gray-800 flex items-center gap-2"><Calendar size={20} className="text-purple-700" />Agenda Semanal</h2><p className="text-xs text-gray-500 mt-1">{semanaInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} — {new Date(semanaInicio.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p></div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2"><Building2 size={14} className="text-gray-400" /><select value={filterSetor} onChange={(e) => handleSetorChange(e.target.value)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white"><option value="todos">Todos os setores</option>{setores.map(setor => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}</select></div>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button onClick={semanaAnterior} className={`px-2 py-1.5 text-sm rounded-md hover:bg-white transition ${!podeNavegar('anterior') && 'opacity-50 cursor-not-allowed'}`} disabled={!podeNavegar('anterior')}>←</button>
                <button onClick={semanaAtual} className="px-3 py-1.5 text-xs rounded-md bg-purple-600 text-white shadow-sm">Hoje</button>
                <button onClick={proximaSemana} className={`px-2 py-1.5 text-sm rounded-md hover:bg-white transition ${!podeNavegar('proximo') && 'opacity-50 cursor-not-allowed'}`} disabled={!podeNavegar('proximo')}>→</button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid" style={{ gridTemplateColumns: `90px repeat(7, 1fr)` }}>
              <div className="p-3 bg-gray-100 border-b border-gray-300 font-semibold text-gray-600 text-xs uppercase tracking-wider">Turno</div>
              {diasDaSemana.map((dia, idx) => {
                const isToday = dia.toDateString() === new Date().toDateString()
                return (<div key={idx} className={`p-3 text-center border-b border-gray-300 ${isToday ? 'bg-purple-100' : 'bg-gray-100'}`}><p className="text-xs font-semibold text-gray-500 uppercase">{dia.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</p><p className={`text-base font-bold mt-1 ${isToday ? 'text-purple-700' : 'text-gray-700'}`}>{dia.getDate()}</p></div>)
              })}
            </div>

            {turnos.map((turno, turnoIndex) => {
              const bgColor = turnoIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              return (
                <div key={turno} className="grid" style={{ gridTemplateColumns: `90px repeat(7, 1fr)` }}>
                  <div className={`p-3 flex items-center justify-center gap-2 text-sm font-medium border-b border-gray-200 ${bgColor}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${turno === 'Manhã' ? 'bg-blue-100 text-blue-600' : turno === 'Tarde' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
                      {turno === 'Manhã' && <Sun size={16} />}{turno === 'Tarde' && <Sun size={16} />}{turno === 'Noite' && <Moon size={16} />}
                    </div>
                    <span className="text-gray-700">{turno}</span>
                  </div>
                  
                  {diasDaSemana.map((dia, idx) => {
                    const key = `${dia.toDateString()}_${turno}`
                    const acoesNoTurno = acoesPorDiaTurno[key] || []
                    const isToday = dia.toDateString() === new Date().toDateString()
                    
                    return (
                      <div key={idx} className={`p-1.5 border-b border-gray-200 ${idx !== 6 ? 'border-r border-gray-100' : ''} ${bgColor} ${isToday ? 'border-l-2 border-l-purple-400' : ''}`}>
                        <div className="space-y-1.5 min-h-[130px]">
                          {acoesNoTurno.length === 0 ? (<div className="h-full flex items-center justify-center py-6"><div className="w-1 h-1 rounded-full bg-gray-300"></div></div>) : (
                            acoesNoTurno.map((acao, acaoIdx) => {
                              const setorCriador = setores.find(s => s.id === acao.setor_id)
                              const tipoAcao = tiposAcoes.find(t => t.id === acao.tipo_acao_id)
                              const nomeTipo = tipoAcao?.nome || 'Ação'
                              const acaoOriginal = acoes.find(a => a.id === acao.id)
                              const borderColor = acao.status === 'Realizada' ? 'border-l-green-500' : acao.status === 'Realizada Parcialmente' ? 'border-l-blue-500' : acao.status === 'Cancelada' ? 'border-l-red-500' : acao.status === 'Reagendada' ? 'border-l-purple-500' : 'border-l-amber-500'
                              
                              return (
                                <div key={acaoIdx} onClick={() => setModalAcao(acaoOriginal)} className={`rounded-md p-2 text-xs border-l-4 ${borderColor} bg-white shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]`}>
                                  <div className="flex items-center justify-between mb-1.5"><div className="flex flex-1 items-center justify-between gap-1 text-gray-400"><Clock size={10} className="text-gray-700" /><span className="text-[10px] font-mono font-medium text-gray-600">{acao.horario}</span>{acao.status === 'Pendente' && <span className="ml-auto text-amber-500 font-bold">Pendente</span>}{acao.status === 'Realizada' && <span className="ml-auto text-green-500 font-bold">Realizada</span>}{acao.status === 'Cancelada' && <span className="ml-auto text-red-500 font-bold">Cancelada</span>}</div></div>
                                  <p className="text-[11px] font-semibold text-gray-800 mb-1 line-clamp-2 leading-tight">{nomeTipo.length > 30 ? nomeTipo.substring(0, 20) + '…' : nomeTipo}</p>
                                  {acao.local && (<div className="flex items-center gap-1 mb-1 text-gray-700"><MapPin size={9} /><span className="text-[9px] truncate">{acao.local.length > 22 ? acao.local.substring(0, 32) + '…' : acao.local}</span></div>)}
                                  <div className="flex items-center gap-1 text-gray-700"><Building2 size={9} /><span className="text-[9px] truncate">{setorCriador?.nome?.length > 18 ? setorCriador.nome.substring(0, 18) + '…' : setorCriador?.nome || 'N/I'}</span>{acao.necessita_transporte && <Car size={14} className="text-blue-500 ml-auto" />}</div>
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
        
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-xs"><span className="text-gray-500 font-bold">Status:</span><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span>Pendente</span></div><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>Realizada</span></div><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span>Parcial</span></div><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span>Cancelada</span></div></div>
          <div className="flex items-center gap-3 text-xs text-gray-400"><div className="flex text-blue-500 items-center gap-1"><Car size={16} className="text-blue-500" /><span className='font-semibold'>Transporte</span></div></div>
        </div>
      </div>

      {/* GRÁFICOS PRINCIPAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border"><h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><CheckCircle size={20} className="text-purple-600" /> Status das Ações</h2><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={dadosStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}>{dadosStatus.map((entry, index) => <Cell key={index} fill={entry.color} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>

        {dadosPorTurno.length > 0 && (<div className="bg-white p-6 rounded-xl shadow-sm border"><h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock size={20} className="text-orange-500" /> Ações por Turno</h2><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={dadosPorTurno} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>{dadosPorTurno.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>)}

        {dadosPorTipoAcao.length > 0 && (<div className="bg-white p-6 rounded-xl shadow-sm border"><h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><List size={20} className="text-cyan-500" /> Ações por Tipo</h2><ResponsiveContainer width="100%" height={300}><BarChart data={dadosPorTipoAcao} layout="vertical" margin={{ left: 80 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis type="category" dataKey="name" width={100} /><Tooltip /><Bar dataKey="value" fill="#06b6d4" name="Quantidade" /></BarChart></ResponsiveContainer></div>)}

        {dadosPorSetor.length > 0 && (<div className="bg-white p-6 rounded-xl shadow-sm border"><h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Building2 size={20} className="text-purple-600" /> Ações por Setor</h2><ResponsiveContainer width="100%" height={300}><BarChart data={dadosPorSetor} layout="vertical" margin={{ left: 80 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis type="category" dataKey="nome" /><Tooltip /><Legend /><Bar dataKey="total" fill="#7114dd" name="Total" /><Bar dataKey="realizadas" fill="#22c55e" name="Realizadas" /><Bar dataKey="pendentes" fill="#facc15" name="Pendentes" /></BarChart></ResponsiveContainer></div>)}

        {dadosMensais.length > 0 && (<div className="bg-white p-6 rounded-xl shadow-sm border"><h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-purple-500" /> Tendência Mensal</h2><ResponsiveContainer width="100%" height={300}><LineChart data={dadosMensais}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mes" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="total" stroke="#7114dd" name="Total" strokeWidth={2} /><Line type="monotone" dataKey="realizadas" stroke="#22c55e" name="Realizadas" strokeWidth={2} /></LineChart></ResponsiveContainer></div>)}

        {dadosParticipantes.length > 0 && (<div className="bg-white p-6 rounded-xl shadow-sm border"><h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Users size={20} className="text-orange-500" /> Top 10 Participantes</h2><ResponsiveContainer width="100%" height={300}><BarChart data={dadosParticipantes} layout="vertical" margin={{ left: 100 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis type="category" dataKey="name" width={100} /><Tooltip /><Bar dataKey="value" fill="#f97316" name="Quantidade" /></BarChart></ResponsiveContainer></div>)}
      </div>

      {/* GRÁFICOS DOS CAMPOS EXTRAS */}
      {filterTipoAcao !== 'todos' && graficosExtras.length > 0 && (
        <div className="mt-6">
          <button onClick={() => setExpandirGraficosExtras(!expandirGraficosExtras)} className="w-full flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-all mb-4">
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"><Eye size={20} className="text-purple-600" /></div><div><h3 className="font-semibold text-gray-800">Análise por Campos Específicos</h3><p className="text-sm text-gray-500">{graficosExtras.length} {graficosExtras.length === 1 ? 'parâmetro' : 'parâmetros'} disponíveis</p></div></div>
            <div className="flex items-center gap-2 text-purple-600"><span className="text-sm font-medium">{expandirGraficosExtras ? 'Ocultar' : 'Visualizar'}</span>{expandirGraficosExtras ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
          </button>
          {expandirGraficosExtras && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {graficosExtras.map((grafico, idx) => (
                <div key={grafico.label} className="bg-white p-6 rounded-xl shadow-sm border">
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Package size={20} className="text-cyan-500" /> {grafico.label}</h2>
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

      {/* Modal de Detalhes da Ação */}
      {modalAcao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalAcao(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Detalhes da Ação</h2>
              <button onClick={() => setModalAcao(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-400 uppercase">Tipo</label><p className="font-medium">{tiposAcoes.find(t => t.id === modalAcao.tipo_acao_id)?.nome || 'N/A'}</p></div>
                <div><label className="text-xs text-gray-400 uppercase">Status</label><p className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${modalAcao.status === 'Realizada' ? 'bg-green-100 text-green-700' : modalAcao.status === 'Cancelada' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{modalAcao.status || 'Pendente'}</p></div>
                <div><label className="text-xs text-gray-400 uppercase">Setor</label><p>{setores.find(s => s.id === modalAcao.setor_id)?.nome || 'N/I'}</p></div>
                <div><label className="text-xs text-gray-400 uppercase">Data/Hora</label><p>{modalAcao.data_inicio ? new Date(modalAcao.data_inicio).toLocaleString('pt-BR') : 'N/A'}</p></div>
                <div><label className="text-xs text-gray-400 uppercase">Local</label><p>{modalAcao.local || 'Não informado'}</p></div>
                <div><label className="text-xs text-gray-400 uppercase">Transporte</label><p>{modalAcao.necessita_transporte ? 'Sim' : 'Não'}</p></div>
                <div className="col-span-2"><label className="text-xs text-gray-400 uppercase">Participantes</label><p>{(modalAcao.pessoas || []).join(', ') || 'Nenhum'}</p></div>
                <div className="col-span-2"><label className="text-xs text-gray-400 uppercase">Descrição</label><div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">{modalAcao.descricao || 'Sem descrição'}</div></div>
                <div className="col-span-2"><label className="text-xs text-gray-400 uppercase">Observações</label><div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">{modalAcao.observacoes || 'Sem observações'}</div></div>
                <div><label className="text-xs text-gray-400 uppercase">Criado por</label><p>{getUsuarioNome(modalAcao.created_by)}</p></div>
                <div><label className="text-xs text-gray-400 uppercase">Criado em</label><p>{modalAcao.created_at ? new Date(modalAcao.created_at).toLocaleString('pt-BR') : 'N/A'}</p></div>
                <div><label className="text-xs text-gray-400 uppercase">Atualizado por</label><p>{getUsuarioNome(modalAcao.updated_by)}</p></div>
                <div><label className="text-xs text-gray-400 uppercase">Atualizado em</label><p>{modalAcao.updated_at ? new Date(modalAcao.updated_at).toLocaleString('pt-BR') : 'N/A'}</p></div>
              </div>
            </div>
          </div>
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