'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, Pencil, Trash2, School, BarChart3, Eye, 
  ChevronDown, ChevronUp, Users, Target, Copy, CheckCircle,
  X, Filter, Download, FileText, AlertCircle
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { ESCOLAS_FIXAS, getTodosCodigosAcesso } from '@/lib/dadosFixos'

interface Avaliacao {
  id: string
  ano: number
  titulo: string
  created_at: string
}

interface ResultadoTurma {
  id: string
  avaliacao_id: string
  escola_codigo: string
  periodo: string
  turma: string
  disciplina: string
  alunos_matriculados: number
  alunos_avaliados: number
  nivel_insuficiente: number
  nivel_basico: number
  nivel_proficiente: number
  nivel_avancado: number
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
  proficiente: number
  proficienteFormatado: string
  insuficiente: number
  insuficienteFormatado: string
}

const CORES_NIVEIS = {
  insuficiente: '#FF6B6B',
  basico: '#FFB347',
  proficiente: '#4ECDC4',
  avancado: '#45B7D1'
}

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto" onClick={(e) => e.stopPropagation()}>
          <div className="px-6 py-4 bg-linear-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
            <h3 className="text-lg font-medium text-white">{title}</h3>
          </div>
          <div className="max-h-[80vh] overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default function AvaliacoesPage() {
  const supabase = createClient()
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ ano: new Date().getFullYear(), titulo: '' })
  const [visualizandoResultados, setVisualizandoResultados] = useState<Avaliacao | null>(null)
  const [resultados, setResultados] = useState<ResultadoTurma[]>([])
  const [filtroEscola, setFiltroEscola] = useState<string>('')
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('')
  const [filtroDisciplina, setFiltroDisciplina] = useState<string>('todas')
  const [mostrarCodigos, setMostrarCodigos] = useState<Avaliacao | null>(null)

  useEffect(() => {
    fetchAvaliacoes()
  }, [])

  async function fetchAvaliacoes() {
    try {
      const { data, error } = await supabase
        .from('avaliacoes_eja')  // ← Tabela nova
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

  async function handleSalvar() {
    if (!formData.titulo.trim()) {
      setErroSalvar('O título da avaliação é obrigatório')
      return
    }
    
    if (!formData.ano || formData.ano < 2000 || formData.ano > new Date().getFullYear() + 1) {
      setErroSalvar('Ano inválido')
      return
    }

    setSalvando(true)
    setErroSalvar(null)

    try {
      const dados = { 
        ano: formData.ano, 
        titulo: formData.titulo.trim(),
        updated_at: new Date().toISOString()
      }

      let result
      if (editandoId) {
        result = await supabase
          .from('avaliacoes_eja')  // ← Tabela nova
          .update(dados)
          .eq('id', editandoId)
          .select()
      } else {
        result = await supabase
          .from('avaliacoes_eja')  // ← Tabela nova
          .insert([{ 
            ...dados, 
            created_at: new Date().toISOString() 
          }])
          .select()
      }
      
      if (result.error) {
        console.error('Erro do Supabase:', result.error)
        throw new Error(result.error.message)
      }
      
      resetForm()
      await fetchAvaliacoes()
      
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      setErroSalvar(error.message || 'Erro ao salvar avaliação. Verifique os dados e tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  async function handleExcluir(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return
    
    try {
      const { error } = await supabase
        .from('avaliacoes_eja')  // ← Tabela nova
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
    try {
      const { data, error } = await supabase
        .from('resultados_eja_turma')  // ← Tabela nova
        .select('*')
        .eq('avaliacao_id', avaliacao.id)
      
      if (error) throw error
      if (data) setResultados(data)
    } catch (error) {
      console.error('Erro ao buscar resultados:', error)
    }
  }

  function resetForm() {
    setFormData({ ano: new Date().getFullYear(), titulo: '' })
    setEditandoId(null)
    setMostrarFormulario(false)
    setErroSalvar(null)
  }

  // Processar dados para gráficos
  const dadosGrafico = (): DadosGrafico[] => {
    let filtrados = [...resultados]
    
    if (filtroEscola) filtrados = filtrados.filter(r => r.escola_codigo === filtroEscola)
    if (filtroPeriodo) filtrados = filtrados.filter(r => r.periodo === filtroPeriodo)
    if (filtroDisciplina !== 'todas') filtrados = filtrados.filter(r => r.disciplina === filtroDisciplina)
    
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

  // Dados por escola
  const dadosPorEscola = (): DadosPorEscola[] => {
    const escolasMap = new Map<string, { insuficiente: number; basico: number; proficiente: number; avancado: number; total: number }>()
    
    resultados.forEach(r => {
      if (!escolasMap.has(r.escola_codigo)) {
        escolasMap.set(r.escola_codigo, { 
          insuficiente: 0, 
          basico: 0, 
          proficiente: 0, 
          avancado: 0, 
          total: 0 
        })
      }
      const escola = escolasMap.get(r.escola_codigo)!
      escola.insuficiente += r.nivel_insuficiente
      escola.basico += r.nivel_basico
      escola.proficiente += r.nivel_proficiente
      escola.avancado += r.nivel_avancado
      escola.total += r.nivel_insuficiente + r.nivel_basico + r.nivel_proficiente + r.nivel_avancado
    })
    
    const resultado: DadosPorEscola[] = Array.from(escolasMap.entries()).map(([codigo, dados]) => {
      const escola = ESCOLAS_FIXAS.find(e => e.codigo === codigo)
      const proficientePercentual = dados.total > 0 ? (dados.proficiente + dados.avancado) / dados.total * 100 : 0
      const insuficientePercentual = dados.total > 0 ? dados.insuficiente / dados.total * 100 : 0
      
      return {
        escola: escola?.nome || codigo,
        codigo,
        proficiente: proficientePercentual,
        proficienteFormatado: proficientePercentual.toFixed(1),
        insuficiente: insuficientePercentual,
        insuficienteFormatado: insuficientePercentual.toFixed(1)
      }
    })
    
    return resultado.sort((a, b) => b.proficiente - a.proficiente)
  }

  const periodos = [...new Set(resultados.map(r => r.periodo))].sort((a, b) => {
    const numA = parseInt(a.split('º')[0])
    const numB = parseInt(b.split('º')[0])
    return numA - numB
  })

  // Custom Tooltip para o gráfico de barras
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-sm text-gray-600">
            {payload[0].name}: {payload[0].value} alunos
          </p>
        </div>
      )
    }
    return null
  }

  // Custom Tooltip para o gráfico por escola
  const CustomEscolaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <p className="font-semibold text-gray-800">Escola: {label}</p>
          <p className="text-sm text-blue-600">
            {payload[0].name}: {payload[0].value.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-slate-700 bg-linear-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <School className="text-indigo-600" />
              Avaliações Diagnósticas - EJA
            </h1>
            <p className="text-gray-500 mt-1">Cadastre avaliações e acompanhe os resultados por escola e turma</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setMostrarFormulario(true)
            }}
            className="flex items-center gap-2 bg-linear-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-lg"
          >
            <Plus size={20} />
            Nova Avaliação
          </button>
        </div>

        {/* Lista de Avaliações */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-linear-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
            <h2 className="font-semibold text-gray-700">Avaliações Cadastradas</h2>
          </div>
          
          {avaliacoes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-gray-400" />
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
                <div key={av.id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">{av.titulo}</h3>
                    <p className="text-sm text-gray-500">Ano: {av.ano} | Criado em: {new Date(av.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex gap-2">
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
                        setFormData({ ano: av.ano, titulo: av.titulo })
                        setMostrarFormulario(true)
                        setErroSalvar(null)
                      }}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleExcluir(av.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Resultados */}
        <Modal isOpen={!!visualizandoResultados} onClose={() => setVisualizandoResultados(null)} title={`Resultados: ${visualizandoResultados?.titulo || ''}`}>
          {resultados.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500">Nenhum resultado inserido ainda.</p>
              <p className="text-sm text-gray-400 mt-2">Os códigos de acesso já foram gerados e podem ser distribuídos para as escolas.</p>
              <p className="text-sm text-gray-400">Após as escolas inserirem os dados, os resultados aparecerão aqui.</p>
            </div>
          ) : (
            <>
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="text-sm font-medium text-gray-700">Escola</label>
                  <select
                    value={filtroEscola}
                    onChange={(e) => setFiltroEscola(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Todas as escolas</option>
                    {ESCOLAS_FIXAS.map(e => (
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
              </div>

              {/* Cards de Resumo */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {dadosGrafico().find(d => d.name === 'Insuficiente')?.value || 0}
                  </div>
                  <div className="text-xs text-red-600 mt-1">Insuficiente</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {dadosGrafico().find(d => d.name === 'Básico')?.value || 0}
                  </div>
                  <div className="text-xs text-yellow-600 mt-1">Básico</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {dadosGrafico().find(d => d.name === 'Proficiente')?.value || 0}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">Proficiente</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {dadosGrafico().find(d => d.name === 'Avançado')?.value || 0}
                  </div>
                  <div className="text-xs text-green-600 mt-1">Avançado</div>
                </div>
              </div>

              {/* Gráfico Principal */}
              <div className="bg-white rounded-xl border p-6 mb-6">
                <h3 className="font-bold text-gray-800 mb-4">Distribuição por Nível de Proficiência</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={dadosGrafico()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend />
                    <Bar dataKey="value" name="Quantidade de Alunos" radius={[8, 8, 0, 0]}>
                      {dadosGrafico().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico por Escola */}
              {dadosPorEscola().length > 0 && (
                <div className="bg-white rounded-xl border p-6 mb-6">
                  <h3 className="font-bold text-gray-800 mb-4">% de Alunos Proficientes + Avançados por Escola</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={dadosPorEscola()} layout="vertical" margin={{ left: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} unit="%" />
                      <YAxis type="category" dataKey="escola" width={180} tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomEscolaTooltip />} />
                      <Bar dataKey="proficiente" name="% Proficiente + Avançado" fill="#4ECDC4" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Tabela de Resultados */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">Escola</th>
                      <th className="px-4 py-3 text-left">Período</th>
                      <th className="px-4 py-3 text-left">Turma</th>
                      <th className="px-4 py-3 text-left">Disciplina</th>
                      <th className="px-4 py-3 text-center">Matric.</th>
                      <th className="px-4 py-3 text-center">Aval.</th>
                      <th className="px-4 py-3 text-center">Insuf.</th>
                      <th className="px-4 py-3 text-center">Básico</th>
                      <th className="px-4 py-3 text-center">Profic.</th>
                      <th className="px-4 py-3 text-center">Avanç.</th>
                      <th className="px-4 py-3 text-center">% Aproveit.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {resultados
                      .filter(r => !filtroEscola || r.escola_codigo === filtroEscola)
                      .filter(r => !filtroPeriodo || r.periodo === filtroPeriodo)
                      .filter(r => filtroDisciplina === 'todas' || r.disciplina === filtroDisciplina)
                      .map((r) => {
                        const escola = ESCOLAS_FIXAS.find(e => e.codigo === r.escola_codigo)
                        const aproveitamento = r.alunos_avaliados > 0 
                          ? ((r.nivel_proficiente + r.nivel_avancado) / r.alunos_avaliados * 100).toFixed(1)
                          : '0'
                        
                        return (
                          <tr key={r.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3 font-medium">{escola?.nome || r.escola_codigo}</td>
                            <td className="px-4 py-3">{r.periodo}</td>
                            <td className="px-4 py-3">{r.turma}</td>
                            <td className="px-4 py-3">{r.disciplina}</td>
                            <td className="px-4 py-3 text-center">{r.alunos_matriculados}</td>
                            <td className="px-4 py-3 text-center">{r.alunos_avaliados}</td>
                            <td className="px-4 py-3 text-center text-red-600">{r.nivel_insuficiente}</td>
                            <td className="px-4 py-3 text-center text-yellow-600">{r.nivel_basico}</td>
                            <td className="px-4 py-3 text-center text-blue-600">{r.nivel_proficiente}</td>
                            <td className="px-4 py-3 text-center text-green-600">{r.nivel_avancado}</td>
                            <td className="px-4 py-3 text-center font-semibold">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                parseFloat(aproveitamento) >= 70 ? 'bg-green-100 text-green-700' :
                                parseFloat(aproveitamento) >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {aproveitamento}%
                              </span>
                            </td>
                          </tr>
                        )
                      })}
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
              <p className="text-sm text-blue-700">
                🔗 Link de acesso: <code className="bg-blue-100 px-2 py-1 rounded font-mono">https://seudominio.com/inserir-resultados</code>
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
            
            <div className="bg-green-50 rounded-xl p-4 mt-4">
              <h4 className="font-medium text-green-800 mb-2">📌 Instruções:</h4>
              <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                <li>Envie cada código para a escola correspondente</li>
                <li>Cada código é único para a avaliação e escola</li>
                <li>O sistema permite salvar rascunho e enviar depois</li>
                <li>Os resultados aparecerão nos gráficos após o envio</li>
              </ul>
            </div>
          </div>
        </Modal>

        {/* Modal de Formulário */}
        <Modal isOpen={mostrarFormulario} onClose={resetForm} title={editandoId ? 'Editar Avaliação' : 'Nova Avaliação'}>
          <div className="space-y-4">
            {erroSalvar && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
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
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleSalvar} 
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
    </div>
  )
}