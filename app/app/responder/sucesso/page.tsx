// app/app/responder/sucesso/page.tsx
'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, Home, ArrowLeft } from "lucide-react"

// Componente interno que contém a lógica dos SearchParams
function SucessoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const acaoNome = searchParams.get('acao')
  const status = searchParams.get('status')

  const getStatusMessage = () => {
    switch (status) {
      case 'Realizada':
        return 'Ótimo! A ação foi registrada como realizada.'
      case 'Realizada Parcialmente':
        return 'Ação registrada como realizada parcialmente.'
      case 'Cancelada':
        return 'Ação registrada como cancelada.'
      case 'Reagendada':
        return 'Ação registrada como reagendada.'
      default:
        return 'Ação registrada com sucesso!'
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Resposta Registrada!
      </h1>
      
      <p className="text-gray-600 mb-4">
        {getStatusMessage()}
      </p>
      
      {acaoNome && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-500">Ação</p>
          <p className="font-semibold text-gray-800">{acaoNome}</p>
        </div>
      )}
      
      <div className="space-y-3">
        <button
          onClick={() => router.push('/dien')}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition flex items-center justify-center gap-2"
        >
          <Home size={20} />
          Voltar para Página Principal
        </button>
        
        <button
          onClick={() => router.push('/app')}
          className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
        >
          <ArrowLeft size={20} />
          Voltar para Ações
        </button>
      </div>
    </div>
  )
}

// Página principal envolve o conteúdo no Suspense
export default function SucessoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 flex items-center justify-center p-6">
      <Suspense fallback={<div className="text-gray-500">Carregando confirmação...</div>}>
        <SucessoContent />
      </Suspense>
    </div>
  )
}