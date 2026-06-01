'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSetorEJA } from '@/hooks/useSetorEJA'
import { Plus, Pencil, Trash2, X, School, Search, Save, Building2, Hash } from 'lucide-react'

const PERIODOS = ['1º período', '2º período', '3º período', '4º período', '5º período', '6º período', '7º período', '8º período']

interface Escola {
  id: string
  codigo: string
  nome: string
  turmas: Record<string, string[]>
  ativa: boolean
  created_at: string
}

const emptyTurmas = () => Object.fromEntries(PERIODOS.map(p => [p, [] as string[]]))

export default function EscolasPage() {
  const supabase = createClient()
  const router = useRouter()
  const { isSetorEJA, loading: loadingPerm } = useSetorEJA()

  const [escolas, setEscolas] = useState<Escola[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [formCodigo, setFormCodigo] = useState('')
  const [formNome, setFormNome] = useState('')
  const [formTurmas, setFormTurmas] = useState<Record<string, string[]>>(emptyTurmas())
  const [formAtiva, setFormAtiva] = useState(true)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!loadingPerm && !isSetorEJA) router.push('/agenda')
  }, [loadingPerm, isSetorEJA, router])

  useEffect(() => {
    if (!isSetorEJA) return
    fetchEscolas()
  }, [isSetorEJA])

  async function fetchEscolas() {
    setLoading(true)
    const { data } = await supabase.from('escolas_eja').select('*').order('nome')
    if (data) setEscolas(data as unknown as Escola[])
    setLoading(false)
  }

  function openAddModal() {
    setEditandoId(null)
    setFormCodigo('')
    setFormNome('')
    setFormTurmas(emptyTurmas())
    setFormAtiva(true)
    setErro('')
    setModalOpen(true)
  }

  function openEditModal(escola: Escola) {
    setEditandoId(escola.id)
    setFormCodigo(escola.codigo)
    setFormNome(escola.nome)
    setFormTurmas({ ...emptyTurmas(), ...escola.turmas })
    setFormAtiva(escola.ativa)
    setErro('')
    setModalOpen(true)
  }

  function adicionarTurma(periodo: string) {
    const turmas = formTurmas[periodo] || []
    const novoNumero = turmas.length + 1
    const novaTurma = novoNumero === 1 ? periodo : `${periodo}.${novoNumero}`
    setFormTurmas(prev => ({ ...prev, [periodo]: [...turmas, novaTurma] }))
  }

  function removerTurma(periodo: string, index: number) {
    setFormTurmas(prev => ({
      ...prev,
      [periodo]: (prev[periodo] || []).filter((_, i) => i !== index),
    }))
  }

  function atualizarTurma(periodo: string, index: number, valor: string) {
    setFormTurmas(prev => {
      const turmas = [...(prev[periodo] || [])]
      turmas[index] = valor
      return { ...prev, [periodo]: turmas }
    })
  }

  async function handleSalvar() {
    if (!formNome.trim() || !formCodigo.trim()) {
      setErro('Nome e código são obrigatórios')
      return
    }
    setSaving(true)
    setErro('')
    try {
      const dados = {
        codigo: formCodigo.trim().toUpperCase(),
        nome: formNome.trim(),
        turmas: formTurmas,
        ativa: formAtiva,
        updated_at: new Date().toISOString(),
      }

      if (editandoId) {
        const { error } = await supabase.from('escolas_eja').update(dados).eq('id', editandoId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('escolas_eja').insert([{ ...dados, created_at: new Date().toISOString() }])
        if (error) throw error
      }
      await fetchEscolas()
      setModalOpen(false)
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleExcluir(id: string, nome: string) {
    if (!confirm(`Excluir "${nome}"? Isso afetará lotações e matrizes vinculadas.`)) return
    try {
      const { error } = await supabase.from('escolas_eja').delete().eq('id', id)
      if (error) throw error
      await fetchEscolas()
    } catch {
      alert('Erro ao excluir escola')
    }
  }

  const filtradas = escolas.filter(e =>
    e.nome.toLowerCase().includes(search.toLowerCase()) ||
    e.codigo.toLowerCase().includes(search.toLowerCase())
  )

  const totalTurmas = (escola: Escola) =>
    Object.values(escola.turmas || {}).reduce((acc, t) => acc + t.length, 0)

  return (
    <div className="min-h-screen text-slate-700 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <School className="text-indigo-600" />
              Escolas EJA
            </h1>
            <p className="text-gray-500 mt-1">Cadastro de escolas e turmas da EJA</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
          >
            <Plus size={18} />
            Nova Escola
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou código..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          </div>
        ) : filtradas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <School size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">Nenhuma escola encontrada</p>
            <p className="text-sm text-gray-400">Clique em "Nova Escola" para cadastrar</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtradas.map(escola => (
              <div
                key={escola.id}
                className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 transition hover:shadow-xl ${
                  escola.ativa ? 'border-l-emerald-500' : 'border-l-gray-300 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${escola.ativa ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                      <School size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{escola.nome}</h3>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Hash size={12} />
                        {escola.codigo}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(escola)}
                      className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleExcluir(escola.id, escola.nome)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <School size={14} />
                    {totalTurmas(escola)} turmas
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    escola.ativa ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {escola.ativa ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                {Object.entries(escola.turmas || {}).filter(([, t]) => t.length > 0).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {Object.entries(escola.turmas || {})
                      .filter(([, t]) => t.length > 0)
                      .map(([periodo]) => (
                        <span key={periodo} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                          {periodo}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setModalOpen(false)}>
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="fixed inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl flex justify-between items-center">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  {editandoId ? <Pencil size={20} /> : <Plus size={20} />}
                  {editandoId ? 'Editar Escola' : 'Nova Escola'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-white hover:text-gray-200"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-5">
                {erro && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{erro}</div>}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Código</label>
                    <input
                      type="text"
                      value={formCodigo}
                      onChange={e => setFormCodigo(e.target.value.toUpperCase())}
                      placeholder="Ex: ESC001"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formAtiva}
                        onChange={e => setFormAtiva(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-600">Ativa</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Nome da Escola</label>
                  <input
                    type="text"
                    value={formNome}
                    onChange={e => setFormNome(e.target.value)}
                    placeholder="Ex: EMEB Dr. Gustavo Paiva"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-3">Turmas por Período</label>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {PERIODOS.map(periodo => (
                      <div key={periodo} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{periodo}</span>
                          <button
                            onClick={() => adicionarTurma(periodo)}
                            className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-200 transition"
                          >
                            + Adicionar Turma
                          </button>
                        </div>
                        {(formTurmas[periodo] || []).length === 0 ? (
                          <p className="text-xs text-gray-400">Nenhuma turma</p>
                        ) : (
                          <div className="space-y-2">
                            {(formTurmas[periodo] || []).map((turma, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={turma}
                                  onChange={e => atualizarTurma(periodo, idx, e.target.value)}
                                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <button
                                  onClick={() => removerTurma(periodo, idx)}
                                  className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSalvar}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-md disabled:opacity-50"
                  >
                    <Save size={18} />
                    {saving ? 'Salvando...' : 'Salvar'}
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
