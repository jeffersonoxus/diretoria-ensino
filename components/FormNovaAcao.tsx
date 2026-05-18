'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Calendar, Car, EyeOff, Eye, AlertCircle, CheckCircle2, X, Bus } from "lucide-react"

export interface ParametroExtra {
  id: string
  label: string
  tipo: 'text' | 'number' | 'boolean' | 'select' | 'multiselect'
  opcoes?: string[]
}

export interface TipoAcao {
  id: string
  nome: string
  setores_ids: string[]
  parametros_extras: ParametroExtra[]
}

export interface Acao {
  id: string
  descricao?: string
  pessoas?: string[]
  created_at: string
  created_by?: string
  updated_at?: string
  updated_by?: string
  tipo_acao_id?: string
  setor_id?: string
  setores_envolvidos?: string[]
  local?: string
  data_inicio?: string
  data_fim?: string
  necessita_transporte?: boolean
  status?: string
  dados_extras?: Record<string, any>
  observacoes?: string
  created_by_nome?: string
  updated_by_nome?: string
}

export interface Setor {
  id: string
  nome: string
  descricao?: string
  pessoas: string[]
}

export interface Usuario {
  id: string
  nome: string
  email: string
}

interface Local {
  id: string
  nome: string
  tipo?: string
  endereco?: string
  ativo?: boolean
}

export const STATUS_OPCOES = ['Pendente', 'Realizada', 'Realizada Parcialmente', 'Cancelada', 'Reagendada']

const timeOptions: { hora: string; minuto: string; label: string }[] = []
for (let hora = 6; hora <= 21; hora++) {
  const horaStr = String(hora).padStart(2, '0')
  timeOptions.push({ hora: horaStr, minuto: '00', label: `${horaStr}:00` })
  timeOptions.push({ hora: horaStr, minuto: '30', label: `${horaStr}:30` })
}

export const formatarDataParaBanco = (dataLocal: string): string => {
  if (!dataLocal) return ''
  const [datePart, timePart] = dataLocal.split('T')
  if (!datePart || !timePart) return ''
  const [ano, mes, dia] = datePart.split('-')
  const [horas, minutos] = timePart.split(':')
  const dataLocalObj = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), parseInt(horas), parseInt(minutos))
  return dataLocalObj.toISOString()
}

export const formatarDataParaExibicao = (dataUTC: string): string => {
  if (!dataUTC) return ''
  const dataObj = new Date(dataUTC)
  if (isNaN(dataObj.getTime())) return ''
  return `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}-${String(dataObj.getDate()).padStart(2, '0')}T${String(dataObj.getHours()).padStart(2, '0')}:${String(dataObj.getMinutes()).padStart(2, '0')}`
}

export const formatarDataParaExibicaoLista = (dataUTC: string): string => {
  if (!dataUTC) return ''
  const dataObj = new Date(dataUTC)
  if (isNaN(dataObj.getTime())) return ''
  return dataObj.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const DateOnlyInput = ({ value, onChange, label, required = false, invalid = false }: { value: string, onChange: (value: string) => void, label: string, required?: boolean, invalid?: boolean }) => {
  const [dateValue, setDateValue] = useState('')
  const [timeValue, setTimeValue] = useState('')

  useEffect(() => {
    if (value) {
      const [datePart, timePart] = value.split('T')
      setDateValue(datePart || '')
      setTimeValue(timePart || '')
    } else {
      setDateValue('')
      setTimeValue('')
    }
  }, [value])

  const handleDateChange = (date: string) => {
    setDateValue(date)
    if (date && timeValue) {
      onChange(`${date}T${timeValue}`)
    } else if (date) {
      onChange(date)
    } else {
      onChange('')
    }
  }

  const handleTimeChange = (time: string) => {
    setTimeValue(time)
    if (dateValue && time) {
      onChange(`${dateValue}T${time}`)
    } else if (time) {
      setDateValue(dateValue)
    }
  }

  const openCalendar = () => {
    const dateInput = document.getElementById(`${label.replace(/\s/g, '')}-date-input`)
    if (dateInput) {
      (dateInput as HTMLInputElement).showPicker()
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-base font-bold text-gray-700">
        {label}
      </label>
      <div className="flex gap-2">
        <div
          className="relative flex-1 cursor-pointer"
          onClick={openCalendar}
        >
          <input
            id={`${label.replace(/\s/g, '')}-date-input`}
            type="date"
            value={dateValue}
            onChange={(e) => handleDateChange(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer bg-white ${invalid && !dateValue ? 'border-red-400' : ''}`}
          />
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500 pointer-events-none" size={18} />
        </div>
        <select
          value={timeValue}
          onChange={(e) => handleTimeChange(e.target.value)}
          className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white ${invalid && !timeValue ? 'border-red-400 text-red-600' : ''}`}
        >
          {!timeValue && <option value="">Selecione</option>}
          {timeOptions.map((option) => (
            <option key={option.label} value={option.label}>{option.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

interface FormNovaAcaoProps {
  setores: Setor[]
  tiposAcoes: TipoAcao[]
  locais: Local[]
  usuarios: Usuario[]
  userPerfilId: string | null
  userSetoresIds: string[]
  userNivelAcesso?: string
  editandoAcao?: Acao | null
  defaultDataInicio?: string
  defaultDataFim?: string
  defaultSetorId?: string
  onSave: () => void
  onCancel?: () => void
  titulo?: string
}

export default function FormNovaAcao({
  setores,
  tiposAcoes,
  locais,
  usuarios,
  userPerfilId,
  userSetoresIds,
  userNivelAcesso,
  editandoAcao,
  defaultDataInicio,
  defaultDataFim,
  defaultSetorId,
  onSave,
  onCancel,
  titulo
}: FormNovaAcaoProps) {
  const supabase = createClient()

  const [setorSelecionado, setSetorSelecionado] = useState<string | null>(null)
  const [descricao, setDescricao] = useState('')
  const [pessoas, setPessoas] = useState<string[]>([])
  const [setoresSelecionados, setSetoresSelecionados] = useState<string[]>([])
  const [tipoAcaoId, setTipoAcaoId] = useState('')
  const [local, setLocal] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [necessitaTransporte, setNecessitaTransporte] = useState(false)
  const [status, setStatus] = useState('Pendente')
  const [dadosExtras, setDadosExtras] = useState<Record<string, any>>({})
  const [observacoes, setObservacoes] = useState('')
  const [mostrarCamposPersonalizados, setMostrarCamposPersonalizados] = useState(false)
  const [setorInicialAuto, setSetorInicialAuto] = useState(true)
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const temAcessoAmplo = userNivelAcesso === 'gerencial' || userNivelAcesso === 'diretivo' || userNivelAcesso === 'administrativo'
  const setoresDisponiveis = temAcessoAmplo ? setores : setores.filter(s => userSetoresIds.includes(s.id))
  const todosSetoresParaEnvolver = setores.filter(s => s.id !== setorSelecionado)

  const carregarPessoasDoSetor = async (setorId: string) => {
    const setor = setores.find(s => s.id === setorId)
    if (setor?.pessoas && setor.pessoas.length > 0) {
      const { data: perfis } = await supabase
        .from('perfis')
        .select('id, nome, email')
        .in('id', setor.pessoas)

      if (perfis && perfis.length > 0) {
        const nomes = perfis.map(p => p.nome?.trim() || p.email)
        setPessoas(nomes)
      } else {
        setPessoas([])
      }
    } else {
      setPessoas([])
    }
  }

  useEffect(() => {
    if (editandoAcao) {
      setSetorSelecionado(editandoAcao.setor_id || null)
      setDescricao(editandoAcao.descricao || '')
      setPessoas(editandoAcao.pessoas || [])
      setSetoresSelecionados(editandoAcao.setores_envolvidos || [])
      setTipoAcaoId(editandoAcao.tipo_acao_id || '')
      setLocal(editandoAcao.local || '')
      setDataInicio(formatarDataParaExibicao(editandoAcao.data_inicio || ''))
      setDataFim(formatarDataParaExibicao(editandoAcao.data_fim || ''))
      setNecessitaTransporte(editandoAcao.necessita_transporte || false)
      setStatus(editandoAcao.status || 'Pendente')
      setDadosExtras(editandoAcao.dados_extras || {})
      setObservacoes(editandoAcao.observacoes || '')
      setMostrarCamposPersonalizados(true)
      setSetorInicialAuto(false)
      return
    }

    if (defaultDataInicio) setDataInicio(defaultDataInicio)
    if (defaultDataFim) setDataFim(defaultDataFim)

    if (defaultSetorId) {
      setSetorSelecionado(defaultSetorId)
      carregarPessoasDoSetor(defaultSetorId)
      setSetorInicialAuto(false)
      return
    }

    if (setorInicialAuto && userSetoresIds.length === 1 && !setorSelecionado) {
      const setorId = userSetoresIds[0]
      setSetorSelecionado(setorId)
      carregarPessoasDoSetor(setorId)
      setSetorInicialAuto(false)
    }
  }, [editandoAcao, defaultDataInicio, defaultDataFim, defaultSetorId, userSetoresIds])

  const nomeResponsavel = (() => {
    const usuarioResponsavel = usuarios.find(u => u.id === userPerfilId)
    return usuarioResponsavel?.nome?.trim() || usuarioResponsavel?.email || ''
  })()

  const toggleSetor = async (setorId: string) => {
    const isSelected = setoresSelecionados.includes(setorId)
    const setor = setores.find(s => s.id === setorId)

    if (isSelected) {
      setSetoresSelecionados(prev => prev.filter(id => id !== setorId))
      if (setor && setor.pessoas && setor.pessoas.length > 0) {
        const { data: perfis } = await supabase
          .from('perfis')
          .select('nome, email')
          .in('id', setor.pessoas)
        if (perfis) {
          const nomesParaRemover = perfis.map(p => p.nome?.trim() || p.email)
          if (nomeResponsavel && nomesParaRemover.includes(nomeResponsavel)) {
            const nomesFiltrados = nomesParaRemover.filter(n => n !== nomeResponsavel)
            setPessoas(prev => prev.filter(p => !nomesFiltrados.includes(p)))
          } else {
            setPessoas(prev => prev.filter(p => !nomesParaRemover.includes(p)))
          }
        }
      }
    } else {
      setSetoresSelecionados(prev => [...prev, setorId])
      if (setor && setor.pessoas && setor.pessoas.length > 0) {
        const { data: perfis } = await supabase
          .from('perfis')
          .select('nome, email')
          .in('id', setor.pessoas)
        if (perfis) {
          const nomesParaAdicionar = perfis.map(p => p.nome?.trim() || p.email)
          setPessoas(prev => [...new Set([...prev, ...nomesParaAdicionar])])
        }
      }
    }
  }

  const togglePessoa = async (nomePessoa: string) => {
    if (nomePessoa === nomeResponsavel) {
      alert("Você não pode remover a si mesmo das pessoas envolvidas!")
      return
    }

    const setorPrincipal = setores.find(s => s.id === setorSelecionado)
    if (!setorPrincipal) return

    const buscarNomes = async () => {
      if (setorPrincipal.pessoas && setorPrincipal.pessoas.length > 0) {
        const { data: perfis } = await supabase
          .from('perfis')
          .select('nome, email')
          .in('id', setorPrincipal.pessoas)

        if (perfis) {
          const nomesDoSetorPrincipal = perfis.map(p => p.nome?.trim() || p.email)

          const pessoasSelecionadasDoPrincipal = pessoas.filter(p =>
            nomesDoSetorPrincipal.includes(p) && p !== nomeResponsavel
          )

          if (nomesDoSetorPrincipal.includes(nomePessoa) &&
            pessoasSelecionadasDoPrincipal.length === 0 &&
            pessoas.includes(nomePessoa)) {
            alert("Não é possível remover todas as pessoas do setor responsável pela ação!")
            return
          }

          setPessoas(prev => prev.includes(nomePessoa) ? prev.filter(p => p !== nomePessoa) : [...prev, nomePessoa])
        }
      }
    }

    buscarNomes()
  }

  const resetForm = () => {
    setMensagemErro(null)
    setMensagemSucesso(null)
    setDescricao('')
    setPessoas([])
    setSetoresSelecionados([])
    setTipoAcaoId('')
    setLocal('')
    setDataInicio('')
    setDataFim('')
    setNecessitaTransporte(false)
    setStatus('Pendente')
    setDadosExtras({})
    setObservacoes('')
    setMostrarCamposPersonalizados(false)
    if (editandoAcao && onCancel) {
      onCancel()
      return
    }
    if (defaultDataInicio) setDataInicio(defaultDataInicio)
    if (defaultDataFim) setDataFim(defaultDataFim)
    if (defaultSetorId) {
      setSetorSelecionado(defaultSetorId)
      carregarPessoasDoSetor(defaultSetorId)
    } else if (userSetoresIds.length === 1) {
      const setorId = userSetoresIds[0]
      setSetorSelecionado(setorId)
      carregarPessoasDoSetor(setorId)
    }
  }

  const salvarAcao = async () => {
    setMensagemErro(null)
    setMensagemSucesso(null)

    if (!setorSelecionado) { setMensagemErro("Selecione um setor responsável"); return }
    if (!tipoAcaoId) { setMensagemErro("Selecione o Tipo de Ação"); return }
    if (!local) { setMensagemErro("Selecione o Local"); return }
    if (!dataInicio?.includes('T')) { setMensagemErro("Preencha a data e horário de início"); return }
    if (!dataFim?.includes('T')) { setMensagemErro("Preencha a data e horário de término"); return }

    setSalvando(true)

    let pessoasFinal = [...pessoas]
    if (nomeResponsavel && !pessoasFinal.includes(nomeResponsavel)) {
      pessoasFinal.push(nomeResponsavel)
    }

    const dadosComuns = {
      descricao,
      pessoas: pessoasFinal,
      setores_envolvidos: setoresSelecionados,
      tipo_acao_id: tipoAcaoId,
      setor_id: setorSelecionado,
      local,
      data_inicio: dataInicio ? formatarDataParaBanco(dataInicio) : null,
      data_fim: dataFim ? formatarDataParaBanco(dataFim) : null,
      necessita_transporte: necessitaTransporte,
      status,
      dados_extras: dadosExtras,
      observacoes
    }

    const { error } = editandoAcao
      ? await supabase.from('acoes').update({
          ...dadosComuns,
          updated_at: new Date().toISOString(),
          updated_by: userPerfilId
        }).eq('id', editandoAcao.id)
      : await supabase.from('acoes').insert([{
          ...dadosComuns,
          created_at: new Date().toISOString(),
          created_by: userPerfilId,
          updated_at: new Date().toISOString(),
          updated_by: userPerfilId
        }])

    setSalvando(false)

    if (error) {
      setMensagemErro("Erro ao salvar: " + error.message)
      return
    }

    setMensagemSucesso(editandoAcao ? "Ação atualizada com sucesso!" : "Ação criada com sucesso!")
    setTimeout(() => setMensagemSucesso(null), 3000)

    resetForm()
    onSave()
  }

  const tipoAcaoSelecionado = tiposAcoes.find(ta => ta.id === tipoAcaoId)

  const dataInicioValida = dataInicio?.includes('T')
  const dataFimValida = dataFim?.includes('T')
  const podeSalvar = tipoAcaoId && local && dataInicioValida && dataFimValida

  const camposObrigatorios = [
    { nome: 'Tipo de Ação', valido: !!tipoAcaoId },
    { nome: 'Local', valido: !!local },
    { nome: 'Data de Início', valido: dataInicioValida },
    { nome: 'Data de Término', valido: dataFimValida },
  ]

  const todosValidos = camposObrigatorios.every(c => c.valido)

  return (
    <div className="space-y-4">
      {titulo && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{titulo}</h2>
          {editandoAcao && onCancel && (
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">Cancelar edição</button>
          )}
        </div>
      )}

      {mensagemErro && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-300 rounded-xl text-red-700 animate-pulse">
          <AlertCircle size={20} className="shrink-0" />
          <span className="font-medium">{mensagemErro}</span>
          <button onClick={() => setMensagemErro(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={18} /></button>
        </div>
      )}

      {mensagemSucesso && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-300 rounded-xl text-green-700">
          <CheckCircle2 size={20} className="shrink-0" />
          <span className="font-medium">{mensagemSucesso}</span>
          <button onClick={() => setMensagemSucesso(null)} className="ml-auto text-green-400 hover:text-green-600"><X size={18} /></button>
        </div>
      )}



      {setoresDisponiveis.length > 1 && (
        <div className="p-5 rounded-xl border-2">
          <label className="block text-base font-bold text-gray-700 mb-2">Setor Responsável</label>
          <select
            value={setorSelecionado || ''}
            onChange={(e) => {
              const novoSetorId = e.target.value
              setSetorSelecionado(novoSetorId)
              carregarPessoasDoSetor(novoSetorId)
            }}
            className="w-full p-3 font-bold border bg-white rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Selecione um setor</option>
            {setoresDisponiveis.map(s => <option key={s.id} value={s.id} className="font-medium">{s.nome}</option>)}
          </select>
        </div>
      )}

      {setorSelecionado && (
        <>
          {/* Seção: Informações Básicas */}
          <div className="p-5 rounded-xl border-2 border-purple-100 bg-purple-50/30">
            <h3 className="text-base font-bold text-purple-700 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-purple-500 rounded-full inline-block" />
              Informações Básicas
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-bold text-gray-700 mb-2">Tipo de Ação</label>
                <select
                  value={tipoAcaoId}
                  onChange={(e) => setTipoAcaoId(e.target.value)}
                  className={`w-full p-3 font-bold border rounded-lg focus:ring-2 focus:ring-purple-500 ${!tipoAcaoId ? 'border-red-400' : ''}`}
                >
                  <option value="">Selecione</option>
                  {tiposAcoes.filter(ta => ta.setores_ids?.includes(setorSelecionado)).map(ta => (
                    <option key={ta.id} value={ta.id}>{ta.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-base font-bold text-gray-700 mb-2">Local</label>
                <select value={local} onChange={(e) => setLocal(e.target.value)} className={`w-full p-3 border rounded-lg ${!local ? 'border-red-400' : ''}`}>
                  <option value="">Selecione o local</option>
                  {locais.map(l => <option key={l.id} value={l.nome}>{l.nome}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Seção: Data e Hora */}
          <div className="p-5 rounded-xl border-2 border-blue-100 bg-blue-50/30">
            <h3 className="text-base font-bold text-blue-700 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-blue-500 rounded-full inline-block" />
              Data e Hora
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <DateOnlyInput value={dataInicio} onChange={setDataInicio} label="Data de Início" required invalid={!dataInicio?.includes('T')} />
              <DateOnlyInput value={dataFim} onChange={setDataFim} label="Data de Término" required invalid={!dataFim?.includes('T')} />
            </div>
          </div>

          {/* Seção: Detalhamento */}
          <div className="p-5 rounded-xl border-2 border-emerald-100 bg-emerald-50/30">
            <h3 className="text-base font-bold text-emerald-700 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-emerald-500 rounded-full inline-block" />
              Detalhamento
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-base font-bold text-gray-700 mb-2">Descrição</label>
                <textarea
                  placeholder="Descreva a ação..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-2">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-3 border rounded-lg font-medium">
                    {STATUS_OPCOES.map(s => {
                      const statusColors: Record<string, string> = {
                        'Pendente': 'text-yellow-600',
                        'Realizada': 'text-green-600',
                        'Realizada Parcialmente': 'text-blue-600',
                        'Cancelada': 'text-red-600',
                        'Reagendada': 'text-purple-600'
                      }
                      const statusDots: Record<string, string> = {
                        'Pendente': 'bg-yellow-500',
                        'Realizada': 'bg-green-500',
                        'Realizada Parcialmente': 'bg-blue-500',
                        'Cancelada': 'bg-red-500',
                        'Reagendada': 'bg-purple-500'
                      }
                      return (
                        <option key={s} value={s} className={`font-medium ${statusColors[s] || ''}`}>
                          {s}
                        </option>
                      )
                    })}
                  </select>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${status === 'Pendente' ? 'bg-yellow-500' : status === 'Realizada' ? 'bg-green-500' : status === 'Realizada Parcialmente' ? 'bg-blue-500' : status === 'Cancelada' ? 'bg-red-500' : status === 'Reagendada' ? 'bg-purple-500' : 'bg-gray-300'}`}></span>
                    <span className={`text-xs font-medium ${status === 'Pendente' ? 'text-yellow-600' : status === 'Realizada' ? 'text-green-600' : status === 'Realizada Parcialmente' ? 'text-blue-600' : status === 'Cancelada' ? 'text-red-600' : status === 'Reagendada' ? 'text-purple-600' : 'text-gray-500'}`}>{status}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-2">Transporte</label>
                  <button
                    type="button"
                    onClick={() => setNecessitaTransporte(!necessitaTransporte)}
                    className={`w-full flex items-center justify-center gap-3 p-3 rounded-xl border-2 font-bold text-base transition-all ${
                      necessitaTransporte
                        ? 'border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]'
                        : 'border-gray-300 bg-white text-gray-500 hover:border-blue-300 hover:text-blue-500'
                    }`}
                  >
                    <Bus size={22} className={necessitaTransporte ? 'text-white' : ''} />
                    {necessitaTransporte ? 'TRANSPORTE SOLICITADO' : 'Necessita Transporte?'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-base font-bold text-gray-700 mb-2">Observações</label>
                <textarea
                  placeholder="Observações..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={2}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Seção: Setores */}
          <div className="p-5 rounded-xl border-2 border-pink-100 bg-pink-50/30">
            <h3 className="text-base font-bold text-pink-700 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-pink-500 rounded-full inline-block" />
              Setores Envolvidos
            </h3>
            <p className="text-sm text-gray-500 mb-3">Clique nos setores para adicionar/remover automaticamente suas pessoas nos participantes.</p>
            <div className="flex flex-wrap gap-2">
              {todosSetoresParaEnvolver.map(setor => (
                <button
                  key={setor.id}
                  onClick={() => toggleSetor(setor.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    setoresSelecionados.includes(setor.id)
                      ? "bg-purple-600 text-white shadow-md scale-105"
                      : "bg-white border-2 border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600"
                  }`}
                >
                  {setor.nome}
                  {setoresSelecionados.includes(setor.id) && (
                    <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                      {setor.pessoas?.length || 0} 👤
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Seção: Participantes */}
          <div className="p-5 rounded-xl border-2 border-amber-100 bg-amber-50/30">
            <h3 className="text-base font-bold text-amber-700 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-amber-500 rounded-full inline-block" />
              Participantes
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-base font-bold text-gray-700 mb-2">Pessoas Envolvidas</label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-4 border rounded-lg bg-white">
                  {usuarios.length > 0 ? (
                    usuarios.map(user => {
                      const nomeExibicao = user.nome?.trim() || user.email
                      const isSelected = pessoas.includes(nomeExibicao)
                      const isResponsavel = nomeExibicao === nomeResponsavel
                      return (
                        <button
                          key={user.id}
                          onClick={() => togglePessoa(nomeExibicao)}
                          className={`px-3 py-1.5 rounded-full text-sm transition ${
                            isSelected
                              ? "bg-amber-400 text-purple-900 font-medium shadow-sm"
                              : "bg-white text-gray-700 border hover:bg-gray-100"
                          } ${isResponsavel ? "ring-2 ring-purple-500 ring-offset-1" : ""}`}
                          title={isResponsavel ? "Responsável pela ação (não pode ser removido)" : ""}
                        >
                          {nomeExibicao} {isResponsavel && "⭐"}
                        </button>
                      )
                    })
                  ) : (
                    <p className="text-gray-500 text-sm p-2">Nenhuma pessoa encontrada</p>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  ⭐ Você é o responsável e não pode ser removido.
                </p>
              </div>
            </div>
          </div>

          {tipoAcaoSelecionado && tipoAcaoSelecionado.parametros_extras && tipoAcaoSelecionado.parametros_extras.length > 0 && (
            <div className="p-5 rounded-xl border-2 border-gray-100 bg-gray-50/30">
              <button
                onClick={() => setMostrarCamposPersonalizados(!mostrarCamposPersonalizados)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium mb-3"
              >
                {mostrarCamposPersonalizados ? <EyeOff size={18} /> : <Eye size={18} />}
                {mostrarCamposPersonalizados ? 'Ocultar' : 'Mostrar'} Campos Específicos
              </button>

              {mostrarCamposPersonalizados && (
                <div className="grid md:grid-cols-2 gap-4">
                  {tipoAcaoSelecionado.parametros_extras.map(param => (
                    <div key={param.id}>
                      <label className="block text-base font-medium text-gray-700 mb-1">{param.label}</label>
                      {renderizarCampoExtra(param, dadosExtras, setDadosExtras)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t mt-6">
            <button
              onClick={salvarAcao}
              disabled={!podeSalvar || salvando}
              className="flex-1 bg-linear-to-r from-purple-600 to-indigo-600 text-white font-bold px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {salvando ? (
                <><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> Salvando...</>
              ) : (
                <>{editandoAcao ? 'Atualizar' : 'Criar'} Ação</>
              )}
            </button>
            <button onClick={resetForm} className="px-6 py-3 border rounded-lg hover:bg-gray-50 transition">Limpar</button>
          </div>
        </>
      )}
    </div>
  )
}

function renderizarCampoExtra(param: ParametroExtra, dadosExtras: any, setDadosExtras: any) {
  const valor = dadosExtras[param.label] ?? ''
  const atualizar = (novoValor: any) => setDadosExtras((prev: any) => ({ ...prev, [param.label]: novoValor }))

  switch (param.tipo) {
    case 'text':
      return <input type="text" value={valor} onChange={(e) => atualizar(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
    case 'number':
      return <input type="number" value={valor} onChange={(e) => atualizar(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
    case 'boolean':
      return (
        <div className="flex gap-2">
          <button onClick={() => atualizar(true)} className={`px-4 py-2 rounded-lg border transition ${valor === true ? 'bg-purple-600 text-white' : 'bg-white hover:bg-gray-50'}`}>Sim</button>
          <button onClick={() => atualizar(false)} className={`px-4 py-2 rounded-lg border transition ${valor === false ? 'bg-amber-400 text-purple-900' : 'bg-white hover:bg-gray-50'}`}>Não</button>
        </div>
      )
    case 'select':
      return (
        <select value={valor} onChange={(e) => atualizar(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
          <option value="">Selecione...</option>
          {param.opcoes?.map(op => <option key={op} value={op}>{op}</option>)}
        </select>
      )
    default:
      return null
  }
}
