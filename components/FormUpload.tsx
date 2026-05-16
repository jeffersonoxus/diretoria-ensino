'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { validarUploadCliente, formatarTamanho } from '@/lib/documentos'
import { createClient } from '@/lib/supabase/client'

interface Categoria {
  id: string
  nome: string
  setor_id: string | null
}

interface Formato {
  id: string
  nome: string
  extensao: string
}

interface FormUploadProps {
  categorias: Categoria[]
  formatos: Formato[]
  setores: Array<{ id: string; nome: string }>
  setorId: string
  userSetoresIds?: string[]
  onSuccess: () => void
  onCancel: () => void
}

function getIconForExt(ext: string) {
  const map: Record<string, { color: string; bg: string }> = {
    '.pdf': { color: '#dc2626', bg: '#fef2f2' },
    '.doc': { color: '#2563eb', bg: '#eff6ff' },
    '.docx': { color: '#2563eb', bg: '#eff6ff' },
    '.xls': { color: '#16a34a', bg: '#f0fdf4' },
    '.xlsx': { color: '#16a34a', bg: '#f0fdf4' },
    '.txt': { color: '#6b7280', bg: '#f9fafb' },
  }
  return map[ext] || { color: '#6b7280', bg: '#f9fafb' }
}

export default function FormUpload({ categorias, formatos, setores, setorId, userSetoresIds, onSuccess, onCancel }: FormUploadProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [formatoId, setFormatoId] = useState('')
  const [setorSelecionado, setSetorSelecionado] = useState(setorId)
  const [tagsInput, setTagsInput] = useState('')
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [exigeJustificativa, setExigeJustificativa] = useState(false)

  const setoresFiltrados = userSetoresIds
    ? setores.filter(s => userSetoresIds.includes(s.id))
    : setores

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    setErro('')
    setExigeJustificativa(false)
    if (!selectedFile) return

    const validacao = validarUploadCliente(selectedFile)
    if (!validacao.valido) {
      setErro(validacao.erro)
      return
    }

    setFile(selectedFile)
    setExigeJustificativa(validacao.exigeJustificativa)
    if (!titulo) {
      setTitulo(selectedFile.name.replace(/\.[^/.]+$/, ''))
    }
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
    const match = formatos.find(f => f.extensao === ext)
    if (match) setFormatoId(match.id)
    else setFormatoId('')
  }, [titulo, formatos])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files[0])
  }, [handleFileSelect])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')

    if (!file) { setErro('Selecione um arquivo'); return }
    if (!titulo.trim()) { setErro('Informe o título do documento'); return }
    if (exigeJustificativa && !motivo.trim()) { setErro('Informe a justificativa para o arquivo grande'); return }

    if (formatoId) {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      const fmt = formatos.find(f => f.id === formatoId)
      if (fmt && fmt.extensao !== ext) {
        setErro(`O formato selecionado (${fmt.extensao}) não corresponde ao arquivo enviado (${ext}). Corrija o formato ou selecione outro arquivo.`)
        return
      }
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) { setErro('Não autenticado'); setLoading(false); return }

      const { data: perfil } = await supabase
        .from('perfis')
        .select('id')
        .eq('email', user.email)
        .single()

      if (!perfil) { setErro('Perfil não encontrado'); setLoading(false); return }

      const validateRes = await fetch('/api/documentos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          arquivo_nome: file.name,
          arquivo_tamanho: file.size,
          setor_id: setorSelecionado,
        }),
      })

      const validateData = await validateRes.json()
      if (!validateRes.ok) { setErro(validateData.erro); setLoading(false); return }

      const formData = new FormData()
      formData.append('arquivo', file)
      formData.append('ticket_id', validateData.ticket_id)
      formData.append('titulo', titulo.trim())
      formData.append('descricao', descricao.trim())
      formData.append('categoria_id', categoriaId)
      formData.append('formato_id', formatoId)
      formData.append('setor_id', setorSelecionado)
      formData.append('tags', tagsInput)
      formData.append('motivo_tamanho', motivo.trim())

      const uploadRes = await fetch('/api/documentos/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) { setErro(uploadData.erro); setLoading(false); return }

      onSuccess()
    } catch (err: any) {
      setErro(err.message || 'Erro ao fazer upload')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-6">
        <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
          <Upload />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-black">Novo Documento</h2>
          <p className="text-slate-500 text-sm font-medium">Faça upload de um documento para o repositório</p>
        </div>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
      </div>

      {erro && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertTriangle size={16} /> {erro}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
          dragOver ? 'border-blue-500 bg-blue-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            {(() => {
              const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
              const ico = getIconForExt(ext)
              return <FileText style={{ color: ico.color }} className="w-8 h-8" />
            })()}
            <div className="text-left">
              <p className="font-semibold text-gray-800">{file.name}</p>
              <p className="text-sm text-gray-500">{formatarTamanho(file.size)}</p>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null) }} className="text-red-500 hover:text-red-700">
              <X size={20} />
            </button>
          </div>
        ) : (
          <div>
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Arraste um arquivo aqui ou clique para selecionar</p>
            <p className="text-sm text-gray-400 mt-1">PDF, DOC, DOCX, XLS, XLSX, TXT — até 10 MB</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Título do Documento *" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Ofício Circular nº 001/2026" required />
        <Input label="Tags (separadas por vírgula)" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Ex: ofício, 2026, educação infantil" />
      </div>

      <Input label="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Breve descrição do documento" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="w-full mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Setor *</label>
          <select value={setorSelecionado} onChange={(e) => setSetorSelecionado(e.target.value)} className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
            <option value="">Selecione...</option>
            {setoresFiltrados.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>

        <div className="w-full mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Sem categoria</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        <div className="w-full mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
          <select value={formatoId} onChange={(e) => setFormatoId(e.target.value)} className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Selecionar...</option>
            {formatos.map((f) => <option key={f.id} value={f.id}>{f.nome} ({f.extensao})</option>)}
          </select>
          {file && formatoId && (() => {
            const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
            const fmt = formatos.find(f => f.id === formatoId)
            if (fmt && fmt.extensao !== ext) {
              return <p className="text-xs text-red-500 mt-1">O formato selecionado ({fmt.extensao}) não corresponde ao arquivo ({ext})</p>
            }
            return null
          })()}
        </div>
      </div>

      {exigeJustificativa && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <label className="block text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
            <AlertTriangle size={16} /> Justificativa (arquivo acima de 2 MB)
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Explique por que este arquivo grande é necessário..."
            className="w-full p-3 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            rows={3}
            required
          />
          <p className="text-xs text-amber-600 mt-1">O documento será enviado para aprovação do administrador.</p>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" loading={loading} disabled={loading || !file}>
          {loading ? 'Enviando...' : exigeJustificativa ? 'Enviar para Aprovação' : 'Publicar Documento'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
