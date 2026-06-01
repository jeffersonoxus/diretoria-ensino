'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSetorEJA } from '@/hooks/useSetorEJA'
import { Plus, Pencil, Trash2, X, BookOpen, School, Copy, Save, RotateCcw } from 'lucide-react'

const PERIODOS = ['1º período', '2º período', '3º período', '4º período', '5º período', '6º período', '7º período', '8º período']

const SEGMENTOS = [
  { value: '1º segmento', label: '1º segmento (1º ao 4º período)', periodos: ['1º período', '2º período', '3º período', '4º período'] },
  { value: '2º segmento', label: '2º segmento (5º ao 8º período)', periodos: ['5º período', '6º período', '7º período', '8º período'] },
]

const PERIODO_TO_SEGMENTO: Record<string, string> = {
  '1º período': '1º segmento',
  '2º período': '1º segmento',
  '3º período': '1º segmento',
  '4º período': '1º segmento',
  '5º período': '2º segmento',
  '6º período': '2º segmento',
  '7º período': '2º segmento',
  '8º período': '2º segmento',
}

const SEGMENTO_1_DISCIPLINAS = ['Língua Portuguesa', 'Matemática', 'História', 'Geografia', 'Ciências', 'Ensino Religioso', 'Arte', 'Educação Física']

const SEGMENTO_2_DISCIPLINAS = ['Língua Portuguesa', 'Matemática', 'História', 'Geografia', 'Ciências', 'Inglês', 'Arte', 'Educação Física', 'Ensino Religioso']

interface DisciplinaMatriz {
  id: string
  segmento: string
  disciplina: string
  ch_prevista: number | null
  turmas_por_professor: number
  created_at: string
}

interface Escola {
  id: string
  nome: string
}

interface ModalData {
  segmento: string
  disciplina: string
  ch_prevista: string
  turmas_por_professor: string
}

export default function MatrizPage() {
  const supabase = createClient()
  const router = useRouter()
  const { isSetorEJA, loading: loadingSetor } = useSetorEJA()

  const [tab, setTab] = useState<'geral' | 'escola'>('geral')
  const [matrizGeral, setMatrizGeral] = useState<DisciplinaMatriz[]>([])
  const [matrizEscola, setMatrizEscola] = useState<DisciplinaMatriz[]>([])
  const [escolas, setEscolas] = useState<Escola[]>([])
  const [escolaSelecionada, setEscolaSelecionada] = useState('')
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [contador, setContador] = useState(10)
  const [podeConfirmar, setPodeConfirmar] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [disciplinaOriginal, setDisciplinaOriginal] = useState('')
  const [modalData, setModalData] = useState<ModalData>({ segmento: '', disciplina: '', ch_prevista: '', turmas_por_professor: '1' })
  const [erro, setErro] = useState<string | null>(null)
  const [inheritModal, setInheritModal] = useState(false)
  const [inheritData, setInheritData] = useState<DisciplinaMatriz[]>([])

  useEffect(() => {
    if (!loadingSetor && !isSetorEJA) {
      router.push('/agenda')
    }
  }, [loadingSetor, isSetorEJA, router])

  useEffect(() => {
    if (!isSetorEJA) return
    loadData()
  }, [isSetorEJA])

  async function loadData() {
    setLoading(true)
    try {
      const [matrizRes, escolasRes] = await Promise.all([
        supabase.from('eja_matriz').select('*').order('segmento'),
        supabase.from('escolas_eja').select('id, nome').eq('ativa', true).order('nome'),
      ])
      if (matrizRes.data) setMatrizGeral(matrizRes.data)
      if (escolasRes.data) setEscolas(escolasRes.data)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadMatrizEscola(escolaId: string) {
    if (!escolaId) { setMatrizEscola([]); return }
    try {
      const { data } = await supabase.from('eja_matriz_escola').select('*').eq('escola_id', escolaId).order('segmento')
      if (data) setMatrizEscola(data)
    } catch (err) {
      console.error('Erro ao carregar matriz da escola:', err)
    }
  }

  useEffect(() => {
    if (tab === 'escola' && escolaSelecionada) {
      loadMatrizEscola(escolaSelecionada)
    }
  }, [tab, escolaSelecionada])

  function openAddModal() {
    setEditandoId(null)
    setDisciplinaOriginal('')
    setModalData({ segmento: '', disciplina: '', ch_prevista: '', turmas_por_professor: '1' })
    setErro(null)
    setModalOpen(true)
  }

  function openEditModal(item: DisciplinaMatriz) {
    setEditandoId(item.id)
    setDisciplinaOriginal(item.disciplina)
    setModalData({
      segmento: tab === 'geral' ? (PERIODO_TO_SEGMENTO[item.segmento] || item.segmento) : item.segmento,
      disciplina: item.disciplina,
      ch_prevista: item.ch_prevista?.toString() || '',
      turmas_por_professor: item.turmas_por_professor.toString(),
    })
    setErro(null)
    setModalOpen(true)
  }

  async function handleSaveModal() {
    if (!modalData.segmento || !modalData.disciplina.trim()) {
      setErro('Preencha segmento e disciplina')
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      const payload = {
        disciplina: modalData.disciplina.trim(),
        ch_prevista: modalData.ch_prevista ? parseInt(modalData.ch_prevista) : null,
        turmas_por_professor: parseInt(modalData.turmas_por_professor) || 1,
      }

      if (tab === 'geral') {
        const seg = SEGMENTOS.find(s => s.value === modalData.segmento)
        if (!seg) { setErro('Segmento inválido'); setSalvando(false); return }

        if (editandoId) {
          const disciplinaMatch = disciplinaOriginal || modalData.disciplina.trim()
          const { error } = await supabase
            .from('eja_matriz')
            .update(payload)
            .in('segmento', seg.periodos)
            .eq('disciplina', disciplinaMatch)
          if (error) throw error
        } else {
          const records = seg.periodos.map(p => ({ ...payload, segmento: p }))
          const { error } = await supabase.from('eja_matriz').insert(records)
          if (error) throw error
        }
        await loadData()
      } else {
        if (!escolaSelecionada) { setErro('Selecione uma escola'); setSalvando(false); return }
        const escolaPayload = { ...payload, segmento: modalData.segmento, escola_id: escolaSelecionada }
        if (editandoId) {
          const { error } = await supabase.from('eja_matriz_escola').update(payload).eq('id', editandoId)
          if (error) throw error
        } else {
          const { error } = await supabase.from('eja_matriz_escola').insert([escolaPayload])
          if (error) throw error
        }
        await loadMatrizEscola(escolaSelecionada)
      }
      setModalOpen(false)
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function handleDelete(item: DisciplinaMatriz) {
    if (!confirm(`Excluir "${item.disciplina}" de todos os períodos?`)) return
    try {
      if (tab === 'geral') {
        const seg = SEGMENTOS.find(s => s.periodos.includes(item.segmento) || s.value === item.segmento)
        if (seg) {
          const { error } = await supabase
            .from('eja_matriz')
            .delete()
            .in('segmento', seg.periodos)
            .eq('disciplina', item.disciplina)
          if (error) throw error
        }
        await loadData()
      } else {
        const { error } = await supabase.from('eja_matriz_escola').delete().eq('id', item.id)
        if (error) throw error
        setMatrizEscola(prev => prev.filter(d => d.id !== item.id))
      }
    } catch (err) {
      console.error('Erro ao excluir:', err)
      alert('Erro ao excluir disciplina')
    }
  }

  async function seedDefaults() {
    setSalvando(true)
    try {
      const { error: delError } = await supabase.from('eja_matriz').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (delError) throw delError

      const inserts: { segmento: string; disciplina: string; ch_prevista: number | null; turmas_por_professor: number }[] = []
      for (const periodo of PERIODOS) {
        const disciplinas = ['5º período', '6º período', '7º período', '8º período'].includes(periodo)
          ? SEGMENTO_2_DISCIPLINAS
          : SEGMENTO_1_DISCIPLINAS
        for (const disc of disciplinas) {
          inserts.push({ segmento: periodo, disciplina: disc, ch_prevista: null, turmas_por_professor: 1 })
        }
      }
      const { error } = await supabase.from('eja_matriz').insert(inserts)
      if (error) throw error
      await loadData()
    } catch (err: any) {
      console.error('Erro ao inserir padrões:', err)
      alert('Erro ao inserir disciplinas padrão')
    } finally {
      setSalvando(false)
      setShowConfirmModal(false)
    }
  }

  function openConfirmModal() {
    setContador(10)
    setPodeConfirmar(false)
    setShowConfirmModal(true)
  }

  useEffect(() => {
    if (!showConfirmModal) return
    if (contador <= 0) {
      setPodeConfirmar(true)
      return
    }
    const timer = setTimeout(() => setContador(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [showConfirmModal, contador])

  async function openInheritModal() {
    setErro(null)
    setInheritData([])
    try {
      const { data } = await supabase.from('eja_matriz').select('*').order('segmento')
      if (data) setInheritData(data)
      setInheritModal(true)
    } catch (err) {
      console.error('Erro:', err)
    }
  }

  async function confirmInherit() {
    if (!escolaSelecionada) return
    setSalvando(true)
    try {
      const inserts = inheritData.map(d => ({
        escola_id: escolaSelecionada,
        segmento: d.segmento,
        disciplina: d.disciplina,
        ch_prevista: d.ch_prevista,
        turmas_por_professor: d.turmas_por_professor,
      }))
      const { error } = await supabase.from('eja_matriz_escola').insert(inserts)
      if (error) {
        if (error.code === '23505') {
          alert('Algumas disciplinas já existem para esta escola. As duplicadas foram ignoradas.')
        } else {
          throw error
        }
      }
      await loadMatrizEscola(escolaSelecionada)
      setInheritModal(false)
    } catch (err: any) {
      console.error('Erro ao herdar:', err)
      alert('Erro ao herdar matriz geral')
    } finally {
      setSalvando(false)
    }
  }

  function groupBySegmento(data: DisciplinaMatriz[]): Record<string, DisciplinaMatriz[]> {
    return data.reduce((acc, item) => {
      if (!acc[item.segmento]) acc[item.segmento] = []
      acc[item.segmento].push(item)
      return acc
    }, {} as Record<string, DisciplinaMatriz[]>)
  }

  function groupBySegmentoNome(data: DisciplinaMatriz[]): Record<string, DisciplinaMatriz[]> {
    const grouped: Record<string, DisciplinaMatriz[]> = {}
    for (const item of data) {
      const segNome = PERIODO_TO_SEGMENTO[item.segmento] || item.segmento
      if (!grouped[segNome]) grouped[segNome] = []
      const existing = grouped[segNome].find(d => d.disciplina === item.disciplina)
      if (!existing) grouped[segNome].push(item)
    }
    return grouped
  }

  if (loadingSetor) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  )

  if (!isSetorEJA) return null

  const geralPorSegmento = groupBySegmentoNome(matrizGeral)
  const escolaAgrupado = groupBySegmento(matrizEscola)

  return (
    <div className="min-h-screen text-slate-700 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <BookOpen className="text-indigo-600" />
              Matriz EJA
            </h1>
            <p className="text-gray-500 mt-1">Configure as disciplinas por segmento — aplicadas a todos os períodos automaticamente</p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-indigo-100 w-fit">
          <button
            onClick={() => setTab('geral')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'geral' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <School size={18} />
            Matriz Geral
          </button>
          <button
            onClick={() => setTab('escola')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'escola' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Copy size={18} />
            Por Escola
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : tab === 'geral' ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-700">Disciplinas da Matriz Geral</h2>
              <div className="flex gap-2">
                  <button
                    onClick={openConfirmModal}
                    disabled={salvando}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 transition shadow-md disabled:opacity-50"
                  >
                    <RotateCcw size={16} />
                    {matrizGeral.length > 0 ? 'Recriar Padrão' : 'Inserir Padrão'}
                  </button>
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
                >
                  <Plus size={16} />
                  Adicionar Disciplina
                </button>
              </div>
            </div>

            {matrizGeral.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">Nenhuma disciplina cadastrada na matriz geral</p>
                <p className="text-sm text-gray-400 mb-4">Clique em "Inserir Padrão" para preencher com disciplinas comuns ou adicione manualmente</p>
                <p className="text-xs text-gray-300">As disciplinas são configuradas por segmento e aplicadas automaticamente a todos os períodos do segmento.</p>
              </div>
            ) : (
              <div>
                {Object.entries(geralPorSegmento).map(([segmento, disciplinas]) => (
                  <div key={segmento} className="border-b border-gray-100 last:border-b-0">
                    <div className="px-6 py-3 bg-gradient-to-r from-indigo-600/5 to-purple-600/5 border-b border-indigo-100/50">
                      <h3 className="font-semibold text-indigo-700 text-sm flex items-center gap-2">
                        <School size={16} />
                        {segmento}
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <th className="px-6 py-3">Disciplina</th>
                            <th className="px-6 py-3">CH Prevista</th>
                            <th className="px-6 py-3">Turmas por Professor</th>
                            <th className="px-6 py-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {disciplinas.map(d => (
                            <tr key={d.id} className="hover:bg-indigo-50/30 transition">
                              <td className="px-6 py-3 font-medium text-gray-800">{d.disciplina}</td>
                              <td className="px-6 py-3 text-gray-500">{d.ch_prevista ? `${d.ch_prevista}h` : '-'}</td>
                              <td className="px-6 py-3 text-gray-500">{d.turmas_por_professor}</td>
                              <td className="px-6 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => openEditModal(d)}
                                    className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                                    title="Editar"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(d)}
                                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                                    title="Excluir"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
              <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                <h2 className="font-semibold text-gray-700">Selecionar Escola</h2>
              </div>
              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Escola</label>
                    <select
                      value={escolaSelecionada}
                      onChange={e => setEscolaSelecionada(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      <option value="">Selecione uma escola...</option>
                      {escolas.map(e => (
                        <option key={e.id} value={e.id}>{e.nome}</option>
                      ))}
                    </select>
                  </div>
                  {escolaSelecionada && (
                    <button
                      onClick={openInheritModal}
                      disabled={salvando}
                      className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white text-sm rounded-xl hover:bg-amber-700 transition shadow-md disabled:opacity-50"
                    >
                      <Copy size={16} />
                      Herdar da Matriz Geral
                    </button>
                  )}
                </div>
              </div>
            </div>

            {escolaSelecionada ? (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-700">
                    Disciplinas - {escolas.find(e => e.id === escolaSelecionada)?.nome}
                  </h2>
                  <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
                  >
                    <Plus size={16} />
                    Adicionar Disciplina
                  </button>
                </div>

                {matrizEscola.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Copy size={32} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-2">Nenhuma disciplina específica para esta escola</p>
                    <p className="text-sm text-gray-400">Use "Herdar da Matriz Geral" para copiar as disciplinas padrão</p>
                  </div>
                ) : (
                  <div>
                    {Object.entries(escolaAgrupado).map(([segmento, disciplinas]) => (
                      <div key={segmento} className="border-b border-gray-100 last:border-b-0">
                        <div className="px-6 py-3 bg-gradient-to-r from-indigo-600/5 to-purple-600/5 border-b border-indigo-100/50">
                          <h3 className="font-semibold text-indigo-700 text-sm flex items-center gap-2">
                            <School size={16} />
                            {segmento}
                          </h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-3">Disciplina</th>
                                <th className="px-6 py-3">CH Prevista</th>
                                <th className="px-6 py-3">Turmas por Professor</th>
                                <th className="px-6 py-3 text-right">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {disciplinas.map(d => (
                                <tr key={d.id} className="hover:bg-indigo-50/30 transition">
                                  <td className="px-6 py-3 font-medium text-gray-800">{d.disciplina}</td>
                                  <td className="px-6 py-3 text-gray-500">{d.ch_prevista ? `${d.ch_prevista}h` : '-'}</td>
                                  <td className="px-6 py-3 text-gray-500">{d.turmas_por_professor}</td>
                                  <td className="px-6 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => openEditModal(d)}
                                        className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                                        title="Editar"
                                      >
                                        <Pencil size={16} />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(d)}
                                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                                        title="Excluir"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <School size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500">Selecione uma escola para ver suas disciplinas</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setModalOpen(false)}>
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="fixed inset-0 bg-black/50" onClick={() => setModalOpen(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl flex justify-between items-center">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  {editandoId ? <Pencil size={20} /> : <Plus size={20} />}
                  {editandoId ? 'Editar Disciplina' : 'Nova Disciplina'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-white hover:text-gray-200"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-5">
                {erro && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{erro}</div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Segmento</label>
                  <select
                    value={modalData.segmento}
                    onChange={e => setModalData(prev => ({ ...prev, segmento: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="">Selecione o segmento...</option>
                    {(tab === 'geral' ? SEGMENTOS : PERIODOS.map(p => ({ value: p, label: p }))).map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Disciplina</label>
                  <input
                    type="text"
                    value={modalData.disciplina}
                    onChange={e => setModalData(prev => ({ ...prev, disciplina: e.target.value }))}
                    placeholder="Ex: Língua Portuguesa"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">CH Prevista (opcional)</label>
                  <input
                    type="number"
                    value={modalData.ch_prevista}
                    onChange={e => setModalData(prev => ({ ...prev, ch_prevista: e.target.value }))}
                    placeholder="Ex: 80"
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Turmas por Professor</label>
                  <input
                    type="number"
                    value={modalData.turmas_por_professor}
                    onChange={e => setModalData(prev => ({ ...prev, turmas_por_professor: e.target.value }))}
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveModal}
                    disabled={salvando}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md disabled:opacity-50"
                  >
                    <Save size={18} />
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {inheritModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setInheritModal(false)}>
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="fixed inset-0 bg-black/50" onClick={() => setInheritModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-orange-600 rounded-t-2xl flex justify-between items-center">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Copy size={20} />
                  Herdar da Matriz Geral
                </h3>
                <button onClick={() => setInheritModal(false)} className="text-white hover:text-gray-200"><X size={20} /></button>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  As seguintes disciplinas serão copiadas da matriz geral para <strong>{escolas.find(e => e.id === escolaSelecionada)?.nome}</strong>:
                </p>

                {inheritData.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">Nenhuma disciplina encontrada na matriz geral</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-2">Segmento</th>
                          <th className="px-4 py-2">Disciplina</th>
                          <th className="px-4 py-2">CH Prevista</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {inheritData.map(d => (
                          <tr key={d.id} className="hover:bg-amber-50/30">
                            <td className="px-4 py-2 text-sm text-gray-700">{d.segmento}</td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-800">{d.disciplina}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{d.ch_prevista ? `${d.ch_prevista}h` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setInheritModal(false)}
                    className="px-5 py-2.5 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmInherit}
                    disabled={salvando || inheritData.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 transition shadow-md disabled:opacity-50"
                  >
                    <Copy size={18} />
                    {salvando ? 'Copiando...' : 'Confirmar Herança'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="fixed inset-0 bg-black/50"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 rounded-t-2xl flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Confirmar Recriação</h3>
                <button onClick={() => setShowConfirmModal(false)} className="text-white hover:text-gray-200"><X size={20} /></button>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-2">
                  Isso irá <strong>apagar todas as disciplinas</strong> da matriz geral e inserir as disciplinas padrão novamente.
                </p>
                <p className="text-gray-500 text-sm mb-6">Esta ação não pode ser desfeita.</p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="px-5 py-2.5 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={seedDefaults}
                    disabled={salvando || !podeConfirmar}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition shadow-md disabled:opacity-50"
                  >
                    {salvando ? 'Recriando...' : podeConfirmar ? 'Confirmar' : `Aguardar ${contador}s`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
