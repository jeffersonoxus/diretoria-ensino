'use client'

import { FileText, Download, ExternalLink, Clock, CheckCircle, XCircle, AlertTriangle, ThumbsDown, Trash2 } from 'lucide-react'
import { formatarTamanho } from '@/lib/documentos'

function getIconInfo(nome: string) {
  const ext = nome.substring(nome.lastIndexOf('.')).toLowerCase()
  const map: Record<string, { color: string; bg: string; label: string }> = {
    '.pdf': { color: '#dc2626', bg: '#fef2f2', label: 'PDF' },
    '.doc': { color: '#2563eb', bg: '#eff6ff', label: 'DOC' },
    '.docx': { color: '#2563eb', bg: '#eff6ff', label: 'DOCX' },
    '.xls': { color: '#16a34a', bg: '#f0fdf4', label: 'XLS' },
    '.xlsx': { color: '#16a34a', bg: '#f0fdf4', label: 'XLSX' },
    '.txt': { color: '#6b7280', bg: '#f9fafb', label: 'TXT' },
  }
  return map[ext] || { color: '#6b7280', bg: '#f3f4f6', label: 'FILE' }
}

interface Documento {
  id: string
  titulo: string
  descricao?: string
  categoria_id?: string
  formato_id?: string
  setor_id: string
  arquivo_url: string
  arquivo_nome: string
  arquivo_tamanho: number
  status: string
  motivo_tamanho?: string
  tags: string[]
  codigo_acesso: string
  criado_por: string
  created_at: string
}

interface ListaDocumentosProps {
  documentos: Documento[]
  categorias: Record<string, string>
  formatos: Record<string, string>
  setores: Record<string, string>
  perfis: Record<string, string>
  onVisualizar: (doc: Documento) => void
  onAprovar?: (id: string) => void
  onRejeitar?: (id: string) => void
  onExcluir?: (id: string) => void
  isAdmin: boolean
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ativo') return null
  const config: Record<string, { icon: any; label: string; classes: string }> = {
    pendente: { icon: Clock, label: 'Pendente', classes: 'bg-amber-100 text-amber-700' },
    rejeitado: { icon: XCircle, label: 'Rejeitado', classes: 'bg-red-100 text-red-700' },
  }
  const c = config[status] || { icon: AlertTriangle, label: status, classes: 'bg-gray-100 text-gray-700' }
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.classes}`}>
      <Icon size={12} /> {c.label}
    </span>
  )
}

export default function ListaDocumentos({
  documentos, categorias, formatos, setores, perfis,
  onVisualizar, onAprovar, onRejeitar, onExcluir, isAdmin,
}: ListaDocumentosProps) {
  if (documentos.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Nenhum documento encontrado</p>
        <p className="text-sm text-gray-400 mt-1">Faça upload do primeiro documento ou ajuste os filtros.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {documentos.map((doc) => (
        <div key={doc.id} className="bg-white border rounded-xl p-4 hover:shadow-sm transition flex flex-col md:flex-row md:items-center gap-4">
          {(() => {
            const ico = getIconInfo(doc.arquivo_nome)
            return (
              <div style={{ backgroundColor: ico.bg }} className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
                <FileText style={{ color: ico.color }} className="w-6 h-6" />
              </div>
            )
          })()}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">{doc.titulo}</h3>
              <StatusBadge status={doc.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
              {categorias[doc.categoria_id || ''] && <span>{categorias[doc.categoria_id || '']}</span>}
              {formatos[doc.formato_id || ''] && <span>{formatos[doc.formato_id || '']}</span>}
              <span>{setores[doc.setor_id] || 'Sem setor'}</span>
              <span>{formatarTamanho(doc.arquivo_tamanho)}</span>
              <span>{new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
              <span>por {perfis[doc.criado_por] || 'Sistema'}</span>
            </div>
            {doc.descricao && (
              <p className="text-xs text-gray-400 mt-1 line-clamp-1">{doc.descricao}</p>
            )}
            {doc.tags && doc.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {doc.tags.map((tag, i) => (
                  <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onVisualizar(doc)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Visualizar"
            >
              <ExternalLink size={16} />
            </button>
            <a
              href={doc.arquivo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
              title="Download"
            >
              <Download size={16} />
            </a>
            {doc.status === 'pendente' && isAdmin && (
              <>
                <button
                  onClick={() => onAprovar?.(doc.id)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                  title="Aprovar"
                >
                  <CheckCircle size={16} />
                </button>
                <button
                  onClick={() => onRejeitar?.(doc.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Rejeitar"
                >
                  <ThumbsDown size={16} />
                </button>
              </>
            )}
            {doc.status === 'ativo' && isAdmin && (
              <button
                onClick={() => onExcluir?.(doc.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Excluir"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
