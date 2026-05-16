'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Download, AlertCircle, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default function CompartilharPage({ params }: { params: Promise<{ codigo: string }> }) {
  const [doc, setDoc] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const { codigo } = await params
        const supabase = createClient()
        const { data, error } = await supabase
          .from('documentos')
          .select('*')
          .eq('codigo_acesso', codigo.toUpperCase())
          .eq('status', 'ativo')
          .single()

        if (error || !data) {
          setErro('Documento não encontrado ou não disponível.')
        } else {
          setDoc(data)
        }
      } catch {
        setErro('Erro ao carregar documento.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (erro || !doc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Documento não encontrado</h1>
          <p className="text-gray-500">{erro || 'O código de acesso é inválido ou o documento foi removido.'}</p>
          <Link href="/" className="mt-6 inline-block text-blue-600 hover:underline text-sm">
            Voltar ao início
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <GraduationCamp className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-lg">DIEN — Documento Compartilhado</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{doc.titulo}</h1>
                <p className="text-sm text-gray-500 mt-1">{doc.arquivo_nome}</p>
              </div>
              <a
                href={doc.arquivo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download size={16} /> Download
              </a>
            </div>
          </div>

          {doc.arquivo_nome.toLowerCase().endsWith('.pdf') ? (
            <iframe src={doc.arquivo_url} className="w-full h-[80vh]" title={doc.titulo} />
          ) : (
            <div className="p-16 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Visualização não disponível para este formato.</p>
              <a
                href={doc.arquivo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download size={16} /> Baixar arquivo
              </a>
            </div>
          )}

          {doc.descricao && (
            <div className="p-6 border-t bg-gray-50">
              <p className="text-sm text-gray-600">{doc.descricao}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GraduationCamp(props: any) {
  return <GraduationCap {...props} />
}
