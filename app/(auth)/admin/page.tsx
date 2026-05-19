// app/(auth)/admin/page.tsx
'use client'

import { useState, useEffect } from "react"
import { showToast } from '@/components/ui/Toast'
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
  EyeOff,
  FileText,
  LayoutGrid,
  Building2,
  FileType
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// --- Interfaces ---
type ModalType = 'setor' | 'tipo_acao' | 'local' | 'categoria_documento' | 'formato_documento' | null

interface Perfil {
  id: string
  nome: string
  email: string
  nivel_acesso?: string
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
  const [activeTab, setActiveTab] = useState<'setores' | 'locais' | 'modelos' | 'documentos' | 'usuarios'>('setores')
  const [setorParaEditar, setSetorParaEditar] = useState<Setor | null>(null)
  const [tipoAcaoParaEditar, setTipoAcaoParaEditar] = useState<TipoAcao | null>(null)
  const [localParaEditar, setLocalParaEditar] = useState<Local | null>(null)
  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [tiposAcoes, setTiposAcoes] = useState<TipoAcao[]>([])
  const [locais, setLocais] = useState<Local[]>([])
  const [categoriasDocumento, setCategoriasDocumento] = useState<Array<{ id: string; nome: string; setor_id: string | null }>>([])
  const [formatosDocumento, setFormatosDocumento] = useState<Array<{ id: string; nome: string; extensao: string }>>([])
  const [categoriaDocParaEditar, setCategoriaDocParaEditar] = useState<{ id: string; nome: string; setor_id: string | null } | null>(null)
  const [formatoDocParaEditar, setFormatoDocParaEditar] = useState<{ id: string; nome: string; extensao: string } | null>(null)
  const [searchPerfil, setSearchPerfil] = useState('')
  const [searchLocal, setSearchLocal] = useState('')
  const [searchAdminPerfil, setSearchAdminPerfil] = useState('')
  const [userNivelAcesso, setUserNivelAcesso] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setCarregando(true)
    console.log("🔄 Carregando dados do admin...")
    const [p, s, ta, l, cd, fd] = await Promise.all([
      supabase.from('perfis').select('*'),
      supabase.from('setores').select('*'),
      supabase.from('tipo_acao').select('*'),
      supabase.from('locais').select('*').order('nome'),
      supabase.from('categorias_documento').select('*').order('nome'),
      supabase.from('formatos_documento').select('*').order('nome'),
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
    if (cd.data) setCategoriasDocumento(cd.data)
    if (fd.data) setFormatosDocumento(fd.data)

    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      const { data: perfilAdmin } = await supabase
        .from('perfis')
        .select('nivel_acesso')
        .eq('email', user.email)
        .single()
      setUserNivelAcesso(perfilAdmin?.nivel_acesso || null)
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
    setCategoriaDocParaEditar(null)
    setFormatoDocParaEditar(null)
  }

  const isSuperAdmin = userNivelAcesso === 'administrativo'

  const handleUpdateNivelAcesso = async (perfilId: string, novoNivel: string) => {
    if (!isSuperAdmin) return
    const { error } = await supabase
      .from('perfis')
      .update({ nivel_acesso: novoNivel })
      .eq('id', perfilId)
    if (!error) {
      setPerfis(prev => prev.map(p => p.id === perfilId ? { ...p, nivel_acesso: novoNivel } : p))
    } else {
      alert('Erro ao atualizar nível de acesso: ' + error.message)
    }
  }

  const handleToggleSetorPessoa = async (setorId: string, pessoaId: string, currentPessoas: string[]) => {
    if (!isSuperAdmin) return
    const isInSetor = currentPessoas.includes(pessoaId)
    const novasPessoas = isInSetor
      ? currentPessoas.filter(id => id !== pessoaId)
      : [...currentPessoas, pessoaId]

    const { error } = await supabase
      .from('setores')
      .update({ pessoas: novasPessoas })
      .eq('id', setorId)

    if (!error) {
      setSetores(prev => prev.map(s => s.id === setorId ? { ...s, pessoas: novasPessoas } : s))
    } else {
      alert('Erro ao alterar setor: ' + error.message)
    }
  }

  const handleDeleteSetor = async (id: string) => {
    const setorNome = setores.find(s => s.id === id)?.nome || ''

    const { count: docRejeitados } = await supabase
      .from('documentos').select('*', { count: 'exact', head: true }).eq('setor_id', id).eq('status', 'rejeitado')
    const { count: docAtivos } = await supabase
      .from('documentos').select('*', { count: 'exact', head: true }).eq('setor_id', id).neq('status', 'rejeitado')

    let msg = `Excluir setor "${setorNome || id}"?\n`
    if (docRejeitados && docRejeitados > 0) msg += `\n🗑️ ${docRejeitados} documento(s) rejeitado(s) serão excluídos permanentemente.`
    if (docAtivos && docAtivos > 0) msg += `\n📄 ${docAtivos} documento(s) ativo(s) ficarão sem setor vinculado (setor_id → NULL).`

    if (!confirm(msg)) return

    if (docRejeitados && docRejeitados > 0) {
      const { data: docsPraRemover } = await supabase
        .from('documentos').select('id, arquivo_url').eq('setor_id', id).eq('status', 'rejeitado')
      for (const doc of docsPraRemover || []) {
        if (doc.arquivo_url) {
          const path = doc.arquivo_url.split('/').slice(-2).join('/')
          await supabase.storage.from('documentos').remove([path])
        }
      }
      await supabase.from('documentos').delete().eq('setor_id', id).eq('status', 'rejeitado')
    }

    await supabase.from('limites_setor').delete().eq('setor_id', id)
    await supabase.from('upload_tickets').delete().eq('setor_id', id)

    const { error } = await supabase.from('setores').delete().eq('id', id)
    if (!error) {
      carregarDados()
    } else {
      const restantes = docAtivos || 0
      if (restantes > 0) {
        alert(
          `Ainda existem ${restantes} documento(s) ativos vinculados a este setor.\n\n` +
          `Para excluir o setor sem perder os documentos:\n` +
          `1. Execute no SQL Editor do Supabase:\n` +
          `   ALTER TABLE documentos ALTER COLUMN setor_id DROP NOT NULL;\n` +
          `   ALTER TABLE documentos ADD CONSTRAINT documentos_setor_id_fkey\n` +
          `     FOREIGN KEY (setor_id) REFERENCES setores(id) ON DELETE SET NULL;\n\n` +
          `2. Ou remova os documentos ativos manualmente antes de excluir.`
        )
      } else {
        alert('Erro ao excluir setor: ' + error.message)
      }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7114dd]"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'setores' as const, label: 'Setores', icon: FolderTree, color: '#7114dd', count: setores.length },
    { id: 'usuarios' as const, label: 'Usuários', icon: Users, color: '#f59e0b', count: perfis.length },
    { id: 'locais' as const, label: 'Locais', icon: Building2, color: '#16a34a', count: locais.length },
    { id: 'modelos' as const, label: 'Modelos de Ação', icon: Workflow, color: '#7114dd', count: tiposAcoes.length },
    { id: 'documentos' as const, label: 'Documentos', icon: FileType, color: '#2563eb', count: categoriasDocumento.length + formatosDocumento.length },
  ]

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-800 font-sans">
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Painel Admin</h1>
            <p className="text-slate-500 font-medium">Gestão completa do sistema DIEN</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleLogout}
              className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition shadow-sm flex items-center gap-2 font-bold text-sm"
            >
              <LogOut size={18}/> Sair
            </button>
            {activeTab === 'setores' && (
              <button onClick={() => setActiveModal('setor')} className="bg-white text-[#7114dd] border border-[#7114dd]/20 px-4 py-2 rounded-xl hover:bg-[#7114dd]/5 transition shadow-sm flex items-center gap-2 font-bold text-sm">
                <Plus size={18}/> Novo Setor
              </button>
            )}
      {activeTab === 'locais' && (
              <button onClick={() => setActiveModal('local')} className="bg-white text-green-600 border border-green-200 px-4 py-2 rounded-xl hover:bg-green-50 transition shadow-sm flex items-center gap-2 font-bold text-sm">
                <Plus size={18}/> Novo Local
              </button>
            )}
            {activeTab === 'modelos' && (
              <button onClick={() => setActiveModal('tipo_acao')} className="bg-[#7114dd] text-white px-4 py-2 rounded-xl hover:bg-[#a94dff] transition shadow-md flex items-center gap-2 font-bold text-sm">
                <Plus size={18}/> Novo Modelo
              </button>
            )}
            {activeTab === 'documentos' && (
              <button onClick={() => setActiveModal('categoria_documento')} className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition shadow-sm flex items-center gap-2 font-bold text-sm">
                <Plus size={18}/> Nova Categoria
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-white shadow-md text-slate-900 ring-2 ring-slate-200'
                : 'bg-white/60 text-slate-500 hover:bg-white hover:shadow-sm'
            }`}
          >
            <tab.icon size={16} style={{ color: tab.color }} />
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === tab.id ? 'bg-slate-100 text-slate-600' : 'bg-slate-200/60 text-slate-500'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Conteúdo das abas */}
      {activeTab === 'setores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {setores.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white rounded-2xl border">
              <FolderTree size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Nenhum setor cadastrado</p>
              <button onClick={() => setActiveModal('setor')} className="mt-3 text-sm text-[#7114dd] hover:underline">Criar primeiro setor</button>
            </div>
          ) : setores.map((setor) => (
            <div key={setor.id} className="border bg-white p-4 rounded-2xl shadow-sm relative group hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 bg-[#7114dd]/10 rounded-xl flex items-center justify-center">
                  <FolderTree className="text-[#7114dd]" size={20} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => { setSetorParaEditar(setor); setActiveModal('setor'); }} className="text-[#7114dd] hover:bg-[#7114dd]/10 p-1.5 rounded-lg"><Pencil size={14} /></button>
                  <button onClick={() => handleDeleteSetor(setor.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2">
                {setor.nome}
                {isSuperAdmin && (
                  <button
                    onClick={async () => {
                      const novoValor = !(setor as any).pode_criar_modelos
                      const { error } = await supabase.from('setores').update({ pode_criar_modelos: novoValor }).eq('id', setor.id)
                      if (!error) {
                        setSetores(prev => prev.map(s => s.id === setor.id ? { ...s, pode_criar_modelos: novoValor } : s))
                      } else {
                        if (error.message?.includes('pode_criar_modelos')) {
                          showToast('Coluna pode_criar_modelos não existe no banco. Execute: ALTER TABLE setores ADD COLUMN pode_criar_modelos BOOLEAN DEFAULT false;', 'error')
                        } else {
                          showToast('Erro: ' + error.message, 'error')
                        }
                      }
                    }}
                    className={`text-[11px] px-3 py-1 rounded-full font-bold border-2 transition ${
                      (setor as any).pode_criar_modelos
                        ? 'bg-green-100 text-green-800 border-green-500 hover:bg-green-200 shadow-sm shadow-green-200'
                        : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                    }`}
                    title="Clique para alternar permissão de criar modelos de ação"
                  >
                    Criar modelo de ação: {(setor as any).pode_criar_modelos ? 'ON' : 'OFF'}
                  </button>
                )}
              </h3>
              <p className="text-xs text-slate-500 mb-3 line-clamp-1">{setor.descricao || 'Sem descrição'}</p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mb-2">
                <Users size={12}/> {setor.pessoas?.length || 0} Membros
              </div>
              {setor.pessoas && setor.pessoas.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {setor.pessoas.slice(0, 3).map(pessoaId => {
                    const perfil = perfis.find(p => p.id === pessoaId)
                    return perfil ? (
                      <span key={pessoaId} className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded-full" title={perfil.email}>{perfil.nome.split(' ')[0]}</span>
                    ) : (
                      <span key={pessoaId} className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">ID: {pessoaId.slice(0, 6)}</span>
                    )
                  })}
                  {setor.pessoas.length > 3 && <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded-full">+{setor.pessoas.length - 3}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'locais' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar local por nome ou endereço..." value={searchLocal} onChange={(e) => setSearchLocal(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {locaisFiltrados.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white rounded-2xl border">
                <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Nenhum local encontrado</p>
              </div>
            ) : locaisFiltrados.map((local) => (
              <div key={local.id} className={`border bg-white p-4 rounded-2xl shadow-sm relative group hover:shadow-md transition ${!local.ativo ? 'opacity-60 bg-gray-50' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <School className="text-green-600" size={20} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => handleToggleLocalStatus(local)} className={`p-1.5 rounded-lg ${local.ativo ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`} title={local.ativo ? 'Desativar' : 'Ativar'}>
                      {local.ativo ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => { setLocalParaEditar(local); setActiveModal('local'); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg"><Pencil size={14} /></button>
                    <button onClick={() => handleDeleteLocal(local.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>
                <h3 className="font-black text-slate-900 flex items-center gap-2 mb-1">{local.nome}{!local.ativo && <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inativo</span>}</h3>
                {local.endereco && <p className="text-xs text-slate-500 mb-2">{local.endereco}</p>}
                <span className={`text-[9px] px-2 py-0.5 rounded-full ${local.tipo === 'escola' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                  {local.tipo === 'escola' ? 'Escola' : 'Outro'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'modelos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tiposAcoes.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white rounded-2xl border">
              <Workflow size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Nenhum modelo de ação cadastrado</p>
              <button onClick={() => setActiveModal('tipo_acao')} className="mt-3 text-sm text-[#7114dd] hover:underline">Criar primeiro modelo</button>
            </div>
          ) : tiposAcoes.map((ta) => (
            <div key={ta.id} className="border bg-white p-4 rounded-2xl shadow-sm relative group hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 bg-[#7114dd]/10 rounded-xl flex items-center justify-center">
                  <Blocks className="text-[#7114dd]" size={20} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => { setTipoAcaoParaEditar(ta); setActiveModal('tipo_acao'); }} className="bg-white shadow-sm p-1.5 rounded-lg hover:bg-[#7114dd]/10"><Pencil size={12} /></button>
                  <button onClick={() => handleDeleteTipoAcao(ta.id)} className="bg-white shadow-sm p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={12} /></button>
                </div>
              </div>
              <h3 className="font-black text-slate-900 mb-1">{ta.nome}</h3>
              <p className="text-[10px] text-[#7114dd] font-bold uppercase mb-3">
                {ta.setores_ids.length === setores.length ? 'Todos os Setores' : `${ta.setores_ids.length} Setores`}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="bg-[#ffa301]/20 text-[#7114dd] px-2 py-1 rounded-md font-bold">{ta.parametros_extras.length} campos personalizados</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'documentos' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileText className="text-blue-600" size={18} /> Categorias
                <span className="text-xs font-normal text-gray-400">({categoriasDocumento.length})</span>
              </h3>
              <button onClick={() => setActiveModal('categoria_documento')} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-1">
                <Plus size={14} /> Nova
              </button>
            </div>
            {categoriasDocumento.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border">
                <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm">Nenhuma categoria</p>
              </div>
            ) : (
              <div className="space-y-2">
                {categoriasDocumento.map((cat) => (
                  <div key={cat.id} className="bg-white border p-3 rounded-xl flex items-center justify-between group hover:shadow-sm transition">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{cat.nome}</p>
                      {cat.setor_id && <p className="text-[10px] text-gray-400">Setor: {setores.find(s => s.id === cat.setor_id)?.nome || 'N/A'}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => { setCategoriaDocParaEditar(cat); setActiveModal('categoria_documento'); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg"><Pencil size={12} /></button>
                      <button onClick={async () => { if (!confirm('Excluir?')) return; const { error } = await supabase.from('categorias_documento').delete().eq('id', cat.id); if (!error) carregarDados() }} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileType className="text-blue-600" size={18} /> Formatos
                <span className="text-xs font-normal text-gray-400">({formatosDocumento.length})</span>
              </h3>
              <button onClick={() => setActiveModal('formato_documento')} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-1">
                <Plus size={14} /> Novo
              </button>
            </div>
            {formatosDocumento.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border">
                <FileType size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm">Nenhum formato</p>
              </div>
            ) : (
              <div className="space-y-2">
                {formatosDocumento.map((fmt) => (
                  <div key={fmt.id} className="bg-white border p-3 rounded-xl flex items-center justify-between group hover:shadow-sm transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{fmt.nome}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{fmt.extensao}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => { setFormatoDocParaEditar(fmt); setActiveModal('formato_documento'); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg"><Pencil size={12} /></button>
                      <button onClick={async () => { if (!confirm('Excluir?')) return; const { error } = await supabase.from('formatos_documento').delete().eq('id', fmt.id); if (!error) carregarDados() }} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'usuarios' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar usuário por nome ou email..." value={searchAdminPerfil} onChange={(e) => setSearchAdminPerfil(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {perfis.filter(p => 
              p.nome.toLowerCase().includes(searchAdminPerfil.toLowerCase()) ||
              p.email.toLowerCase().includes(searchAdminPerfil.toLowerCase())
            ).length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white rounded-2xl border">
                <Users size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Nenhum usuário encontrado</p>
              </div>
            ) : perfis.filter(p => 
              p.nome.toLowerCase().includes(searchAdminPerfil.toLowerCase()) ||
              p.email.toLowerCase().includes(searchAdminPerfil.toLowerCase())
            ).map((perfil) => {
              const nivel = (perfil.nivel_acesso || 'tecnico') as string
              const nivelLabel: Record<string, string> = {
                tecnico: 'Técnico',
                gerencial: 'Gerencial',
                diretivo: 'Diretivo',
                administrativo: 'Administrativo'
              }
              const nivelColors: Record<string, string> = {
                tecnico: 'bg-gray-100 text-gray-700',
                gerencial: 'bg-blue-100 text-blue-700',
                diretivo: 'bg-purple-100 text-purple-700',
                administrativo: 'bg-amber-100 text-amber-700'
              }
              const nivelDotColors: Record<string, string> = {
                tecnico: 'bg-gray-500',
                gerencial: 'bg-blue-500',
                diretivo: 'bg-purple-500',
                administrativo: 'bg-amber-500'
              }
              const setoresDoUsuario = setores.filter(s => s.pessoas?.includes(perfil.id))
              
              return (
                <div key={perfil.id} className="border bg-white p-4 rounded-2xl shadow-sm relative group hover:shadow-md transition">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-amber-600 font-bold text-sm">{perfil.nome.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{perfil.nome}</h3>
                      <p className="text-xs text-gray-500 truncate">{perfil.email}</p>
                      <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${nivelColors[nivel] || 'bg-gray-100 text-gray-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${nivelDotColors[nivel] || 'bg-gray-500'}`}></span>
                        {nivelLabel[nivel] || nivel}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Nível de Acesso</label>
                      {isSuperAdmin ? (
                        <select
                          value={nivel}
                          onChange={(e) => handleUpdateNivelAcesso(perfil.id, e.target.value)}
                          className="w-full mt-1 p-2 text-xs border rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="tecnico">Técnico</option>
                          <option value="gerencial">Gerencial</option>
                          <option value="diretivo">Diretivo</option>
                          <option value="administrativo">Administrativo</option>
                        </select>
                      ) : (
                        <p className="text-xs font-medium text-gray-600 mt-1">{nivelLabel[nivel] || nivel}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                        Setores ({setoresDoUsuario.length})
                      </label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {setoresDoUsuario.length === 0 ? (
                          <span className="text-[10px] text-gray-400 italic">Nenhum setor</span>
                        ) : (
                          setoresDoUsuario.map(setor => (
                            <span
                              key={setor.id}
                              onClick={() => isSuperAdmin && handleToggleSetorPessoa(setor.id, perfil.id, setor.pessoas || [])}
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isSuperAdmin ? 'cursor-pointer hover:bg-red-100 hover:text-red-600' : ''} bg-purple-100 text-purple-700`}
                              title={isSuperAdmin ? 'Clique para remover do setor' : setor.nome}
                            >
                              {setor.nome}
                              {isSuperAdmin && <span className="ml-0.5 text-red-400">×</span>}
                            </span>
                          ))
                        )}
                      </div>
                      {isSuperAdmin && setores.filter(s => !s.pessoas?.includes(perfil.id)).length > 0 && (
                        <details className="mt-1.5">
                          <summary className="text-[10px] text-purple-600 cursor-pointer hover:underline font-medium">
                            + Adicionar a setor
                          </summary>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {setores.filter(s => !s.pessoas?.includes(perfil.id)).map(setor => (
                              <button
                                key={setor.id}
                                onClick={() => handleToggleSetorPessoa(setor.id, perfil.id, setor.pessoas || [])}
                                className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 bg-white hover:bg-purple-50 hover:border-purple-300 text-gray-600 font-medium transition"
                              >
                                {setor.nome}
                              </button>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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

      {/* Modal de Categoria de Documento */}
      {activeModal === 'categoria_documento' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-10">
              <FormCategoriaDocumento
                setores={setores}
                dadosIniciais={categoriaDocParaEditar}
                onSuccess={() => { closeModal(); carregarDados(); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Formato de Documento */}
      {activeModal === 'formato_documento' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-10">
              <FormFormatoDocumento
                dadosIniciais={formatoDocParaEditar}
                onSuccess={() => { closeModal(); carregarDados(); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Componente FormCategoriaDocumento ---
function FormCategoriaDocumento({ setores, dadosIniciais, onSuccess }: { setores: Setor[], dadosIniciais?: { id: string; nome: string; setor_id: string | null } | null, onSuccess: () => void }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState(dadosIniciais?.nome || '')
  const [setorId, setSetorId] = useState(dadosIniciais?.setor_id || '')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) { alert('Nome é obrigatório'); return }
    setLoading(true)
    const payload = { nome: nome.trim(), setor_id: setorId || null }
    let error
    if (dadosIniciais?.id) {
      const r = await supabase.from('categorias_documento').update(payload).eq('id', dadosIniciais.id)
      error = r.error
    } else {
      const r = await supabase.from('categorias_documento').insert([payload])
      error = r.error
    }
    if (error) alert('Erro: ' + error.message)
    else onSuccess()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-6">
        <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg"><FileText /></div>
        <div className="flex-1">
          <h2 className="text-2xl font-black">{dadosIniciais ? 'Editar Categoria' : 'Nova Categoria'}</h2>
          <p className="text-slate-500 text-sm font-medium">Classificação para documentos</p>
        </div>
        <button type="button" onClick={onSuccess} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome da Categoria</label>
        <input className="w-full border p-4 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 ring-blue-500 transition" placeholder="Ex: Ofício, Parecer, Plano de Aula" value={nome} onChange={e => setNome(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Setor (opcional)</label>
        <select value={setorId} onChange={e => setSetorId(e.target.value)} className="w-full border p-4 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 ring-blue-500 transition">
          <option value="">Global (todos os setores)</option>
          {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
      </div>
      <button disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold disabled:opacity-50 hover:shadow-lg transition-all">{loading ? 'Salvando...' : dadosIniciais ? 'Atualizar' : 'Salvar'}</button>
    </form>
  )
}

// --- Componente FormFormatoDocumento ---
function FormFormatoDocumento({ dadosIniciais, onSuccess }: { dadosIniciais?: { id: string; nome: string; extensao: string } | null, onSuccess: () => void }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState(dadosIniciais?.nome || '')
  const [extensao, setExtensao] = useState(dadosIniciais?.extensao || '')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || !extensao.trim()) { alert('Preencha todos os campos'); return }
    const ext = extensao.startsWith('.') ? extensao.trim() : `.${extensao.trim()}`
    setLoading(true)
    const payload = { nome: nome.trim(), extensao: ext }
    let error
    if (dadosIniciais?.id) {
      const r = await supabase.from('formatos_documento').update(payload).eq('id', dadosIniciais.id)
      error = r.error
    } else {
      const r = await supabase.from('formatos_documento').insert([payload])
      error = r.error
    }
    if (error) alert('Erro: ' + error.message)
    else onSuccess()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-6">
        <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg"><FileText /></div>
        <div className="flex-1">
          <h2 className="text-2xl font-black">{dadosIniciais ? 'Editar Formato' : 'Novo Formato'}</h2>
          <p className="text-slate-500 text-sm font-medium">Formato de arquivo permitido</p>
        </div>
        <button type="button" onClick={onSuccess} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome</label>
          <input value={nome} onChange={e => setNome(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition" placeholder="Ex: Ofício" required />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Extensão</label>
          <input className="w-full border p-4 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 ring-blue-500 transition" placeholder="Ex: .pdf" value={extensao} onChange={e => setExtensao(e.target.value)} required />
        </div>
      </div>
      <button disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold disabled:opacity-50 hover:shadow-lg transition-all">{loading ? 'Salvando...' : dadosIniciais ? 'Atualizar' : 'Salvar'}</button>
    </form>
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
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome do Setor</label>
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
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome do Local</label>
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