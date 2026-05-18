'use client'

import { X, Download, FileText, Tag, Clock, User, Building2, FolderOpen, FileType } from 'lucide-react'
import { formatarTamanho } from '@/lib/documentos'

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
  aprovado_por?: string
  created_at: string
  updated_at?: string
}

interface VisualizadorDocumentoProps {
  documento: Documento
  categorias: Record<string, string>
  formatos: Record<string, string>
  setores: Record<string, string>
  perfis: Record<string, string>
  onFechar: () => void
}

export default function VisualizadorDocumento({
  documento: doc, categorias, formatos, setores, perfis, onFechar,
}: VisualizadorDocumentoProps) {
  const isPDF = doc.arquivo_nome.toLowerCase().endsWith('.pdf')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onFechar} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">{doc.titulo}</h2>
              <p className="text-xs text-gray-500">{doc.arquivo_nome} • {formatarTamanho(doc.arquivo_tamanho)}</p>
            </div>
          </div>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Preview */}
          <div className="lg:col-span-2 p-6 border-r border-gray-100">
            {isPDF ? (
              <iframe
                src={doc.arquivo_url}
                className="w-full h-[70vh] rounded-lg border"
                title={doc.titulo}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[70vh] bg-gray-50 rounded-lg border">
                <FileText className="w-20 h-20 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">Visualização não disponível</p>
                <p className="text-sm text-gray-400 mt-1">Faça o download para abrir o arquivo</p>
                <a
                  href={doc.arquivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Download size={16} /> Download
                </a>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="p-6 space-y-5">
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Metadados</h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 flex items-center gap-1"><FolderOpen size={12} /> Categoria</p>
                <p className="text-sm font-medium">{categorias[doc.categoria_id || ''] || 'Sem categoria'}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 flex items-center gap-1"><FileType size={12} /> Formato</p>
                <p className="text-sm font-medium">{formatos[doc.formato_id || ''] || 'Não especificado'}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 flex items-center gap-1"><Building2 size={12} /> Setor</p>
                <p className="text-sm font-medium">{setores[doc.setor_id] || (
                  <span className="text-gray-400 italic">Setor removido</span>
                )}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 flex items-center gap-1"><User size={12} /> Enviado por</p>
                <p className="text-sm font-medium">{perfis[doc.criado_por] || 'Sistema'}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> Data de envio</p>
                <p className="text-sm font-medium">{new Date(doc.created_at).toLocaleString('pt-BR')}</p>
              </div>

              {doc.status === 'pendente' && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-700 font-medium">Aguardando aprovação</p>
                  {doc.motivo_tamanho && (
                    <p className="text-xs text-amber-600 mt-1">Motivo: {doc.motivo_tamanho}</p>
                  )}
                </div>
              )}

              {doc.codigo_acesso && (
                <div>
                  <p className="text-xs text-gray-400">Código de acesso</p>
                  <p className="text-sm font-mono font-bold text-blue-600">{doc.codigo_acesso}</p>
                </div>
              )}
            </div>

            {doc.descricao && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Descrição</p>
                <p className="text-sm text-gray-600">{doc.descricao}</p>
              </div>
            )}

            {doc.tags && doc.tags.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Tag size={12} /> Tags</p>
                <div className="flex flex-wrap gap-1">
                  {doc.tags.map((tag, i) => (
                    <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <a
                href={doc.arquivo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <Download size={16} /> Download
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
