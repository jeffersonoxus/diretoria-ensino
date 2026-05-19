'use client'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Blocks, Plus, Pencil, Trash2, X, AlertCircle, CheckCircle, Shield } from "lucide-react"
import { showToast } from "@/components/ui/Toast"

interface Setor {
  id: string
  nome: string
  pode_criar_modelos: boolean
}

interface ParametroExtra {
  id: string
  label: string
  tipo: 'text' | 'number' | 'boolean' | 'select' | 'multiselect'
  opcoes?: string[]
}

interface TipoAcao {
  id: string
  nome: string
  setores_ids: string[]
  parametros_extras: ParametroExtra[]
}

export default function ModelosPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [setores, setSetores] = useState<Setor[]>([])
  const [tiposAcoes, setTiposAcoes] = useState<TipoAcao[]>([])
  const [userSetoresIds, setUserSetoresIds] = useState<string[]>([])
  const [userNivelAcesso, setUserNivelAcesso] = useState<string>('')
  const [userPerfilId, setUserPerfilId] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editandoNome, setEditandoNome] = useState('')
  const [editandoSetoresIds, setEditandoSetoresIds] = useState<string[]>([])
  const [editandoExtras, setEditandoExtras] = useState<ParametroExtra[]>([])
  const [showForm, setShowForm] = useState(false)

  const isAdmin = userNivelAcesso === 'administrativo' || userNivelAcesso === 'diretivo' || userNivelAcesso === 'gerencial'

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: perfil } = await supabase.from('perfis').select('id, nivel_acesso').eq('email', user.email).single()
    if (perfil) {
      setUserPerfilId(perfil.id)
      setUserNivelAcesso(perfil.nivel_acesso || 'tecnico')
    }

    const { data: setoresData } = await supabase.from('setores').select('*')
    if (setoresData) {
      setSetores(setoresData)
      const idsDoUsuario = setoresData
        .filter(s => s.pessoas?.includes(perfil?.id))
        .map(s => s.id)
      setUserSetoresIds(idsDoUsuario)
    }

    const { data: tiposData } = await supabase.from('tipo_acao').select('*')
    if (tiposData) setTiposAcoes(tiposData)

    setLoading(false)
  }

  const podeCriar = () => {
    if (isAdmin) return true
    return setores.some(s => userSetoresIds.includes(s.id) && s.pode_criar_modelos)
  }

  const setoresQuePodeCriar = () => {
    if (isAdmin) return setores
    return setores.filter(s => userSetoresIds.includes(s.id) && s.pode_criar_modelos)
  }

  const modelosDoSetor = () => {
    if (isAdmin) return tiposAcoes
    return tiposAcoes.filter(ta =>
      ta.setores_ids.some(id => userSetoresIds.includes(id))
    )
  }

  const resetForm = () => {
    setEditandoId(null)
    setEditandoNome('')
    setEditandoSetoresIds([])
    setEditandoExtras([])
    setShowForm(false)
  }

  const abrirNovo = () => {
    const setoresPadrao = setoresQuePodeCriar()
    setEditandoId(null)
    setEditandoNome('')
    setEditandoSetoresIds(setoresPadrao.map(s => s.id))
    setEditandoExtras([])
    setShowForm(true)
  }

  const abrirEdicao = (ta: TipoAcao) => {
    if (!isAdmin) return
    setEditandoId(ta.id)
    setEditandoNome(ta.nome)
    setEditandoSetoresIds(ta.setores_ids)
    setEditandoExtras(ta.parametros_extras || [])
    setShowForm(true)
  }

  const adicionarCampo = () => {
    setEditandoExtras([...editandoExtras, { id: crypto.randomUUID(), label: '', tipo: 'text' }])
  }

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editandoNome.trim() || editandoSetoresIds.length === 0) {
      showToast('Preencha o nome e selecione ao menos um setor', 'error')
      return
    }

    const payload = {
      nome: editandoNome.trim(),
      setores_ids: editandoSetoresIds,
      parametros_extras: editandoExtras.filter(ext => ext.label.trim()),
    }

    if (editandoId) {
      const { error } = await supabase.from('tipo_acao').update(payload).eq('id', editandoId)
      if (error) { showToast('Erro: ' + error.message, 'error'); return }
      showToast('Modelo atualizado!')
    } else {
      const { error } = await supabase.from('tipo_acao').insert([payload])
      if (error) { showToast('Erro: ' + error.message, 'error'); return }
      showToast('Modelo criado!')
    }

    resetForm()
    carregarDados()
  }

  const deletar = async (id: string) => {
    if (!isAdmin) {
      showToast('Apenas administrativo pode excluir modelos', 'error')
      return
    }
    if (!confirm('Excluir este modelo de ação?')) return
    const { error } = await supabase.from('tipo_acao').delete().eq('id', id)
    if (error) { showToast('Erro: ' + error.message, 'error'); return }
    showToast('Modelo excluído!')
    carregarDados()
  }

  const toggleSetor = (id: string) => {
    setEditandoSetoresIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  )

  if (!podeCriar()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Acesso Restrito</h2>
          <p className="text-gray-500">Seu setor não tem permissão para criar modelos de ação.</p>
          <p className="text-xs text-gray-400 mt-2">Solicite ao administrador que ative a opção no Painel Admin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Ações do Setor
            </h1>
            <p className="text-gray-500 mt-1">Modelos de ação disponíveis para seu setor</p>
          </div>
          <button onClick={abrirNovo} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:from-purple-700 hover:to-indigo-700 transition shadow-lg shadow-purple-300 font-bold text-base">
            <Plus size={20} /> Criar Modelo
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editandoId ? 'Editar Modelo' : 'Novo Modelo de Ação'}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={salvar} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Nome do Modelo</label>
                <input
                  value={editandoNome}
                  onChange={(e) => setEditandoNome(e.target.value)}
                  className="w-full border rounded-xl p-3 mt-1 bg-gray-50 focus:bg-white outline-none focus:ring-2 ring-purple-500"
                  placeholder="Ex: Monitoramento Escolar"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Setores que podem usar este modelo</label>
                <div className="flex flex-wrap gap-2 mt-2 bg-gray-50 p-3 rounded-xl border">
                  {(isAdmin ? setores : setoresQuePodeCriar()).map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSetor(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                        editandoSetoresIds.includes(s.id)
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-purple-400'
                      }`}
                    >
                      {s.nome}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Campos Personalizados</label>
                  <button type="button" onClick={adicionarCampo} className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-purple-700">
                    <Plus size={12} /> Add Campo
                  </button>
                </div>
                <div className="space-y-3">
                  {editandoExtras.length === 0 && (
                    <p className="text-sm text-gray-400 italic">Nenhum campo extra.</p>
                  )}
                  {editandoExtras.map((campo) => (
                    <div key={campo.id} className="flex gap-2 items-start bg-gray-50 p-3 rounded-xl border">
                      <input
                        className="flex-1 bg-white border rounded-lg p-2 text-sm font-medium outline-none focus:ring-1 ring-purple-500"
                        placeholder="Nome do campo"
                        value={campo.label}
                        onChange={(e) => setEditandoExtras(editandoExtras.map(ex => ex.id === campo.id ? { ...ex, label: e.target.value } : ex))}
                      />
                      <select
                        className="bg-white border rounded-lg p-2 text-xs font-medium outline-none"
                        value={campo.tipo}
                        onChange={(e) => setEditandoExtras(editandoExtras.map(ex => ex.id === campo.id ? { ...ex, tipo: e.target.value as any } : ex))}
                      >
                        <option value="text">Texto</option>
                        <option value="number">Número</option>
                        <option value="boolean">Sim/Não</option>
                        <option value="select">Seleção</option>
                        <option value="multiselect">Multi Seleção</option>
                      </select>
                      <button type="button" onClick={() => setEditandoExtras(editandoExtras.filter(ex => ex.id !== campo.id))} className="text-red-400 p-2 hover:text-red-600">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition">
                {editandoId ? 'Atualizar Modelo' : 'Salvar Modelo'}
              </button>
            </form>
          </div>
        )}

        <div className="grid gap-4">
          {modelosDoSetor().map(ta => (
            <div key={ta.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{ta.nome}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {setores
                      .filter(s => ta.setores_ids.includes(s.id))
                      .map(s => (
                        <span key={s.id} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {s.nome}
                        </span>
                      ))}
                  </div>
                  {ta.parametros_extras && ta.parametros_extras.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      {ta.parametros_extras.length} campo(s) personalizado(s)
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => abrirEdicao(ta)} className="p-2 text-gray-500 hover:text-purple-600 rounded-lg transition" title="Editar">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => deletar(ta.id)} className="p-2 text-gray-500 hover:text-red-600 rounded-lg transition" title="Excluir">
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {modelosDoSetor().length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border">
              <Blocks size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Nenhum modelo de ação para seu setor</p>
              <button onClick={abrirNovo} className="mt-3 text-sm text-purple-600 hover:underline">Criar primeiro modelo</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
