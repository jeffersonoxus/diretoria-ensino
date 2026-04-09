'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  School, Save, CheckCircle, AlertCircle, BookOpen, ChevronDown, 
  ChevronUp, Loader2, Target, BarChart3, Send, Clock
} from 'lucide-react'
import { 
  validarCodigoAcesso, PERIODOS, HABILIDADES_FIXAS, getHabilidadesPorPeriodo
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

interface DadosTurmaNiveis {
  periodo: string
  turma: string
  matriculados: number
  frequentando: number
  avaliados: number
  portugues: {
    insuficiente: number
    basico: number
    proficiente: number
    avancado: number
  }
  matematica: {
    insuficiente: number
    basico: number
    proficiente: number
    avancado: number
  }
  salvo: boolean
}

interface DadosTurmaHabilidades {
  periodo: string
  turma: string
  matriculados: number
  frequentando: number
  avaliados: number
  habilidades: Record<string, { quantidade: number; percentual: number }>
  salvo: boolean
}

export default function InserirResultados() {
  const supabase = createClient()
  const [codigo, setCodigo] = useState('')
  const [codigoValido, setCodigoValido] = useState(false)
  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null)
  const [escola, setEscola] = useState<Escola | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [dadosNiveis, setDadosNiveis] = useState<Record<string, DadosTurmaNiveis>>({})
  const [dadosHabilidades, setDadosHabilidades] = useState<Record<string, DadosTurmaHabilidades>>({})
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({})
  const [salvando, setSalvando] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function handleValidarCodigo() {
    if (!codigo.trim()) {
      setErro('Digite o código de acesso')
      return
    }

    setLoading(true)
    setErro('')
    
    try {
      const { data: avaliacoes, error: avError } = await supabase
        .from('avaliacoes_eja')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (avError) throw avError
      
      if (!avaliacoes || avaliacoes.length === 0) {
        setErro('Nenhuma avaliação encontrada')
        setLoading(false)
        return
      }
      
      const { data: escolas, error: escError } = await supabase
        .from('escolas_eja')
        .select('*')
      
      if (escError) throw escError
      
      let avaliacaoEncontrada = null
      let escolaEncontrada = null
      
      for (const escola of escolas || []) {
        for (const av of avaliacoes) {
          const resultado = validarCodigoAcesso(codigo, av, escola.codigo)
          if (resultado.valido) {
            avaliacaoEncontrada = av
            escolaEncontrada = escola
            break
          }
        }
        if (avaliacaoEncontrada) break
      }
      
      if (!avaliacaoEncontrada || !escolaEncontrada) {
        setErro('Código inválido, avaliação desativada ou prazo encerrado')
        setLoading(false)
        return
      }
      
      setAvaliacao(avaliacaoEncontrada)
      setEscola(escolaEncontrada)
      
      const turmasDaEscola = escolaEncontrada.turmas as Record<string, string[]>
      
      if (avaliacaoEncontrada.tipo_avaliacao === 'niveis') {
        const resultadosSalvos = avaliacaoEncontrada.resultados_niveis?.[escolaEncontrada.codigo] || {}
        const novosDados: Record<string, DadosTurmaNiveis> = {}
        
        for (const [periodo, turmasLista] of Object.entries(turmasDaEscola)) {
          const turmasArray = Array.isArray(turmasLista) ? turmasLista : []
          
          for (const turmaNome of turmasArray) {
            const key = `${periodo}_${turmaNome}`
            const dadosSalvos = resultadosSalvos[periodo]?.[turmaNome] || {}
            
            novosDados[key] = {
              periodo,
              turma: turmaNome,
              matriculados: dadosSalvos.matriculados || 0,
              frequentando: dadosSalvos.frequentando || 0,
              avaliados: dadosSalvos.avaliados || 0,
              portugues: {
                insuficiente: dadosSalvos.portugues?.insuficiente || 0,
                basico: dadosSalvos.portugues?.basico || 0,
                proficiente: dadosSalvos.portugues?.proficiente || 0,
                avancado: dadosSalvos.portugues?.avancado || 0
              },
              matematica: {
                insuficiente: dadosSalvos.matematica?.insuficiente || 0,
                basico: dadosSalvos.matematica?.basico || 0,
                proficiente: dadosSalvos.matematica?.proficiente || 0,
                avancado: dadosSalvos.matematica?.avancado || 0
              },
              salvo: !!dadosSalvos.matriculados
            }
            setExpandidos(prev => ({ ...prev, [periodo]: false }))
          }
        }
        setDadosNiveis(novosDados)
      } else {
        const resultadosSalvos = avaliacaoEncontrada.resultados_habilidades?.[escolaEncontrada.codigo] || {}
        const novosDados: Record<string, DadosTurmaHabilidades> = {}
        
        for (const [periodo, turmasLista] of Object.entries(turmasDaEscola)) {
          const turmasArray = Array.isArray(turmasLista) ? turmasLista : []
          
          for (const turmaNome of turmasArray) {
            const key = `${periodo}_${turmaNome}`
            const dadosSalvos = resultadosSalvos[periodo]?.[turmaNome] || {}
            
            const habilidadesIniciais: Record<string, { quantidade: number; percentual: number }> = {}
            const habilidadesDoPeriodo = HABILIDADES_FIXAS.filter(h => h.periodo === periodo)
            
            for (const h of habilidadesDoPeriodo) {
              const habSalva = dadosSalvos.habilidades?.[h.codigo] || { quantidade: 0, percentual: 0 }
              habilidadesIniciais[h.codigo] = habSalva
            }
            
            novosDados[key] = {
              periodo,
              turma: turmaNome,
              matriculados: dadosSalvos.matriculados || 0,
              frequentando: dadosSalvos.frequentando || 0,
              avaliados: dadosSalvos.avaliados || 0,
              habilidades: habilidadesIniciais,
              salvo: !!dadosSalvos.matriculados
            }
            setExpandidos(prev => ({ ...prev, [periodo]: false }))
          }
        }
        setDadosHabilidades(novosDados)
      }
      
      setCodigoValido(true)
      
    } catch (err) {
      console.error('Erro na validação:', err)
      setErro('Erro ao validar código. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function toggleExpandir(periodo: string) {
    setExpandidos(prev => ({ ...prev, [periodo]: !prev[periodo] }))
  }

  function expandirTodas() {
    const periodosSet = new Set<string>()
    if (avaliacao?.tipo_avaliacao === 'niveis') {
      Object.values(dadosNiveis).forEach(item => periodosSet.add(item.periodo))
    } else {
      Object.values(dadosHabilidades).forEach(item => periodosSet.add(item.periodo))
    }
    
    const novasExpandidos: Record<string, boolean> = {}
    periodosSet.forEach(periodo => { novasExpandidos[periodo] = true })
    setExpandidos(novasExpandidos)
  }

  function fecharTodas() {
    const periodosSet = new Set<string>()
    if (avaliacao?.tipo_avaliacao === 'niveis') {
      Object.values(dadosNiveis).forEach(item => periodosSet.add(item.periodo))
    } else {
      Object.values(dadosHabilidades).forEach(item => periodosSet.add(item.periodo))
    }
    
    const novasExpandidos: Record<string, boolean> = {}
    periodosSet.forEach(periodo => { novasExpandidos[periodo] = false })
    setExpandidos(novasExpandidos)
  }

  function fecharTodosAposSalvar() {
    const periodosSet = new Set<string>()
    if (avaliacao?.tipo_avaliacao === 'niveis') {
      Object.values(dadosNiveis).forEach(item => periodosSet.add(item.periodo))
    } else {
      Object.values(dadosHabilidades).forEach(item => periodosSet.add(item.periodo))
    }
    
    const novasExpandidos: Record<string, boolean> = {}
    periodosSet.forEach(periodo => { novasExpandidos[periodo] = false })
    setExpandidos(novasExpandidos)
  }

  function atualizarNivel(
    periodo: string,
    turma: string,
    disciplina: 'portugues' | 'matematica',
    campo: string,
    valor: number
  ) {
    setDadosNiveis(prev => {
      const key = `${periodo}_${turma}`
      if (!prev[key]) return prev
      
      const disciplinaData = { ...prev[key][disciplina] }
      ;(disciplinaData as any)[campo] = Math.max(0, valor)
      
      return {
        ...prev,
        [key]: { ...prev[key], [disciplina]: disciplinaData, salvo: false }
      }
    })
  }

  function atualizarMatriculadosNiveis(periodo: string, turma: string, valor: number) {
    setDadosNiveis(prev => {
      const key = `${periodo}_${turma}`
      if (!prev[key]) return prev
      
      const matriculados = Math.max(0, valor)
      let frequentando = prev[key].frequentando
      let avaliados = prev[key].avaliados
      
      if (frequentando > matriculados) frequentando = matriculados
      if (avaliados > matriculados) avaliados = matriculados
      
      return {
        ...prev,
        [key]: { ...prev[key], matriculados, frequentando, avaliados, salvo: false }
      }
    })
  }

  function atualizarFrequentandoNiveis(periodo: string, turma: string, valor: number) {
    setDadosNiveis(prev => {
      const key = `${periodo}_${turma}`
      if (!prev[key]) return prev
      
      const frequentando = Math.min(Math.max(0, valor), prev[key].matriculados)
      
      return {
        ...prev,
        [key]: { ...prev[key], frequentando, salvo: false }
      }
    })
  }

  function atualizarAvaliadosNiveis(periodo: string, turma: string, valor: number) {
    setDadosNiveis(prev => {
      const key = `${periodo}_${turma}`
      if (!prev[key]) return prev
      
      const avaliados = Math.min(Math.max(0, valor), prev[key].matriculados)
      
      return {
        ...prev,
        [key]: { ...prev[key], avaliados, salvo: false }
      }
    })
  }

  function atualizarMatriculadosHabilidades(periodo: string, turma: string, valor: number) {
    setDadosHabilidades(prev => {
      const key = `${periodo}_${turma}`
      if (!prev[key]) return prev
      
      const matriculados = Math.max(0, valor)
      let frequentando = prev[key].frequentando
      let avaliados = prev[key].avaliados
      
      if (frequentando > matriculados) frequentando = matriculados
      if (avaliados > matriculados) avaliados = matriculados
      
      return {
        ...prev,
        [key]: { ...prev[key], matriculados, frequentando, avaliados, salvo: false }
      }
    })
  }

  function atualizarFrequentandoHabilidades(periodo: string, turma: string, valor: number) {
    setDadosHabilidades(prev => {
      const key = `${periodo}_${turma}`
      if (!prev[key]) return prev
      
      const frequentando = Math.min(Math.max(0, valor), prev[key].matriculados)
      
      return {
        ...prev,
        [key]: { ...prev[key], frequentando, salvo: false }
      }
    })
  }

  function atualizarAvaliadosHabilidades(periodo: string, turma: string, valor: number) {
    setDadosHabilidades(prev => {
      const key = `${periodo}_${turma}`
      if (!prev[key]) return prev
      
      const avaliados = Math.min(Math.max(0, valor), prev[key].matriculados)
      
      const habilidadesAtualizadas = { ...prev[key].habilidades }
      for (const habCodigo in habilidadesAtualizadas) {
        const quantidade = habilidadesAtualizadas[habCodigo].quantidade
        const percentual = avaliados > 0 ? Math.min(100, (quantidade / avaliados) * 100) : 0
        habilidadesAtualizadas[habCodigo] = { quantidade, percentual }
      }
      
      return {
        ...prev,
        [key]: { ...prev[key], avaliados, habilidades: habilidadesAtualizadas, salvo: false }
      }
    })
  }

  function atualizarHabilidade(
    periodo: string,
    turma: string,
    habilidadeCodigo: string,
    quantidade: number
  ) {
    setDadosHabilidades(prev => {
      const key = `${periodo}_${turma}`
      if (!prev[key]) return prev
      
      const avaliados = prev[key].avaliados
      const quantidadeLimitada = Math.max(0, Math.min(quantidade, avaliados))
      const percentual = avaliados > 0 ? (quantidadeLimitada / avaliados) * 100 : 0
      
      return {
        ...prev,
        [key]: {
          ...prev[key],
          habilidades: {
            ...prev[key].habilidades,
            [habilidadeCodigo]: { quantidade: quantidadeLimitada, percentual: Math.min(100, percentual) }
          },
          salvo: false
        }
      }
    })
  }

  function validarSoma(periodo: string, turma: string, disciplina: 'portugues' | 'matematica'): boolean {
    const key = `${periodo}_${turma}`
    const data = dadosNiveis[key]?.[disciplina]
    if (!data) return true
    
    const soma = data.insuficiente + data.basico + data.proficiente + data.avancado
    return soma === dadosNiveis[key].avaliados
  }

  function todasTurmasPreenchidas(): boolean {
    if (avaliacao?.tipo_avaliacao === 'niveis') {
      return Object.values(dadosNiveis).every(turma => turma.salvo === true)
    } else {
      return Object.values(dadosHabilidades).every(turma => turma.salvo === true)
    }
  }

  function getTurmasPendentesCount(): number {
    if (avaliacao?.tipo_avaliacao === 'niveis') {
      return Object.values(dadosNiveis).filter(turma => !turma.salvo).length
    } else {
      return Object.values(dadosHabilidades).filter(turma => !turma.salvo).length
    }
  }

  async function salvarTurmaNiveis(periodo: string, turma: string) {
    const key = `${periodo}_${turma}`
    const data = dadosNiveis[key]
    
    if (!data) return
    
    const ptValido = validarSoma(periodo, turma, 'portugues')
    const matValido = validarSoma(periodo, turma, 'matematica')
    
    if (!ptValido || !matValido) {
      setErro(`A soma dos níveis não corresponde ao total de avaliados na turma ${periodo} - ${turma}`)
      setTimeout(() => setErro(''), 3000)
      return
    }
    
    setSalvando(true)
    
    try {
      const { data: avaliacaoAtual } = await supabase
        .from('avaliacoes_eja')
        .select('resultados_niveis')
        .eq('id', avaliacao!.id)
        .single()
      
      const resultadosAtuais = avaliacaoAtual?.resultados_niveis || {}
      
      const novosResultados = {
        ...resultadosAtuais,
        [escola!.codigo]: {
          ...resultadosAtuais[escola!.codigo],
          [periodo]: {
            ...resultadosAtuais[escola!.codigo]?.[periodo],
            [turma]: {
              matriculados: data.matriculados,
              frequentando: data.frequentando,
              avaliados: data.avaliados,
              portugues: data.portugues,
              matematica: data.matematica,
              updated_at: new Date().toISOString()
            }
          }
        }
      }
      
      const { error } = await supabase
        .from('avaliacoes_eja')
        .update({ resultados_niveis: novosResultados, updated_at: new Date().toISOString() })
        .eq('id', avaliacao!.id)
      
      if (error) throw error
      
      setDadosNiveis(prev => ({ ...prev, [key]: { ...prev[key], salvo: true } }))
      setSucesso(`Dados da turma ${periodo} - ${turma} salvos com sucesso!`)
      setTimeout(() => setSucesso(''), 3000)
      
      fecharTodosAposSalvar()
      
    } catch (err) {
      console.error('Erro ao salvar:', err)
      setErro('Erro ao salvar dados. Tente novamente.')
      setTimeout(() => setErro(''), 3000)
    } finally {
      setSalvando(false)
    }
  }

  async function salvarTurmaHabilidades(periodo: string, turma: string) {
    const key = `${periodo}_${turma}`
    const data = dadosHabilidades[key]
    
    if (!data) return
    
    setSalvando(true)
    
    try {
      const { data: avaliacaoAtual } = await supabase
        .from('avaliacoes_eja')
        .select('resultados_habilidades')
        .eq('id', avaliacao!.id)
        .single()
      
      const resultadosAtuais = avaliacaoAtual?.resultados_habilidades || {}
      
      const novosResultados = {
        ...resultadosAtuais,
        [escola!.codigo]: {
          ...resultadosAtuais[escola!.codigo],
          [periodo]: {
            ...resultadosAtuais[escola!.codigo]?.[periodo],
            [turma]: {
              matriculados: data.matriculados,
              frequentando: data.frequentando,
              avaliados: data.avaliados,
              habilidades: data.habilidades,
              updated_at: new Date().toISOString()
            }
          }
        }
      }
      
      const { error } = await supabase
        .from('avaliacoes_eja')
        .update({ resultados_habilidades: novosResultados, updated_at: new Date().toISOString() })
        .eq('id', avaliacao!.id)
      
      if (error) throw error
      
      setDadosHabilidades(prev => ({ ...prev, [key]: { ...prev[key], salvo: true } }))
      setSucesso(`Dados da turma ${periodo} - ${turma} salvos com sucesso!`)
      setTimeout(() => setSucesso(''), 3000)
      
      fecharTodosAposSalvar()
      
    } catch (err) {
      console.error('Erro ao salvar:', err)
      setErro('Erro ao salvar dados. Tente novamente.')
      setTimeout(() => setErro(''), 3000)
    } finally {
      setSalvando(false)
    }
  }

  async function salvarTodasTurmas() {
    if (avaliacao?.tipo_avaliacao === 'niveis') {
      const turmasNaoSalvas = Object.values(dadosNiveis).filter(d => !d.salvo)
      if (turmasNaoSalvas.length === 0) {
        setSucesso('Todas as turmas já estão salvas!')
        setTimeout(() => setSucesso(''), 3000)
        return
      }
      
      setSalvando(true)
      for (const turma of turmasNaoSalvas) {
        await salvarTurmaNiveis(turma.periodo, turma.turma)
      }
    } else {
      const turmasNaoSalvas = Object.values(dadosHabilidades).filter(d => !d.salvo)
      if (turmasNaoSalvas.length === 0) {
        setSucesso('Todas as turmas já estão salvas!')
        setTimeout(() => setSucesso(''), 3000)
        return
      }
      
      setSalvando(true)
      for (const turma of turmasNaoSalvas) {
        await salvarTurmaHabilidades(turma.periodo, turma.turma)
      }
    }
    
    setSalvando(false)
    setSucesso('Todas as turmas foram salvas com sucesso!')
    setTimeout(() => setSucesso(''), 3000)
    fecharTodosAposSalvar()
  }

  async function handleEnviarDiagnostico() {
    const pendentes = getTurmasPendentesCount()
    
    if (pendentes > 0) {
      setErro(`Não é possível enviar o diagnóstico. Existem ${pendentes} turma(s) pendentes de preenchimento.`)
      setTimeout(() => setErro(''), 5000)
      return
    }
    
    setEnviando(true)
    
    try {
      // Aqui você pode adicionar a lógica para enviar o diagnóstico
      // Por exemplo, marcar como finalizado, enviar email, etc.
      
      setSucesso('Diagnóstico enviado com sucesso! Todas as turmas foram preenchidas.')
      setTimeout(() => setSucesso(''), 5000)
      
    } catch (err) {
      console.error('Erro ao enviar diagnóstico:', err)
      setErro('Erro ao enviar diagnóstico. Tente novamente.')
      setTimeout(() => setErro(''), 3000)
    } finally {
      setEnviando(false)
    }
  }

  const dadosPorPeriodo = () => {
    if (avaliacao?.tipo_avaliacao === 'niveis') {
      return Object.values(dadosNiveis).reduce((acc, item) => {
        if (!acc[item.periodo]) acc[item.periodo] = []
        acc[item.periodo].push(item)
        return acc
      }, {} as Record<string, DadosTurmaNiveis[]>)
    } else {
      return Object.values(dadosHabilidades).reduce((acc, item) => {
        if (!acc[item.periodo]) acc[item.periodo] = []
        acc[item.periodo].push(item)
        return acc
      }, {} as Record<string, DadosTurmaHabilidades[]>)
    }
  }

  const periodosOrdenados = PERIODOS.filter(p => dadosPorPeriodo()[p]?.length > 0)

  return (
    <div className="min-h-screen text-slate-700 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mb-4">
            <School size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Inserção de Resultados
          </h1>
          <p className="text-gray-500 mt-2">Utilize o código fornecido pela coordenação</p>
        </div>

        {!codigoValido ? (
          <div className="max-w-md text-slate-700 mx-auto bg-white rounded-2xl shadow-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Código de Acesso</label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Ex: AV01-ESC001-2024"
              className="w-full p-3 border rounded-xl font-mono mb-4"
            />
            {erro && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
                <AlertCircle size={18} /> {erro}
              </div>
            )}
            <button
              onClick={handleValidarCodigo}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Validar Código'}
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <School size={24} className="text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{escola?.nome}</h2>
                    <p className="text-gray-500">
                      Avaliação: {avaliacao?.titulo} ({avaliacao?.ano}) - 
                      {avaliacao?.tipo_avaliacao === 'niveis' ? ' Por Níveis' : ' Por Habilidades'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={expandirTodas}
                    className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 transition"
                  >
                    <ChevronDown size={18} />
                    Expandir Todas
                  </button>
                  <button
                    onClick={fecharTodas}
                    className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 transition"
                  >
                    <ChevronUp size={18} />
                    Fechar Todas
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-xl ${todasTurmasPreenchidas() ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {todasTurmasPreenchidas() ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle size={20} />
                        <span className="font-medium">Todas as turmas preenchidas</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Clock size={20} />
                        <span className="font-medium">{getTurmasPendentesCount()} turma(s) pendente(s)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progresso de preenchimento</span>
                  <span>{Math.round(((Object.values(avaliacao?.tipo_avaliacao === 'niveis' ? dadosNiveis : dadosHabilidades).filter(t => t.salvo).length) / 
                    (Object.values(avaliacao?.tipo_avaliacao === 'niveis' ? dadosNiveis : dadosHabilidades).length)) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((Object.values(avaliacao?.tipo_avaliacao === 'niveis' ? dadosNiveis : dadosHabilidades).filter(t => t.salvo).length) / 
                      (Object.values(avaliacao?.tipo_avaliacao === 'niveis' ? dadosNiveis : dadosHabilidades).length)) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {erro && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
                <AlertCircle size={18} /> {erro}
              </div>
            )}

            {sucesso && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl flex items-center gap-2">
                <CheckCircle size={18} /> {sucesso}
              </div>
            )}

            {avaliacao?.tipo_avaliacao === 'niveis' && (
              <div className="mb-6 p-3 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <BarChart3 size={16} />
                  Esta avaliação é do tipo <strong>Por Níveis de Proficiência</strong>. Preencha os níveis para cada disciplina.
                </p>
              </div>
            )}

            {avaliacao?.tipo_avaliacao === 'habilidades' && (
              <div className="mb-6 p-3 bg-purple-50 rounded-xl">
                <p className="text-sm text-purple-700 flex items-center gap-2">
                  <Target size={16} />
                  Esta avaliação é do tipo <strong>Por Habilidades</strong>. Preencha a quantidade de acertos para cada habilidade.
                </p>
              </div>
            )}

            <div className="space-y-6">
              {periodosOrdenados.map((periodo) => {
                const turmasPeriodo = dadosPorPeriodo()[periodo] || []
                const todasSalvas = turmasPeriodo.every(t => t.salvo)
                const algumaSalva = turmasPeriodo.some(t => t.salvo)
                
                return (
                  <div key={periodo} className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all ${
                    todasSalvas ? 'border-green-300' : algumaSalva ? 'border-yellow-300' : 'border-gray-200'
                  }`}>
                    <button
                      onClick={() => toggleExpandir(periodo)}
                      className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-indigo-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen size={20} className="text-indigo-600" />
                        <h3 className="font-semibold">{periodo}</h3>
                        <span className="text-sm text-gray-500">{turmasPeriodo.length} turma(s)</span>
                        {todasSalvas ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                            <CheckCircle size={10} /> Completas
                          </span>
                        ) : algumaSalva ? (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
                            <Clock size={10} /> Em andamento
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full flex items-center gap-1">
                            <AlertCircle size={10} /> Pendente
                          </span>
                        )}
                      </div>
                      {expandidos[periodo] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    
                    {expandidos[periodo] && avaliacao?.tipo_avaliacao === 'niveis' && (
                      <div className="p-6 space-y-6">
                        {(dadosPorPeriodo()[periodo] as DadosTurmaNiveis[])?.map((item) => (
                          <div key={`${item.periodo}_${item.turma}`} className={`border rounded-xl p-4 transition-all ${
                            item.salvo 
                              ? 'bg-green-50 border-green-300 shadow-sm' 
                              : 'bg-yellow-50 border-yellow-300 shadow-sm'
                          }`}>
                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center gap-3">
                                <h4 className="font-semibold text-lg">Turma {item.turma}</h4>
                                {!item.salvo && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
                                    <AlertCircle size={12} /> Pendente
                                  </span>
                                )}
                                {item.salvo && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                                    <CheckCircle size={12} /> Salvo
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                              <div>
                                <label className="text-sm font-medium text-gray-700">Alunos Matriculados</label>
                                <input
                                  type="number"
                                  value={item.matriculados}
                                  onChange={(e) => atualizarMatriculadosNiveis(item.periodo, item.turma, parseInt(e.target.value) || 0)}
                                  className="w-full mt-1 p-2 border rounded-lg"
                                  min={0}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Alunos Frequentando</label>
                                <input
                                  type="number"
                                  value={item.frequentando}
                                  onChange={(e) => atualizarFrequentandoNiveis(item.periodo, item.turma, parseInt(e.target.value) || 0)}
                                  className="w-full mt-1 p-2 border rounded-lg"
                                  min={0}
                                  max={item.matriculados}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Alunos Avaliados</label>
                                <input
                                  type="number"
                                  value={item.avaliados}
                                  onChange={(e) => atualizarAvaliadosNiveis(item.periodo, item.turma, parseInt(e.target.value) || 0)}
                                  className="w-full mt-1 p-2 border rounded-lg"
                                  min={0}
                                  max={item.matriculados}
                                />
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="bg-blue-50 rounded-xl p-4">
                                <h5 className="font-medium text-blue-800 mb-3">Língua Portuguesa</h5>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-xs text-red-600">Insuficiente</label>
                                    <input
                                      type="number"
                                      value={item.portugues.insuficiente}
                                      onChange={(e) => atualizarNivel(item.periodo, item.turma, 'portugues', 'insuficiente', parseInt(e.target.value) || 0)}
                                      className="w-full p-2 border rounded-lg text-sm"
                                      min={0}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-yellow-600">Básico</label>
                                    <input
                                      type="number"
                                      value={item.portugues.basico}
                                      onChange={(e) => atualizarNivel(item.periodo, item.turma, 'portugues', 'basico', parseInt(e.target.value) || 0)}
                                      className="w-full p-2 border rounded-lg text-sm"
                                      min={0}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-blue-600">Proficiente</label>
                                    <input
                                      type="number"
                                      value={item.portugues.proficiente}
                                      onChange={(e) => atualizarNivel(item.periodo, item.turma, 'portugues', 'proficiente', parseInt(e.target.value) || 0)}
                                      className="w-full p-2 border rounded-lg text-sm"
                                      min={0}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-green-600">Avançado</label>
                                    <input
                                      type="number"
                                      value={item.portugues.avancado}
                                      onChange={(e) => atualizarNivel(item.periodo, item.turma, 'portugues', 'avancado', parseInt(e.target.value) || 0)}
                                      className="w-full p-2 border rounded-lg text-sm"
                                      min={0}
                                    />
                                  </div>
                                </div>
                                <div className="mt-2 text-xs text-gray-500 text-right">
                                  Soma: {item.portugues.insuficiente + item.portugues.basico + item.portugues.proficiente + item.portugues.avancado} / {item.avaliados}
                                  {!validarSoma(item.periodo, item.turma, 'portugues') && (
                                    <span className="text-red-500 ml-2">⚠️ Soma não confere</span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="bg-purple-50 rounded-xl p-4">
                                <h5 className="font-medium text-purple-800 mb-3">Matemática</h5>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-xs text-red-600">Insuficiente</label>
                                    <input
                                      type="number"
                                      value={item.matematica.insuficiente}
                                      onChange={(e) => atualizarNivel(item.periodo, item.turma, 'matematica', 'insuficiente', parseInt(e.target.value) || 0)}
                                      className="w-full p-2 border rounded-lg text-sm"
                                      min={0}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-yellow-600">Básico</label>
                                    <input
                                      type="number"
                                      value={item.matematica.basico}
                                      onChange={(e) => atualizarNivel(item.periodo, item.turma, 'matematica', 'basico', parseInt(e.target.value) || 0)}
                                      className="w-full p-2 border rounded-lg text-sm"
                                      min={0}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-blue-600">Proficiente</label>
                                    <input
                                      type="number"
                                      value={item.matematica.proficiente}
                                      onChange={(e) => atualizarNivel(item.periodo, item.turma, 'matematica', 'proficiente', parseInt(e.target.value) || 0)}
                                      className="w-full p-2 border rounded-lg text-sm"
                                      min={0}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-green-600">Avançado</label>
                                    <input
                                      type="number"
                                      value={item.matematica.avancado}
                                      onChange={(e) => atualizarNivel(item.periodo, item.turma, 'matematica', 'avancado', parseInt(e.target.value) || 0)}
                                      className="w-full p-2 border rounded-lg text-sm"
                                      min={0}
                                    />
                                  </div>
                                </div>
                                <div className="mt-2 text-xs text-gray-500 text-right">
                                  Soma: {item.matematica.insuficiente + item.matematica.basico + item.matematica.proficiente + item.matematica.avancado} / {item.avaliados}
                                  {!validarSoma(item.periodo, item.turma, 'matematica') && (
                                    <span className="text-red-500 ml-2">⚠️ Soma não confere</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                              <button
                                onClick={() => salvarTurmaNiveis(item.periodo, item.turma)}
                                disabled={salvando}
                                className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition flex items-center gap-2"
                              >
                                <Save size={18} />
                                {item.salvo ? 'Atualizar Resultados' : 'Salvar Resultados da Turma'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {expandidos[periodo] && avaliacao?.tipo_avaliacao === 'habilidades' && (
                      <div className="p-6 space-y-6">
                        {(dadosPorPeriodo()[periodo] as DadosTurmaHabilidades[])?.map((item) => (
                          <div key={`${item.periodo}_${item.turma}`} className={`border rounded-xl p-4 transition-all ${
                            item.salvo 
                              ? 'bg-green-50 border-green-300 shadow-sm' 
                              : 'bg-yellow-50 border-yellow-300 shadow-sm'
                          }`}>
                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center gap-3">
                                <h4 className="font-semibold text-lg">Turma {item.turma}</h4>
                                {!item.salvo && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
                                    <AlertCircle size={12} /> Pendente
                                  </span>
                                )}
                                {item.salvo && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                                    <CheckCircle size={12} /> Salvo
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                              <div>
                                <label className="text-sm font-medium text-gray-700">Alunos Matriculados</label>
                                <input
                                  type="number"
                                  value={item.matriculados}
                                  onChange={(e) => atualizarMatriculadosHabilidades(item.periodo, item.turma, parseInt(e.target.value) || 0)}
                                  className="w-full mt-1 p-2 border rounded-lg"
                                  min={0}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Alunos Frequentando</label>
                                <input
                                  type="number"
                                  value={item.frequentando}
                                  onChange={(e) => atualizarFrequentandoHabilidades(item.periodo, item.turma, parseInt(e.target.value) || 0)}
                                  className="w-full mt-1 p-2 border rounded-lg"
                                  min={0}
                                  max={item.matriculados}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">Alunos Avaliados</label>
                                <input
                                  type="number"
                                  value={item.avaliados}
                                  onChange={(e) => atualizarAvaliadosHabilidades(item.periodo, item.turma, parseInt(e.target.value) || 0)}
                                  className="w-full mt-1 p-2 border rounded-lg"
                                  min={0}
                                  max={item.matriculados}
                                />
                              </div>
                            </div>

                            <div className="space-y-6">
                              <div className="bg-blue-50 rounded-xl p-4">
                                <h5 className="font-medium text-blue-800 mb-3">Habilidades - Língua Portuguesa</h5>
                                {getHabilidadesPorPeriodo('Língua Portuguesa', item.periodo).map((habilidade) => {
                                  const habData = item.habilidades[habilidade.codigo] || { quantidade: 0, percentual: 0 }
                                  return (
                                    <div key={habilidade.codigo} className="mb-4 last:mb-0">
                                      <label className="text-sm font-medium text-gray-700 block mb-1">
                                        {habilidade.codigo} - {habilidade.descricao}
                                      </label>
                                      <div className="flex gap-4 items-center">
                                        <input
                                          type="number"
                                          value={habData.quantidade}
                                          onChange={(e) => atualizarHabilidade(item.periodo, item.turma, habilidade.codigo, parseInt(e.target.value) || 0)}
                                          className="w-32 p-2 border rounded-lg"
                                          min={0}
                                          max={item.avaliados}
                                          placeholder="Quantidade"
                                        />
                                        <span className="text-sm text-gray-500">
                                          {item.avaliados > 0 ? ((habData.quantidade / item.avaliados) * 100).toFixed(1) : 0}% de acerto
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>

                              <div className="bg-purple-50 rounded-xl p-4">
                                <h5 className="font-medium text-purple-800 mb-3">Habilidades - Matemática</h5>
                                {getHabilidadesPorPeriodo('Matemática', item.periodo).map((habilidade) => {
                                  const habData = item.habilidades[habilidade.codigo] || { quantidade: 0, percentual: 0 }
                                  return (
                                    <div key={habilidade.codigo} className="mb-4 last:mb-0">
                                      <label className="text-sm font-medium text-gray-700 block mb-1">
                                        {habilidade.codigo} - {habilidade.descricao}
                                      </label>
                                      <div className="flex gap-4 items-center">
                                        <input
                                          type="number"
                                          value={habData.quantidade}
                                          onChange={(e) => atualizarHabilidade(item.periodo, item.turma, habilidade.codigo, parseInt(e.target.value) || 0)}
                                          className="w-32 p-2 border rounded-lg"
                                          min={0}
                                          max={item.avaliados}
                                          placeholder="Quantidade"
                                        />
                                        <span className="text-sm text-gray-500">
                                          {item.avaliados > 0 ? ((habData.quantidade / item.avaliados) * 100).toFixed(1) : 0}% de acerto
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                              <button
                                onClick={() => salvarTurmaHabilidades(item.periodo, item.turma)}
                                disabled={salvando}
                                className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition flex items-center gap-2"
                              >
                                <Save size={18} />
                                {item.salvo ? 'Atualizar Resultados' : 'Salvar Resultados da Turma'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={salvarTodasTurmas}
                disabled={salvando}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2"
              >
                <Save size={20} /> {salvando ? 'Salvando...' : 'Salvar Todas as Turmas'}
              </button>
              <button
                onClick={handleEnviarDiagnostico}
                disabled={enviando || !todasTurmasPreenchidas()}
                className={`flex-1 py-3 rounded-xl transition flex items-center justify-center gap-2 ${
                  todasTurmasPreenchidas() 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Send size={20} /> 
                {enviando ? 'Enviando...' : todasTurmasPreenchidas() ? 'Enviar Diagnóstico' : `Aguardando ${getTurmasPendentesCount()} turma(s)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}