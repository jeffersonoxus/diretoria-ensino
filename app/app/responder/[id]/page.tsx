// app/app/responder/[id]/page.tsx
'use client'

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { 
  Calendar, 
  MapPin, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Users,
  ChevronRight,
  AlertCircle,
  Send,
  Home
} from "lucide-react"

// Interfaces
interface Acao {
  id: string
  nome: string
  descricao?: string
  local?: string
  data_inicio?: string
  data_fim?: string
  necessita_transporte?: boolean
  status?: string
  dados_extras?: Record<string, any>
  pessoas?: string[]
  setor_id?: string
  tipo_acao_id?: string
  setores_envolvidos?: string[]
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
  parametros_extras: ParametroExtra[]
}

const STATUS_OPCOES = [
  { value: 'Realizada', label: '✅ Realizada', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  { value: 'Realizada Parcialmente', label: '⚠️ Realizada Parcialmente', icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { value: 'Cancelada', label: '❌ Cancelada', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  { value: 'Reagendada', label: '🔄 Reagendada', icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50' }
]

export default function ResponderAcaoPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const acaoId = params.id as string

  const [acao, setAcao] = useState<Acao | null>(null)
  const [tipoAcao, setTipoAcao] = useState<TipoAcao | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [respostas, setRespostas] = useState<Record<string, any>>({})
  const [statusSelecionado, setStatusSelecionado] = useState<string>('')
  const [observacoes, setObservacoes] = useState('')
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    carregarDados()
  }, [acaoId])

  const carregarDados = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar ação
      const { data: acaoData, error: acaoError } = await supabase
        .from('acoes')
        .select('*')
        .eq('id', acaoId)
        .single()

      if (acaoError) throw new Error('Ação não encontrada')
      setAcao(acaoData)

      // Buscar tipo de ação
      if (acaoData.tipo_acao_id) {
        const { data: tipoData, error: tipoError } = await supabase
          .from('tipo_acao')
          .select('*')
          .eq('id', acaoData.tipo_acao_id)
          .single()

        if (!tipoError && tipoData) {
          setTipoAcao(tipoData)
          // Inicializar respostas com valores existentes
          if (acaoData.dados_extras) {
            setRespostas(acaoData.dados_extras)
          }
        }
      }

      setStatusSelecionado(acaoData.status || 'Pendente')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const renderizarCampoExtra = (param: ParametroExtra) => {
    const valor = respostas[param.label] || ''
    const atualizarValor = (novoValor: any) => {
      setRespostas(prev => ({ ...prev, [param.label]: novoValor }))
    }

    switch (param.tipo) {
      case 'text':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              {param.label}
            </label>
            <input
              type="text"
              placeholder="Digite sua resposta..."
              value={valor}
              onChange={(e) => atualizarValor(e.target.value)}
              className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-base"
            />
          </div>
        )
      
      case 'number':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              {param.label}
            </label>
            <input
              type="number"
              placeholder="Digite um número..."
              value={valor}
              onChange={(e) => atualizarValor(e.target.value)}
              className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-base"
            />
          </div>
        )
      
      case 'boolean':
        const valorReal = respostas[param.label];
        return (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {param.label}
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => atualizarValor(true)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition ${
                  valor === true 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sim ✅
              </button>
              <button
                type="button"
                onClick={() => atualizarValor(false)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition ${
                  valorReal === false 
                    ? 'bg-red-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Não ❌
              </button>
            </div>
          </div>
        )
      
      case 'select':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              {param.label}
            </label>
            <select
              value={valor}
              onChange={(e) => atualizarValor(e.target.value)}
              className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-base bg-white"
            >
              <option value="">Selecione uma opção...</option>
              {param.opcoes?.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>
        )
      
      case 'multiselect':
        const valoresSelecionados = Array.isArray(valor) ? valor : []
        return (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {param.label}
            </label>
            <div className="space-y-2">
              {param.opcoes?.map(op => (
                <label key={op} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                  <input
                    type="checkbox"
                    checked={valoresSelecionados.includes(op)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        atualizarValor([...valoresSelecionados, op])
                      } else {
                        atualizarValor(valoresSelecionados.filter(v => v !== op))
                      }
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-base">{op}</span>
                </label>
              ))}
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  const handleSubmit = async () => {
    if (!statusSelecionado) {
      alert('Por favor, selecione um status para a ação')
      return
    }

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Buscar o perfil do usuário
      const { data: perfil } = await supabase
        .from('perfis')
        .select('id')
        .eq('email', user?.email)
        .single()

      const { error } = await supabase
        .from('acoes')
        .update({
          status: statusSelecionado,
          dados_extras: { ...acao?.dados_extras, ...respostas },
          observacoes: observacoes,
          updated_at: new Date().toISOString(),
          updated_by: perfil?.id
        })
        .eq('id', acaoId)

      if (error) throw error

      // Redirecionar para página de sucesso
      router.push(`/app/responder/sucesso?acao=${encodeURIComponent(acao?.nome || '')}&status=${statusSelecionado}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar resposta')
      alert('Erro ao salvar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-purple-50 to-purple-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando ação...</p>
        </div>
      </div>
    )
  }

  if (error || !acao) {
    return (
      <div className="min-h-screen bg-linear-to-b from-purple-50 to-purple-200 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro ao carregar ação</h2>
          <p className="text-gray-600 mb-4">{error || 'Ação não encontrada'}</p>
          <button
            onClick={() => router.push('/app')}
            className="bg-purple-500 text-white px-6 py-3 rounded-xl hover:bg-purple-600 transition"
          >
            Voltar para início
          </button>
        </div>
      </div>
    )
  }

  // Verificar se a ação já foi realizada
  const jaRealizada = acao.status !== 'Pendente' && acao.status !== 'Reagendada'
  
  if (jaRealizada) {
    return (
      <div className="min-h-screen bg-linear-to-b from-purple-50 to-purple-200 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ação já registrada</h2>
          <p className="text-gray-600 mb-4">
            Esta ação já foi registrada como <strong>{acao.status}</strong>
          </p>
          <button
            onClick={() => router.push('/app')}
            className="bg-purple-500 text-white px-6 py-3 rounded-xl hover:bg-purple-600 transition"
          >
            Ver outras ações
          </button>
        </div>
      </div>
    )
  }

  // Steps: 0 = Informações, 1 = Perguntas, 2 = Status
  const steps = [
    { title: 'Informações', icon: Calendar },
    { title: 'Perguntas', icon: CheckCircle },
    { title: 'Status', icon: Send }
  ]

  return (
    <div className="min-h-screen text-slate-700 bg-linear-to-b from-purple-50 to-purple-200">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <ChevronRight className="w-6 h-6 text-gray-600 rotate-180" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Responder Ação</h1>
                <p className="text-xs text-gray-500">Preencha as informações da visita</p>
              </div>
            </div>
            
            {/* Botão Home */}
            <button
              onClick={() => router.push('/dien')}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <Home size={24} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white text-slate-700 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              return (
                <div key={index} className="flex-1 flex items-center gap-2">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition
                    ${isActive ? 'bg-purple-500 text-white' : ''}
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-500' : ''}
                  `}>
                    <StepIcon size={16} />
                  </div>
                  <span className={`
                    text-xs font-medium hidden sm:block
                    ${isActive ? 'text-purple-600' : ''}
                    ${isCompleted ? 'text-green-600' : ''}
                    ${!isActive && !isCompleted ? 'text-gray-400' : ''}
                  `}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-gray-200 mx-2">
                      <div className={`h-full transition-all duration-300 ${index < currentStep ? 'bg-green-500 w-full' : 'w-0'}`} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Step 0: Informações da Ação */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{acao.nome}</h2>
              {acao.descricao && (
                <p className="text-gray-600 mb-4">{acao.descricao}</p>
              )}
              
              <div className="space-y-3">
                {acao.local && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPin size={20} />
                    <span>{acao.local}</span>
                  </div>
                )}
                {acao.data_inicio && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Calendar size={20} />
                    <span>Início: {new Date(acao.data_inicio).toLocaleString('pt-BR')}</span>
                  </div>
                )}
                {acao.data_fim && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Calendar size={20} />
                    <span>Término: {new Date(acao.data_fim).toLocaleString('pt-BR')}</span>
                  </div>
                )}
                {acao.necessita_transporte && (
                  <div className="flex items-center gap-3 text-purple-600">
                    <Truck size={20} />
                    <span className="font-medium">Necessita transporte</span>
                  </div>
                )}
                {acao.pessoas && acao.pessoas.length > 0 && (
                  <div className="flex items-start gap-3 text-gray-600">
                    <Users size={20} className="mt-0.5" />
                    <div>
                      <span className="font-medium">Participantes:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {acao.pessoas.map((pessoa, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                            {pessoa}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setCurrentStep(1)}
              className="w-full bg-purple-500 text-white py-4 rounded-2xl font-bold text-lg shadow-md hover:bg-purple-600 transition active:scale-98"
            >
              Continuar
            </button>
          </div>
        )}

        {/* Step 1: Perguntas Personalizadas */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Informações da Visita
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Responda as perguntas abaixo sobre a realização da ação
              </p>

              <div className="space-y-6">
                {tipoAcao?.parametros_extras?.map((param) => (
                  <div key={param.id}>
                    {renderizarCampoExtra(param)}
                  </div>
                ))}

                {/* Observações */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Observações Adicionais
                  </label>
                  <textarea
                    placeholder="Registre observações importantes sobre a visita..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={4}
                    className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-base"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(0)}
                className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-medium hover:bg-gray-200 transition"
              >
                Voltar
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                className="flex-1 bg-purple-500 text-white py-4 rounded-2xl font-bold hover:bg-purple-600 transition active:scale-98"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Status Final */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Resultado da Ação
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Selecione o status final desta ação
              </p>

              <div className="space-y-3 mb-6">
                {STATUS_OPCOES.map((status) => {
                  const StatusIcon = status.icon
                  const isSelected = statusSelecionado === status.value
                  return (
                    <button
                      key={status.value}
                      onClick={() => setStatusSelecionado(status.value)}
                      className={`
                        w-full p-4 rounded-2xl border-2 transition-all text-left
                        ${isSelected 
                          ? `${status.bg} border-${status.color.replace('text-', '')} shadow-md` 
                          : 'bg-white border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`w-6 h-6 ${isSelected ? status.color : 'text-gray-400'}`} />
                        <div>
                          <p className={`font-bold ${isSelected ? status.color : 'text-gray-700'}`}>
                            {status.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {status.value === 'Realizada' && 'Ação concluída com sucesso'}
                            {status.value === 'Realizada Parcialmente' && 'Parte da ação foi realizada'}
                            {status.value === 'Cancelada' && 'Ação não foi realizada'}
                            {status.value === 'Reagendada' && 'Nova data será definida'}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-medium hover:bg-gray-200 transition"
              >
                Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!statusSelecionado || submitting}
                className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Finalizar
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}