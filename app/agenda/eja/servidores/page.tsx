'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSetorEJA } from '@/hooks/useSetorEJA'
import { Plus, Pencil, Trash2, Search, X, Users, UserCheck, UserX, Filter } from 'lucide-react'

interface Servidor {
  id: string
  nome: string
  matricula: string
  funcao: string
  classificacao: string
  carga_horaria_base: number | null
  escolas_ids: string[]
  ativo: boolean
  created_at: string
  updated_at: string
}

const FUNCOES = ['Professor', 'Coordenador(a)']
const CLASSIFICACOES = ['1º segmento', '2º segmento', 'Educação Física', 'Coordenador']

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-auto" onClick={(e) => e.stopPropagation()}>
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

export default function ServidoresPage() {
  const supabase = createClient()
  const router = useRouter()
  const { isSetorEJA, loading: loadingSetor } = useSetorEJA()

  const [servidores, setServidores] = useState<Servidor[]>([])
  const [servidoresLotados, setServidoresLotados] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroFuncao, setFiltroFuncao] = useState('Todos')
  const [mostrarInativos, setMostrarInativos] = useState(false)

  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    matricula: '',
    funcao: 'Professor',
    classificacao: '1º segmento',
    ativo: true,
  })

  useEffect(() => {
    if (!loadingSetor && !isSetorEJA) {
      router.push('/agenda')
    }
  }, [loadingSetor, isSetorEJA, router])

  useEffect(() => {
    if (!isSetorEJA) return
    fetchServidores()
  }, [isSetorEJA])

  async function fetchServidores() {
    try {
      const [servRes, lotRes] = await Promise.all([
        supabase.from('eja_servidores').select('*').order('nome'),
        supabase.from('eja_lotacoes').select('servidor_id'),
      ])
      if (servRes.error) throw servRes.error
      if (servRes.data) setServidores(servRes.data)
      const lotSet = new Set(lotRes.data?.map(l => l.servidor_id) || [])
      setServidoresLotados(lotSet)
    } catch (error) {
      console.error('Erro ao buscar servidores:', error)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      nome: '',
      matricula: '',
      funcao: 'Professor',
      classificacao: '1º segmento',
      ativo: true,
    })
    setEditandoId(null)
    setModalAberto(false)
  }

  function abrirEdicao(servidor: Servidor) {
    setFormData({
      nome: servidor.nome,
      matricula: servidor.matricula || '',
      funcao: servidor.funcao,
      classificacao: servidor.classificacao || '1º segmento',
      ativo: servidor.ativo,
    })
    setEditandoId(servidor.id)
    setModalAberto(true)
  }

  async function handleSalvar() {
    if (!formData.nome.trim()) {
      alert('Nome é obrigatório')
      return
    }

    setSalvando(true)
    try {
      const dados: any = {
        nome: formData.nome.trim(),
        matricula: formData.matricula.trim() || null,
        funcao: formData.funcao,
        classificacao: formData.funcao === 'Coordenador(a)' ? 'Coordenador' : formData.classificacao,
        ativo: formData.ativo,
        updated_at: new Date().toISOString(),
      }

      let result
      if (editandoId) {
        result = await supabase
          .from('eja_servidores')
          .update(dados)
          .eq('id', editandoId)
          .select()
      } else {
        result = await supabase
          .from('eja_servidores')
          .insert([{ ...dados, created_at: new Date().toISOString() }])
          .select()
      }

      if (result.error) throw new Error(result.error.message)

      resetForm()
      await fetchServidores()
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar servidor')
    } finally {
      setSalvando(false)
    }
  }

  async function handleExcluir(id: string) {
    if (!confirm('Tem certeza que deseja excluir este servidor? Esta ação não pode ser desfeita.')) return

    try {
      const { error } = await supabase
        .from('eja_servidores')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchServidores()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir servidor')
    }
  }

  const servidoresFiltrados = servidores.filter(s => {
    if (!mostrarInativos && !s.ativo) return false
    if (filtroFuncao !== 'Todos' && s.funcao !== filtroFuncao) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      if (!s.nome.toLowerCase().includes(term) && !(s.matricula || '').toLowerCase().includes(term)) return false
    }
    return true
  })

  if (loadingSetor) return <div className="flex items-center justify-center h-64">Carregando...</div>
  if (!isSetorEJA) return null

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
              <Users className="text-indigo-600" />
              Servidores
            </h1>
            <p className="text-gray-500 mt-1">Cadastro de professores, coordenadores e demais servidores</p>
          </div>
          <button
            onClick={() => { resetForm(); setModalAberto(true) }}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition shadow-lg"
          >
            <Plus size={20} />
            Novo Servidor
          </button>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm mb-8">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
            <h2 className="font-semibold text-gray-700">Filtros</h2>
          </div>
          <div className="p-4 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 p-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="md:w-64">
              <select
                value={filtroFuncao}
                onChange={(e) => setFiltroFuncao(e.target.value)}
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500"
              >
                <option value="Todos">Todas as Funções</option>
                {FUNCOES.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mostrarInativos}
                onChange={(e) => setMostrarInativos(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-sm text-gray-600">Mostrar inativos</span>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
            <h2 className="font-semibold text-gray-700">Servidores Cadastrados</h2>
          </div>

          {servidoresFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500">Nenhum servidor cadastrado</p>
              <button
                onClick={() => { resetForm(); setModalAberto(true) }}
                className="mt-4 text-indigo-600 hover:text-indigo-700"
              >
                Clique aqui para cadastrar o primeiro servidor
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Nome</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Matrícula</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Função</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Classificação</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Lotação</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {servidoresFiltrados.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => abrirEdicao(s)}>
                      <td className="px-4 py-3 font-medium text-gray-800">{s.nome}</td>
                      <td className="px-4 py-3 font-mono text-gray-600">{s.matricula || '-'}</td>
                      <td className="px-4 py-3">{s.funcao}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                          s.classificacao === 'Coordenador' ? 'bg-purple-100 text-purple-700' :
                          s.classificacao === '1º segmento' ? 'bg-blue-100 text-blue-700' :
                          s.classificacao === '2º segmento' ? 'bg-emerald-100 text-emerald-700' :
                          s.classificacao === 'Educação Física' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {s.classificacao}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {servidoresLotados.has(s.id) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full whitespace-nowrap">
                            <UserCheck size={10} /> Lotado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full whitespace-nowrap">
                            <UserX size={10} /> Não lotado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.ativo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            <UserCheck size={10} /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => abrirEdicao(s)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleExcluir(s.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
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
          )}
        </div>
      </div>

      <Modal isOpen={modalAberto} onClose={resetForm} title={editandoId ? 'Editar Servidor' : 'Novo Servidor'}>
        <div className="space-y-4 text-slate-700">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Nome completo"
            />
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Matrícula <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input
                type="text"
                value={formData.matricula}
                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Número da matrícula (opcional)"
              />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Função</label>
            <select
              value={formData.funcao}
              onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
              className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500"
            >
              {FUNCOES.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {formData.funcao === 'Professor' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Classificação</label>
              <select
                value={formData.classificacao}
                onChange={(e) => setFormData({ ...formData, classificacao: e.target.value })}
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500"
              >
                {CLASSIFICACOES.filter(c => c !== 'Coordenador').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                1º segmento: polivalente, assume 1 turma com várias disciplinas.
                2º segmento: disciplina específica, pode assumir várias turmas.
                Educação Física: atende qualquer turma de ambos os segmentos.
              </p>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <span className="text-sm text-gray-700">Servidor Ativo</span>
          </label>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {salvando ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>Salvando...</>
              ) : (
                editandoId ? 'Atualizar' : 'Salvar'
              )}
            </button>
            <button onClick={resetForm} className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-medium">
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
