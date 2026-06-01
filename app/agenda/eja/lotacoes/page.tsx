'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSetorEJA } from '@/hooks/useSetorEJA'
import { Plus, Pencil, Trash2, Search, X, School, Briefcase, Building2, BookOpen, Clock, AlertCircle } from 'lucide-react'
import { showToast } from '@/components/ui/Toast'

interface Servidor {
  id: string
  nome: string
  matricula: string
  funcao: string
  classificacao: string
}

interface Escola {
  id: string
  nome: string
  turmas: Record<string, string[]> | null
}

interface Lotacao {
  id: string
  servidor_id: string
  escola_id: string
  turma_id: string | null
  disciplina: string | null
  carga_horaria: number | null
  funcao_na_lotacao: string | null
  regente: boolean
  created_at: string
  servidor: Servidor
  escola: { id: string; nome: string }
}

export default function LotacoesPage() {
  const { isSetorEJA, loading: loadingPerm } = useSetorEJA()
  const router = useRouter()
  const supabase = createClient()

  const [lotacoes, setLotacoes] = useState<Lotacao[]>([])
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [escolas, setEscolas] = useState<Escola[]>([])
  const [matriz, setMatriz] = useState<{ segmento: string; disciplina: string; ch_prevista: number | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEscola, setFiltroEscola] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [formServidorId, setFormServidorId] = useState('')
  const [formEscolaId, setFormEscolaId] = useState('')
  const [formTurmaId, setFormTurmaId] = useState('')
  const [formDisciplina, setFormDisciplina] = useState('')
  const [formCargaHoraria, setFormCargaHoraria] = useState('')
  const [formFuncao, setFormFuncao] = useState('')
  const [formRegente, setFormRegente] = useState(false)
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!loadingPerm && !isSetorEJA) router.push('/agenda')
  }, [loadingPerm, isSetorEJA, router])

  useEffect(() => {
    if (!isSetorEJA) return
    fetchData()
  }, [isSetorEJA])

  const fetchData = async () => {
    setLoading(true)
    const [lotacoesRes, servidoresRes, escolasRes, matrizRes] = await Promise.all([
      supabase
        .from('eja_lotacoes')
        .select('*, servidor:eja_servidores(id, nome, matricula, funcao, classificacao), escola:escolas_eja(id, nome)')
        .order('created_at', { ascending: false }),
      supabase
        .from('eja_servidores')
        .select('id, nome, matricula, funcao, classificacao')
        .eq('ativo', true)
        .order('nome'),
      supabase
        .from('escolas_eja')
        .select('id, nome, turmas')
        .eq('ativa', true)
        .order('nome'),
      supabase
        .from('eja_matriz')
        .select('segmento, disciplina, ch_prevista')
        .order('segmento'),
    ])
    if (lotacoesRes.data) setLotacoes(lotacoesRes.data as unknown as Lotacao[])
    if (servidoresRes.data) setServidores(servidoresRes.data)
    if (escolasRes.data) setEscolas(escolasRes.data as unknown as Escola[])
    if (matrizRes.data) setMatriz(matrizRes.data)
    setLoading(false)
  }

  const getPeriodoFromTurma = (escolaId: string, turmaNome: string): string | null => {
    const escola = escolas.find(e => e.id === escolaId)
    if (!escola?.turmas) return null
    const turmas = escola.turmas as Record<string, string[]>
    for (const periodo in turmas) {
      if (turmas[periodo]?.includes(turmaNome)) return periodo
    }
    return null
  }

  const getSegmentoFromClassificacao = (periodo: string): string => {
    const num = parseInt(periodo)
    if (isNaN(num)) return ''
    return num <= 4 ? '1º segmento' : '2º segmento'
  }

  const getAllTurmas = (escolaId: string): string[] => {
    const escola = escolas.find(e => e.id === escolaId)
    if (!escola?.turmas) return []
    const turmasSet = new Set<string>()
    const turmas = escola.turmas as Record<string, string[]>
    for (const periodo in turmas) {
      turmas[periodo]?.forEach(t => turmasSet.add(t))
    }
    return Array.from(turmasSet)
  }

  const getTurmasPorClassificacao = (escolaId: string, classificacao: string): string[] => {
    const escola = escolas.find(e => e.id === escolaId)
    if (!escola?.turmas) return []
    if (classificacao === 'Educação Física') return getAllTurmas(escolaId)
    const turmas = escola.turmas as Record<string, string[]>
    const result: string[] = []
    for (const periodo in turmas) {
      const seg = getSegmentoFromClassificacao(periodo)
      if (seg === classificacao) {
        turmas[periodo]?.forEach(t => result.push(t))
      }
    }
    return result
  }

  const getDisciplinasDaMatriz = (periodo: string | null): { disciplina: string; ch_prevista: number | null }[] => {
    if (!periodo) return []
    const segmento = getSegmentoFromClassificacao(periodo)
    return matriz.filter(m => m.segmento === periodo || m.segmento === segmento)
  }

  const getFuncaoDisplay = (lotacao: Lotacao): string =>
    lotacao.funcao_na_lotacao || lotacao.servidor.funcao

  const getFuncaoBadge = (funcao: string): string => {
    const f = funcao.toLowerCase()
    if (f.includes('professor')) return 'border-blue-200 bg-blue-50 text-blue-600'
    if (f.includes('coordenador')) return 'border-purple-200 bg-purple-50 text-purple-600'
    if (f.includes('orientador')) return 'border-emerald-200 bg-emerald-50 text-emerald-600'
    if (f.includes('auxiliar')) return 'border-amber-200 bg-amber-50 text-amber-600'
    return 'border-gray-200 bg-gray-50 text-gray-600'
  }

  const lotacoesFiltradas = lotacoes.filter(lot => {
    if (filtroEscola && lot.escola_id !== filtroEscola) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const nome = (lot.servidor?.nome || '').toLowerCase()
      const funcao = getFuncaoDisplay(lot).toLowerCase()
      const disciplina = (lot.disciplina || '').toLowerCase()
      if (!nome.includes(term) && !funcao.includes(term) && !disciplina.includes(term)) return false
    }
    return true
  })

  const grouped = lotacoesFiltradas.reduce<Record<string, { nome: string; turmas: Record<string, Lotacao[]> }>>((acc, lot) => {
    if (!acc[lot.escola_id]) {
      acc[lot.escola_id] = { nome: lot.escola.nome, turmas: {} }
    }
    const turmaKey = lot.turma_id || '__coordenacao__'
    if (!acc[lot.escola_id].turmas[turmaKey]) {
      acc[lot.escola_id].turmas[turmaKey] = []
    }
    acc[lot.escola_id].turmas[turmaKey].push(lot)
    return acc
  }, {})

  const resetForm = () => {
    setEditandoId(null)
    setFormServidorId('')
    setFormEscolaId('')
    setFormTurmaId('')
    setFormDisciplina('')
    setFormCargaHoraria('')
    setFormFuncao('')
    setFormRegente(false)
  }

  const openCreate = () => { resetForm(); setModalOpen(true) }

  const openEdit = (lot: Lotacao) => {
    setEditandoId(lot.id)
    setFormServidorId(lot.servidor_id)
    setFormEscolaId(lot.escola_id)
    setFormTurmaId(lot.turma_id || '')
    setFormDisciplina(lot.disciplina || '')
    setFormCargaHoraria(lot.carga_horaria?.toString() || '')
    setFormFuncao(lot.funcao_na_lotacao || '')
    setFormRegente(lot.regente || false)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formServidorId || !formEscolaId) {
      showToast('Selecione servidor e escola', 'error')
      return
    }
    setSaving(true)
    const payload = {
      servidor_id: formServidorId,
      escola_id: formEscolaId,
      turma_id: formTurmaId || null,
      disciplina: formRegente ? null : (formDisciplina || null),
      carga_horaria: formCargaHoraria ? parseInt(formCargaHoraria) : null,
      funcao_na_lotacao: formFuncao || null,
      regente: formRegente,
    }
    try {
      if (editandoId) {
        const { error } = await supabase.from('eja_lotacoes').update(payload).eq('id', editandoId)
        if (error) throw error
        showToast('Lotação atualizada com sucesso!')
      } else {
        const { error } = await supabase.from('eja_lotacoes').insert(payload)
        if (error) throw error
        showToast('Lotação criada com sucesso!')
      }
      setModalOpen(false)
      resetForm()
      fetchData()
    } catch (err: any) {
      showToast('Erro: ' + (err.message || 'Erro desconhecido'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('eja_lotacoes').delete().eq('id', deleteId)
      if (error) throw error
      showToast('Lotação excluída com sucesso!')
      setDeleteId(null)
      fetchData()
    } catch (err: any) {
      showToast('Erro ao excluir: ' + (err.message || 'Erro desconhecido'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  if (loadingPerm) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    )
  }
  if (!isSetorEJA) return null

  const servidorSelecionado = servidores.find(s => s.id === formServidorId)
  const classificacaoServidor = servidorSelecionado?.classificacao || ''
  const turmasDisponiveis = classificacaoServidor === 'Coordenador'
    ? []
    : getTurmasPorClassificacao(formEscolaId, classificacaoServidor)
  const periodoSelecionado = formTurmaId ? getPeriodoFromTurma(formEscolaId, formTurmaId) : null
  const disciplinasDaMatriz = getDisciplinasDaMatriz(periodoSelecionado)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lotações</h1>
              <p className="text-sm text-gray-500">Vincular servidores às turmas e escolas</p>
            </div>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Lotação
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por servidor, função ou disciplina..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <select
          value={filtroEscola}
          onChange={e => setFiltroEscola(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm min-w-[200px]"
        >
          <option value="">Todas as escolas</option>
          {escolas.map(esc => (
            <option key={esc.id} value={esc.id}>{esc.nome}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20">
          <Briefcase className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 text-lg font-medium">Nenhuma lotação cadastrada</p>
          <p className="text-gray-300 text-sm mt-1">Clique em "Nova Lotação" para começar</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([escolaId, escolaGroup]) => (
            <div key={escolaId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-100">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <School className="w-4 h-4 text-purple-600" />
                </div>
                <h2 className="font-bold text-gray-900">{escolaGroup.nome}</h2>
                <span className="text-xs text-gray-400 ml-auto">
                  {Object.values(escolaGroup.turmas).flat().length} lotação(ões)
                </span>
              </div>

              <div className="divide-y divide-gray-50">
                {Object.entries(escolaGroup.turmas).map(([turmaKey, lotacoesDaTurma]) => {
                  const isCoordenacao = turmaKey === '__coordenacao__'
                  return (
                    <div key={turmaKey}>
                      <div className="flex items-center gap-2 px-6 py-3 bg-gray-50/50">
                        {isCoordenacao ? (
                          <>
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-500">Coordenação / Escola</span>
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-medium text-amber-700">{turmaKey}</span>
                          </>
                        )}
                        <span className="text-xs text-gray-400 ml-auto">{lotacoesDaTurma.length} servidor(es)</span>
                      </div>

                      <div className="divide-y divide-gray-50">
                        {lotacoesDaTurma.map(lot => {
                          const funcao = getFuncaoDisplay(lot)
                          return (
                            <div key={lot.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/80 transition-colors">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{lot.servidor.nome}</span>
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getFuncaoBadge(funcao)}`}>
                                    {funcao}
                                  </span>
                                  {'classificacao' in lot.servidor && lot.servidor.classificacao && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      lot.servidor.classificacao === 'Coordenador' ? 'bg-purple-100 text-purple-700' :
                                      lot.servidor.classificacao === '1º segmento' ? 'bg-blue-100 text-blue-700' :
                                      lot.servidor.classificacao === '2º segmento' ? 'bg-emerald-100 text-emerald-700' :
                                      lot.servidor.classificacao === 'Educação Física' ? 'bg-amber-100 text-amber-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {lot.servidor.classificacao}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                  {lot.regente ? (
                                    <span className="flex items-center gap-1 text-blue-600 font-medium">
                                      <BookOpen className="w-3.5 h-3.5" />
                                      Regente
                                    </span>
                                  ) : lot.disciplina && (
                                    <span className="flex items-center gap-1">
                                      <BookOpen className="w-3.5 h-3.5" />
                                      {lot.disciplina}
                                    </span>
                                  )}
                                  {lot.carga_horaria && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" />
                                      {lot.carga_horaria}h
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-400">Mat: {lot.servidor.matricula}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => openEdit(lot)}
                                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteId(lot.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">
                {editandoId ? 'Editar Lotação' : 'Nova Lotação'}
              </h3>
              <button onClick={() => { setModalOpen(false); resetForm() }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Servidor *</label>
                <select
                  value={formServidorId}
                  onChange={e => setFormServidorId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                >
                  <option value="">Selecione um servidor</option>
                  {servidores.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nome} - {s.matricula} ({s.funcao})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Escola *</label>
                <select
                  value={formEscolaId}
                  onChange={e => { setFormEscolaId(e.target.value); setFormTurmaId('') }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                >
                  <option value="">Selecione uma escola</option>
                  {escolas.map(e => (
                    <option key={e.id} value={e.id}>{e.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Turma</label>
                  {classificacaoServidor === 'Coordenador' && (
                    <span className="text-xs text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">
                      Coordenador vincula-se à escola inteira
                    </span>
                  )}
                </div>
                <select
                  value={formTurmaId}
                  onChange={e => { setFormTurmaId(e.target.value); setFormDisciplina('') }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm disabled:opacity-50 disabled:bg-gray-50"
                  disabled={!formEscolaId || classificacaoServidor === 'Coordenador'}
                >
                  <option value="">
                    {classificacaoServidor === 'Coordenador'
                      ? 'Vinculado à escola'
                      : !formEscolaId
                      ? 'Selecione uma escola primeiro'
                      : 'Selecione uma turma'}
                  </option>
                  {turmasDisponiveis.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {classificacaoServidor !== 'Coordenador' && formEscolaId && turmasDisponiveis.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Nenhuma turma disponível para esta classificação</p>
                )}
              </div>

              {periodoSelecionado && disciplinasDaMatriz.length > 0 && (
                <div>
                  {classificacaoServidor === '1º segmento' && formTurmaId ? (
                    <label className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100/50 transition">
                      <input
                        type="checkbox"
                        checked={formRegente}
                        onChange={e => { setFormRegente(e.target.checked); if (e.target.checked) setFormDisciplina('') }}
                        className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-blue-800">Regente da turma (todas as disciplinas)</span>
                        <p className="text-sm text-blue-600 mt-0.5">O professor assume todas as disciplinas exceto Educação Física nesta turma</p>
                      </div>
                    </label>
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Disciplina <span className="text-gray-400 font-normal">(da Matriz - {periodoSelecionado})</span>
                      </label>
                      <select
                        value={formDisciplina}
                        onChange={e => setFormDisciplina(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                      >
                        <option value="">Selecione uma disciplina</option>
                        {disciplinasDaMatriz.map(d => (
                          <option key={`${d.disciplina}-${d.ch_prevista}`} value={d.disciplina}>
                            {d.disciplina}{d.ch_prevista ? ` (${d.ch_prevista}h)` : ''}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              )}

              {!periodoSelecionado && classificacaoServidor !== 'Coordenador' && classificacaoServidor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Disciplina</label>
                  <input
                    type="text"
                    value={formDisciplina}
                    onChange={e => setFormDisciplina(e.target.value)}
                    placeholder="Ex: Polivalente, Matemática..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Carga Horária (h/semana)</label>
                <input
                  type="number"
                  value={formCargaHoraria}
                  onChange={e => setFormCargaHoraria(e.target.value)}
                  placeholder="Ex: 20"
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Função na Lotação</label>
                <input
                  type="text"
                  value={formFuncao}
                  onChange={e => setFormFuncao(e.target.value)}
                  placeholder={servidorSelecionado ? `Função base: ${servidorSelecionado.funcao}` : 'Deixe vazio para usar a função base'}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                />
                {servidorSelecionado && (
                  <p className="text-xs text-gray-400 mt-1">Deixe vazio para usar "{servidorSelecionado.funcao}"</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => { setModalOpen(false); resetForm() }}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formServidorId || !formEscolaId}
                className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {saving ? 'Salvando...' : editandoId ? 'Atualizar' : 'Criar Lotação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Confirmar exclusão</h3>
                <p className="text-sm text-gray-500 mt-0.5">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
