// app/(auth)/admin/page.tsx
'use client'

import { useState, useEffect } from "react"
import { 
  Plus, 
  FolderTree, 
  Blocks, 
  Workflow, 
  X, 
  Type, 
  MapPin,
  Calendar,
  Truck,
  Activity,
  Users,
  Pencil,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle,
  LogOut,
  School,
  Edit,
  Eye,
  EyeOff
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// --- Interfaces ---
type ModalType = 'setor' | 'tipo_acao' | 'local' | null

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

interface Local {
  id: string
  nome: string
  tipo: string
  endereco?: string
  ativo: boolean
  created_at?: string
  updated_at?: string
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
  const [localParaEditar, setLocalParaEditar] = useState<Local | null>(null)
  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [tiposAcoes, setTiposAcoes] = useState<TipoAcao[]>([])
  const [locais, setLocais] = useState<Local[]>([])
  const [searchPerfil, setSearchPerfil] = useState('')
  const [searchLocal, setSearchLocal] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setCarregando(true)
    console.log("🔄 Carregando dados do admin...")
    const [p, s, ta, l] = await Promise.all([
      supabase.from('perfis').select('*'),
      supabase.from('setores').select('*'),
      supabase.from('tipo_acao').select('*'),
      supabase.from('locais').select('*').order('nome')
    ])
    if (p.data) {
      console.log(`📋 ${p.data.length} perfis carregados`)
      setPerfis(p.data)
    }
    if (s.data) {
      console.log(`📋 ${s.data.length} setores carregados`)
      setSetores(s.data)
    }
    if (ta.data) setTiposAcoes(ta.data)
    if (l.data) {
      console.log(`📋 ${l.data.length} locais carregados`)
      setLocais(l.data)
    }
    setCarregando(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const closeModal = () => {
    setActiveModal(null)
    setSetorParaEditar(null)
    setTipoAcaoParaEditar(null)
    setLocalParaEditar(null)
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

  const handleDeleteLocal = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este local? As ações associadas a ele ficarão sem local definido.')) return
    const { error } = await supabase.from('locais').delete().eq('id', id)
    if (!error) {
      carregarDados()
    } else {
      alert('Erro ao excluir local: ' + error.message)
    }
  }

  const handleToggleLocalStatus = async (local: Local) => {
    const novoStatus = !local.ativo
    const { error } = await supabase
      .from('locais')
      .update({ ativo: novoStatus, updated_at: new Date().toISOString() })
      .eq('id', local.id)
    
    if (!error) {
      carregarDados()
    } else {
      alert('Erro ao alterar status do local: ' + error.message)
    }
  }

  const perfisFiltrados = perfis.filter(p => 
    p.nome.toLowerCase().includes(searchPerfil.toLowerCase()) ||
    p.email.toLowerCase().includes(searchPerfil.toLowerCase())
  )

  const locaisFiltrados = locais.filter(l => 
    l.nome.toLowerCase().includes(searchLocal.toLowerCase()) ||
    (l.endereco && l.endereco.toLowerCase().includes(searchLocal.toLowerCase()))
  )

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7114dd]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-100 to-purple-200 text-slate-800 font-sans">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Painel Admin</h1>
            <p className="text-slate-500 font-medium">Gestão de Setores, Modelos de Ação e Locais</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={handleLogout}
              className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition shadow-sm flex items-center gap-2 font-bold text-sm"
            >
              <LogOut size={18}/> Sair
            </button>
            <button 
              onClick={() => setActiveModal('setor')} 
              className="bg-white text-[#7114dd] border border-[#7114dd]/20 px-4 py-2 rounded-xl hover:bg-[#7114dd]/5 transition shadow-sm flex items-center gap-2 font-bold text-sm"
            >
              <Plus size={18}/> Novo Setor
            </button>
            <button 
              onClick={() => setActiveModal('local')} 
              className="bg-white text-green-600 border border-green-200 px-4 py-2 rounded-xl hover:bg-green-50 transition shadow-sm flex items-center gap-2 font-bold text-sm"
            >
              <School size={18}/> Novo Local
            </button>
            <button 
              onClick={() => setActiveModal('tipo_acao')} 
              className="bg-[#7114dd] text-white px-4 py-2 rounded-xl hover:bg-[#a94dff] transition shadow-md flex items-center gap-2 font-bold text-sm"
            >
              <Plus size={18}/> Novo Modelo
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Setores */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 px-1">
            <FolderTree className="text-[#7114dd]" size={20} /> Setores Cadastrados
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {setores.map((setor) => (
              <div key={setor.id} className="border bg-white p-4 rounded-2xl shadow-sm relative group">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-slate-900">{setor.nome}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button 
                      onClick={() => { setSetorParaEditar(setor); setActiveModal('setor'); }} 
                      className="text-[#7114dd] hover:bg-[#7114dd]/10 p-1.5 rounded-lg transition"
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
                <p className="text-xs text-slate-500 mb-4 line-clamp-1">{setor.descricao || 'Sem descrição'}</p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                  <Users size={12}/> {setor.pessoas?.length || 0} Membros
                </div>
                {setor.pessoas && setor.pessoas.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {setor.pessoas.slice(0, 3).map(pessoaId => {
                      const perfil = perfis.find(p => p.id === pessoaId)
                      return perfil ? (
                        <span key={pessoaId} className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded-full" title={perfil.email}>
                          {perfil.nome.split(' ')[0]}
                        </span>
                      ) : (
                        <span key={pessoaId} className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full" title="Usuário não encontrado">
                          ID: {pessoaId.slice(0, 6)}
                        </span>
                      )
                    })}
                    {setor.pessoas.length > 3 && (
                      <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded-full">
                        +{setor.pessoas.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Locais */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 px-1">
            <School className="text-green-600" size={20} /> Locais Cadastrados
          </h2>
          
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar local por nome ou endereço..."
              value={searchLocal}
              onChange={(e) => setSearchLocal(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto">
            {locaisFiltrados.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl border">
                <School size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm">Nenhum local encontrado</p>
              </div>
            ) : (
              locaisFiltrados.map((local) => (
                <div key={local.id} className={`border bg-white p-4 rounded-2xl shadow-sm relative group ${!local.ativo ? 'opacity-60 bg-gray-50' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-black text-slate-900 flex items-center gap-2">
                        {local.nome}
                        {!local.ativo && (
                          <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inativo</span>
                        )}
                      </h3>
                      {local.endereco && (
                        <p className="text-xs text-slate-500 mt-1">{local.endereco}</p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button 
                        onClick={() => handleToggleLocalStatus(local)} 
                        className={`p-1.5 rounded-lg transition ${local.ativo ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                        title={local.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {local.ativo ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button 
                        onClick={() => { setLocalParaEditar(local); setActiveModal('local'); }} 
                        className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteLocal(local.id)} 
                        className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full ${local.tipo === 'escola' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                      {local.tipo === 'escola' ? '🏫 Escola' : '📍 Outro'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modelos de Ação */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 px-1">
            <Workflow className="text-[#7114dd]" size={20} /> Modelos de Ações
          </h2>
          <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto">
            {tiposAcoes.map((ta) => (
              <div key={ta.id} className="border bg-white p-4 rounded-2xl shadow-sm relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-2 flex gap-1 opacity-0 group-hover:opacity-100 transition z-10">
                  <button 
                    onClick={() => { setTipoAcaoParaEditar(ta); setActiveModal('tipo_acao'); }} 
                    className="bg-white shadow-md p-1.5 rounded-lg hover:bg-[#7114dd]/10"
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
                <p className="text-[10px] text-[#7114dd] font-bold uppercase mb-3">
                  {ta.setores_ids.length === setores.length ? 'Todos os Setores' : `${ta.setores_ids.length} Setores`}
                </p>
                <div className="flex flex-wrap gap-2 mt-auto">
                   <span className="text-[9px] bg-[#ffa301]/20 text-[#7114dd] px-2 py-1 rounded-md font-bold border border-[#ffa301]/30">
                     +{ta.parametros_extras.length} Custom
                   </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Setor */}
      {activeModal === 'setor' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-10">
              <FormSetor 
                listaDePerfis={perfis} 
                dadosIniciais={setorParaEditar} 
                onSuccess={() => { closeModal(); carregarDados(); }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Local */}
      {activeModal === 'local' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-10">
              <FormLocal 
                dadosIniciais={localParaEditar} 
                onSuccess={() => { closeModal(); carregarDados(); }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Tipo de Ação */}
      {activeModal === 'tipo_acao' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-10">
              <FormTipoAcao 
                setores={setores} 
                dadosIniciais={tipoAcaoParaEditar}
                onSuccess={() => { closeModal(); carregarDados(); }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Componente FormSetor ---
function FormSetor({ listaDePerfis, onSuccess, dadosIniciais }: { listaDePerfis: Perfil[], onSuccess: () => void, dadosIniciais?: Setor | null }) {
  const supabase = createClient()
  const [nome, setNome] = useState(dadosIniciais?.nome || '')
  const [desc, setDesc] = useState(dadosIniciais?.descricao || '')
  const [pessoasSelecionadas, setPessoasSelecionadas] = useState<string[]>(dadosIniciais?.pessoas || [])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debugInfo, setDebugInfo] = useState('')

  const perfisFiltrados = listaDePerfis.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome) {
      alert("Nome do setor é obrigatório")
      return
    }
    
    setLoading(true)
    setDebugInfo('Salvando...')
    
    const payload = { 
      nome, 
      descricao: desc, 
      pessoas: pessoasSelecionadas 
    }
    
    let error
    if (dadosIniciais?.id) {
      const result = await supabase
        .from('setores')
        .update(payload)
        .eq('id', dadosIniciais.id)
      error = result.error
      if (!error) setDebugInfo('Setor atualizado com sucesso!')
    } else {
      const result = await supabase
        .from('setores')
        .insert([payload])
      error = result.error
      if (!error) setDebugInfo('Setor criado com sucesso!')
    }
    
    if (error) {
      console.error("❌ Erro ao salvar:", error)
      alert('Erro ao salvar: ' + error.message)
    } else {
      setTimeout(() => onSuccess(), 1000)
    }
    setLoading(false)
  }

  const togglePessoa = (pessoaId: string) => {
    setPessoasSelecionadas(prev => 
      prev.includes(pessoaId) 
        ? prev.filter(id => id !== pessoaId)
        : [...prev, pessoaId]
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-6">
        <div className="h-12 w-12 bg-[#ffa301] rounded-xl flex items-center justify-center text-white shadow-lg">
          <FolderTree />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-black">{dadosIniciais ? 'Editar Setor' : 'Configurar Setor'}</h2>
          <p className="text-slate-500 text-sm font-medium">
            {dadosIniciais ? 'Atualize as informações do setor' : 'Crie um novo setor e adicione membros'}
          </p>
          {debugInfo && <p className="text-xs text-green-600 mt-1">{debugInfo}</p>}
        </div>
        <button type="button" onClick={onSuccess} className="text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome do Setor *</label>
          <input 
            className="w-full border p-4 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 ring-[#7114dd] transition" 
            placeholder="Ex: Educação Infantil" 
            value={nome} 
            onChange={e => setNome(e.target.value)} 
            required 
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Descrição</label>
          <input 
            className="w-full border p-4 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 ring-[#7114dd] transition" 
            placeholder="Breve descrição do setor" 
            value={desc} 
            onChange={e => setDesc(e.target.value)} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase ml-1 flex items-center justify-between">
          <span>Membros do Setor</span>
          <span className="text-[10px] text-[#7114dd] font-normal">
            {pessoasSelecionadas.length} membro(s) selecionado(s)
          </span>
        </label>
        
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
          />
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border h-96 overflow-y-auto">
          {perfisFiltrados.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Nenhum perfil encontrado</div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {perfisFiltrados.map(p => {
                const isSelected = pessoasSelecionadas.includes(p.id)
                return (
                  <div 
                    key={p.id} 
                    onClick={() => togglePessoa(p.id)} 
                    className={`p-3 rounded-lg cursor-pointer text-xs font-bold border transition-all ${
                      isSelected 
                        ? 'bg-[#7114dd] text-white border-[#7114dd] shadow-md' 
                        : 'bg-white hover:bg-[#7114dd]/5 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-white text-[#7114dd]' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {p.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{p.nome}</div>
                        <div className="text-[10px] opacity-70 truncate">{p.email}</div>
                      </div>
                      {isSelected && <CheckCircle size={14} className="text-white" />}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <button 
        disabled={loading} 
        className="w-full bg-gradient-to-r from-[#7114dd] to-[#a94dff] text-white p-4 rounded-xl font-bold disabled:opacity-50 hover:shadow-lg transition-all"
      >
        {loading ? 'Salvando...' : dadosIniciais ? 'Atualizar Setor' : 'Salvar Setor'}
      </button>
    </form>
  )
}

// --- Componente FormLocal ---
function FormLocal({ dadosIniciais, onSuccess }: { dadosIniciais?: Local | null, onSuccess: () => void }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState(dadosIniciais?.nome || '')
  const [tipo, setTipo] = useState(dadosIniciais?.tipo || 'escola')
  const [endereco, setEndereco] = useState(dadosIniciais?.endereco || '')
  const [ativo, setAtivo] = useState(dadosIniciais?.ativo !== undefined ? dadosIniciais.ativo : true)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome) {
      alert("Nome do local é obrigatório")
      return
    }
    
    setLoading(true)
    
    const payload = { 
      nome, 
      tipo, 
      endereco: endereco || null,
      ativo,
      updated_at: new Date().toISOString()
    }
    
    let error
    if (dadosIniciais?.id) {
      const result = await supabase
        .from('locais')
        .update(payload)
        .eq('id', dadosIniciais.id)
      error = result.error
    } else {
      const result = await supabase
        .from('locais')
        .insert([{ ...payload, created_at: new Date().toISOString() }])
      error = result.error
    }
    
    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-6">
        <div className="h-12 w-12 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg">
          <School />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-black">{dadosIniciais ? 'Editar Local' : 'Novo Local'}</h2>
          <p className="text-slate-500 text-sm font-medium">
            {dadosIniciais ? 'Atualize as informações do local' : 'Cadastre um novo local (escola, unidade, etc.)'}
          </p>
        </div>
        <button type="button" onClick={onSuccess} className="text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome do Local *</label>
          <input 
            className="w-full border p-4 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 ring-green-500 transition" 
            placeholder="Ex: EMEB Dalmario Souza" 
            value={nome} 
            onChange={e => setNome(e.target.value)} 
            required 
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Tipo</label>
          <select 
            value={tipo} 
            onChange={e => setTipo(e.target.value)} 
            className="w-full border p-4 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 ring-green-500 transition"
          >
            <option value="escola">🏫 Escola</option>
            <option value="secretaria">📋 Secretaria</option>
            <option value="auditorio">🎭 Auditório</option>
            <option value="outro">📍 Outro</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Endereço (opcional)</label>
          <input 
            className="w-full border p-4 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 ring-green-500 transition" 
            placeholder="Rua, número, bairro, cidade..." 
            value={endereco} 
            onChange={e => setEndereco(e.target.value)} 
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={ativo} 
              onChange={(e) => setAtivo(e.target.checked)} 
              className="accent-green-600 w-5 h-5"
            />
            <span className="text-sm font-medium text-gray-700">Local ativo (disponível para seleção)</span>
          </label>
        </div>
      </div>

      <button 
        disabled={loading} 
        className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white p-4 rounded-xl font-bold disabled:opacity-50 hover:shadow-lg transition-all"
      >
        {loading ? 'Salvando...' : dadosIniciais ? 'Atualizar Local' : 'Salvar Local'}
      </button>
    </form>
  )
}

// --- Componente FormTipoAcao ---
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
        <div className="h-12 w-12 bg-gradient-to-r from-[#7114dd] to-[#a94dff] rounded-xl flex items-center justify-center text-white shadow-lg">
          <Blocks />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-black">{dadosIniciais ? 'Editar Modelo de Ação' : 'Novo Modelo de Ação'}</h2>
          <p className="text-slate-500 text-sm font-medium">Configure campos obrigatórios e personalizados</p>
        </div>
        <button type="button" onClick={onSuccess} className="text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome do Modelo</label>
            <input className="w-full border p-4 rounded-2xl bg-slate-50 focus:bg-white outline-none focus:ring-2 ring-[#7114dd] transition" 
                   placeholder="Ex: Monitoramento Escolar" value={nome} onChange={e => setNome(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Setores que podem usar</label>
              <button type="button" onClick={selecionarTodosSetores} className="text-[10px] font-black text-[#7114dd] uppercase hover:underline">
                {setoresIds.length === setores.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 bg-slate-50 p-3 rounded-2xl border">
              {setores.map(s => (
                <button key={s.id} type="button" onClick={() => toggleSetor(s.id)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                          setoresIds.includes(s.id) 
                            ? 'bg-[#7114dd] text-white border-[#7114dd]' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-[#7114dd] hover:text-[#7114dd]'
                        }`}>
                  {s.nome}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-400 uppercase">Campos Personalizados</label>
            <button type="button" onClick={adicionarCampo} className="text-[10px] bg-[#7114dd] text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-[#a94dff] transition">
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
                  <input className="flex-1 bg-slate-50 border-none p-2 rounded-lg text-sm font-bold outline-none focus:ring-1 ring-[#7114dd]" 
                         placeholder="Nome do Campo" value={campo.label} onChange={e => setExtras(extras.map(ex => ex.id === campo.id ? {...ex, label: e.target.value} : ex))} />
                  <button type="button" onClick={() => setExtras(extras.filter(ex => ex.id !== campo.id))} className="text-red-400 p-2 hover:text-red-600"><X size={16}/></button>
                </div>
                <select className="w-full bg-slate-50 p-2 rounded-lg text-xs font-bold outline-none border-none focus:ring-1 ring-[#7114dd]" value={campo.tipo} onChange={e => setExtras(extras.map(ex => ex.id === campo.id ? {...ex, tipo: e.target.value as any} : ex))}>
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
                         onChange={e => setExtras(extras.map(ex => ex.id === campo.id ? {...ex, opcoes: e.target.value.split(',').map(s => s.trim()).filter(s => s)} : ex))} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button disabled={loading} className="w-full bg-gradient-to-r from-[#7114dd] to-[#a94dff] text-white p-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:shadow-2xl transition-all disabled:opacity-50">
        {loading ? 'Salvando...' : dadosIniciais ? 'Atualizar Modelo' : 'Publicar Modelo de Ação'}
      </button>
    </form>
  )
}