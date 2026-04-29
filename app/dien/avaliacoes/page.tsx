'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, Pencil, Trash2, School, BarChart3, Copy, X, 
  Power, PowerOff, Target, TrendingUp, AlertCircle, Settings,
  ChevronDown, ChevronUp, Check, Users, UserCheck, UserPlus,
  Printer, Download, FileText, HelpCircle
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'
import { 
  PERIODOS, HABILIDADES_FIXAS, getHabilidadesPorPeriodo,
  TIPOS_GRAFICO, MODALIDADES_VISUALIZACAO, CORES_NIVEIS,
  calcularPercentualProficiente, calcularMediaRede,
  TipoGrafico, ModalidadeVisualizacao, gerarCodigoAcesso,
  Habilidade
} from '@/lib/dadosFixos'
import { useRouter } from 'next/navigation'
import { useSetorEJA } from '@/hooks/useSetorEJA'


interface Escola {
  id: string
  codigo: string
  nome: string
  turmas: Record<string, string[]>
  ativa: boolean
  created_at: string
}

interface Avaliacao {
  id: string
  ano: number
  titulo: string
  ativa: boolean
  data_limite_insercao: string
  tipo_avaliacao: 'niveis' | 'habilidades'
  resultados_niveis: any
  resultados_habilidades: any
  habilidades_selecionadas?: Record<string, string[]> | null
  created_at: string
}

interface ResultadoTurma {
  escola_codigo: string
  escola_nome: string
  periodo: string
  turma: string
  disciplina: string
  alunos_matriculados: number
  alunos_frequentando: number
  alunos_avaliados: number
  nivel_insuficiente: number
  nivel_basico: number
  nivel_proficiente: number
  nivel_avancado: number
  habilidades?: Record<string, { quantidade: number; percentual: number }>
}

interface DadosGrafico {
  name: string
  value: number
  percentual: string
  cor: string
}

interface DadosPorEscola {
  escola: string
  codigo: string
  insuficiente: number
  insuficienteFormatado: string
  basico: number
  basicoFormatado: string
  proficiente: number
  proficienteFormatado: string
  avancado: number
  avancadoFormatado: string
}

interface DadosHabilidadeGrafico {
  codigo: string
  descricao: string
  percentual: number
  disciplina: string
  cor: string
}

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl mx-auto" onClick={(e) => e.stopPropagation()}>
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">{title}</h3>
            <button onClick={onClose} className="text-white hover:text-gray-200"><X size={20} /></button>
          </div>
          <div className="max-h-[80vh] overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

const CORES_HABILIDADES = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#2563eb', '#7c3aed'
]

export default function AvaliacoesPage() {
  const supabase = createClient()
  const [escolas, setEscolas] = useState<Escola[]>([])
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarGerenciarEscolas, setMostrarGerenciarEscolas] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [escolaEditando, setEscolaEditando] = useState<Escola | null>(null)
  const [formData, setFormData] = useState<{
    ano: number
    titulo: string
    ativa: boolean
    data_limite_insercao: string
    tipo_avaliacao: 'niveis' | 'habilidades'
    habilidades_selecionadas: Record<string, string[]>
  }>({ 
    ano: new Date().getFullYear(), 
    titulo: '',
    ativa: true,
    data_limite_insercao: '',
    tipo_avaliacao: 'niveis',
    habilidades_selecionadas: {}
  })
  const [visualizandoResultados, setVisualizandoResultados] = useState<Avaliacao | null>(null)
  const [resultados, setResultados] = useState<ResultadoTurma[]>([])
  const [filtroEscola, setFiltroEscola] = useState<string>('')
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('')
  const [filtroDisciplina, setFiltroDisciplina] = useState<string>('todas')
  const [filtroTurma, setFiltroTurma] = useState<string>('')
  const [mostrarCodigos, setMostrarCodigos] = useState<Avaliacao | null>(null)
  const [abas, setAbas] = useState<'geral' | 'habilidades'>('geral')
  const [tipoGrafico, setTipoGrafico] = useState<TipoGrafico>('barra')
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false)
  const [filtroHabilidadeDisciplina, setFiltroHabilidadeDisciplina] = useState<string>('todas')
  const relatorioRef = useRef<HTMLDivElement>(null)
  const [imprimindo, setImprimindo] = useState(false)

  const router = useRouter()
  const { isSetorEJA, loading: loadingSetor } = useSetorEJA()

  useEffect(() => {
    if (!loadingSetor && !isSetorEJA) {
      router.push('/dien')
    }
  }, [loadingSetor, isSetorEJA, router])

  useEffect(() => {
    if (!isSetorEJA) return
    fetchEscolas()
    fetchAvaliacoes()
  }, [isSetorEJA])

  if (loadingSetor) return <div className="flex items-center justify-center h-64">Carregando...</div>
  if (!isSetorEJA) return null

  async function fetchEscolas() {
    try {
      const { data, error } = await supabase
        .from('escolas_eja')
        .select('*')
        .order('nome', { ascending: true })
      
      if (error) throw error
      if (data) setEscolas(data)
    } catch (error) {
      console.error('Erro ao buscar escolas:', error)
    }
  }

  async function fetchAvaliacoes() {
    try {
      const { data, error } = await supabase
        .from('avaliacoes_eja')
        .select('*')
        .order('ano', { ascending: false })
      
      if (error) throw error
      if (data) {
        const avaliacoesFormatadas = data.map(av => ({
          ...av,
          habilidades_selecionadas: av.habilidades_selecionadas || {}
        }))
        setAvaliacoes(avaliacoesFormatadas)
      }
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error)
    } finally {
      setLoading(false)
    }
  }

  function toggleHabilidadeSelecionada(periodo: string, habilidadeId: string) {
    setFormData(prev => {
      const novasHabilidades = { ...prev.habilidades_selecionadas }
      if (!novasHabilidades[periodo]) {
        novasHabilidades[periodo] = []
      }
      
      if (novasHabilidades[periodo].includes(habilidadeId)) {
        novasHabilidades[periodo] = novasHabilidades[periodo].filter(id => id !== habilidadeId)
      } else {
        novasHabilidades[periodo] = [...novasHabilidades[periodo], habilidadeId]
      }
      
      return { ...prev, habilidades_selecionadas: novasHabilidades }
    })
  }

  function selecionarTodasHabilidadesPeriodo(periodo: string) {
    const habilidades = HABILIDADES_FIXAS.filter(h => h.periodo === periodo)
    setFormData(prev => ({
      ...prev,
      habilidades_selecionadas: {
        ...prev.habilidades_selecionadas,
        [periodo]: habilidades.map(h => h.id)
      }
    }))
  }

  function limparHabilidadesPeriodo(periodo: string) {
    setFormData(prev => ({
      ...prev,
      habilidades_selecionadas: {
        ...prev.habilidades_selecionadas,
        [periodo]: []
      }
    }))
  }

  async function handleSalvarEscola() {
    if (!escolaEditando?.nome || !escolaEditando?.codigo) {
      setErroSalvar('Nome e código da escola são obrigatórios')
      return
    }
    
    setSalvando(true)
    setErroSalvar(null)

    try {
      const dados = {
        codigo: escolaEditando.codigo,
        nome: escolaEditando.nome,
        turmas: escolaEditando.turmas,
        ativa: escolaEditando.ativa,
        updated_at: new Date().toISOString()
      }

      let result
      if (escolaEditando.id) {
        result = await supabase
          .from('escolas_eja')
          .update(dados)
          .eq('id', escolaEditando.id)
          .select()
      } else {
        result = await supabase
          .from('escolas_eja')
          .insert([{ ...dados, created_at: new Date().toISOString() }])
          .select()
      }
      
      if (result.error) throw new Error(result.error.message)
      
      await fetchEscolas()
      setMostrarGerenciarEscolas(false)
      setEscolaEditando(null)
      
    } catch (error: any) {
      setErroSalvar(error.message || 'Erro ao salvar escola')
    } finally {
      setSalvando(false)
    }
  }

  async function handleExcluirEscola(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta escola? Isso pode afetar avaliações existentes.')) return
    
    try {
      const { error } = await supabase
        .from('escolas_eja')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      await fetchEscolas()
    } catch (error) {
      console.error('Erro ao excluir escola:', error)
      alert('Erro ao excluir escola')
    }
  }

  function atualizarTurmasEscola(periodo: string, turmas: string[]) {
    if (!escolaEditando) return
    setEscolaEditando({
      ...escolaEditando,
      turmas: {
        ...escolaEditando.turmas,
        [periodo]: turmas
      }
    })
  }

  function adicionarTurma(periodo: string) {
    if (!escolaEditando) return
    const turmasAtuais = escolaEditando.turmas[periodo] || []
    const novoNumero = turmasAtuais.length + 1
    const novaTurma = novoNumero === 1 ? periodo : `${periodo}.${novoNumero}`
    
    setEscolaEditando({
      ...escolaEditando,
      turmas: {
        ...escolaEditando.turmas,
        [periodo]: [...turmasAtuais, novaTurma]
      }
    })
  }

  function removerTurma(periodo: string, index: number) {
    if (!escolaEditando) return
    
    const turmasAtuais = escolaEditando.turmas[periodo] || []
    const novasTurmas = turmasAtuais.filter((_, i) => i !== index)
    
    setEscolaEditando({
      ...escolaEditando,
      turmas: {
        ...escolaEditando.turmas,
        [periodo]: novasTurmas
      }
    })
  }

  async function handleSalvarAvaliacao() {
    if (!formData.titulo.trim()) {
      setErroSalvar('O título da avaliação é obrigatório')
      return
    }

    if (formData.tipo_avaliacao === 'habilidades') {
      const totalHabilidades = Object.values(formData.habilidades_selecionadas).flat().length
      if (totalHabilidades === 0) {
        setErroSalvar('Selecione pelo menos uma habilidade para a avaliação por habilidades')
        return
      }
    }
    
    setSalvando(true)
    setErroSalvar(null)

    try {
      const dados: any = { 
        ano: formData.ano, 
        titulo: formData.titulo.trim(),
        ativa: formData.ativa,
        data_limite_insercao: formData.data_limite_insercao || null,
        tipo_avaliacao: formData.tipo_avaliacao,
        updated_at: new Date().toISOString()
      }

      if (formData.tipo_avaliacao === 'habilidades') {
        dados.habilidades_selecionadas = formData.habilidades_selecionadas
      } else {
        dados.habilidades_selecionadas = {}
      }

      let result
      if (editandoId) {
        result = await supabase
          .from('avaliacoes_eja')
          .update(dados)
          .eq('id', editandoId)
          .select()
      } else {
        result = await supabase
          .from('avaliacoes_eja')
          .insert([{ 
            ...dados, 
            resultados_niveis: {},
            resultados_habilidades: {},
            created_at: new Date().toISOString() 
          }])
          .select()
      }
      
      if (result.error) throw new Error(result.error.message)
      
      resetForm()
      await fetchAvaliacoes()
      
    } catch (error: any) {
      setErroSalvar(error.message || 'Erro ao salvar avaliação')
    } finally {
      setSalvando(false)
    }
  }

  async function handleToggleAtivaAvaliacao(avaliacao: Avaliacao) {
    try {
      const { error } = await supabase
        .from('avaliacoes_eja')
        .update({ ativa: !avaliacao.ativa })
        .eq('id', avaliacao.id)
      
      if (error) throw error
      await fetchAvaliacoes()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
    }
  }

  async function handleExcluirAvaliacao(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.')) return
    
    try {
      const { error } = await supabase
        .from('avaliacoes_eja')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      await fetchAvaliacoes()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir avaliação')
    }
  }

  async function verResultados(avaliacao: Avaliacao) {
    setVisualizandoResultados(avaliacao)
    setAbas('geral')
    
    const resultadosExtraidos: ResultadoTurma[] = []
    
    const resultadosFonte = avaliacao.tipo_avaliacao === 'niveis' 
      ? avaliacao.resultados_niveis 
      : avaliacao.resultados_habilidades
    
    if (resultadosFonte) {
      const resultadosObj = typeof resultadosFonte === 'string' 
        ? JSON.parse(resultadosFonte) 
        : resultadosFonte
      
      for (const [escolaCodigo, escolasResultados] of Object.entries(resultadosObj)) {
        const escola = escolas.find(e => e.codigo === escolaCodigo)
        
        for (const [periodo, periodosResultados] of Object.entries(escolasResultados as any)) {
          for (const [turma, turmaResultados] of Object.entries(periodosResultados as any)) {
            const dados = turmaResultados as any
            const alunosAvaliados = dados.avaliados || 0
            const alunosFrequentando = dados.frequentando || 0
            const alunosMatriculados = dados.matriculados || 0
            
            const habilidadesCorrigidas: Record<string, { quantidade: number; percentual: number }> = {}
            
            if (dados.habilidades) {
              for (const [habCodigo, habData] of Object.entries(dados.habilidades as any)) {
                let quantidade = (habData as any).quantidade || 0
                let percentual = (habData as any).percentual || 0
                
                if (quantidade > alunosAvaliados && alunosAvaliados > 0) {
                  quantidade = alunosAvaliados
                  percentual = (quantidade / alunosAvaliados) * 100
                }
                
                if (percentual > 100) {
                  percentual = 100
                  quantidade = alunosAvaliados
                }
                
                habilidadesCorrigidas[habCodigo] = { quantidade, percentual }
              }
            }
            
            if (avaliacao.tipo_avaliacao === 'habilidades') {
              resultadosExtraidos.push({
                escola_codigo: escolaCodigo,
                escola_nome: escola?.nome || escolaCodigo,
                periodo,
                turma,
                disciplina: 'Geral',
                alunos_matriculados: alunosMatriculados,
                alunos_frequentando: alunosFrequentando,
                alunos_avaliados: alunosAvaliados,
                nivel_insuficiente: 0,
                nivel_basico: 0,
                nivel_proficiente: 0,
                nivel_avancado: 0,
                habilidades: habilidadesCorrigidas
              })
            }
            
            if (dados.portugues) {
              resultadosExtraidos.push({
                escola_codigo: escolaCodigo,
                escola_nome: escola?.nome || escolaCodigo,
                periodo,
                turma,
                disciplina: 'Língua Portuguesa',
                alunos_matriculados: alunosMatriculados,
                alunos_frequentando: alunosFrequentando,
                alunos_avaliados: alunosAvaliados,
                nivel_insuficiente: dados.portugues.insuficiente || 0,
                nivel_basico: dados.portugues.basico || 0,
                nivel_proficiente: dados.portugues.proficiente || 0,
                nivel_avancado: dados.portugues.avancado || 0,
                habilidades: habilidadesCorrigidas
              })
            }
            if (dados.matematica) {
              resultadosExtraidos.push({
                escola_codigo: escolaCodigo,
                escola_nome: escola?.nome || escolaCodigo,
                periodo,
                turma,
                disciplina: 'Matemática',
                alunos_matriculados: alunosMatriculados,
                alunos_frequentando: alunosFrequentando,
                alunos_avaliados: alunosAvaliados,
                nivel_insuficiente: dados.matematica.insuficiente || 0,
                nivel_basico: dados.matematica.basico || 0,
                nivel_proficiente: dados.matematica.proficiente || 0,
                nivel_avancado: dados.matematica.avancado || 0,
                habilidades: habilidadesCorrigidas
              })
            }
          }
        }
      }
    }
    
    setResultados(resultadosExtraidos)
  }

  function resetForm() {
    setFormData({ 
      ano: new Date().getFullYear(), 
      titulo: '',
      ativa: true,
      data_limite_insercao: '',
      tipo_avaliacao: 'niveis',
      habilidades_selecionadas: {}
    })
    setEditandoId(null)
    setMostrarFormulario(false)
    setErroSalvar(null)
  }

  function getTodosCodigosAcesso(avaliacaoId: string, ano: number) {
    return escolas.map(escola => ({
      codigo: gerarCodigoAcesso(avaliacaoId, escola.codigo, ano),
      escola
    }))
  }

  function getTotaisUnicos() {
    const turmasUnicas = new Map()
    
    let filtrados = [...resultados]
    if (filtroEscola) filtrados = filtrados.filter(r => r.escola_codigo === filtroEscola)
    if (filtroPeriodo) filtrados = filtrados.filter(r => r.periodo === filtroPeriodo)
    if (filtroTurma) filtrados = filtrados.filter(r => r.turma === filtroTurma)
    
    if (filtroDisciplina !== 'todas') {
      const totalMatriculados = filtrados.reduce((sum, r) => sum + r.alunos_matriculados, 0)
      const totalFrequentando = filtrados.reduce((sum, r) => sum + (r.alunos_frequentando || 0), 0)
      const totalAvaliados = filtrados.reduce((sum, r) => sum + r.alunos_avaliados, 0)
      return { totalMatriculados, totalFrequentando, totalAvaliados }
    }
    
    filtrados.forEach(r => {
      const key = `${r.escola_codigo}_${r.periodo}_${r.turma}`
      if (!turmasUnicas.has(key)) {
        turmasUnicas.set(key, {
          matriculados: r.alunos_matriculados,
          frequentando: r.alunos_frequentando || 0,
          avaliados: r.alunos_avaliados
        })
      }
    })
    
    let totalMatriculados = 0
    let totalFrequentando = 0
    let totalAvaliados = 0
    
    turmasUnicas.forEach(turma => {
      totalMatriculados += turma.matriculados
      totalFrequentando += turma.frequentando
      totalAvaliados += turma.avaliados
    })
    
    return { totalMatriculados, totalFrequentando, totalAvaliados }
  }

  function getResultadosFiltrados() {
    let filtrados = [...resultados]
    if (filtroEscola) filtrados = filtrados.filter(r => r.escola_codigo === filtroEscola)
    if (filtroPeriodo) filtrados = filtrados.filter(r => r.periodo === filtroPeriodo)
    if (filtroTurma) filtrados = filtrados.filter(r => r.turma === filtroTurma)
    if (filtroDisciplina !== 'todas') filtrados = filtrados.filter(r => r.disciplina === filtroDisciplina)
    return filtrados
  }

  const dadosGraficoNiveis = (): DadosGrafico[] => {
    const filtrados = getResultadosFiltrados()
    
    const totalizador = { insuficiente: 0, basico: 0, proficiente: 0, avancado: 0 }
    filtrados.forEach(r => {
      totalizador.insuficiente += r.nivel_insuficiente
      totalizador.basico += r.nivel_basico
      totalizador.proficiente += r.nivel_proficiente
      totalizador.avancado += r.nivel_avancado
    })
    
    const total = Object.values(totalizador).reduce((a, b) => a + b, 0)
    
    return Object.entries(totalizador).map(([name, value]) => ({
      name: name === 'insuficiente' ? 'Insuficiente' : name === 'basico' ? 'Básico' : name === 'proficiente' ? 'Proficiente' : 'Avançado',
      value,
      percentual: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
      cor: CORES_NIVEIS[name as keyof typeof CORES_NIVEIS]
    }))
  }

  const dadosGraficoHabilidades = (): DadosHabilidadeGrafico[] => {
    let filtrados = [...resultados].filter(r => r.disciplina === 'Geral')
    
    if (filtroEscola) filtrados = filtrados.filter(r => r.escola_codigo === filtroEscola)
    if (filtroPeriodo) filtrados = filtrados.filter(r => r.periodo === filtroPeriodo)
    if (filtroTurma) filtrados = filtrados.filter(r => r.turma === filtroTurma)
    
    const habilidadesAgregadas: Record<string, { totalQuantidade: number; totalAvaliados: number; descricao: string; disciplina: string }> = {}
    
    filtrados.forEach(r => {
      if (r.habilidades) {
        for (const [codigo, dados] of Object.entries(r.habilidades)) {
          if (!habilidadesAgregadas[codigo]) {
            const habilidadeInfo = HABILIDADES_FIXAS.find(h => h.codigo === codigo)
            habilidadesAgregadas[codigo] = {
              totalQuantidade: 0,
              totalAvaliados: 0,
              descricao: habilidadeInfo?.descricao || codigo,
              disciplina: habilidadeInfo?.disciplina || 'Geral'
            }
          }
          habilidadesAgregadas[codigo].totalQuantidade += dados.quantidade
          habilidadesAgregadas[codigo].totalAvaliados += r.alunos_avaliados
        }
      }
    })
    
    let resultado = Object.entries(habilidadesAgregadas)
    if (filtroHabilidadeDisciplina !== 'todas') {
      resultado = resultado.filter(([_, data]) => data.disciplina === filtroHabilidadeDisciplina)
    }
    
    return resultado.map(([codigo, data], index) => ({
      codigo,
      descricao: data.descricao,
      percentual: data.totalAvaliados > 0 ? (data.totalQuantidade / data.totalAvaliados) * 100 : 0,
      disciplina: data.disciplina,
      cor: CORES_HABILIDADES[index % CORES_HABILIDADES.length]
    })).sort((a, b) => b.percentual - a.percentual)
  }

  const getDadosHabilidadesPorTurma = () => {
    let filtrados = [...resultados].filter(r => r.disciplina === 'Geral')
    
    if (filtroEscola) filtrados = filtrados.filter(r => r.escola_codigo === filtroEscola)
    if (filtroPeriodo) filtrados = filtrados.filter(r => r.periodo === filtroPeriodo)
    if (filtroTurma) filtrados = filtrados.filter(r => r.turma === filtroTurma)
    
    return filtrados
  }

  const dadosPorEscola = (): DadosPorEscola[] => {
    const escolasMap = new Map<string, { insuficiente: number; basico: number; proficiente: number; avancado: number; total: number }>()
    
    const filtrados = getResultadosFiltrados()
    
    filtrados.forEach(r => {
      if (!escolasMap.has(r.escola_codigo)) {
        escolasMap.set(r.escola_codigo, { insuficiente: 0, basico: 0, proficiente: 0, avancado: 0, total: 0 })
      }
      const escola = escolasMap.get(r.escola_codigo)!
      escola.insuficiente += r.nivel_insuficiente
      escola.basico += r.nivel_basico
      escola.proficiente += r.nivel_proficiente
      escola.avancado += r.nivel_avancado
      escola.total += (r.nivel_insuficiente + r.nivel_basico + r.nivel_proficiente + r.nivel_avancado)
    })
    
    const resultado: DadosPorEscola[] = Array.from(escolasMap.entries()).map(([codigo, dados]) => {
      const escola = escolas.find(e => e.codigo === codigo)
      const insuficientePercentual = dados.total > 0 ? (dados.insuficiente / dados.total) * 100 : 0
      const basicoPercentual = dados.total > 0 ? (dados.basico / dados.total) * 100 : 0
      const proficientePercentual = dados.total > 0 ? (dados.proficiente / dados.total) * 100 : 0
      const avancadoPercentual = dados.total > 0 ? (dados.avancado / dados.total) * 100 : 0
      
      return {
        escola: escola?.nome || codigo,
        codigo,
        insuficiente: insuficientePercentual,
        insuficienteFormatado: insuficientePercentual.toFixed(1),
        basico: basicoPercentual,
        basicoFormatado: basicoPercentual.toFixed(1),
        proficiente: proficientePercentual,
        proficienteFormatado: proficientePercentual.toFixed(1),
        avancado: avancadoPercentual,
        avancadoFormatado: avancadoPercentual.toFixed(1)
      }
    })
    
    return resultado.sort((a, b) => b.proficiente - a.proficiente)
  }

  const periodos = [...new Set(resultados.map(r => r.periodo))].sort((a, b) => {
    const numA = parseInt(a.split('º')[0])
    const numB = parseInt(b.split('º')[0])
    return numA - numB
  })

  const turmas = [...new Set(resultados.map(r => r.turma))].sort()

  function handleImprimirRelatorio() {
    setMostrarRelatorio(true)
    setImprimindo(true)
    setTimeout(() => {
      window.print()
      setTimeout(() => {
        setMostrarRelatorio(false)
        setImprimindo(false)
      }, 1000)
    }, 300)
  }

  // Relatório de impressão para avaliação por NÍVEIS
  const RelatorioNiveis = () => {
    const totais = getTotaisUnicos()
    const dadosNiveis = dadosGraficoNiveis()
    const escolasComparativo = dadosPorEscola()
    const resultadosFiltrados = getResultadosFiltrados()

    // Agrupar por turma
    const turmasMap = new Map()
    resultadosFiltrados.forEach(r => {
      const key = `${r.escola_codigo}_${r.periodo}_${r.turma}`
      if (!turmasMap.has(key)) {
        turmasMap.set(key, {
          escola: r.escola_nome,
          periodo: r.periodo,
          turma: r.turma,
          matriculados: r.alunos_matriculados,
          frequentando: r.alunos_frequentando || 0,
          avaliados: r.alunos_avaliados,
          portugues: null as any,
          matematica: null as any
        })
      }
      const turmaData = turmasMap.get(key)
      if (r.disciplina === 'Língua Portuguesa') {
        turmaData.portugues = {
          insuficiente: r.nivel_insuficiente,
          basico: r.nivel_basico,
          proficiente: r.nivel_proficiente,
          avancado: r.nivel_avancado
        }
      } else if (r.disciplina === 'Matemática') {
        turmaData.matematica = {
          insuficiente: r.nivel_insuficiente,
          basico: r.nivel_basico,
          proficiente: r.nivel_proficiente,
          avancado: r.nivel_avancado
        }
      }
    })

    return (
      <div id="relatorio-impressao" style={{ 
        fontFamily: 'Arial, sans-serif', 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '20px',
        backgroundColor: 'white',
        color: '#000'
      }}>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #relatorio-impressao, #relatorio-impressao * { visibility: visible; }
            #relatorio-impressao { position: absolute; top: 0; left: 0; width: 100%; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 15px; }
            th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; font-size: 11px; }
            th { background-color: #e5e7eb; font-weight: bold; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            h1 { font-size: 20px; margin-bottom: 5px; }
            h2 { font-size: 16px; margin-bottom: 5px; }
            h3 { font-size: 14px; margin-bottom: 10px; }
            .card-total { display: inline-block; width: 30%; padding: 10px; margin: 5px; border: 1px solid #000; text-align: center; }
            .page-break { page-break-before: always; }
          }
        `}</style>

        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #1f2937' }}>
          <h1 style={{ color: '#1f2937', marginBottom: '5px' }}>RELATÓRIO DE RESULTADOS - AVALIAÇÃO POR NÍVEIS</h1>
          <h2 style={{ color: '#374151' }}>{visualizandoResultados?.titulo}</h2>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '5px' }}>Ano: {visualizandoResultados?.ano}</p>
          <p style={{ fontSize: '11px', color: '#9ca3af' }}>Emitido em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
        </div>

        {/* Filtros aplicados */}
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '13px' }}>Filtros Aplicados:</h3>
          <table style={{ fontSize: '11px', marginBottom: '0' }}>
            <tbody>
              <tr>
                <td style={{ border: 'none', padding: '2px 8px', fontWeight: 'bold', width: '100px' }}>Escola:</td>
                <td style={{ border: 'none', padding: '2px 8px' }}>{filtroEscola ? escolas.find(e => e.codigo === filtroEscola)?.nome || filtroEscola : 'Todas'}</td>
                <td style={{ border: 'none', padding: '2px 8px', fontWeight: 'bold', width: '100px' }}>Período:</td>
                <td style={{ border: 'none', padding: '2px 8px' }}>{filtroPeriodo || 'Todos'}</td>
              </tr>
              <tr>
                <td style={{ border: 'none', padding: '2px 8px', fontWeight: 'bold' }}>Disciplina:</td>
                <td style={{ border: 'none', padding: '2px 8px' }}>{filtroDisciplina === 'todas' ? 'Ambas' : filtroDisciplina}</td>
                <td style={{ border: 'none', padding: '2px 8px', fontWeight: 'bold' }}>Turma:</td>
                <td style={{ border: 'none', padding: '2px 8px' }}>{filtroTurma || 'Todas'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totais */}
        <h3 style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '10px' }}>Quantitativos Gerais</h3>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div className="card-total">
            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{totais.totalMatriculados}</div>
            <div style={{ fontSize: '11px' }}>Matriculados</div>
          </div>
          <div className="card-total">
            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{totais.totalFrequentando}</div>
            <div style={{ fontSize: '11px' }}>Frequentando</div>
          </div>
          <div className="card-total">
            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{totais.totalAvaliados}</div>
            <div style={{ fontSize: '11px' }}>Avaliados</div>
          </div>
        </div>

        {/* Distribuição por níveis */}
        <h3 style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '10px' }}>Distribuição por Níveis</h3>
        <table>
          <thead>
            <tr>
              <th>Nível</th>
              <th className="text-center">Quantidade</th>
              <th className="text-center">Percentual</th>
            </tr>
          </thead>
          <tbody>
            {dadosNiveis.map(nivel => (
              <tr key={nivel.name}>
                <td style={{ color: nivel.cor, fontWeight: 'bold' }}>{nivel.name}</td>
                <td className="text-center">{nivel.value}</td>
                <td className="text-center">{nivel.percentual}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Resultados por turma */}
        <div className="page-break"></div>
        <h3 style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '10px' }}>Resultados por Turma</h3>
        {Array.from(turmasMap.values()).map((turma: any, idx) => (
          <div key={idx} style={{ marginBottom: '15px', border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#f3f4f6', padding: '8px 12px', fontWeight: 'bold', fontSize: '12px' }}>
              {turma.escola} - {turma.periodo} - Turma {turma.turma}
              <span style={{ marginLeft: '15px', fontSize: '11px', color: '#6b7280', fontWeight: 'normal' }}>
                Mat: {turma.matriculados} | Freq: {turma.frequentando} | Aval: {turma.avaliados}
              </span>
            </div>
            <table style={{ marginBottom: '0' }}>
              <thead>
                <tr>
                  <th>Disciplina</th>
                  <th className="text-center">Insuf.</th>
                  <th className="text-center">Básico</th>
                  <th className="text-center">Profic.</th>
                  <th className="text-center">Avanç.</th>
                  <th className="text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {turma.portugues && (
                  <tr>
                    <td>Língua Portuguesa</td>
                    <td className="text-center" style={{ color: '#ef4444' }}>{turma.portugues.insuficiente}</td>
                    <td className="text-center" style={{ color: '#eab308' }}>{turma.portugues.basico}</td>
                    <td className="text-center" style={{ color: '#3b82f6' }}>{turma.portugues.proficiente}</td>
                    <td className="text-center" style={{ color: '#22c55e' }}>{turma.portugues.avancado}</td>
                    <td className="text-center">{turma.avaliados}</td>
                  </tr>
                )}
                {turma.matematica && (
                  <tr>
                    <td>Matemática</td>
                    <td className="text-center" style={{ color: '#ef4444' }}>{turma.matematica.insuficiente}</td>
                    <td className="text-center" style={{ color: '#eab308' }}>{turma.matematica.basico}</td>
                    <td className="text-center" style={{ color: '#3b82f6' }}>{turma.matematica.proficiente}</td>
                    <td className="text-center" style={{ color: '#22c55e' }}>{turma.matematica.avancado}</td>
                    <td className="text-center">{turma.avaliados}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ))}

        {/* Comparativo por escola */}
        {escolasComparativo.length > 0 && (
          <>
            <div className="page-break"></div>
            <h3 style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '10px' }}>Comparativo por Escola (%)</h3>
            <table>
              <thead>
                <tr>
                  <th>Escola</th>
                  <th className="text-center">Insuficiente</th>
                  <th className="text-center">Básico</th>
                  <th className="text-center">Proficiente</th>
                  <th className="text-center">Avançado</th>
                </tr>
              </thead>
              <tbody>
                {escolasComparativo.map((escola, idx) => (
                  <tr key={idx}>
                    <td>{escola.escola}</td>
                    <td className="text-center" style={{ color: '#ef4444', fontWeight: 'bold' }}>{escola.insuficienteFormatado}%</td>
                    <td className="text-center" style={{ color: '#eab308', fontWeight: 'bold' }}>{escola.basicoFormatado}%</td>
                    <td className="text-center" style={{ color: '#3b82f6', fontWeight: 'bold' }}>{escola.proficienteFormatado}%</td>
                    <td className="text-center" style={{ color: '#22c55e', fontWeight: 'bold' }}>{escola.avancadoFormatado}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Rodapé */}
        <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '10px', color: '#9ca3af' }}>
          <p>Sistema de Avaliações EJA - Relatório gerado em {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
    )
  }

  // Relatório de impressão para avaliação por HABILIDADES
  const RelatorioHabilidades = () => {
    const totais = getTotaisUnicos()
    const habilidadesGrafico = dadosGraficoHabilidades()
    const turmasHabilidades = getDadosHabilidadesPorTurma()

    return (
      <div id="relatorio-impressao" style={{ 
        fontFamily: 'Arial, sans-serif', 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '20px',
        backgroundColor: 'white',
        color: '#000'
      }}>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #relatorio-impressao, #relatorio-impressao * { visibility: visible; }
            #relatorio-impressao { position: absolute; top: 0; left: 0; width: 100%; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 15px; }
            th, td { border: 1px solid #000; padding: 5px 6px; text-align: left; font-size: 10px; }
            th { background-color: #e5e7eb; font-weight: bold; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            h1 { font-size: 20px; margin-bottom: 5px; }
            h2 { font-size: 16px; margin-bottom: 5px; }
            h3 { font-size: 14px; margin-bottom: 10px; }
            .card-total { display: inline-block; width: 30%; padding: 10px; margin: 5px; border: 1px solid #000; text-align: center; }
            .hab-card { display: inline-block; width: 30%; padding: 10px; margin: 5px; border: 1px solid #e5e7eb; border-radius: 4px; vertical-align: top; }
            .barra-progresso { width: 100%; height: 8px; background-color: #e5e7eb; border-radius: 4px; margin-top: 4px; }
            .barra-preenchida { height: 8px; border-radius: 4px; }
            .page-break { page-break-before: always; }
          }
        `}</style>

        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #1f2937' }}>
          <h1 style={{ color: '#1f2937', marginBottom: '5px' }}>RELATÓRIO DE RESULTADOS - AVALIAÇÃO POR HABILIDADES</h1>
          <h2 style={{ color: '#374151' }}>{visualizandoResultados?.titulo}</h2>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '5px' }}>Ano: {visualizandoResultados?.ano}</p>
          <p style={{ fontSize: '11px', color: '#9ca3af' }}>Emitido em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
        </div>

        {/* Filtros aplicados */}
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '13px' }}>Filtros Aplicados:</h3>
          <table style={{ fontSize: '11px', marginBottom: '0' }}>
            <tbody>
              <tr>
                <td style={{ border: 'none', padding: '2px 8px', fontWeight: 'bold', width: '100px' }}>Escola:</td>
                <td style={{ border: 'none', padding: '2px 8px' }}>{filtroEscola ? escolas.find(e => e.codigo === filtroEscola)?.nome || filtroEscola : 'Todas'}</td>
                <td style={{ border: 'none', padding: '2px 8px', fontWeight: 'bold', width: '100px' }}>Período:</td>
                <td style={{ border: 'none', padding: '2px 8px' }}>{filtroPeriodo || 'Todos'}</td>
              </tr>
              <tr>
                <td style={{ border: 'none', padding: '2px 8px', fontWeight: 'bold' }}>Disciplina:</td>
                <td style={{ border: 'none', padding: '2px 8px' }}>{filtroHabilidadeDisciplina === 'todas' ? 'Todas' : filtroHabilidadeDisciplina}</td>
                <td style={{ border: 'none', padding: '2px 8px', fontWeight: 'bold' }}>Turma:</td>
                <td style={{ border: 'none', padding: '2px 8px' }}>{filtroTurma || 'Todas'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totais */}
        <h3 style={{ borderLeft: '4px solid #8b5cf6', paddingLeft: '10px' }}>Quantitativos Gerais</h3>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div className="card-total">
            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{totais.totalMatriculados}</div>
            <div style={{ fontSize: '11px' }}>Matriculados</div>
          </div>
          <div className="card-total">
            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{totais.totalFrequentando}</div>
            <div style={{ fontSize: '11px' }}>Frequentando</div>
          </div>
          <div className="card-total">
            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{totais.totalAvaliados}</div>
            <div style={{ fontSize: '11px' }}>Avaliados</div>
          </div>
        </div>

        {/* Resumo por Habilidade */}
        <h3 style={{ borderLeft: '4px solid #8b5cf6', paddingLeft: '10px' }}>Desempenho por Habilidade</h3>
        <div style={{ marginBottom: '20px' }}>
          {habilidadesGrafico.map((hab) => (
            <div key={hab.codigo} className="hab-card">
              <div style={{ marginBottom: '4px' }}>
                <span style={{ 
                  display: 'inline-block', 
                  padding: '2px 6px', 
                  borderRadius: '3px', 
                  fontSize: '10px', 
                  fontWeight: 'bold',
                  backgroundColor: hab.cor + '20',
                  color: hab.cor
                }}>
                  {hab.codigo}
                </span>
                <span style={{ fontSize: '10px', color: '#6b7280', marginLeft: '6px' }}>{hab.disciplina}</span>
              </div>
              <div style={{ fontSize: '12px', marginBottom: '4px' }}>{hab.descricao}</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: hab.cor }}>{hab.percentual.toFixed(1)}%</div>
              <div style={{ fontSize: '10px', color: '#6b7280' }}>de acerto</div>
              <div className="barra-progresso">
                <div className="barra-preenchida" style={{ width: `${hab.percentual}%`, backgroundColor: hab.cor }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabela por Turma */}
        <div className="page-break"></div>
        <h3 style={{ borderLeft: '4px solid #8b5cf6', paddingLeft: '10px' }}>Resultados por Turma (%)</h3>
        {turmasHabilidades.length > 0 && (
          <table style={{ fontSize: '9px' }}>
            <thead>
              <tr>
                <th>Escola</th>
                <th>Período</th>
                <th>Turma</th>
                <th className="text-center">Mat.</th>
                <th className="text-center">Aval.</th>
                {habilidadesGrafico.map(hab => (
                  <th key={hab.codigo} className="text-center" style={{ fontSize: '8px' }}>{hab.codigo}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {turmasHabilidades.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.escola_nome}</td>
                  <td>{r.periodo}</td>
                  <td>{r.turma}</td>
                  <td className="text-center">{r.alunos_matriculados}</td>
                  <td className="text-center">{r.alunos_avaliados}</td>
                  {habilidadesGrafico.map(hab => {
                    const habData = r.habilidades?.[hab.codigo]
                    const percentual = habData?.percentual || 0
                    return (
                      <td key={hab.codigo} className="text-center" style={{ color: hab.cor, fontWeight: 'bold' }}>
                        {percentual.toFixed(0)}%
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Legenda */}
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
          <h3 style={{ fontSize: '12px', marginBottom: '8px' }}>Legenda das Habilidades</h3>
          {habilidadesGrafico.map(hab => (
            <div key={hab.codigo} style={{ display: 'inline-block', marginRight: '20px', marginBottom: '6px', fontSize: '10px' }}>
              <span style={{ 
                display: 'inline-block', 
                width: '10px', 
                height: '10px', 
                borderRadius: '2px', 
                backgroundColor: hab.cor,
                marginRight: '4px',
                verticalAlign: 'middle'
              }}></span>
              <strong>{hab.codigo}</strong> - {hab.descricao} ({hab.disciplina})
            </div>
          ))}
        </div>

        {/* Rodapé */}
        <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '10px', color: '#9ca3af' }}>
          <p>Sistema de Avaliações EJA - Relatório gerado em {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen text-slate-700 bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-slate-700 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <School className="text-indigo-600" />
              Avaliações Diagnósticas - EJA
            </h1>
            <p className="text-gray-500 mt-1">Cadastre avaliações e acompanhe os resultados por escola e turma</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEscolaEditando({
                  id: '',
                  codigo: '',
                  nome: '',
                  turmas: {},
                  ativa: true,
                  created_at: ''
                })
                setMostrarGerenciarEscolas(true)
                setErroSalvar(null)
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 transition shadow-lg"
            >
              <Settings size={20} />
              Gerenciar Escolas
            </button>
            <button
              onClick={() => {
                resetForm()
                setMostrarFormulario(true)
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-lg"
            >
              <Plus size={20} />
              Nova Avaliação
            </button>
          </div>
        </div>

        {/* Lista de Avaliações */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
            <h2 className="font-semibold text-gray-700">Avaliações Cadastradas</h2>
          </div>
          
          {avaliacoes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <School size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500">Nenhuma avaliação cadastrada</p>
              <button
                onClick={() => {
                  resetForm()
                  setMostrarFormulario(true)
                }}
                className="mt-4 text-indigo-600 hover:text-indigo-700"
              >
                Clique aqui para criar sua primeira avaliação
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {avaliacoes.map((av) => (
                <div key={av.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{av.titulo}</h3>
                        {av.ativa ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                            <Power size={10} /> Ativa
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
                            <PowerOff size={10} /> Inativa
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                          {av.tipo_avaliacao === 'niveis' ? 'Por Níveis' : 'Por Habilidades'}
                        </span>
                        {av.tipo_avaliacao === 'habilidades' && av.habilidades_selecionadas && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {Object.values(av.habilidades_selecionadas).flat().length} habilidades
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Ano: {av.ano} | Criado: {new Date(av.created_at).toLocaleDateString('pt-BR')}
                        {av.data_limite_insercao && (
                          <> | Prazo: {new Date(av.data_limite_insercao).toLocaleDateString('pt-BR')}</>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleAtivaAvaliacao(av)}
                        className={`p-2 rounded-lg transition ${av.ativa ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                        title={av.ativa ? 'Desativar' : 'Ativar'}
                      >
                        {av.ativa ? <PowerOff size={16} /> : <Power size={16} />}
                      </button>
                      <button
                        onClick={() => verResultados(av)}
                        className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition flex items-center gap-2"
                      >
                        <BarChart3 size={16} />
                        Ver Resultados
                      </button>
                      <button
                        onClick={() => setMostrarCodigos(av)}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition flex items-center gap-2"
                      >
                        <Copy size={16} />
                        Códigos
                      </button>
                      <button
                        onClick={() => {
                          setEditandoId(av.id)
                          setFormData({ 
                            ano: av.ano, 
                            titulo: av.titulo,
                            ativa: av.ativa,
                            data_limite_insercao: av.data_limite_insercao || '',
                            tipo_avaliacao: av.tipo_avaliacao,
                            habilidades_selecionadas: av.habilidades_selecionadas || {}
                          })
                          setMostrarFormulario(true)
                          setErroSalvar(null)
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleExcluirAvaliacao(av.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lista de Escolas */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-teal-50 border-b border-green-100">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <School size={18} />
              Escolas Cadastradas
            </h2>
          </div>
          
          {escolas.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Nenhuma escola cadastrada</p>
              <button
                onClick={() => {
                  setEscolaEditando({
                    id: '',
                    codigo: '',
                    nome: '',
                    turmas: {},
                    ativa: true,
                    created_at: ''
                  })
                  setMostrarGerenciarEscolas(true)
                }}
                className="mt-2 text-green-600 hover:text-green-700"
              >
                Clique aqui para cadastrar escolas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {escolas.map((escola) => (
                <div key={escola.id} className="border rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">{escola.nome}</h3>
                      <p className="text-xs text-gray-500 font-mono">{escola.codigo}</p>
                    </div>
                    <button
                      onClick={() => {
                        setEscolaEditando(escola)
                        setMostrarGerenciarEscolas(true)
                      }}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">Turmas por período:</p>
                    <div className="space-y-1">
                      {Object.entries(escola.turmas || {}).map(([periodo, turmasLista]) => (
                        <div key={periodo} className="text-xs">
                          <span className="font-medium">{periodo}:</span>{' '}
                          <span className="text-gray-600">{Array.isArray(turmasLista) ? turmasLista.join(', ') : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Resultados */}
        <Modal isOpen={!!visualizandoResultados} onClose={() => { setVisualizandoResultados(null); setMostrarRelatorio(false) }} title={`Resultados: ${visualizandoResultados?.titulo || ''}`}>
          {resultados.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500">Nenhum resultado inserido ainda para esta avaliação.</p>
            </div>
          ) : (
            <>
              {/* Botão de impressão */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleImprimirRelatorio}
                  disabled={imprimindo}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                >
                  <Printer size={18} />
                  {imprimindo ? 'Preparando...' : 'Imprimir Relatório'}
                </button>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="text-sm font-medium text-gray-700">Escola</label>
                  <select
                    value={filtroEscola}
                    onChange={(e) => setFiltroEscola(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Todas as escolas</option>
                    {escolas.map(e => (
                      <option key={e.codigo} value={e.codigo}>{e.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Período</label>
                  <select
                    value={filtroPeriodo}
                    onChange={(e) => setFiltroPeriodo(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Todos os períodos</option>
                    {periodos.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Turma</label>
                  <select
                    value={filtroTurma}
                    onChange={(e) => setFiltroTurma(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Todas as turmas</option>
                    {turmas.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                {visualizandoResultados?.tipo_avaliacao === 'niveis' ? (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Disciplina</label>
                    <select
                      value={filtroDisciplina}
                      onChange={(e) => setFiltroDisciplina(e.target.value)}
                      className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="todas">Ambas</option>
                      <option value="Língua Portuguesa">Língua Portuguesa</option>
                      <option value="Matemática">Matemática</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Disciplina (Habilidades)</label>
                    <select
                      value={filtroHabilidadeDisciplina}
                      onChange={(e) => setFiltroHabilidadeDisciplina(e.target.value)}
                      className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="todas">Todas</option>
                      <option value="Língua Portuguesa">Língua Portuguesa</option>
                      <option value="Matemática">Matemática</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Cards de totais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 rounded-xl p-4 text-center text-white">
                  <Users size={28} className="mx-auto mb-2 text-gray-300" />
                  <div className="text-3xl font-bold">{getTotaisUnicos().totalMatriculados}</div>
                  <div className="text-sm text-gray-300 mt-1">Total de Matriculados</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center text-white">
                  <UserCheck size={28} className="mx-auto mb-2 text-gray-300" />
                  <div className="text-3xl font-bold">{getTotaisUnicos().totalFrequentando}</div>
                  <div className="text-sm text-gray-300 mt-1">Total de Frequentando</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center text-white">
                  <UserPlus size={28} className="mx-auto mb-2 text-gray-300" />
                  <div className="text-3xl font-bold">{getTotaisUnicos().totalAvaliados}</div>
                  <div className="text-sm text-gray-300 mt-1">Total de Avaliados</div>
                </div>
              </div>

              {/* CONTEÚDO PARA AVALIAÇÃO POR NÍVEIS */}
              {visualizandoResultados?.tipo_avaliacao === 'niveis' && (
                <>
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-3 text-sm">Língua Portuguesa</h3>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-red-600">{resultados.filter(r => r.disciplina === 'Língua Portuguesa').filter(r => !filtroEscola || r.escola_codigo === filtroEscola).filter(r => !filtroPeriodo || r.periodo === filtroPeriodo).filter(r => !filtroTurma || r.turma === filtroTurma).reduce((sum, r) => sum + r.nivel_insuficiente, 0)}</div>
                        <div className="text-xs text-red-600 mt-1">Insuficiente</div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-yellow-600">{resultados.filter(r => r.disciplina === 'Língua Portuguesa').filter(r => !filtroEscola || r.escola_codigo === filtroEscola).filter(r => !filtroPeriodo || r.periodo === filtroPeriodo).filter(r => !filtroTurma || r.turma === filtroTurma).reduce((sum, r) => sum + r.nivel_basico, 0)}</div>
                        <div className="text-xs text-yellow-600 mt-1">Básico</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-blue-600">{resultados.filter(r => r.disciplina === 'Língua Portuguesa').filter(r => !filtroEscola || r.escola_codigo === filtroEscola).filter(r => !filtroPeriodo || r.periodo === filtroPeriodo).filter(r => !filtroTurma || r.turma === filtroTurma).reduce((sum, r) => sum + r.nivel_proficiente, 0)}</div>
                        <div className="text-xs text-blue-600 mt-1">Proficiente</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-green-600">{resultados.filter(r => r.disciplina === 'Língua Portuguesa').filter(r => !filtroEscola || r.escola_codigo === filtroEscola).filter(r => !filtroPeriodo || r.periodo === filtroPeriodo).filter(r => !filtroTurma || r.turma === filtroTurma).reduce((sum, r) => sum + r.nivel_avancado, 0)}</div>
                        <div className="text-xs text-green-600 mt-1">Avançado</div>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-700 mb-3 text-sm">Matemática</h3>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-red-600">{resultados.filter(r => r.disciplina === 'Matemática').filter(r => !filtroEscola || r.escola_codigo === filtroEscola).filter(r => !filtroPeriodo || r.periodo === filtroPeriodo).filter(r => !filtroTurma || r.turma === filtroTurma).reduce((sum, r) => sum + r.nivel_insuficiente, 0)}</div>
                        <div className="text-xs text-red-600 mt-1">Insuficiente</div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-yellow-600">{resultados.filter(r => r.disciplina === 'Matemática').filter(r => !filtroEscola || r.escola_codigo === filtroEscola).filter(r => !filtroPeriodo || r.periodo === filtroPeriodo).filter(r => !filtroTurma || r.turma === filtroTurma).reduce((sum, r) => sum + r.nivel_basico, 0)}</div>
                        <div className="text-xs text-yellow-600 mt-1">Básico</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-blue-600">{resultados.filter(r => r.disciplina === 'Matemática').filter(r => !filtroEscola || r.escola_codigo === filtroEscola).filter(r => !filtroPeriodo || r.periodo === filtroPeriodo).filter(r => !filtroTurma || r.turma === filtroTurma).reduce((sum, r) => sum + r.nivel_proficiente, 0)}</div>
                        <div className="text-xs text-blue-600 mt-1">Proficiente</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-green-600">{resultados.filter(r => r.disciplina === 'Matemática').filter(r => !filtroEscola || r.escola_codigo === filtroEscola).filter(r => !filtroPeriodo || r.periodo === filtroPeriodo).filter(r => !filtroTurma || r.turma === filtroTurma).reduce((sum, r) => sum + r.nivel_avancado, 0)}</div>
                        <div className="text-xs text-green-600 mt-1">Avançado</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border p-6 mb-6">
                    <h3 className="font-bold text-gray-800 mb-4">Distribuição por Nível de Proficiência</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={dadosGraficoNiveis()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => `${value} alunos`} />
                        <Legend />
                        <Bar dataKey="value" name="Quantidade de Alunos" radius={[8, 8, 0, 0]}>
                          {dadosGraficoNiveis().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.cor} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left">Escola</th>
                          <th className="px-4 py-3 text-left">Período</th>
                          <th className="px-4 py-3 text-left">Turma</th>
                          <th className="px-4 py-3 text-left">Disciplina</th>
                          <th className="px-4 py-3 text-center">Matric.</th>
                          <th className="px-4 py-3 text-center">Freq.</th>
                          <th className="px-4 py-3 text-center">Aval.</th>
                          <th className="px-4 py-3 text-center">Insuf.</th>
                          <th className="px-4 py-3 text-center">Básico</th>
                          <th className="px-4 py-3 text-center">Profic.</th>
                          <th className="px-4 py-3 text-center">Avanç.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {getResultadosFiltrados().map((r, idx) => (
                          <tr key={`${r.escola_codigo}-${r.periodo}-${r.turma}-${r.disciplina}-${idx}`} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3 font-medium">{r.escola_nome}</td>
                            <td className="px-4 py-3">{r.periodo}</td>
                            <td className="px-4 py-3">{r.turma}</td>
                            <td className="px-4 py-3">{r.disciplina}</td>
                            <td className="px-4 py-3 text-center">{r.alunos_matriculados}</td>
                            <td className="px-4 py-3 text-center">{r.alunos_frequentando || 0}</td>
                            <td className="px-4 py-3 text-center">{r.alunos_avaliados}</td>
                            <td className="px-4 py-3 text-center text-red-600">{r.nivel_insuficiente}</td>
                            <td className="px-4 py-3 text-center text-yellow-600">{r.nivel_basico}</td>
                            <td className="px-4 py-3 text-center text-blue-600">{r.nivel_proficiente}</td>
                            <td className="px-4 py-3 text-center text-green-600">{r.nivel_avancado}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* CONTEÚDO PARA AVALIAÇÃO POR HABILIDADES */}
              {visualizandoResultados?.tipo_avaliacao === 'habilidades' && (
                <>
                  <div className="bg-white rounded-xl border p-6 mb-6">
                    <h3 className="font-bold text-gray-800 mb-4">Percentual de Acerto por Habilidade</h3>
                    <ResponsiveContainer width="100%" height={Math.max(400, dadosGraficoHabilidades().length * 40)}>
                      <BarChart 
                        data={dadosGraficoHabilidades()} 
                        layout="vertical"
                        margin={{ left: 150, right: 30, top: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                        <YAxis type="category" dataKey="codigo" width={140} />
                        <Tooltip 
                          formatter={(value: any) => [`${value.toFixed(1)}%`, 'Percentual de Acerto']}
                          labelFormatter={(label) => {
                            const hab = dadosGraficoHabilidades().find(h => h.codigo === label)
                            return hab ? `${hab.codigo} - ${hab.descricao}` : label
                          }}
                        />
                        <Bar dataKey="percentual" name="Percentual de Acerto" radius={[0, 8, 8, 0]}>
                          {dadosGraficoHabilidades().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.cor} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-bold text-gray-800 mb-4">Resumo por Habilidade</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dadosGraficoHabilidades().map((hab) => (
                        <div key={hab.codigo} className="border rounded-xl p-3 hover:shadow-md transition">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 text-xs rounded-full font-medium" style={{ backgroundColor: hab.cor + '20', color: hab.cor }}>{hab.codigo}</span>
                            <span className="text-xs text-gray-500">{hab.disciplina}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{hab.descricao}</p>
                          <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold" style={{ color: hab.cor }}>{hab.percentual.toFixed(1)}%</span>
                            <span className="text-xs text-gray-500 mb-1">de acerto</span>
                          </div>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${hab.percentual}%`, backgroundColor: hab.cor }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-bold text-gray-800 mb-4">Resultados por Turma</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left">Escola</th>
                            <th className="px-4 py-3 text-left">Período</th>
                            <th className="px-4 py-3 text-left">Turma</th>
                            <th className="px-4 py-3 text-center">Matric.</th>
                            <th className="px-4 py-3 text-center">Freq.</th>
                            <th className="px-4 py-3 text-center">Aval.</th>
                            {dadosGraficoHabilidades().map(hab => (
                              <th key={hab.codigo} className="px-3 py-3 text-center text-xs" title={hab.descricao}>{hab.codigo}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {getDadosHabilidadesPorTurma().map((r, idx) => (
                            <tr key={`${r.escola_codigo}-${r.periodo}-${r.turma}-${idx}`} className="hover:bg-gray-50 transition">
                              <td className="px-4 py-3 font-medium">{r.escola_nome}</td>
                              <td className="px-4 py-3">{r.periodo}</td>
                              <td className="px-4 py-3">{r.turma}</td>
                              <td className="px-4 py-3 text-center">{r.alunos_matriculados}</td>
                              <td className="px-4 py-3 text-center">{r.alunos_frequentando || 0}</td>
                              <td className="px-4 py-3 text-center">{r.alunos_avaliados}</td>
                              {dadosGraficoHabilidades().map(hab => {
                                const habData = r.habilidades?.[hab.codigo]
                                const percentual = habData?.percentual || 0
                                return (
                                  <td key={hab.codigo} className="px-3 py-3 text-center">
                                    <span className="font-medium" style={{ color: hab.cor }}>{percentual.toFixed(0)}%</span>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Legenda das Habilidades</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {dadosGraficoHabilidades().map(hab => (
                        <div key={hab.codigo} className="flex items-center gap-2 text-sm">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: hab.cor }}></span>
                          <span className="font-medium">{hab.codigo}</span>
                          <span className="text-gray-500">- {hab.descricao}</span>
                          <span className="text-gray-400 text-xs">({hab.disciplina})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </Modal>

        {/* Modal de Códigos */}
        <Modal isOpen={!!mostrarCodigos} onClose={() => setMostrarCodigos(null)} title={`Códigos de Acesso - ${mostrarCodigos?.titulo || ''}`}>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-700 mb-2">
                📋 Distribua os códigos abaixo para cada escola. Cada código permite acesso único para inserção dos resultados.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Escola</th>
                    <th className="px-4 py-3 text-left">Código de Acesso</th>
                    <th className="px-4 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {mostrarCodigos && getTodosCodigosAcesso(mostrarCodigos.id, mostrarCodigos.ano).map((item) => (
                    <tr key={item.escola.codigo} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{item.escola.nome}</td>
                      <td className="px-4 py-3">
                        <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">{item.codigo}</code>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.codigo)
                            alert(`Código ${item.codigo} copiado!`)
                          }}
                          className="text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1 mx-auto"
                        >
                          <Copy size={16} />
                          Copiar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>

        {/* Modal de Nova/Editar Avaliação */}
        <Modal isOpen={mostrarFormulario} onClose={resetForm} title={editandoId ? 'Editar Avaliação' : 'Nova Avaliação'}>
          <div className="space-y-4 text-slate-700">
            {erroSalvar && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
                <div className="text-sm text-red-700">{erroSalvar}</div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ano</label>
              <input type="number" value={formData.ano} onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) || new Date().getFullYear() })} className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" min={2000} max={new Date().getFullYear() + 1} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título da Avaliação</label>
              <input type="text" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Ex: Avaliação Diagnóstica - 1º Semestre 2024" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Avaliação</label>
              <select value={formData.tipo_avaliacao} onChange={(e) => setFormData({ ...formData, tipo_avaliacao: e.target.value as 'niveis' | 'habilidades', habilidades_selecionadas: {} })} className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500">
                <option value="niveis">Avaliação por Níveis de Proficiência</option>
                <option value="habilidades">Avaliação por Habilidades</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.ativa} onChange={(e) => setFormData({ ...formData, ativa: e.target.checked })} className="w-4 h-4 text-indigo-600" />
                <span className="text-sm text-gray-700">Avaliação Ativa</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Limite para Inserção (opcional)</label>
              <input type="date" value={formData.data_limite_insercao} onChange={(e) => setFormData({ ...formData, data_limite_insercao: e.target.value })} className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>

            {formData.tipo_avaliacao === 'habilidades' && (
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Target size={20} className="text-purple-600" />
                  <label className="text-lg font-semibold text-gray-800">Seleção de Habilidades</label>
                  <span title="Selecione as habilidades que farão parte desta avaliação.">
                    <HelpCircle size={16} className="text-gray-400"  />
                  </span>
                  
                </div>
                
                <div className="bg-purple-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-purple-700">Selecione as habilidades que serão avaliadas em cada período. Os professores só poderão inserir resultados para as habilidades selecionadas.</p>
                </div>

                {PERIODOS.map((periodo) => {
                  const habilidadesPeriodo = HABILIDADES_FIXAS.filter(h => h.periodo === periodo)
                  if (habilidadesPeriodo.length === 0) return null
                  const selecionadas = formData.habilidades_selecionadas[periodo] || []
                  
                  return (
                    <div key={periodo} className="mb-6 border rounded-xl p-4 bg-white">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-gray-700">{periodo}</h3>
                        <div className="flex gap-2">
                          <button onClick={() => selecionarTodasHabilidadesPeriodo(periodo)} className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-200">Selecionar Todas</button>
                          <button onClick={() => limparHabilidadesPeriodo(periodo)} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200">Limpar</button>
                        </div>
                      </div>

                      {habilidadesPeriodo.filter(h => h.disciplina === 'Língua Portuguesa').length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-blue-600 mb-2">Língua Portuguesa</h4>
                          <div className="space-y-2">
                            {habilidadesPeriodo.filter(h => h.disciplina === 'Língua Portuguesa').map((habilidade) => (
                              <label key={habilidade.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                <input type="checkbox" checked={selecionadas.includes(habilidade.id)} onChange={() => toggleHabilidadeSelecionada(periodo, habilidade.id)} className="w-4 h-4 text-indigo-600 rounded" />
                                <div>
                                  <span className="text-sm font-medium text-gray-700">{habilidade.codigo}</span>
                                  <span className="text-sm text-gray-500 ml-2">- {habilidade.descricao}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {habilidadesPeriodo.filter(h => h.disciplina === 'Matemática').length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-purple-600 mb-2">Matemática</h4>
                          <div className="space-y-2">
                            {habilidadesPeriodo.filter(h => h.disciplina === 'Matemática').map((habilidade) => (
                              <label key={habilidade.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                <input type="checkbox" checked={selecionadas.includes(habilidade.id)} onChange={() => toggleHabilidadeSelecionada(periodo, habilidade.id)} className="w-4 h-4 text-indigo-600 rounded" />
                                <div>
                                  <span className="text-sm font-medium text-gray-700">{habilidade.codigo}</span>
                                  <span className="text-sm text-gray-500 ml-2">- {habilidade.descricao}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {selecionadas.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-500">{selecionadas.length} habilidade(s) selecionada(s) neste período</p>
                        </div>
                      )}
                    </div>
                  )
                })}

                {Object.values(formData.habilidades_selecionadas).flat().length > 0 && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-sm text-green-700">Total de {Object.values(formData.habilidades_selecionadas).flat().length} habilidade(s) selecionada(s) para esta avaliação.</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-3 mt-6">
              <button onClick={handleSalvarAvaliacao} disabled={salvando} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {salvando ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>Salvando...</> : (editandoId ? 'Atualizar' : 'Salvar')}
              </button>
              <button onClick={resetForm} className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-medium">Cancelar</button>
            </div>
          </div>
        </Modal>

        {/* Modal de Gerenciar Escolas */}
        <Modal isOpen={mostrarGerenciarEscolas} onClose={() => { setMostrarGerenciarEscolas(false); setEscolaEditando(null); setErroSalvar(null) }} title={escolaEditando?.id ? 'Editar Escola' : 'Nova Escola'}>
          <div className="space-y-4">
            {erroSalvar && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
                <div className="text-sm text-red-700">{erroSalvar}</div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Código da Escola</label>
                <input type="text" value={escolaEditando?.codigo || ''} onChange={(e) => setEscolaEditando(prev => prev ? { ...prev, codigo: e.target.value.toUpperCase() } : null)} className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500" placeholder="Ex: ESC001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Escola</label>
                <input type="text" value={escolaEditando?.nome || ''} onChange={(e) => setEscolaEditando(prev => prev ? { ...prev, nome: e.target.value } : null)} className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500" placeholder="Ex: EMEB Dr. Gustavo Paiva" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={escolaEditando?.ativa || false} onChange={(e) => setEscolaEditando(prev => prev ? { ...prev, ativa: e.target.checked } : null)} className="w-4 h-4 text-indigo-600" />
                <span className="text-sm text-gray-700">Escola Ativa</span>
              </label>
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">Turmas por Período</label>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {PERIODOS.map((periodo) => (
                  <div key={periodo} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{periodo}</span>
                      <button onClick={() => adicionarTurma(periodo)} className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-200">+ Adicionar Turma</button>
                    </div>
                    <div className="space-y-2">
                      {(escolaEditando?.turmas[periodo] || []).map((turma, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input type="text" value={turma} onChange={(e) => { const novasTurmas = [...(escolaEditando?.turmas[periodo] || [])]; novasTurmas[idx] = e.target.value; atualizarTurmasEscola(periodo, novasTurmas) }} className="flex-1 p-2 border rounded-lg text-sm" />
                          <button onClick={() => removerTurma(periodo, idx)} className="text-red-500 hover:text-red-700"><X size={16} /></button>
                        </div>
                      ))}
                      {(escolaEditando?.turmas[periodo] || []).length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-2">Nenhuma turma cadastrada</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={handleSalvarEscola} disabled={salvando} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {salvando ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>Salvando...</> : (escolaEditando?.id ? 'Atualizar Escola' : 'Cadastrar Escola')}
              </button>
              {escolaEditando?.id && (
                <button onClick={() => handleExcluirEscola(escolaEditando.id)} className="px-6 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-medium">Excluir</button>
              )}
            </div>
          </div>
        </Modal>
      </div>

      {/* Relatórios de impressão (renderizados fora da tela) */}
      {mostrarRelatorio && visualizandoResultados && visualizandoResultados.tipo_avaliacao === 'niveis' && <RelatorioNiveis />}
      {mostrarRelatorio && visualizandoResultados && visualizandoResultados.tipo_avaliacao === 'habilidades' && <RelatorioHabilidades />}
    </div>
  )
}