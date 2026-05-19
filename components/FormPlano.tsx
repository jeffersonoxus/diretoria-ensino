'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Save, X } from 'lucide-react'

interface MetaForm {
  id?: string
  descricao: string
  concluida: boolean
  prazo: string
  responsavel: string
}

interface Setor {
  id: string
  nome: string
}

interface FormPlanoProps {
  setores: Setor[]
  userPerfilId: string
  userNome: string
  editandoPlano?: {
    id: string
    titulo: string
    descricao: string
    setor_id: string | null
    prazo: string
    prioridade: 'alta' | 'media' | 'baixa'
    status: string
    observacoes: string | null
    metas: MetaForm[]
  } | null
  onSave: () => void
  onCancel: () => void
}

export default function FormPlano({ setores, userPerfilId, userNome, editandoPlano, onSave, onCancel }: FormPlanoProps) {
  const supabase = createClient()

  const [titulo, setTitulo] = useState(editandoPlano?.titulo || '')
  const [descricao, setDescricao] = useState(editandoPlano?.descricao || '')
  const [setorId, setSetorId] = useState(editandoPlano?.setor_id || '')
  const [prazo, setPrazo] = useState(editandoPlano?.prazo || '')
  const [prioridade, setPrioridade] = useState<'alta' | 'media' | 'baixa'>(editandoPlano?.prioridade || 'media')
  const [observacoes, setObservacoes] = useState(editandoPlano?.observacoes || '')
  const [metas, setMetas] = useState<MetaForm[]>(
    editandoPlano?.metas?.map(m => ({ id: m.id, descricao: m.descricao, concluida: m.concluida, prazo: m.prazo, responsavel: m.responsavel })) || []
  )
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function adicionarMeta() {
    setMetas([...metas, { descricao: '', concluida: false, prazo: '', responsavel: userNome }])
  }

  function atualizarMeta(index: number, campo: string, valor: any) {
    const novas = [...metas]
    ;(novas[index] as any)[campo] = valor
    setMetas(novas)
  }

  function removerMeta(index: number) {
    setMetas(metas.filter((_, i) => i !== index))
  }

  async function salvar() {
    if (!titulo.trim()) return
    setSalvando(true)
    setErro(null)

    const agora = new Date().toISOString()
    const todasConcluidas = metas.every(m => m.concluida)
    const algumaConcluida = metas.some(m => m.concluida)
    const status = metas.length === 0 ? 'nao_iniciado' : todasConcluidas ? 'concluido' : algumaConcluida ? 'em_andamento' : 'nao_iniciado'

    const dadosPlano = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      responsavel: userNome,
      setor_id: setorId || null,
      prazo: prazo || null,
      prioridade,
      status,
      observacoes: observacoes.trim() || null,
      atualizado_por: userPerfilId,
      updated_at: agora,
    }

    if (editandoPlano) {
      const { error: erroPlano } = await supabase
        .from('planos_acao')
        .update(dadosPlano)
        .eq('id', editandoPlano.id)

      if (erroPlano) {
        setErro(erroPlano.message)
        setSalvando(false)
        return
      }

      const { data: metasExistentes } = await supabase
        .from('metas')
        .select('id')
        .eq('plano_id', editandoPlano.id)

      const idsExistentes = new Set(metasExistentes?.map(m => m.id) || [])
      const idsManter = new Set<string>()

      for (const meta of metas) {
        if (meta.id && idsExistentes.has(meta.id)) {
          idsManter.add(meta.id)
          await supabase
            .from('metas')
            .update({
              descricao: meta.descricao,
              concluida: meta.concluida,
              prazo: meta.prazo || null,
              responsavel: userNome,
              atualizado_por: userPerfilId,
              updated_at: agora,
            })
            .eq('id', meta.id)
        } else {
          const { data: novaMeta } = await supabase
            .from('metas')
            .insert([{
              plano_id: editandoPlano.id,
              descricao: meta.descricao,
              concluida: meta.concluida,
              prazo: meta.prazo || null,
              responsavel: meta.responsavel || null,
              criado_por: userPerfilId,
              created_at: agora,
              atualizado_por: userPerfilId,
              updated_at: agora,
            }])
            .select('id')
            .single()
          if (novaMeta) idsManter.add(novaMeta.id)
        }
      }

      const idsParaDeletar = [...idsExistentes].filter(id => !idsManter.has(id))
      if (idsParaDeletar.length > 0) {
        await supabase.from('metas').delete().in('id', idsParaDeletar)
      }
    } else {
      const { data: novoPlano, error: erroPlano } = await supabase
        .from('planos_acao')
        .insert([{
          ...dadosPlano,
          criado_por: userPerfilId,
          created_at: agora,
        }])
        .select('id')
        .single()

      if (erroPlano || !novoPlano) {
        setErro(erroPlano?.message || 'Erro ao criar plano')
        setSalvando(false)
        return
      }

      if (metas.length > 0) {
        await supabase.from('metas').insert(
          metas.map(m => ({
            plano_id: novoPlano.id,
            descricao: m.descricao,
            concluida: m.concluida,
            prazo: m.prazo || null,
            responsavel: m.responsavel || null,
            criado_por: userPerfilId,
            created_at: agora,
            atualizado_por: userPerfilId,
            updated_at: agora,
          }))
        )
      }
    }

    setSalvando(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 text-slate-600 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {editandoPlano ? 'Editar Plano' : 'Novo Plano de Ação'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {erro}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition" placeholder="Ex: Melhoria do IDEB" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3}
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition" placeholder="Descreva o plano..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
              <select value={setorId} onChange={(e) => setSetorId(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition">
                <option value="">Nenhum</option>
                {setores.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
              <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
              <select value={prioridade} onChange={(e) => setPrioridade(e.target.value as any)}
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition">
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <input type="text" value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition" placeholder="Opcional" />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">Metas do Plano</h3>
              <button onClick={adicionarMeta}
                className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700">
                <Plus size={16} /> Adicionar Meta
              </button>
            </div>
            <div className="space-y-3">
              {metas.map((meta, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <input type="text" value={meta.descricao}
                        onChange={(e) => atualizarMeta(i, 'descricao', e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition" placeholder="Descrição da meta" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" value={meta.responsavel}
                          onChange={(e) => atualizarMeta(i, 'responsavel', e.target.value)}
                          className="p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition" placeholder="Responsável pela meta" />
                        <input type="date" value={meta.prazo}
                          onChange={(e) => atualizarMeta(i, 'prazo', e.target.value)}
                          className="p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition" />
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={meta.concluida}
                          onChange={(e) => atualizarMeta(i, 'concluida', e.target.checked)}
                          className="rounded" />
                        Meta concluída
                      </label>
                    </div>
                    <button onClick={() => removerMeta(i)}
                      className="p-1 text-gray-400 hover:text-red-500 transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {metas.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Nenhuma meta adicionada. Clique em "Adicionar Meta".
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button onClick={salvar}
              disabled={!titulo.trim() || salvando}
              className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              <Save size={18} /> {salvando ? 'Salvando...' : editandoPlano ? 'Atualizar Plano' : 'Criar Plano'}
            </button>
            <button onClick={onCancel}
              className="px-6 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
