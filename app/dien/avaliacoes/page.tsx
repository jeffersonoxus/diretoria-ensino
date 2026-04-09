'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, Pencil, Trash2, School, BarChart3, Copy, X, 
  Power, PowerOff, Target, TrendingUp, AlertCircle, Settings,
  ChevronDown, ChevronUp, Check, Users, UserCheck, UserPlus,
  Printer, Download, FileText
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'
import { 
  PERIODOS, HABILIDADES_FIXAS, getHabilidadesPorPeriodo,
  TIPOS_GRAFICO, MODALIDADES_VISUALIZACAO, CORES_NIVEIS,
  calcularPercentualProficiente, calcularMediaRede,
  TipoGrafico, ModalidadeVisualizacao, gerarCodigoAcesso
} from '@/lib/dadosFixos'

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
  }>({ 
    ano: new Date().getFullYear(), 
    titulo: '',
    ativa: true,
    data_limite_insercao: '',
    tipo_avaliacao: 'niveis'
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
  const relatorioRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchEscolas()
    fetchAvaliacoes()
  }, [])

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
      if (data) setAvaliacoes(data)
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error)
    } finally {
      setLoading(false)
    }
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
    
    setSalvando(true)
    setErroSalvar(null)

    try {
      const dados = { 
        ano: formData.ano, 
        titulo: formData.titulo.trim(),
        ativa: formData.ativa,
        data_limite_insercao: formData.data_limite_insercao || null,
        tipo_avaliacao: formData.tipo_avaliacao,
        resultados_niveis: {},
        resultados_habilidades: {},
        updated_at: new Date().toISOString()
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
    
    const resultadosExtraidos: ResultadoTurma[] = []
    
    const resultadosFonte = avaliacao.tipo_avaliacao === 'niveis' 
      ? avaliacao.resultados_niveis 
      : avaliacao.resultados_habilidades
    
    if (resultadosFonte) {
      for (const [escolaCodigo, escolasResultados] of Object.entries(resultadosFonte)) {
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
      tipo_avaliacao: 'niveis'
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

  const dadosGraficoNiveis = (): DadosGrafico[] => {
    let filtrados = [...resultados]
    
    if (filtroEscola) filtrados = filtrados.filter(r => r.escola_codigo === filtroEscola)
    if (filtroPeriodo) filtrados = filtrados.filter(r => r.periodo === filtroPeriodo)
    if (filtroDisciplina !== 'todas') filtrados = filtrados.filter(r => r.disciplina === filtroDisciplina)
    if (filtroTurma) filtrados = filtrados.filter(r => r.turma === filtroTurma)
    
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

  const dadosPorEscola = (): DadosPorEscola[] => {
    const escolasMap = new Map<string, { insuficiente: number; basico: number; proficiente: number; avancado: number; total: number }>()
    
    let filtrados = [...resultados]
    if (filtroEscola) filtrados = filtrados.filter(r => r.escola_codigo === filtroEscola)
    if (filtroPeriodo) filtrados = filtrados.filter(r => r.periodo === filtroPeriodo)
    if (filtroDisciplina !== 'todas') filtrados = filtrados.filter(r => r.disciplina === filtroDisciplina)
    if (filtroTurma) filtrados = filtrados.filter(r => r.turma === filtroTurma)
    
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
    setTimeout(() => {
      window.print()
      setTimeout(() => setMostrarRelatorio(false), 1000)
    }, 100)
  }

  const RelatorioDiagnostico = () => {
    // Aplicar os filtros nos dados do relatório
    let dadosFiltrados = [...resultados]
    if (filtroEscola) dadosFiltrados = dadosFiltrados.filter(r => r.escola_codigo === filtroEscola)
    if (filtroPeriodo) dadosFiltrados = dadosFiltrados.filter(r => r.periodo === filtroPeriodo)
    if (filtroDisciplina !== 'todas') dadosFiltrados = dadosFiltrados.filter(r => r.disciplina === filtroDisciplina)
    if (filtroTurma) dadosFiltrados = dadosFiltrados.filter(r => r.turma === filtroTurma)
    
    // Agrupar por turma para os totais
    const turmasUnicasRelatorio = new Map()
    dadosFiltrados.forEach(r => {
      const key = `${r.escola_codigo}_${r.periodo}_${r.turma}`
      if (!turmasUnicasRelatorio.has(key)) {
        turmasUnicasRelatorio.set(key, {
          escola: r.escola_nome,
          periodo: r.periodo,
          turma: r.turma,
          matriculados: r.alunos_matriculados,
          frequentando: r.alunos_frequentando || 0,
          avaliados: r.alunos_avaliados,
          portugues: null,
          matematica: null
        })
      }
      const turmaData = turmasUnicasRelatorio.get(key)
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
    
    const turmasRelatorio = Array.from(turmasUnicasRelatorio.values())
    
    // Calcular totais
    const totaisRelatorio = {
      matriculados: turmasRelatorio.reduce((sum, t) => sum + t.matriculados, 0),
      frequentando: turmasRelatorio.reduce((sum, t) => sum + t.frequentando, 0),
      avaliados: turmasRelatorio.reduce((sum, t) => sum + t.avaliados, 0)
    }
    
    // Dados por escola para o relatório
    const escolasMapRelatorio = new Map()
    dadosFiltrados.forEach(r => {
      if (!escolasMapRelatorio.has(r.escola_codigo)) {
        escolasMapRelatorio.set(r.escola_codigo, {
          nome: r.escola_nome,
          insuficiente: 0,
          basico: 0,
          proficiente: 0,
          avancado: 0,
          total: 0
        })
      }
      const escola = escolasMapRelatorio.get(r.escola_codigo)
      escola.insuficiente += r.nivel_insuficiente
      escola.basico += r.nivel_basico
      escola.proficiente += r.nivel_proficiente
      escola.avancado += r.nivel_avancado
      escola.total += (r.nivel_insuficiente + r.nivel_basico + r.nivel_proficiente + r.nivel_avancado)
    })
    
    const escolasRelatorio = Array.from(escolasMapRelatorio.values()).map(escola => ({
      nome: escola.nome,
      insuficiente: escola.total > 0 ? (escola.insuficiente / escola.total) * 100 : 0,
      basico: escola.total > 0 ? (escola.basico / escola.total) * 100 : 0,
      proficiente: escola.total > 0 ? (escola.proficiente / escola.total) * 100 : 0,
      avancado: escola.total > 0 ? (escola.avancado / escola.total) * 100 : 0
    }))
    
    return (
      <div ref={relatorioRef} id="relatorio-diagnostico" style={{ 
        fontFamily: 'Arial, sans-serif', 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '20px 20px',
        backgroundColor: 'white'
      }}>
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #relatorio-diagnostico, #relatorio-diagnostico * {
                visibility: visible;
              }
              #relatorio-diagnostico {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                margin: 0;
                padding: 20px;
              }
              .no-print {
                display: none;
              }
              .print-break {
                page-break-before: always;
              }
              
              /* Evitar quebra de página dentro das tabelas e containers */
              table, .turma-container, .tabela-container {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              
              /* Evitar quebra entre o cabeçalho da turma e a tabela */
              .turma-header {
                page-break-after: avoid;
                break-after: avoid;
              }
              
              .turma-tabela {
                page-break-before: avoid;
                break-before: avoid;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              
              table {
                border-collapse: collapse;
                width: 100%;
                margin-bottom: 10px;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              
              th, td {
                border: 1px solid #000;
                padding: 2px 4px;
                text-align: left;
                font-size: 10px;
              }
              
              th {
                background-color: #f0f0f0;
                font-weight: bold;
              }
              
              .text-center {
                text-align: center;
              }
              
              .text-right {
                text-align: right;
              }
              
              .valor-positivo {
                color: #22c55e;
                font-weight: bold;
              }
              
              .valor-negativo {
                color: #ef4444;
                font-weight: bold;
              }
            }
          `
        }} />
        
        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '2px solid #000' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '10px', color: '#1f2937' }}>RELATÓRIO DIAGNÓSTICO</h1>
          <h2 style={{ fontSize: '18px', marginBottom: '5px', color: '#374151' }}>{visualizandoResultados?.titulo}</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Ano: {visualizandoResultados?.ano}</p>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>Data de emissão: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        {/* Filtros aplicados */}
        <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#1f2937' }}>Filtros aplicados:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '12px' }}>
            <div><strong>Escola:</strong> {filtroEscola ? escolas.find(e => e.codigo === filtroEscola)?.nome || filtroEscola : 'Todas'}</div>
            <div><strong>Período:</strong> {filtroPeriodo || 'Todos'}</div>
            <div><strong>Disciplina:</strong> {filtroDisciplina === 'todas' ? 'Ambas' : filtroDisciplina}</div>
            <div><strong>Turma:</strong> {filtroTurma || 'Todas'}</div>
          </div>
        </div>

        {/* Quantitativos */}
        <div style={{ marginBottom: '10px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px', color: '#1f2937', borderLeft: '4px solid #3b82f6', paddingLeft: '10px' }}>
            Quantitativos Gerais
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
            <div style={{ backgroundColor: '#1f2937', padding: '10px', borderRadius: '8px', textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{totaisRelatorio.matriculados}</div>
              <div style={{ fontSize: '12px', marginTop: '5px' }}>Total de Matriculados</div>
            </div>
            <div style={{ backgroundColor: '#1f2937', padding: '10px', borderRadius: '8px', textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{totaisRelatorio.frequentando}</div>
              <div style={{ fontSize: '12px', marginTop: '5px' }}>Total de Frequentando</div>
            </div>
            <div style={{ backgroundColor: '#1f2937', padding: '10px', borderRadius: '8px', textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{totaisRelatorio.avaliados}</div>
              <div style={{ fontSize: '12px', marginTop: '5px' }}>Total de Avaliados</div>
            </div>
          </div>
        </div>

        {/* Tabelas por Turma */}
        <div style={{ marginBottom: '10px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '15px', color: '#1f2937', borderLeft: '4px solid #3b82f6', paddingLeft: '10px' }}>
            Resultados por Turma
          </h3>
          
          {turmasRelatorio.map((turma, idx) => (
            <div 
              key={idx} 
              className="turma-container"
              style={{ 
                marginBottom: '10px', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px', 
                overflow: 'hidden',
                pageBreakInside: 'avoid',
                breakInside: 'avoid'
              }}
            >
              <div 
                className="turma-header"
                style={{ 
                  backgroundColor: '#f3f4f6', 
                  padding: '10px 15px', 
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                <strong>{turma.escola} - {turma.periodo} - Turma {turma.turma}</strong>
                <span style={{ marginLeft: '15px', fontSize: '12px', color: '#6b7280' }}>
                  Mat: {turma.matriculados} | Freq: {turma.frequentando} | Aval: {turma.avaliados}
                </span>
              </div>
              <div 
                className="turma-tabela"
                style={{ 
                  padding: '10px'
                }}
              >
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Disciplina</th>
                      <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Insuficiente</th>
                      <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Básico</th>
                      <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Proficiente</th>
                      <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Avançado</th>
                      <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turma.portugues && (
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '8px' }}>Língua Portuguesa</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#ef4444' }}>{turma.portugues.insuficiente}</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#eab308' }}>{turma.portugues.basico}</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#3b82f6' }}>{turma.portugues.proficiente}</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#22c55e' }}>{turma.portugues.avancado}</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{turma.avaliados}</td>
                      </tr>
                    )}
                    {turma.matematica && (
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '8px' }}>Matemática</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#ef4444' }}>{turma.matematica.insuficiente}</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#eab308' }}>{turma.matematica.basico}</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#3b82f6' }}>{turma.matematica.proficiente}</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#22c55e' }}>{turma.matematica.avancado}</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{turma.avaliados}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          
          {turmasRelatorio.length === 0 && (
            <p style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Nenhum resultado encontrado com os filtros selecionados.</p>
          )}
        </div>

        {/* Comparativo por Escola */}
        {escolasRelatorio.length > 0 && (
          <div 
            style={{ 
              marginBottom: '30px',
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#1f2937', borderLeft: '4px solid #3b82f6', paddingLeft: '10px' }}>
              Comparativo por Escola (%)
            </h3>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Escola</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Insuficiente</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Básico</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Proficiente</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Avançado</th>
                </tr>
              </thead>
              <tbody>
                {escolasRelatorio.map((escola, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{escola.nome}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#ef4444', fontWeight: 'bold' }}>{escola.insuficiente.toFixed(1)}%</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#eab308', fontWeight: 'bold' }}>{escola.basico.toFixed(1)}%</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#3b82f6', fontWeight: 'bold' }}>{escola.proficiente.toFixed(1)}%</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#22c55e', fontWeight: 'bold' }}>{escola.avancado.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Rodapé */}
        <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '11px', color: '#9ca3af' }}>
          <p>Relatório gerado automaticamente pelo Sistema de Avaliações EJA</p>
          <p>© {new Date().getFullYear()} - Todos os direitos reservados</p>
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
                            tipo_avaliacao: av.tipo_avaliacao
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
                      {Object.entries(escola.turmas).map(([periodo, turmasLista]) => (
                        <div key={periodo} className="text-xs">
                          <span className="font-medium">{periodo}:</span>{' '}
                          <span className="text-gray-600">{turmasLista.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Gerenciar Escolas */}
        <Modal isOpen={mostrarGerenciarEscolas} onClose={() => {
          setMostrarGerenciarEscolas(false)
          setEscolaEditando(null)
          setErroSalvar(null)
        }} title={escolaEditando?.id ? 'Editar Escola' : 'Nova Escola'}>
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
                <input
                  type="text"
                  value={escolaEditando?.codigo || ''}
                  onChange={(e) => setEscolaEditando(prev => prev ? { ...prev, codigo: e.target.value.toUpperCase() } : null)}
                  className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: ESC001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Escola</label>
                <input
                  type="text"
                  value={escolaEditando?.nome || ''}
                  onChange={(e) => setEscolaEditando(prev => prev ? { ...prev, nome: e.target.value } : null)}
                  className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: EMEB Dr. Gustavo Paiva"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={escolaEditando?.ativa || false}
                  onChange={(e) => setEscolaEditando(prev => prev ? { ...prev, ativa: e.target.checked } : null)}
                  className="w-4 h-4 text-indigo-600"
                />
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
                      <button
                        onClick={() => adicionarTurma(periodo)}
                        className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-200"
                      >
                        + Adicionar Turma
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(escolaEditando?.turmas[periodo] || []).map((turma, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={turma}
                            onChange={(e) => {
                              const novasTurmas = [...(escolaEditando?.turmas[periodo] || [])]
                              novasTurmas[idx] = e.target.value
                              atualizarTurmasEscola(periodo, novasTurmas)
                            }}
                            className="flex-1 p-2 border rounded-lg text-sm"
                          />
                          <button
                            onClick={() => removerTurma(periodo, idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
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
              <button 
                onClick={handleSalvarEscola} 
                disabled={salvando}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {salvando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Salvando...
                  </>
                ) : (
                  escolaEditando?.id ? 'Atualizar Escola' : 'Cadastrar Escola'
                )}
              </button>
              {escolaEditando?.id && (
                <button 
                  onClick={() => handleExcluirEscola(escolaEditando.id)}
                  className="px-6 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-medium"
                >
                  Excluir
                </button>
              )}
            </div>
          </div>
        </Modal>

        {/* Modal de Resultados */}
        <Modal isOpen={!!visualizandoResultados} onClose={() => setVisualizandoResultados(null)} title={`Resultados: ${visualizandoResultados?.titulo || ''}`}>
          {resultados.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500">Nenhum resultado inserido ainda para esta avaliação.</p>
            </div>
          ) : (
            <>
              {/* Botão de Impressão */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleImprimirRelatorio}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
                >
                  <Printer size={18} />
                  Imprimir Relatório
                </button>
              </div>

              <div className="flex gap-2 border-b mb-6">
                <button
                  onClick={() => setAbas('geral')}
                  className={`px-4 py-2 font-medium transition ${abas === 'geral' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <TrendingUp size={16} className="inline mr-2" />
                  Resultados Gerais
                </button>
                {visualizandoResultados?.tipo_avaliacao === 'habilidades' && (
                  <button
                    onClick={() => setAbas('habilidades')}
                    className={`px-4 py-2 font-medium transition ${abas === 'habilidades' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Target size={16} className="inline mr-2" />
                    Resultados por Habilidade
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="text-sm font-medium text-gray-700">Tipo de Gráfico</label>
                  <select
                    value={tipoGrafico}
                    onChange={(e) => setTipoGrafico(e.target.value as TipoGrafico)}
                    className="mt-1 p-2 border rounded-lg"
                  >
                    <option value="barra">Barras Verticais</option>
                    <option value="pizza">Pizza (Setores)</option>
                  </select>
                </div>
              </div>

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
              </div>

              {/* Cards de resumo geral - CORRIGIDOS (sem duplicação e em preto) */}
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

              {/* Cards de níveis */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {dadosGraficoNiveis().find(d => d.name === 'Insuficiente')?.value || 0}
                  </div>
                  <div className="text-xs text-red-600 mt-1">Insuficiente</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {dadosGraficoNiveis().find(d => d.name === 'Básico')?.value || 0}
                  </div>
                  <div className="text-xs text-yellow-600 mt-1">Básico</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {dadosGraficoNiveis().find(d => d.name === 'Proficiente')?.value || 0}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">Proficiente</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {dadosGraficoNiveis().find(d => d.name === 'Avançado')?.value || 0}
                  </div>
                  <div className="text-xs text-green-600 mt-1">Avançado</div>
                </div>
              </div>

              <div className="bg-white rounded-xl border p-6 mb-6">
                <h3 className="font-bold text-gray-800 mb-4">
                  {tipoGrafico === 'pizza' ? 'Distribuição por Nível de Proficiência' : 'Resultados por Nível'}
                </h3>
                
                {tipoGrafico === 'pizza' ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={dadosGraficoNiveis().filter(entry => entry.percentual !== '0' && parseFloat(entry.percentual) > 0)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label={({ name, percent = 0 }) => percent > 0 ? `${name}: ${(percent * 100).toFixed(1)}%` : ''}
                      >
                        {dadosGraficoNiveis().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} alunos`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
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
                )}
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
                    {resultados
                      .filter(r => !filtroEscola || r.escola_codigo === filtroEscola)
                      .filter(r => !filtroPeriodo || r.periodo === filtroPeriodo)
                      .filter(r => filtroDisciplina === 'todas' || r.disciplina === filtroDisciplina)
                      .filter(r => !filtroTurma || r.turma === filtroTurma)
                      .map((r, idx) => (
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
        </Modal>

        {/* Modal de Códigos de Acesso */}
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

        {/* Modal de Formulário de Avaliação */}
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
              <input
                type="number"
                value={formData.ano}
                onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) || new Date().getFullYear() })}
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                min={2000}
                max={new Date().getFullYear() + 1}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título da Avaliação</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ex: Avaliação Diagnóstica - 1º Semestre 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Avaliação</label>
              <select
                value={formData.tipo_avaliacao}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  tipo_avaliacao: e.target.value as 'niveis' | 'habilidades'
                })}
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                <option value="niveis">Avaliação por Níveis de Proficiência</option>
                <option value="habilidades">Avaliação por Habilidades</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.ativa}
                  onChange={(e) => setFormData({ ...formData, ativa: e.target.checked })}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-sm text-gray-700">Avaliação Ativa</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Limite para Inserção (opcional)</label>
              <input
                type="date"
                value={formData.data_limite_insercao}
                onChange={(e) => setFormData({ ...formData, data_limite_insercao: e.target.value })}
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleSalvarAvaliacao} 
                disabled={salvando}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {salvando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Salvando...
                  </>
                ) : (
                  editandoId ? 'Atualizar' : 'Salvar'
                )}
              </button>
              <button 
                onClick={resetForm} 
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      </div>

      {/* Componente de Relatório para impressão */}
      {mostrarRelatorio && visualizandoResultados && <RelatorioDiagnostico />}
    </div>
  )
}