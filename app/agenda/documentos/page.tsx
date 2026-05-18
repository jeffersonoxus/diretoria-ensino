'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, FileText, LogOut } from 'lucide-react'
import FiltrosDocumento from '@/components/FiltrosDocumento'
import ListaDocumentos from '@/components/ListaDocumentos'
import VisualizadorDocumento from '@/components/VisualizadorDocumento'
import FormUpload from '@/components/FormUpload'

export default function DocumentosPage() {
  const supabase = createClient()
  const router = useRouter()

  const [documentos, setDocumentos] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [formatos, setFormatos] = useState<any[]>([])
  const [setores, setSetores] = useState<any[]>([])
  const [perfis, setPerfis] = useState<any[]>([])
  const [userEmail, setUserEmail] = useState('')
  const [userPerfilId, setUserPerfilId] = useState<string | null>(null)
  const [userSetoresIds, setUserSetoresIds] = useState<string[]>([])
  const [userNivelAcesso, setUserNivelAcesso] = useState<string>('tecnico')
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [docVisualizar, setDocVisualizar] = useState<any>(null)

  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroFormato, setFiltroFormato] = useState('')
  const [filtroSetor, setFiltroSetor] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')

  const isAdmin = userNivelAcesso === 'diretivo' || userNivelAcesso === 'administrativo'

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    if (!loading && userSetoresIds.length === 0 && !isAdmin) {
      router.push('/agenda/perfil')
    }
  }, [loading, userSetoresIds, isAdmin])

  const carregarDados = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { router.push('/login'); return }
    setUserEmail(user.email)

    const { data: perfil } = await supabase
      .from('perfis')
      .select('id, nome, nivel_acesso')
      .eq('email', user.email)
      .single()

    if (perfil) {
      setUserPerfilId(perfil.id)
      setUserNivelAcesso(perfil.nivel_acesso || 'tecnico')
      const { data: setoresData } = await supabase.from('setores').select('*')
      const setoresDoUsuario = setoresData?.filter((s: any) =>
        s.pessoas?.includes(perfil.id)
      ) || []
      setUserSetoresIds(setoresDoUsuario.map((s: any) => s.id))
    }

    const [docsRes, catsRes, formatsRes, setoresRes, perfisRes] = await Promise.all([
      supabase.from('documentos').select('*').order('created_at', { ascending: false }),
      supabase.from('categorias_documento').select('*').order('nome'),
      supabase.from('formatos_documento').select('*').order('nome'),
      supabase.from('setores').select('*').order('nome'),
      supabase.from('perfis').select('id, nome'),
    ])

    setDocumentos(docsRes.data || [])
    setCategorias(catsRes.data || [])
    setFormatos(formatsRes.data || [])
    setSetores(setoresRes.data || [])
    setPerfis(perfisRes.data || [])
    setLoading(false)
  }

  const categoriasMap = useMemo(() => {
    const m: Record<string, string> = {}
    categorias.forEach(c => { m[c.id] = c.nome })
    return m
  }, [categorias])

  const formatosMap = useMemo(() => {
    const m: Record<string, string> = {}
    formatos.forEach(f => { m[f.id] = `${f.nome} (${f.extensao})` })
    return m
  }, [formatos])

  const setoresMap = useMemo(() => {
    const m: Record<string, string> = {}
    setores.forEach(s => { m[s.id] = s.nome })
    return m
  }, [setores])

  const perfisMap = useMemo(() => {
    const m: Record<string, string> = {}
    perfis.forEach(p => { m[p.id] = p.nome })
    return m
  }, [perfis])

  const documentosFiltrados = useMemo(() => {
    let filtrados = [...documentos]

    if (!isAdmin && userSetoresIds.length > 0) {
      filtrados = filtrados.filter(d => userSetoresIds.includes(d.setor_id))
    }

    if (busca) {
      const termo = busca.toLowerCase()
      filtrados = filtrados.filter(d =>
        d.titulo.toLowerCase().includes(termo) ||
        (d.tags && d.tags.some((t: string) => t.toLowerCase().includes(termo)))
      )
    }
    if (filtroCategoria) {
      filtrados = filtrados.filter(d => d.categoria_id === filtroCategoria)
    }
    if (filtroFormato) {
      filtrados = filtrados.filter(d => d.formato_id === filtroFormato)
    }
    if (filtroSetor) {
      filtrados = filtrados.filter(d => d.setor_id === filtroSetor)
    }
    if (filtroStatus) {
      filtrados = filtrados.filter(d => d.status === filtroStatus)
    }
    return filtrados
  }, [documentos, isAdmin, userSetoresIds, busca, filtroCategoria, filtroFormato, filtroSetor, filtroStatus])

  const temFiltros = busca || filtroCategoria || filtroFormato || filtroSetor || filtroStatus

  const handleAprovar = async (id: string) => {
    const { error } = await supabase
      .from('documentos')
      .update({ status: 'ativo', aprovado_por: userPerfilId, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (!error) carregarDados()
  }

  const handleRejeitar = async (id: string) => {
    const { data: doc } = await supabase.from('documentos').select('arquivo_url').eq('id', id).single()
    if (doc?.arquivo_url) {
      const path = doc.arquivo_url.split('/').slice(-2).join('/')
      await supabase.storage.from('documentos').remove([path])
    }
    await supabase
      .from('documentos')
      .update({ status: 'rejeitado', updated_at: new Date().toISOString() })
      .eq('id', id)
    carregarDados()
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return
    const { data: doc } = await supabase.from('documentos').select('arquivo_url').eq('id', id).single()
    if (doc?.arquivo_url) {
      const path = doc.arquivo_url.split('/').slice(-2).join('/')
      await supabase.storage.from('documentos').remove([path])
    }
    await supabase.from('documentos').delete().eq('id', id)
    carregarDados()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Repositório de Documentos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {documentos.length} documento(s) no repositório
            {!isAdmin && ` • Visão do seu setor`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={18} /> Novo Documento
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Filtros */}
      <FiltrosDocumento
        categorias={categorias}
        formatos={formatos}
        setores={setores}
        busca={busca}
        categoriaId={filtroCategoria}
        formatoId={filtroFormato}
        setorId={filtroSetor}
        status={filtroStatus}
        onBuscaChange={setBusca}
        onCategoriaChange={setFiltroCategoria}
        onFormatoChange={setFiltroFormato}
        onSetorChange={setFiltroSetor}
        onStatusChange={setFiltroStatus}
        onLimpar={() => { setBusca(''); setFiltroCategoria(''); setFiltroFormato(''); setFiltroSetor(''); setFiltroStatus('') }}
        temFiltros={!!temFiltros}
      />

      {/* Documentos count info */}
      {filtroStatus === 'pendente' && isAdmin && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          {documentosFiltrados.length} documento(s) aguardando aprovação.
        </div>
      )}

      {/* Documentos */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <ListaDocumentos
          documentos={documentosFiltrados}
          categorias={categoriasMap}
          formatos={formatosMap}
          setores={setoresMap}
          perfis={perfisMap}
          onVisualizar={setDocVisualizar}
          onAprovar={isAdmin ? handleAprovar : undefined}
          onRejeitar={isAdmin ? handleRejeitar : undefined}
          onExcluir={isAdmin ? handleExcluir : undefined}
          isAdmin={isAdmin}
        />
      )}

      {/* Modal Upload */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowUpload(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-10">
            <FormUpload
              categorias={categorias}
              formatos={formatos}
              setores={setores}
              setorId={userSetoresIds[0] || ''}
              userSetoresIds={isAdmin ? undefined : userSetoresIds}
              onSuccess={() => { setShowUpload(false); carregarDados() }}
              onCancel={() => setShowUpload(false)}
            />
          </div>
        </div>
      )}

      {/* Modal Visualizador */}
      {docVisualizar && (
        <VisualizadorDocumento
          documento={docVisualizar}
          categorias={categoriasMap}
          formatos={formatosMap}
          setores={setoresMap}
          perfis={perfisMap}
          onFechar={() => setDocVisualizar(null)}
        />
      )}
    </div>
  )
}
