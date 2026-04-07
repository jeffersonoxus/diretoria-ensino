'use client'

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Plus, 
  Pencil, 
  Trash2, 
  School,
  TrendingUp,
  BarChart3,
  PieChart,
  Filter,
  X,
  Eye,
  ChevronDown,
  ChevronUp,
  Users,
  Target,
  BookOpen,
  ExternalLink,
  AlertCircle,
  Download
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { 
  ESCOLAS_OPCOES, 
  DISCIPLINAS_OPCOES,
  getSeriesEJA,
  getHabilidadesByModalidadeEDisciplina,  // Certifique-se que é esta a função importada
  type Habilidade
} from "@/lib/dadosAvaliacao"

// --- Interfaces ---

interface ResultadoHabilidade {
  codigo: string
  descricao: string
  percentual: number
}

interface ResultadoPadrao {
  insuficiente: number
  basico: number
  proficiente: number
  avancado: number
}

interface Avaliacao {
  id: string
  ano: number
  titulo: string
  modalidade: string
  serie: string
  escola: string
  disciplina: string  // NOVO CAMPO
  tipo_resultado: 'padrao' | 'habilidade'
  alunos_matriculados: number
  alunos_avaliados: number
  nao_informou_quantitativo?: boolean
  resultado_padrao?: ResultadoPadrao
  habilidades_selecionadas?: ResultadoHabilidade[]
  created_at: string
  created_by?: string
  updated_at?: string
  updated_by?: string
}

// Opções estáticas - APENAS EJA
const MODALIDADES_OPCOES = [
  "EJA 1º segmento",
  "EJA 2º segmento"
]

// Cores originais para os gráficos
const CORES_NIVEIS = {
  insuficiente: '#FF6B6B',
  basico: '#FFB347',
  proficiente: '#4ECDC4',
  avancado: '#45B7D1'
}

// Tipos de gráfico
type TipoGrafico = 'barras' | 'pizza' | 'area' | 'radar'

// Componente do Card de Resultado Ensino Fundamental (menos destaque)
function CardEnsinoFundamental() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <School size={18} className="text-gray-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Ensino Fundamental</h3>
            <p className="text-xs text-gray-400">
              Resultados gerenciados por sistema parceiro
            </p>
          </div>
        </div>
        <a
          href="https://sistemaavaliacao.ensinofundamental.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          Acessar
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  )
}

// Componente de Cabeçalho de Filtros para exibição
function FiltrosHeader({ filtros }: { filtros: any }) {
  const temFiltros = filtros.ano || filtros.modalidade || filtros.serie || filtros.escola || filtros.habilidade
  
  if (!temFiltros) return null
  
  return (
    <div className="bg-linear-to-r from-indigo-50 to-blue-50 rounded-xl p-4 mb-6 border border-indigo-100">
      <h3 className="text-sm font-semibold text-indigo-800 mb-2 flex items-center gap-2">
        <Filter size={14} />
        Filtros aplicados:
      </h3>
      <div className="flex flex-wrap gap-2 text-xs">
        {filtros.ano && (
          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Ano: {filtros.ano}</span>
        )}
        {filtros.modalidade && (
          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Modalidade: {filtros.modalidade}</span>
        )}
        {filtros.serie && (
          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Série: {filtros.serie}</span>
        )}
        {filtros.escola && (
          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Escola: {filtros.escola}</span>
        )}
        {filtros.habilidade && (
          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Habilidade: {filtros.habilidade}</span>
        )}
      </div>
    </div>
  )
}

// Componente de Título Dinâmico para Gráficos
function GraficoTitulo({ filtros }: { filtros: any }) {
  const partes = []
  
  if (filtros.escola) {
    partes.push(`Escola: ${filtros.escola}`)
  }
  if (filtros.modalidade) {
    const segmento = filtros.modalidade === 'EJA 1º segmento' ? '1º Segmento' : '2º Segmento'
    partes.push(`Segmento: ${segmento}`)
  }
  if (filtros.serie) {
    partes.push(`Turma: ${filtros.serie}`)
  }
  
  if (partes.length === 0) {
    return (
      <div className="mb-6">
        <h3 className="text-xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Análise Geral da Rede
        </h3>
        <p className="text-sm text-gray-500 mt-1">Visão consolidada de todas as avaliações</p>
      </div>
    )
  }
  
  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        Análise Detalhada
      </h3>
      <div className="flex flex-wrap gap-2 mt-2">
        {partes.map((part, index) => (
          <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700">
            {part}
          </span>
        ))}
      </div>
    </div>
  )
}

// Componente Modal corrigido - 80% da tela
function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {/* Overlay com fundo escuro */}
        <div 
          className="fixed inset-0 transition-opacity" 
          onClick={onClose}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        ></div>
        
        {/* Modal - 80% da largura em telas grandes, 95% em telas pequenas */}
        <div 
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[60vw] mx-auto transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho do Modal */}
          <div className="px-6 py-4 bg-linear-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
            <h3 className="text-lg font-medium text-white">{title}</h3>
          </div>
          
          {/* Corpo do Modal com scroll */}
          <div className="max-h-[80vh] overflow-y-auto p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// Tooltip customizado para gráficos
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
        <p className="font-semibold text-gray-800">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value} {entry.unit || ''}
            {entry.payload.percentual && ` (${entry.payload.percentual}%)`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function AvaliacoesDiagnosticas() {
  const supabase = createClient()
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [userPerfilId, setUserPerfilId] = useState<string | null>(null)
  const [errosValidacao, setErrosValidacao] = useState<Record<string, string>>({})
  const [naoInformouQuantitativo, setNaoInformouQuantitativo] = useState(false)
  const [tipoGrafico, setTipoGrafico] = useState<TipoGrafico>('barras')
  
  // Filtros
  const [filtroAno, setFiltroAno] = useState<string>('')
  const [filtroModalidade, setFiltroModalidade] = useState<string>('')
  const [filtroSerie, setFiltroSerie] = useState<string>('')
  const [filtroEscola, setFiltroEscola] = useState<string>('')
  const [filtroHabilidade, setFiltroHabilidade] = useState<string>('')
  const [tipoVisualizacao, setTipoVisualizacao] = useState<'tabela' | 'graficos'>('graficos')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  
  // Estado do Formulário
  const [formData, setFormData] = useState({
    ano: new Date().getFullYear(),
    titulo: '',
    escola: '',      // 1º - Escola
    modalidade: '',  // 2º - Modalidade
    serie: '',       // 3º - Série
    disciplina: '',  // 4º - Disciplina (NOVO)
    tipo_resultado: 'padrao' as 'padrao' | 'habilidade',
    alunos_matriculados: 0,
    alunos_avaliados: 0,
    resultado_padrao: {
      insuficiente: 0,
      basico: 0,
      proficiente: 0,
      avancado: 0
    } as ResultadoPadrao,
    habilidades_selecionadas: [] as ResultadoHabilidade[]
  })

  // Buscar perfil do usuário atual
  const getCurrentUserPerfil = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) return null
      
      const { data: perfil, error: perfilError } = await supabase
        .from('perfis')
        .select('id')
        .eq('email', user.email)
        .single()
      
      if (perfilError && perfilError.code === 'PGRST116') {
        const novoPerfil = {
          id: user.id,
          nome: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
          email: user.email
        }
        const { data: novoPerfilData, error: createError } = await supabase
          .from('perfis')
          .insert([novoPerfil])
          .select('id')
          .single()
        
        if (createError) throw createError
        if (novoPerfilData) {
          setUserPerfilId(novoPerfilData.id)
          return novoPerfilData.id
        }
      } else if (perfil) {
        setUserPerfilId(perfil.id)
        return perfil.id
      }
      return null
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
      return null
    }
  }

  // Buscar avaliações
  const fetchAvaliacoes = async () => {
    try {
      let query = supabase
        .from('avaliacoes_diagnosticas')
        .select('*')
        .order('ano', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (filtroAno) {
        query = query.eq('ano', parseInt(filtroAno))
      }
      if (filtroModalidade) {
        query = query.eq('modalidade', filtroModalidade)
      }
      if (filtroSerie) {
        query = query.eq('serie', filtroSerie)
      }
      if (filtroEscola) {
        query = query.eq('escola', filtroEscola)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      let dadosFiltrados = data || []
      if (filtroHabilidade && filtroHabilidade !== '') {
        dadosFiltrados = dadosFiltrados.filter(av => 
          av.habilidades_selecionadas?.some((h: ResultadoHabilidade) => 
            h.codigo === filtroHabilidade
          )
        )
      }
      
      setAvaliacoes(dadosFiltrados)
    } catch (error) {
      console.error("Erro ao carregar avaliações:", error)
      setError("Erro ao carregar avaliações")
    } finally {
      setLoading(false)
    }
  }

  // Inicialização
  useEffect(() => {
    const init = async () => {
      await getCurrentUserPerfil()
      await fetchAvaliacoes()
    }
    init()
  }, [])

  // Recarregar quando filtros mudarem
  useEffect(() => {
    fetchAvaliacoes()
  }, [filtroAno, filtroModalidade, filtroSerie, filtroEscola, filtroHabilidade])

  const resetForm = () => {
    setFormData({
      ano: new Date().getFullYear(),
      titulo: '',
      escola: '',
      modalidade: '',
      serie: '',
      disciplina: '',  // NOVO
      tipo_resultado: 'padrao',
      alunos_matriculados: 0,
      alunos_avaliados: 0,
      resultado_padrao: {
        insuficiente: 0,
        basico: 0,
        proficiente: 0,
        avancado: 0
      },
      habilidades_selecionadas: []
    })
    setNaoInformouQuantitativo(false)
    setEditandoId(null)
    setErrosValidacao({})
  }

  const adicionarHabilidade = (habilidade: Habilidade) => {
    if (formData.habilidades_selecionadas.some(h => h.codigo === habilidade.codigo)) {
      alert("Esta habilidade já foi adicionada")
      return
    }
    
    setFormData({
      ...formData,
      habilidades_selecionadas: [
        ...formData.habilidades_selecionadas,
        { codigo: habilidade.codigo, descricao: habilidade.descricao, percentual: 0 }
      ]
    })
  }

  const removerHabilidade = (codigo: string) => {
    setFormData({
      ...formData,
      habilidades_selecionadas: formData.habilidades_selecionadas.filter(h => h.codigo !== codigo)
    })
  }

  const atualizarPercentualHabilidade = (codigo: string, percentual: number) => {
    if (percentual < 0 || percentual > 100) return
    
    setFormData({
      ...formData,
      habilidades_selecionadas: formData.habilidades_selecionadas.map(h =>
        h.codigo === codigo ? { ...h, percentual } : h
      )
    })
  }

  const atualizarResultadoPadrao = (tipo: keyof ResultadoPadrao, valor: number) => {
    setFormData({
      ...formData,
      resultado_padrao: {
        ...formData.resultado_padrao,
        [tipo]: valor
      }
    })
  }

  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {}
    
    if (!formData.titulo.trim()) {
      novosErros.titulo = "O título da avaliação é obrigatório"
    }

    if (!formData.escola) {
      novosErros.escola = "Selecione a escola"
    }
    
    if (!formData.modalidade) {
      novosErros.modalidade = "Selecione uma modalidade"
    }
    
    if (!formData.serie) {
      novosErros.serie = "Selecione a série/período"
    }
    
    if (!formData.disciplina) {  // 4º - NOVO
      novosErros.disciplina = "Selecione a disciplina"
    }
    
    if (formData.tipo_resultado === 'padrao') {
      if (formData.alunos_matriculados === 0) {
        novosErros.matriculados = "Informe o número de alunos matriculados"
      }
      
      if (formData.alunos_avaliados === 0) {
        novosErros.avaliados = "Informe o número de alunos avaliados"
      } else if (formData.alunos_avaliados > formData.alunos_matriculados) {
        novosErros.avaliados = "Número de alunos avaliados não pode ser maior que matriculados"
      }
      
      const totalResultados = Object.values(formData.resultado_padrao).reduce((sum, val) => sum + val, 0)
      
      if (totalResultados === 0) {
        novosErros.resultado = "Informe pelo menos um quantitativo de resultado"
      } else if (totalResultados !== formData.alunos_avaliados) {
        novosErros.resultado = `A soma dos resultados (${totalResultados}) deve ser igual ao total de alunos avaliados (${formData.alunos_avaliados})`
      }
    } else if (formData.tipo_resultado === 'habilidade') {
      if (formData.habilidades_selecionadas.length === 0) {
        novosErros.habilidades = "Adicione pelo menos uma habilidade"
      }
    }
    
    setErrosValidacao(novosErros)
    return Object.keys(novosErros).length === 0
  }

  const handleSalvar = async () => {
    if (!validarFormulario()) {
      const primeiroErro = document.querySelector('.border-red-500')
      if (primeiroErro) {
        primeiroErro.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    try {
      const dados = {
        ano: formData.ano,
        titulo: formData.titulo,
        modalidade: formData.modalidade,
        serie: formData.serie,
        escola: formData.escola,
        disciplina: formData.disciplina,
        tipo_resultado: formData.tipo_resultado,
        alunos_matriculados: formData.tipo_resultado === 'padrao' ? formData.alunos_matriculados : (naoInformouQuantitativo ? 0 : formData.alunos_matriculados),
        alunos_avaliados: formData.tipo_resultado === 'padrao' ? formData.alunos_avaliados : (naoInformouQuantitativo ? 0 : formData.alunos_avaliados),
        nao_informou_quantitativo: formData.tipo_resultado === 'habilidade' ? naoInformouQuantitativo : false,
        resultado_padrao: formData.tipo_resultado === 'padrao' ? formData.resultado_padrao : null,
        habilidades_selecionadas: formData.tipo_resultado === 'habilidade' ? formData.habilidades_selecionadas : null,
        updated_at: new Date().toISOString(),
        updated_by: userPerfilId
      }

      let error
      if (editandoId) {
        const { error: updateError } = await supabase
          .from('avaliacoes_diagnosticas')
          .update(dados)
          .eq('id', editandoId)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('avaliacoes_diagnosticas')
          .insert([{
            ...dados,
            created_at: new Date().toISOString(),
            created_by: userPerfilId
          }])
        error = insertError
      }

      if (error) throw error

      resetForm()
      setMostrarFormulario(false)
      fetchAvaliacoes()
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao salvar avaliação")
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta avaliação?")) return
    
    try {
      const { error } = await supabase
        .from('avaliacoes_diagnosticas')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchAvaliacoes()
    } catch (error) {
      console.error("Erro ao excluir:", error)
      alert("Erro ao excluir avaliação")
    }
  }

  const handleEditar = (avaliacao: Avaliacao) => {
    setFormData({
      ano: avaliacao.ano,
      titulo: avaliacao.titulo,
      modalidade: avaliacao.modalidade,
      serie: avaliacao.serie,
      disciplina: avaliacao.disciplina,  // NOVO
      escola: avaliacao.escola,
      tipo_resultado: avaliacao.tipo_resultado,
      alunos_matriculados: avaliacao.alunos_matriculados,
      alunos_avaliados: avaliacao.alunos_avaliados,
      resultado_padrao: avaliacao.resultado_padrao || {
        insuficiente: 0,
        basico: 0,
        proficiente: 0,
        avancado: 0
      },
      habilidades_selecionadas: avaliacao.habilidades_selecionadas || []
    })
    setNaoInformouQuantitativo(avaliacao.nao_informou_quantitativo || false)
    setEditandoId(avaliacao.id)
    setMostrarFormulario(true)
    setErrosValidacao({})
  }

  // Preparar dados para gráficos
  const getDadosGraficoResultadoPadrao = () => {
    const totalizador = {
      insuficiente: 0,
      basico: 0,
      proficiente: 0,
      avancado: 0
    }
    
    let totalAlunos = 0
    
    avaliacoes.forEach(av => {
      if (av.resultado_padrao) {
        totalizador.insuficiente += av.resultado_padrao.insuficiente
        totalizador.basico += av.resultado_padrao.basico
        totalizador.proficiente += av.resultado_padrao.proficiente
        totalizador.avancado += av.resultado_padrao.avancado
        totalAlunos += (av.resultado_padrao.insuficiente + av.resultado_padrao.basico + av.resultado_padrao.proficiente + av.resultado_padrao.avancado)
      }
    })
    
    return Object.entries(totalizador).map(([name, value]) => ({ 
      name: name === 'insuficiente' ? 'Insuficiente' : 
            name === 'basico' ? 'Básico' :
            name === 'proficiente' ? 'Proficiente' : 'Avançado',
      value,
      percentual: totalAlunos > 0 ? ((value / totalAlunos) * 100).toFixed(1) : '0',
      cor: CORES_NIVEIS[name as keyof typeof CORES_NIVEIS]
    }))
  }

  const getDadosGraficoHabilidades = () => {
    const habilidadesMap = new Map<string, { descricao: string, percentuais: number[], count: number }>()
    
    avaliacoes.forEach(av => {
      if (av.habilidades_selecionadas) {
        av.habilidades_selecionadas.forEach(h => {
          if (!habilidadesMap.has(h.codigo)) {
            habilidadesMap.set(h.codigo, { descricao: h.descricao, percentuais: [], count: 0 })
          }
          const item = habilidadesMap.get(h.codigo)!
          item.percentuais.push(h.percentual)
          item.count++
        })
      }
    })
    
    return Array.from(habilidadesMap.entries()).map(([codigo, data]) => ({
      codigo,
      descricao: data.descricao.length > 30 ? data.descricao.substring(0, 30) + '...' : data.descricao,
      media: data.percentuais.reduce((a, b) => a + b, 0) / data.count
    }))
  }

  const getDadosGraficoParticipacao = () => {
    const avaliacoesComDados = avaliacoes.filter(av => av.alunos_matriculados > 0)
    return avaliacoesComDados.map(av => ({
      nome: av.titulo.length > 20 ? av.titulo.substring(0, 20) + '...' : av.titulo,
      matriculados: av.alunos_matriculados,
      avaliados: av.alunos_avaliados,
      participacao: ((av.alunos_avaliados / av.alunos_matriculados) * 100).toFixed(1)
    }))
  }

  const calcularTaxaParticipacao = () => {
    const avaliacoesComDados = avaliacoes.filter(av => av.alunos_matriculados > 0)
    if (avaliacoesComDados.length === 0) return 0
    const totalMatriculados = avaliacoesComDados.reduce((sum, av) => sum + av.alunos_matriculados, 0)
    const totalAvaliados = avaliacoesComDados.reduce((sum, av) => sum + av.alunos_avaliados, 0)
    return (totalAvaliados / totalMatriculados) * 100
  }

  const anosDisponiveis = [...new Set(avaliacoes.map(av => av.ano))].sort((a,b) => b - a)
  const seriesDisponiveis = formData.modalidade ? getSeriesEJA(formData.modalidade) : []
  const habilidadesDisponiveis = formData.modalidade && formData.disciplina ? 
  getHabilidadesByModalidadeEDisciplina(formData.modalidade, formData.disciplina) : []
  const escolasDisponiveis = ESCOLAS_OPCOES

  // Objeto de filtros para exibição
  const filtrosAplicados = {
    ano: filtroAno,
    modalidade: filtroModalidade,
    serie: filtroSerie,
    escola: filtroEscola,
    habilidade: filtroHabilidade
  }

  if (loading) {
    return (
      <div className="min-h-screen text-slate-700 bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando avaliações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-slate-700 bg-linear-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                <School className="text-indigo-600" />
                Avaliações Diagnósticas - EJA
              </h1>
              <p className="text-gray-500 mt-1">
                Gerencie as avaliações da Educação de Jovens e Adultos (EJA)
              </p>
            </div>
            <button
              onClick={() => {
                resetForm()
                setMostrarFormulario(true)
              }}
              className="flex items-center gap-2 bg-linear-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-lg hover:shadow-xl"
            >
              <Plus size={20} />
              Nova Avaliação
            </button>
          </div>
        </div>

        {/* Card Ensino Fundamental com menos destaque */}
        <CardEnsinoFundamental />

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total de Avaliações</p>
                <p className="text-3xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{avaliacoes.length}</p>
              </div>
              <div className="w-12 h-12 bg-linear-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                <School size={24} className="text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Taxa de Participação</p>
                <p className="text-3xl font-bold bg-linear-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">{calcularTaxaParticipacao().toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 bg-linear-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <Users size={24} className="text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Matriculados</p>
                <p className="text-3xl font-bold text-gray-800">
                  {avaliacoes.filter(av => av.alunos_matriculados > 0).reduce((sum, av) => sum + av.alunos_matriculados, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-linear-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center">
                <Users size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Avaliados</p>
                <p className="text-3xl font-bold text-gray-800">
                  {avaliacoes.filter(av => av.alunos_avaliados > 0).reduce((sum, av) => sum + av.alunos_avaliados, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-linear-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                <Target size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-6">
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="flex items-center justify-between w-full md:w-auto group"
          >
            <div className="flex items-center gap-2 text-gray-700 group-hover:text-indigo-600 transition">
              <Filter size={20} />
              <span className="font-medium">Filtros</span>
            </div>
            {mostrarFiltros ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
          </button>
          
          {mostrarFiltros && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-5 pt-5 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ano</label>
                <select
                  value={filtroAno}
                  onChange={(e) => setFiltroAno(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                >
                  <option value="">Todos os anos</option>
                  {anosDisponiveis.map(ano => (
                    <option key={ano} value={ano}>{ano}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modalidade</label>
                <select
                  value={filtroModalidade}
                  onChange={(e) => {
                    setFiltroModalidade(e.target.value)
                    setFiltroSerie('')
                    setFiltroHabilidade('')
                  }}
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                >
                  <option value="">Todas as modalidades</option>
                  {MODALIDADES_OPCOES.map(mod => (
                    <option key={mod} value={mod}>{mod}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Série/Período</label>
                <select
                  value={filtroSerie}
                  onChange={(e) => setFiltroSerie(e.target.value)}
                  disabled={!filtroModalidade}
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Todas as séries</option>
                  {getSeriesEJA(filtroModalidade).map(serie => (
                    <option key={serie} value={serie}>{serie}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Escola</label>
                <select
                  value={filtroEscola}
                  onChange={(e) => setFiltroEscola(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                >
                  <option value="">Todas as escolas</option>
                  {escolasDisponiveis.map(escola => (
                    <option key={escola} value={escola}>{escola}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Habilidade</label>
                <select
                  value={filtroHabilidade}
                  onChange={(e) => setFiltroHabilidade(e.target.value)}
                  disabled={!filtroModalidade}
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Todas as habilidades</option>
                  {filtroModalidade ? getHabilidadesByModalidadeEDisciplina(filtroModalidade, '').map(h => (
                    <option key={h.codigo} value={h.codigo}>
                      {h.codigo} - {h.descricao.substring(0, 40)}...
                    </option>
                  )) : <option value="">Selecione uma modalidade primeiro</option>}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Botões de Visualização */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setTipoVisualizacao('tabela')}
            className={`px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium ${
              tipoVisualizacao === 'tabela'
                ? 'bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Eye size={18} />
            Tabela
          </button>
          <button
            onClick={() => setTipoVisualizacao('graficos')}
            className={`px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium ${
              tipoVisualizacao === 'graficos'
                ? 'bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <BarChart3 size={18} />
            Gráficos
          </button>
        </div>

        {/* Filtros aplicados */}
        <FiltrosHeader filtros={filtrosAplicados} />

        {/* Visualização em Gráficos */}
        {tipoVisualizacao === 'graficos' && avaliacoes.length > 0 && (
          <div className="space-y-8">
            {/* Controles de tipo de gráfico */}
            <div className="bg-white rounded-2xl shadow-lg p-5 flex items-center justify-between flex-wrap gap-4">
              <GraficoTitulo filtros={filtrosAplicados} />
              <div className="flex gap-2">
                <button
                  onClick={() => setTipoGrafico('barras')}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm font-medium ${
                    tipoGrafico === 'barras'
                      ? 'bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <BarChart3 size={16} />
                  Barras
                </button>
                <button
                  onClick={() => setTipoGrafico('pizza')}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm font-medium ${
                    tipoGrafico === 'pizza'
                      ? 'bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <PieChart size={16} />
                  Pizza
                </button>
                <button
                  onClick={() => setTipoGrafico('area')}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm font-medium ${
                    tipoGrafico === 'area'
                      ? 'bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <TrendingUp size={16} />
                  Área
                </button>
              </div>
            </div>

            {/* Gráfico de Resultado Padrão - Cores originais */}
            {getDadosGraficoResultadoPadrao().some(d => d.value > 0) && (
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <BarChart3 size={20} className="text-indigo-600" />
                  Distribuição por Nível de Proficiência
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  {tipoGrafico === 'barras' && (
                    <BarChart data={getDadosGraficoResultadoPadrao()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: 20 }} />
                      <Bar dataKey="value" name="Quantidade de Alunos" radius={[8, 8, 0, 0]}>
                        {getDadosGraficoResultadoPadrao().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                  {tipoGrafico === 'pizza' && (
                    <RePieChart>
                      <Pie
                        data={getDadosGraficoResultadoPadrao()}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => {
                          if (percent === undefined) return `${name}: 0%`
                          return `${name}: ${(percent * 100).toFixed(1)}%`
                        }}
                        outerRadius={140}
                        dataKey="value"
                      >
                        {getDadosGraficoResultadoPadrao().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: 20 }} />
                    </RePieChart>
                  )}
                  {tipoGrafico === 'area' && (
                    <AreaChart data={getDadosGraficoResultadoPadrao()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="areaInsuficiente" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="areaBasico" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FFB347" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#FFB347" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="areaProficiente" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="areaAvancado" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#45B7D1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#45B7D1" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        name="Quantidade de Alunos" 
                        stroke="#8884d8" 
                        fillOpacity={1} 
                        fill="url(#areaProficiente)" 
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}

            {/* Gráfico de Habilidades */}
            {getDadosGraficoHabilidades().length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Target size={20} className="text-purple-600" />
                  Média de Aproveitamento por Habilidade
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getDadosGraficoHabilidades()} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis type="category" dataKey="codigo" width={80} tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: 20 }} />
                    <Bar dataKey="media" name="Média de Aproveitamento" radius={[0, 8, 8, 0]} fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Gráfico de Participação */}
            {getDadosGraficoParticipacao().length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Users size={20} className="text-green-600" />
                  Participação por Avaliação
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getDadosGraficoParticipacao()} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="nome" angle={-45} textAnchor="end" height={80} tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: 20 }} />
                    <Bar dataKey="matriculados" name="Matriculados" radius={[8, 8, 0, 0]} fill="#8884d8" />
                    <Bar dataKey="avaliados" name="Avaliados" radius={[8, 8, 0, 0]} fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Tabela de Dados */}
        {tipoVisualizacao === 'tabela' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {avaliacoes.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <School size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">Nenhuma avaliação encontrada</p>
                <p className="text-sm text-gray-400 mt-2">
                  Clique em "Nova Avaliação" para começar
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ano</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Título</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Escola</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Modalidade</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Série</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Matriculados</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Avaliados</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Resultado</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {avaliacoes.map((av) => {
                      const totalAlunos = av.resultado_padrao ? 
                        av.resultado_padrao.insuficiente + av.resultado_padrao.basico + 
                        av.resultado_padrao.proficiente + av.resultado_padrao.avancado : 0
                      
                      const resultadoDisplay = av.tipo_resultado === 'padrao' && av.resultado_padrao ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <span className="text-xs text-gray-600">Insuficiente:</span>
                            </div>
                            <span className="font-semibold text-sm text-gray-800">{av.resultado_padrao.insuficiente} <span className="text-gray-400 text-xs">({totalAlunos > 0 ? ((av.resultado_padrao.insuficiente / totalAlunos) * 100).toFixed(1) : 0}%)</span></span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              <span className="text-xs text-gray-600">Básico:</span>
                            </div>
                            <span className="font-semibold text-sm text-gray-800">{av.resultado_padrao.basico} <span className="text-gray-400 text-xs">({totalAlunos > 0 ? ((av.resultado_padrao.basico / totalAlunos) * 100).toFixed(1) : 0}%)</span></span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <span className="text-xs text-gray-600">Proficiente:</span>
                            </div>
                            <span className="font-semibold text-sm text-gray-800">{av.resultado_padrao.proficiente} <span className="text-gray-400 text-xs">({totalAlunos > 0 ? ((av.resultado_padrao.proficiente / totalAlunos) * 100).toFixed(1) : 0}%)</span></span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span className="text-xs text-gray-600">Avançado:</span>
                            </div>
                            <span className="font-semibold text-sm text-gray-800">{av.resultado_padrao.avancado} <span className="text-gray-400 text-xs">({totalAlunos > 0 ? ((av.resultado_padrao.avancado / totalAlunos) * 100).toFixed(1) : 0}%)</span></span>
                          </div>
                        </div>
                      ) : av.tipo_resultado === 'habilidade' && av.habilidades_selecionadas ? (
                        <div className="flex flex-wrap gap-1.5">
                          {av.habilidades_selecionadas.slice(0, 2).map((h, idx) => (
                            <span key={idx} className="text-xs bg-linear-to-r from-indigo-100 to-purple-100 text-indigo-700 px-2 py-1 rounded-full" title={`${h.descricao}: ${h.percentual}%`}>
                              {h.codigo}: {h.percentual}%
                            </span>
                          ))}
                          {av.habilidades_selecionadas.length > 2 && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              +{av.habilidades_selecionadas.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )
                      
                      return (
                        <tr key={av.id} className="hover:bg-linear-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{av.ano}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate" title={av.titulo}>
                            {av.titulo}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={av.escola}>
                            {av.escola}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{av.modalidade}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{av.serie}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-800">
                            {av.nao_informou_quantitativo ? (
                              <span className="text-gray-400 text-xs">Não informado</span>
                            ) : (
                              av.alunos_matriculados
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-800">
                            {av.nao_informou_quantitativo ? (
                              <span className="text-gray-400 text-xs">Não informado</span>
                            ) : (
                              av.alunos_avaliados
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {resultadoDisplay}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <button
                              onClick={() => handleEditar(av)}
                              className="text-indigo-600 hover:text-indigo-800 mr-4 transition-colors"
                              title="Editar"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleExcluir(av.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal do Formulário - corrigido para 80% */}
        <Modal
          isOpen={mostrarFormulario}
          onClose={() => {
            resetForm()
            setMostrarFormulario(false)
          }}
          title={editandoId ? 'Editar Avaliação' : 'Nova Avaliação Diagnóstica - EJA'}
        >
          <div className="space-y-4 text-slate-700">
            {/* Linha 1: Ano e Título */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ano <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.ano}
                  onChange={(e) => setFormData({...formData, ano: parseInt(e.target.value)})}
                  className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                    errosValidacao.ano ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min={2000}
                  max={new Date().getFullYear() + 1}
                />
                {errosValidacao.ano && (
                  <p className="text-red-500 text-xs mt-1">{errosValidacao.ano}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Avaliação <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                    errosValidacao.titulo ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Avaliação Diagnóstica 1º Semestre"
                />
                {errosValidacao.titulo && (
                  <p className="text-red-500 text-xs mt-1">{errosValidacao.titulo}</p>
                )}
              </div>
            </div>

            {/* Linha 2: Escola, Modalidade, Série e Disciplina - NESTA ORDEM */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 1º - ESCOLA */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Escola <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.escola}
                    onChange={(e) => setFormData({...formData, escola: e.target.value})}
                    className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                      errosValidacao.escola ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione uma escola</option>
                    {ESCOLAS_OPCOES.map(escola => (
                      <option key={escola} value={escola}>{escola}</option>
                    ))}
                  </select>
                  {errosValidacao.escola && (
                    <p className="text-red-500 text-xs mt-1">{errosValidacao.escola}</p>
                  )}
                </div>
                
                {/* 2º - MODALIDADE */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modalidade <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.modalidade}
                    onChange={(e) => {
                      setFormData({...formData, modalidade: e.target.value, serie: '', disciplina: ''})
                    }}
                    className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                      errosValidacao.modalidade ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione</option>
                    {MODALIDADES_OPCOES.map(mod => (
                      <option key={mod} value={mod}>{mod}</option>
                    ))}
                  </select>
                  {errosValidacao.modalidade && (
                    <p className="text-red-500 text-xs mt-1">{errosValidacao.modalidade}</p>
                  )}
                </div>
                
                {/* 3º - SÉRIE/PERÍODO */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Série/Período <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.serie}
                    onChange={(e) => setFormData({...formData, serie: e.target.value})}
                    disabled={!formData.modalidade}
                    className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errosValidacao.serie ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione</option>
                    {getSeriesEJA(formData.modalidade).map(serie => (
                      <option key={serie} value={serie}>{serie}</option>
                    ))}
                  </select>
                  {errosValidacao.serie && (
                    <p className="text-red-500 text-xs mt-1">{errosValidacao.serie}</p>
                  )}
                </div>
                
                {/* 4º - DISCIPLINA */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disciplina <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.disciplina}
                    onChange={(e) => {
                      setFormData({...formData, disciplina: e.target.value, habilidades_selecionadas: []})
                    }}
                    disabled={!formData.modalidade}
                    className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errosValidacao.disciplina ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione uma disciplina</option>
                    {DISCIPLINAS_OPCOES.map(disciplina => (
                      <option key={disciplina} value={disciplina}>{disciplina}</option>
                    ))}
                  </select>
                  {errosValidacao.disciplina && (
                    <p className="text-red-500 text-xs mt-1">{errosValidacao.disciplina}</p>
                  )}
                </div>
              </div>

            {/* Restante do formulário */}
            <div className="border rounded-xl p-4 bg-gray-50">
              {formData.tipo_resultado === 'padrao' ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alunos Matriculados <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.alunos_matriculados || ''}
                      onChange={(e) => setFormData({...formData, alunos_matriculados: parseInt(e.target.value) || 0})}
                      className={`w-full p-2.5 text-slate-700 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                        errosValidacao.matriculados ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Número de alunos matriculados"
                      min={0}
                    />
                    {errosValidacao.matriculados && (
                      <p className="text-red-500 text-xs mt-1">{errosValidacao.matriculados}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alunos Avaliados <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.alunos_avaliados || ''}
                      onChange={(e) => setFormData({...formData, alunos_avaliados: parseInt(e.target.value) || 0})}
                      className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                        errosValidacao.avaliados ? 'border-red-500' : 'border-gray-300'
                      }`}
                      min={0}
                      max={formData.alunos_matriculados}
                    />
                    {errosValidacao.avaliados && (
                      <p className="text-red-500 text-xs mt-1">{errosValidacao.avaliados}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Quantitativo de Alunos
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={naoInformouQuantitativo}
                        onChange={(e) => {
                          setNaoInformouQuantitativo(e.target.checked)
                          if (e.target.checked) {
                            setFormData({...formData, alunos_matriculados: 0, alunos_avaliados: 0})
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-500">Não sei informar</span>
                    </label>
                  </div>
                  
                  {!naoInformouQuantitativo && (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Alunos Matriculados
                        </label>
                        <input
                          type="number"
                          value={formData.alunos_matriculados || ''}
                          onChange={(e) => setFormData({...formData, alunos_matriculados: parseInt(e.target.value) || 0})}
                          className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                          placeholder="Número de alunos matriculados"
                          min={0}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Alunos Avaliados
                        </label>
                        <input
                          type="number"
                          value={formData.alunos_avaliados || ''}
                          onChange={(e) => setFormData({...formData, alunos_avaliados: parseInt(e.target.value) || 0})}
                          className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                          min={0}
                          max={formData.alunos_matriculados}
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Tipo de Resultado */}
            <div className="border rounded-xl p-4">
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.tipo_resultado === 'padrao'}
                    onChange={() => setFormData({...formData, tipo_resultado: 'padrao'})}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Resultado Padrão (por nível)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.tipo_resultado === 'habilidade'}
                    onChange={() => setFormData({...formData, tipo_resultado: 'habilidade'})}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Resultado por Habilidade</span>
                </label>
              </div>
              
              {formData.tipo_resultado === 'padrao' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Quantitativo de Alunos por Nível <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-red-600 mb-2">Insuficiente</label>
                      <input
                        type="number"
                        value={formData.resultado_padrao.insuficiente}
                        onChange={(e) => atualizarResultadoPadrao('insuficiente', parseInt(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-yellow-600 mb-2">Básico</label>
                      <input
                        type="number"
                        value={formData.resultado_padrao.basico}
                        onChange={(e) => atualizarResultadoPadrao('basico', parseInt(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-blue-600 mb-2">Proficiente</label>
                      <input
                        type="number"
                        value={formData.resultado_padrao.proficiente}
                        onChange={(e) => atualizarResultadoPadrao('proficiente', parseInt(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-600 mb-2">Avançado</label>
                      <input
                        type="number"
                        value={formData.resultado_padrao.avancado}
                        onChange={(e) => atualizarResultadoPadrao('avancado', parseInt(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        min={0}
                      />
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    Total: {Object.values(formData.resultado_padrao).reduce((a, b) => a + b, 0)} alunos
                  </div>
                  {errosValidacao.resultado && (
                    <p className="text-red-500 text-xs mt-2">{errosValidacao.resultado}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <BookOpen size={16} className="inline mr-1" />
                    Habilidades Avaliadas <span className="text-red-500">*</span>
                  </label>
                  
                  {formData.modalidade && formData.disciplina ? (
                    <>
                      <div className="mb-4">
                        <select
                          onChange={(e) => {
                            const habilidade = getHabilidadesByModalidadeEDisciplina(formData.modalidade, formData.disciplina)
                              .find(h => h.codigo === e.target.value)
                            if (habilidade) adicionarHabilidade(habilidade)
                          }}
                          value=""
                          className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        >
                          <option value="">+ Adicionar habilidade...</option>
                          {getHabilidadesByModalidadeEDisciplina(formData.modalidade, formData.disciplina)
                            .filter(h => !formData.habilidades_selecionadas.some(sh => sh.codigo === h.codigo))
                            .map(h => (
                              <option key={h.codigo} value={h.codigo}>
                                {h.codigo} - {h.descricao}
                              </option>
                            ))}
                        </select>
                      </div>
                      
                      {formData.habilidades_selecionadas.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-700">Percentual de Aproveitamento por Habilidade</h4>
                          {formData.habilidades_selecionadas.map(habilidade => (
                            <div key={habilidade.codigo} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{habilidade.codigo}</p>
                                <p className="text-xs text-gray-600">{habilidade.descricao}</p>
                              </div>
                              <div className="w-48">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={habilidade.percentual}
                                    onChange={(e) => atualizarPercentualHabilidade(habilidade.codigo, parseInt(e.target.value) || 0)}
                                    className="w-20 p-2 border border-gray-300 rounded-xl text-center focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    min={0}
                                    max={100}
                                  />
                                  <span className="text-sm">%</span>
                                  <button
                                    onClick={() => removerHabilidade(habilidade.codigo)}
                                    className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                                  >
                                    <X size={18} />
                                  </button>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                  <div 
                                    className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-full h-2 transition-all"
                                    style={{ width: `${habilidade.percentual}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {errosValidacao.habilidades && (
                        <p className="text-red-500 text-xs mt-2">{errosValidacao.habilidades}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400 text-sm">
                      {!formData.modalidade ? "Selecione uma modalidade primeiro" : "Selecione uma disciplina primeiro"}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button
              onClick={handleSalvar}
              className="flex-1 bg-linear-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition font-medium shadow-md"
            >
              {editandoId ? 'Atualizar' : 'Salvar'}
            </button>
            <button
              onClick={() => {
                resetForm()
                setMostrarFormulario(false)
              }}
              className="px-6 text-white py-2.5 bg-linear-to-r from-red-600 to-red-500 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium"
            >
              Cancelar
            </button>
          </div>
        </Modal>
      </div>
    </div>
  )
}