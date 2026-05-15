'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Calendar, Car, EyeOff, Eye } from "lucide-react"

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

const DateOnlyInput = ({ value, onChange, label, required = false }: { value: string, onChange: (value: string) => void, label: string, required?: boolean }) => {
  const [dateValue, setDateValue] = useState('')
  const [timeValue, setTimeValue] = useState('08:00')

  useEffect(() => {
    if (value) {
      const [datePart, timePart] = value.split('T')
      setDateValue(datePart || '')
      if (timePart) setTimeValue(timePart)
      else setTimeValue('08:00')
    } else {
      setDateValue('')
      setTimeValue('08:00')
    }
  }, [value])

  const handleDateChange = (date: string) => {
    setDateValue(date)
    if (date && timeValue) {
      onChange(`${date}T${timeValue}`)
    }
  }

  const handleTimeChange = (time: string) => {
    setTimeValue(time)
    if (dateValue && time) {
      onChange(`${dateValue}T${time}`)
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
        {label} {required && '*'}
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
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer bg-white"
          />
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500 pointer-events-none" size={18} />
        </div>
        <select
          value={timeValue}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
        >
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

  const setoresDisponiveis = setores.filter(s => userSetoresIds.includes(s.id))
  const setoresEnvolvidosDisponiveis = setores.filter(s => userSetoresIds.includes(s.id) && s.id !== setorSelecionado)

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
    if (!setorSelecionado) return alert("Selecione um setor")
    if (!tipoAcaoId) return alert("Selecione o Tipo de Ação")

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

    if (editandoAcao) {
      await supabase.from('acoes').update({
        ...dadosComuns,
        updated_at: new Date().toISOString(),
        updated_by: userPerfilId
      }).eq('id', editandoAcao.id)
    } else {
      await supabase.from('acoes').insert([{
        ...dadosComuns,
        created_at: new Date().toISOString(),
        created_by: userPerfilId,
        updated_at: new Date().toISOString(),
        updated_by: userPerfilId
      }])
    }

    resetForm()
    onSave()
  }

  const tipoAcaoSelecionado = tiposAcoes.find(ta => ta.id === tipoAcaoId)

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
          <div>
            <label className="block text-base font-bold text-gray-700 mb-2">Tipo de Ação *</label>
            <select
              value={tipoAcaoId}
              onChange={(e) => setTipoAcaoId(e.target.value)}
              className="w-full p-3 font-bold border rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Selecione</option>
              {tiposAcoes.filter(ta => ta.setores_ids?.includes(setorSelecionado)).map(ta => (
                <option key={ta.id} value={ta.id}>{ta.nome}</option>
              ))}
            </select>
          </div>

          <textarea
            placeholder="Descrição da ação..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />

          <div className="grid font-bold md:grid-cols-2 gap-4">
            <select value={local} onChange={(e) => setLocal(e.target.value)} className="p-3 border rounded-lg">
              <option value="">Local (Escola)</option>
              {locais.map(l => <option key={l.id} value={l.nome}>{l.nome}</option>)}
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value)} className="p-3 border rounded-lg">
              {STATUS_OPCOES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <DateOnlyInput value={dataInicio} onChange={setDataInicio} label="Data de Início" />

            <DateOnlyInput value={dataFim} onChange={setDataFim} label="Data de Término (opcional)" />

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={necessitaTransporte} onChange={(e) => setNecessitaTransporte(e.target.checked)} className="accent-purple-600" />
                <Car size={20} className="text-purple-600" />
                <span>Necessita Transporte</span>
              </label>
            </div>
          </div>

          {setoresEnvolvidosDisponiveis.length > 0 && (
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">Setores Envolvidos</label>
              <div className="flex flex-wrap gap-2">
                {setoresEnvolvidosDisponiveis.map(setor => (
                  <button
                    key={setor.id}
                    onClick={() => toggleSetor(setor.id)}
                    className={`px-3 py-1.5 rounded-full text-base transition ${
                      setoresSelecionados.includes(setor.id) ? "bg-purple-600 text-white" : "bg-gray-200 hover:bg-gray-200"
                    }`}
                  >
                    {setor.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-base font-bold text-gray-700 mb-2">Pessoas Envolvidas</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg bg-gray-50">
              {usuarios.length > 0 ? (
                usuarios.map(user => {
                  const nomeExibicao = user.nome?.trim() || user.email
                  const isSelected = pessoas.includes(nomeExibicao)
                  const isResponsavel = nomeExibicao === nomeResponsavel
                  return (
                    <button
                      key={user.id}
                      onClick={() => togglePessoa(nomeExibicao)}
                      className={`px-3 py-1.5 rounded-full text-base transition ${
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
            <p className="text-base text-gray-700 mt-1">
              ⭐ Você é o responsável e não pode ser removido. As pessoas do setor responsável já estão selecionadas automaticamente.
            </p>
          </div>

          {tipoAcaoSelecionado && tipoAcaoSelecionado.parametros_extras && tipoAcaoSelecionado.parametros_extras.length > 0 && (
            <div className="border-t pt-4">
              <button
                onClick={() => setMostrarCamposPersonalizados(!mostrarCamposPersonalizados)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium mb-3"
              >
                {mostrarCamposPersonalizados ? <EyeOff size={18} /> : <Eye size={18} />}
                {mostrarCamposPersonalizados ? 'Ocultar' : 'Mostrar'} Campos Específicos
              </button>

              {mostrarCamposPersonalizados && (
                <div className="space-y-3">
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

          <textarea
            placeholder="Observações..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={2}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />

          <div className="flex gap-3 pt-4">
            <button
              onClick={salvarAcao}
              disabled={!tipoAcaoId}
              className="flex-1 bg-linear-to-r from-purple-600 to-indigo-600 text-white font-bold px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-md disabled:opacity-50"
            >
              {editandoAcao ? 'Atualizar' : 'Criar'} Ação
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
