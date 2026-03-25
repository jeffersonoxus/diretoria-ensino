// app/admin/page.tsx
'use client'

import { useState, useEffect } from "react"
import { 
  Plus, 
  FolderTree, 
  Blocks, 
  Workflow, 
  X, 
  Type, 
  Hash, 
  ChevronDown, 
  ListChecks, 
  ToggleLeft,
  MapPin,
  Calendar,
  Truck,
  Activity,
  Users,
  Pencil,
  Trash2
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// --- Configurações Estáticas ---
const ESCOLAS_OPCOES = [
  "Escola Municipal Almira Manso",
  "Escola Estadual Rubens Canuto",
  "Centro de Educação Integral - Maceió",
  "Escola Municipal Dr. José Maria de Melo",
  "Escola Técnica Estadual de Alagoas (Rio Largo)"
]

const STATUS_OPCOES = [
  'Pendente', 
  'Realizada', 
  'Realizada Parcialmente', 
  'Cancelada', 
  'Reagendada'
]

// --- Interfaces ---

type ModalType = 'setor' | 'tipo_acao' | null

interface Perfil {
  id: string
  nome: string
  email: string
}

interface Setor {
  id: string
  nome: string
  descricao?: string
  pessoas: string[]
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

export default function AdminPage() {
  const supabase = createClient()
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [setorParaEditar, setSetorParaEditar] = useState<Setor | null>(null)
  const [tipoAcaoParaEditar, setTipoAcaoParaEditar] = useState<TipoAcao | null>(null)
  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [tiposAcoes, setTiposAcoes] = useState<TipoAcao[]>([])

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    const [p, s, ta] = await Promise.all([
      supabase.from('perfis').select('*'),
      supabase.from('setores').select('*'),
      supabase.from('tipo_acao').select('*')
    ])
    if (p.data) setPerfis(p.data)
    if (s.data) setSetores(s.data)
    if (ta.data) setTiposAcoes(ta.data)
  }

  const closeModal = () => {
    setActiveModal(null)
    setSetorParaEditar(null)
    setTipoAcaoParaEditar(null)
  }

  const handleDeleteSetor = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este setor? Esta ação pode afetar ações existentes.')) return
    const { error } = await supabase.from('setores').delete().eq('id', id)
    if (!error) {
      carregarDados()
    } else {
      alert('Erro ao excluir setor: ' + error.message)
    }
  }

  const handleDeleteTipoAcao = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este modelo de ação? Esta ação pode afetar ações existentes.')) return
    const { error } = await supabase.from('tipo_acao').delete().eq('id', id)
    if (!error) {
      carregarDados()
    } else {
      alert('Erro ao excluir modelo de ação: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#f8fafc] text-slate-800 font-sans">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Painel Admin</h1>
            <p className="text-slate-500 font-medium">Gestão de Setores e Modelos de Ação</p>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setActiveModal('setor')} className="bg-white text-indigo-600 border border-indigo-100 px-4 py-2 rounded-xl hover:bg-indigo-50 transition shadow-sm flex items-center gap-2 font-bold text-sm">
               <Plus size={18}/> Novo Setor
             </button>
             <button onClick={() => setActiveModal('tipo_acao')} className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition shadow-md flex items-center gap-2 font-bold text-sm">
               <Plus size={18}/> Novo Modelo de Ação
             </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
         {/* Setores */}
         <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 px-1">
            <FolderTree className="text-indigo-600" size={20} /> Setores Cadastrados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {setores.map((setor) => (
              <div key={setor.id} className="border bg-white p-4 rounded-2xl shadow-sm relative group">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-slate-900">{setor.nome}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button 
                      onClick={() => { setSetorParaEditar(setor); setActiveModal('setor'); }} 
                      className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition"
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteSetor(setor.id)} 
                      className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-4 line-clamp-1">{setor.descricao}</p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                  <Users size={12}/> {setor.pessoas?.length || 0} Membros
                </div>
              </div>
            ))}
          </div>
         </div>

         {/* Modelos de Ação */}
         <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 px-1">
            <Workflow className="text-indigo-600" size={20} /> Modelos de Ações
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tiposAcoes.map((ta) => (
              <div key={ta.id} className="border bg-white p-4 rounded-2xl shadow-sm relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-2 flex gap-1 opacity-0 group-hover:opacity-100 transition z-10">
                  <button 
                    onClick={() => { setTipoAcaoParaEditar(ta); setActiveModal('tipo_acao'); }} 
                    className="bg-white shadow-md p-1.5 rounded-lg hover:bg-indigo-50"
                  >
                    <Pencil size={12} />
                  </button>
                  <button 
                    onClick={() => handleDeleteTipoAcao(ta.id)} 
                    className="bg-white shadow-md p-1.5 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <h3 className="font-black text-slate-900 mb-1 pr-16">{ta.nome}</h3>
                <p className="text-[10px] text-indigo-600 font-bold uppercase mb-3">
                  {ta.setores_ids.length === setores.length ? 'Todos os Setores' : `${ta.setores_ids.length} Setores`}
                </p>
                <div className="flex flex-wrap gap-2 mt-auto">
                   <span className="text-[9px] bg-amber-50 text-amber-600 px-2 py-1 rounded-md font-bold border border-amber-100">
                     +{ta.parametros_extras.length} Custom
                   </span>
                </div>
              </div>
            ))}
          </div>
         </div>
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-10">
              {activeModal === 'setor' && (
                <FormSetor 
                  listaDePerfis={perfis} 
                  dadosIniciais={setorParaEditar} 
                  onSuccess={() => { closeModal(); carregarDados(); }} 
                />
              )}
              {activeModal === 'tipo_acao' && (
                <FormTipoAcao 
                  setores={setores} 
                  dadosIniciais={tipoAcaoParaEditar}
                  onSuccess={() => { closeModal(); carregarDados(); }} 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Componente FormSetor (Atualizado para edição) ---
function FormSetor({ listaDePerfis, onSuccess, dadosIniciais }: { listaDePerfis: Perfil[], onSuccess: () => void, dadosIniciais?: Setor | null }) {
  const supabase = createClient()
  const [nome, setNome] = useState(dadosIniciais?.nome || '')
  const [desc, setDesc] = useState(dadosIniciais?.descricao || '')
  const [sel, setSel] = useState<string[]>(dadosIniciais?.pessoas || [])
  const [loading, setLoading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const payload = { nome, descricao: desc, pessoas: sel }
    
    let error
    if (dadosIniciais?.id) {
      const result = await supabase.from('setores').update(payload).eq('id', dadosIniciais.id)
      error = result.error
    } else {
      const result = await supabase.from('setores').insert([payload])
      error = result.error
    }
    
    if (!error) {
      onSuccess()
    } else {
      alert('Erro ao salvar: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <h2 className="text-2xl font-black">{dadosIniciais ? 'Editar Setor' : 'Configurar Setor'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input className="border p-4 rounded-xl" placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} required />
        <input className="border p-4 rounded-xl" placeholder="Descrição" value={desc} onChange={e => setDesc(e.target.value)} />
      </div>
      <div className="bg-slate-50 p-4 rounded-2xl border h-64 overflow-y-auto grid grid-cols-2 gap-2">
        {listaDePerfis.map(p => (
          <div 
            key={p.id} 
            onClick={() => setSel(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} 
            className={`p-3 rounded-lg cursor-pointer text-xs font-bold border transition ${sel.includes(p.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white'}`}
          >
            {p.nome}
          </div>
        ))}
      </div>
      <button disabled={loading} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold disabled:opacity-50">
        {loading ? 'Salvando...' : dadosIniciais ? 'Atualizar Setor' : 'Salvar Setor'}
      </button>
    </form>
  )
}

// --- Componente FormTipoAcao (Atualizado para edição) ---
function FormTipoAcao({ setores, dadosIniciais, onSuccess }: { setores: Setor[], dadosIniciais?: TipoAcao | null, onSuccess: () => void }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState(dadosIniciais?.nome || '')
  const [setoresIds, setSetoresIds] = useState<string[]>(dadosIniciais?.setores_ids || [])
  const [extras, setExtras] = useState<ParametroExtra[]>(dadosIniciais?.parametros_extras || [])

  const toggleSetor = (id: string) => {
    setSetoresIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selecionarTodosSetores = () => {
    setSetoresIds(setoresIds.length === setores.length ? [] : setores.map(s => s.id))
  }

  const adicionarCampo = () => {
    const novo: ParametroExtra = { id: crypto.randomUUID(), label: '', tipo: 'text' }
    setExtras([...extras, novo])
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome || setoresIds.length === 0) return alert("Preencha o nome e selecione ao menos um setor.")
    setLoading(true)
    
    let error
    if (dadosIniciais?.id) {
      const result = await supabase.from('tipo_acao').update({
        nome,
        setores_ids: setoresIds,
        parametros_extras: extras
      }).eq('id', dadosIniciais.id)
      error = result.error
    } else {
      const result = await supabase.from('tipo_acao').insert([{
        nome,
        setores_ids: setoresIds,
        parametros_extras: extras
      }])
      error = result.error
    }
    
    if (error) alert(error.message)
    else onSuccess()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="flex items-center gap-4 border-b pb-6">
        <div className="h-12 w-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg"><Blocks /></div>
        <div>
          <h2 className="text-2xl font-black">{dadosIniciais ? 'Editar Modelo de Ação' : 'Novo Modelo de Ação'}</h2>
          <p className="text-slate-500 text-sm font-medium">Configure campos obrigatórios e personalizados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Lado Esquerdo: Configuração Básica */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome do Modelo</label>
            <input className="w-full border p-4 rounded-2xl bg-slate-50 focus:bg-white outline-none focus:ring-2 ring-indigo-500 transition" 
                   placeholder="Ex: Monitoramento Escolar" value={nome} onChange={e => setNome(e.target.value)} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Setores que podem usar</label>
              <button type="button" onClick={selecionarTodosSetores} className="text-[10px] font-black text-indigo-600 uppercase">
                {setoresIds.length === setores.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 bg-slate-50 p-3 rounded-2xl border">
              {setores.map(s => (
                <button key={s.id} type="button" onClick={() => toggleSetor(s.id)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${setoresIds.includes(s.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-500'}`}>
                  {s.nome}
                </button>
              ))}
            </div>
          </div>

          {/* Seção de Campos Fixos (Apenas Visual) */}
          <div className="space-y-3">
             <label className="text-xs font-bold text-slate-400 uppercase ml-1">Campos Obrigatórios (Padrão)</label>
             <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-3 p-3 bg-white border rounded-xl opacity-60">
                   <Type size={16} className="text-slate-400"/> <span className="text-xs font-bold">Título da Ação</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white border rounded-xl opacity-60">
                   <MapPin size={16} className="text-slate-400"/> <span className="text-xs font-bold">Local (Lista de Escolas)</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white border rounded-xl opacity-60">
                   <Calendar size={16} className="text-slate-400"/> <span className="text-xs font-bold">Data de Início e Fim</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white border rounded-xl opacity-60">
                   <Truck size={16} className="text-slate-400"/> <span className="text-xs font-bold">Necessita Transporte (Sim/Não)</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white border rounded-xl opacity-60">
                   <Activity size={16} className="text-slate-400"/> <span className="text-xs font-bold">Status (Pendente, Realizada...)</span>
                </div>
             </div>
          </div>
        </div>

        {/* Lado Direito: Parâmetros Extras */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-400 uppercase">Campos Personalizados</label>
            <button type="button" onClick={adicionarCampo} className="text-[10px] bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
              <Plus size={12}/> Add Campo
            </button>
          </div>
          
          <div className="space-y-3 h-[450px] overflow-y-auto pr-2">
            {extras.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed rounded-3xl text-slate-400 text-xs font-medium">
                Nenhum campo extra adicionado.
              </div>
            )}
            {extras.map((campo) => (
              <div key={campo.id} className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
                <div className="flex gap-2">
                  <input className="flex-1 bg-slate-50 border-none p-2 rounded-lg text-sm font-bold outline-none focus:ring-1 ring-indigo-500" 
                         placeholder="Nome do Campo (ex: KM Inicial)" value={campo.label} onChange={e => setExtras(extras.map(ex => ex.id === campo.id ? {...ex, label: e.target.value} : ex))} />
                  <button type="button" onClick={() => setExtras(extras.filter(ex => ex.id !== campo.id))} className="text-red-400 p-2"><X size={16}/></button>
                </div>
                <select className="w-full bg-slate-50 p-2 rounded-lg text-xs font-bold outline-none border-none" value={campo.tipo} onChange={e => setExtras(extras.map(ex => ex.id === campo.id ? {...ex, tipo: e.target.value as any} : ex))}>
                  <option value="text">Texto</option>
                  <option value="number">Número</option>
                  <option value="boolean">Sim/Não</option>
                  <option value="select">Seleção Única</option>
                  <option value="multiselect">Múltipla Escolha</option>
                </select>
                {(campo.tipo === 'select' || campo.tipo === 'multiselect') && (
                  <input className="w-full border-b text-[10px] p-1 outline-none font-medium" 
                         placeholder="Opções separadas por vírgula" 
                         defaultValue={campo.opcoes?.join(', ')} 
                         onChange={e => setExtras(extras.map(ex => ex.id === campo.id ? {...ex, opcoes: e.target.value.split(',').map(s => s.trim())} : ex))} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button disabled={loading} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-100 hover:scale-[1.01] transition disabled:opacity-50">
        {loading ? 'Salvando...' : dadosIniciais ? 'Atualizar Modelo' : 'Publicar Modelo de Ação'}
      </button>
    </form>
  )
}