// app/dien/acoes/page.tsx
'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Calendar, 
  MapPin, 
  Truck,
  Car,
  X,
  Users,
  Eye,
  Filter,
  Building2,
  AlertCircle,
  CheckCircle,
  List,
  ChevronDown,
  ChevronUp
} from "lucide-react"

// --- Interfaces ---

interface Usuario {
  id: string
  nome: string
  email: string
}

interface Acao {
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
}

interface Setor {
  id: string
  nome: string
  descricao?: string
  pessoas: string[]
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

// Opções estáticas
const ESCOLAS_OPCOES = [
  "EMEB Dalmario Souza",
  "EMEB Dr. Gustavo Paiva",
  "EMEB João Paulo II",
  "EMEB José Bonifácio de Andrada e Silva",
  "EMEB Lápis de Cor",
  "EMEB Marieta Leão",
  "EMEB Professor Givaldo Moraes Sarmento",
  "EMEB Professor José Carlos da Silva",
  "EMEB Professor Pompeu Sarmento",
  "EMEB Professora Iete Melo Mathias",
  "EMEB Renato Jarsen de Melo",
  "EMEB Teresa Cristina Lins de Souza Costa",
  "EMEF Industrial Luigi Bauducco",
  "EMEF Machado de Assis",
  "EMEF Manoel Soares de Souza",
  "EMEF Prefeito Antonio Lins de Souza",
  "EMEF Professor José Edmilson de Souza",
  "EMEF Professora Emilia Milones",
  "Escola Municipal de Ensino Fundamental Dr. Gastão Oiticica",
  "Escola Municipal de Ensino Fundamental Manoel Gonçalves da Silva",
  "Escola Municipal de Ensino Fundamental Odylo Alvares de Souza"
]

const STATUS_OPCOES = [
  'Pendente', 
  'Realizada', 
  'Realizada Parcialmente', 
  'Cancelada', 
  'Reagendada'
]

// --- Funções de data com fuso horário local corrigido ---

// Converter data local para UTC ao salvar no banco
const formatarDataParaBanco = (dataLocal: string): string => {
  if (!dataLocal) return ''
  
  const [datePart, timePart] = dataLocal.split('T')
  const [ano, mes, dia] = datePart.split('-')
  const [horas, minutos] = timePart.split(':')
  
  // Criar objeto Date no fuso local
  const dataLocalObj = new Date(
    parseInt(ano), 
    parseInt(mes) - 1, 
    parseInt(dia), 
    parseInt(horas), 
    parseInt(minutos)
  )
  
  // Converter para ISO string (UTC) para salvar no banco
  return dataLocalObj.toISOString()
}

// Converter data UTC do banco para exibição local no input
const formatarDataParaExibicao = (dataUTC: string): string => {
  if (!dataUTC) return ''
  
  const dataObj = new Date(dataUTC)
  
  const ano = dataObj.getFullYear()
  const mes = String(dataObj.getMonth() + 1).padStart(2, '0')
  const dia = String(dataObj.getDate()).padStart(2, '0')
  const horas = String(dataObj.getHours()).padStart(2, '0')
  const minutos = String(dataObj.getMinutes()).padStart(2, '0')
  
  return `${ano}-${mes}-${dia}T${horas}:${minutos}`
}

// Para exibir nas listas (já no horário local)
const formatarDataParaExibicaoLista = (dataUTC: string): string => {
  if (!dataUTC) return ''
  const dataObj = new Date(dataUTC)
  return dataObj.toLocaleString('pt-BR')
}

// Componente de input com minutos limitados a 0 e 30
const DateTimeLocalInput = ({ 
  value, 
  onChange, 
  label,
  required = false
}: { 
  value: string, 
  onChange: (value: string) => void, 
  label: string,
  required?: boolean
}) => {
  const [dateValue, setDateValue] = useState('')
  const [timeValue, setTimeValue] = useState('')

  useEffect(() => {
    if (value) {
      const [datePart, timePart] = value.split('T')
      setDateValue(datePart || '')
      if (timePart) {
        const [hours, minutes] = timePart.split(':')
        // Arredondar para 0 ou 30 minutos
        const roundedMinutes = parseInt(minutes) < 15 ? '00' : '30'
        setTimeValue(`${hours}:${roundedMinutes}`)
      }
    }
  }, [value])

  const handleDateTimeChange = (date: string, time: string) => {
    if (date && time) {
      onChange(`${date}T${time}`)
    } else if (date) {
      onChange(`${date}T00:00`)
    } else {
      onChange('')
    }
  }

  // Gerar opções de horário (00:00, 00:30, 01:00, 01:30, ..., 23:00, 23:30)
  const timeOptions = []
  for (let hora = 0; hora < 24; hora++) {
    const horaStr = String(hora).padStart(2, '0')
    timeOptions.push({ hora: horaStr, minuto: '00', label: `${horaStr}:00` })
    timeOptions.push({ hora: horaStr, minuto: '30', label: `${horaStr}:30` })
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-gray-700">
        {label} {required && '*'}
      </label>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={dateValue}
          onChange={(e) => handleDateTimeChange(e.target.value, timeValue)}
          className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
          required={required}
        />
        <select
          value={timeValue}
          onChange={(e) => handleDateTimeChange(dateValue, e.target.value)}
          className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
        >
          <option value="">Selecione horário</option>
          {timeOptions.map(({ hora, minuto, label }) => (
            <option key={`${hora}:${minuto}`} value={`${hora}:${minuto}`}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default function AcoesPage() {
  const supabase = createClient()
  const [acoes, setAcoes] = useState<Acao[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [tiposAcoes, setTiposAcoes] = useState<TipoAcao[]>([])
  const [userPerfilId, setUserPerfilId] = useState<string | null>(null)
  const [userNome, setUserNome] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userSetoresIds, setUserSetoresIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editandoAcao, setEditandoAcao] = useState<Acao | null>(null)
  const [formExpandido, setFormExpandido] = useState(true)
  const [setorSelecionado, setSetorSelecionado] = useState<string | null>(null)
  const [setorConfirmado, setSetorConfirmado] = useState(false)
  const [mostrarListaAcoes, setMostrarListaAcoes] = useState(false)
  const [animacaoPulse, setAnimacaoPulse] = useState(true)
  
  // --- Estado do Formulário ---
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

  // Buscar perfil do usuário atual
  const getCurrentUserPerfil = async (): Promise<string | null> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error("❌ Erro ao buscar usuário:", userError)
        throw userError
      }
      if (!user) {
        console.log("❌ Nenhum usuário logado")
        return null
      }
      
      console.log("✅ Usuário logado:", user.email)
      console.log("📋 User ID:", user.id)
      
      const { data: perfil, error: perfilError } = await supabase
        .from('perfis')
        .select('id, nome')
        .eq('email', user.email)
        .single()
      
      let perfilId = null
      let perfilNome = ''
      
      if (perfilError) {
        console.error("❌ Erro ao buscar perfil:", perfilError)
        if (perfilError.code === 'PGRST116') {
          console.log("📝 Perfil não encontrado, criando novo perfil...")
          const novoPerfil = {
            id: user.id,
            nome: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
            email: user.email
          }
          
          const { data: novoPerfilData, error: createError } = await supabase
            .from('perfis')
            .insert([novoPerfil])
            .select('id, nome')
            .single()
          
          if (createError) {
            console.error("❌ Erro ao criar perfil:", createError)
            throw createError
          }
          
          if (novoPerfilData) {
            console.log("✅ Perfil criado:", novoPerfilData)
            perfilId = novoPerfilData.id
            perfilNome = novoPerfilData.nome
          }
        } else {
          throw perfilError
        }
      }
      
      if (perfil) {
        console.log("✅ Perfil encontrado:", perfil)
        perfilId = perfil.id
        perfilNome = perfil.nome
      }
      
      if (perfilId) {
        setUserPerfilId(perfilId)
        setUserNome(perfilNome)
        return perfilId
      }
      return null
    } catch (error) {
      console.error("❌ Erro ao buscar/criar perfil:", error)
      return null
    }
  }

  // Carregar dados do usuário atual
  const loadUserData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error("Usuário não está logado")
      
      setUserEmail(user.email || '')
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error)
      setError("Erro ao carregar dados do usuário")
    }
  }

  // Buscar setores do usuário
  const findUserSetores = async (perfilId: string) => {
    if (!perfilId) {
      console.log("❌ perfilId é null, não é possível buscar setores")
      return []
    }
    
    console.log("🔍 Buscando setores para o perfil ID:", perfilId)
    
    try {
      const { data: setoresData, error } = await supabase
        .from('setores')
        .select('*')
      
      if (error) {
        console.error("❌ Erro ao buscar setores:", error)
        throw error
      }
      
      const setoresDoUsuario = setoresData?.filter(setor => {
        const pessoasSetor = setor.pessoas || []
        return pessoasSetor.includes(perfilId)
      }) || []
      
      console.log(`📊 Total de setores encontrados para o usuário: ${setoresDoUsuario.length}`)
      
      const setoresIds = setoresDoUsuario.map(s => s.id)
      setUserSetoresIds(setoresIds)
      console.log("📋 Setores IDs do usuário:", setoresIds)
      
      return setoresIds
    } catch (error) {
      console.error("❌ Erro ao buscar setores do usuário:", error)
      return []
    }
  }

  const fetchTiposAcoes = async () => {
    try {
      const { data: tiposData, error } = await supabase
        .from('tipo_acao')
        .select('*')
      
      if (error) throw error
      setTiposAcoes(tiposData || [])
    } catch (error) {
      console.error("Erro ao carregar tipos de ação:", error)
    }
  }

  const fetchSetores = async () => {
    try {
      const { data: setoresData, error } = await supabase
        .from('setores')
        .select('*')
      
      if (error) throw error
      setSetores(setoresData || [])
    } catch (error) {
      console.error("Erro ao carregar setores:", error)
    }
  }

  const fetchAcoes = async () => {
    try {
      if (!userSetoresIds.length) {
        setAcoes([])
        return
      }
      
      const { data: acoesData, error } = await supabase
        .from('acoes')
        .select('*')
        .in('setor_id', userSetoresIds)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setAcoes(acoesData || [])
    } catch (error) {
      console.error("Erro ao carregar ações:", error)
      setAcoes([])
    }
  }

  const fetchUsuariosDoSetor = async () => {
    if (!userSetoresIds.length) {
      setUsuarios([])
      return
    }
    
    const setorIdParaBuscar = userSetoresIds[0]
    
    try {
      const { data: setorData, error: setorError } = await supabase
        .from('setores')
        .select('pessoas')
        .eq('id', setorIdParaBuscar)
        .maybeSingle()
      
      if (setorError) throw setorError
      
      const usuariosIds = setorData?.pessoas || []
      if (!usuariosIds.length) {
        setUsuarios([])
        return
      }
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('perfis')
        .select('*')
        .in('id', usuariosIds)
        .order('nome', { ascending: true })
      
      if (profilesError) throw profilesError
      setUsuarios(profilesData || [])
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
      setUsuarios([])
    }
  }

  // Inicialização
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      setError(null)
      
      console.log("🚀 Iniciando carregamento de dados...")
      
      const perfilId = await getCurrentUserPerfil()
      console.log("📌 Perfil ID obtido:", perfilId)
      
      await loadUserData()
      await fetchSetores()
      await fetchTiposAcoes()
      
      if (perfilId) {
        console.log("🔍 Buscando setores para o perfil ID:", perfilId)
        await findUserSetores(perfilId)
      } else {
        console.log("❌ Perfil ID não encontrado, não é possível buscar setores")
      }
      
      console.log("✅ Carregamento concluído")
      setLoading(false)
      
      setTimeout(() => {
        setAnimacaoPulse(false)
      }, 5000)
    }
    
    init()
  }, [])

  // Carregar ações e usuários quando os setores do usuário estiverem disponíveis
  useEffect(() => {
    if (userPerfilId && userSetoresIds.length > 0) {
      fetchAcoes()
      fetchUsuariosDoSetor()
    }
  }, [userPerfilId, userSetoresIds])

  const resetForm = () => {
    setEditandoAcao(null)
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
    setSetorSelecionado(null)
    setSetorConfirmado(false)
  }

  const carregarParaEdicao = (acao: Acao) => {
    setEditandoAcao(acao)
    setDescricao(acao.descricao || '')
    setPessoas(acao.pessoas || [])
    setSetoresSelecionados(acao.setores_envolvidos || [])
    setTipoAcaoId(acao.tipo_acao_id || '')
    setLocal(acao.local || '')
    setDataInicio(formatarDataParaExibicao(acao.data_inicio || ''))
    setDataFim(formatarDataParaExibicao(acao.data_fim || ''))
    setNecessitaTransporte(acao.necessita_transporte || false)
    setStatus(acao.status || 'Pendente')
    setDadosExtras(acao.dados_extras || {})
    setSetorSelecionado(acao.setor_id || null)
    setSetorConfirmado(true)
    setFormExpandido(true)
  }

  const handleSetorConfirm = () => {
    if (setorSelecionado) {
      setSetorConfirmado(true)
    }
  }

  const handleTipoAcaoChange = (tipoId: string) => {
    setTipoAcaoId(tipoId)
    setDadosExtras({})
  }

  const tipoAcaoSelecionado = tiposAcoes.find(ta => ta.id === tipoAcaoId)

  const tiposAcoesDisponiveis = tiposAcoes.filter(ta => {
    if (!setorConfirmado || !setorSelecionado) return false
    return ta.setores_ids?.includes(setorSelecionado)
  })

  const salvarAcao = async () => {
    if (!setorConfirmado || !setorSelecionado) {
      alert("Selecione e confirme um setor primeiro")
      return
    }
    
    if (!tipoAcaoId) {
      alert("Selecione o Tipo de Ação")
      return
    }

    try {
      // Converter datas para UTC antes de salvar
      const dataInicioFormatada = formatarDataParaBanco(dataInicio)
      const dataFimFormatada = formatarDataParaBanco(dataFim)
      
      console.log("📅 Datas:")
      console.log("  Data Início (local input):", dataInicio)
      console.log("  Data Início (UTC para banco):", dataInicioFormatada)
      console.log("  Data Fim (local input):", dataFim)
      console.log("  Data Fim (UTC para banco):", dataFimFormatada)

      const dados = {
        descricao,
        pessoas,
        setores_envolvidos: setoresSelecionados,
        tipo_acao_id: tipoAcaoId,
        setor_id: setorSelecionado,
        created_by: userPerfilId,
        local,
        data_inicio: dataInicioFormatada || null,
        data_fim: dataFimFormatada || null,
        necessita_transporte: necessitaTransporte,
        status,
        dados_extras: dadosExtras,
        updated_at: new Date().toISOString(),
        updated_by: userPerfilId
      }

      console.log("📦 Dados a serem salvos:", dados)

      let error
      if (editandoAcao) {
        const result = await supabase
          .from('acoes')
          .update({
            ...dados,
            updated_at: new Date().toISOString(),
            updated_by: userPerfilId
          })
          .eq('id', editandoAcao.id)
        error = result.error
      } else {
        const result = await supabase
          .from('acoes')
          .insert([dados])
        error = result.error
      }

      if (error) {
        console.error("❌ Erro do Supabase:", error)
        throw error
      }

      console.log("✅ Ação salva com sucesso!")
      resetForm()
      fetchAcoes()
      fetchUsuariosDoSetor()
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao salvar ação: " + (error as Error).message)
    }
  }

  const deleteAcao = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta ação?")) return
    try {
      const { error } = await supabase
        .from('acoes')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchAcoes()
    } catch (error) {
      console.error("Erro ao deletar:", error)
      alert("Erro ao deletar ação")
    }
  }

  const togglePessoa = (nomePessoa: string) => {
    setPessoas((prev) => 
      prev.includes(nomePessoa) 
        ? prev.filter(p => p !== nomePessoa)
        : [...prev, nomePessoa]
    )
  }

  const toggleSetor = (setorId: string) => {
    setSetoresSelecionados((prev) => 
      prev.includes(setorId) 
        ? prev.filter(id => id !== setorId)
        : [...prev, setorId]
    )
  }

  const renderizarCampoExtra = (param: ParametroExtra) => {
    const valor = dadosExtras[param.label] ?? ''
    const atualizarValor = (novoValor: any) => {
      setDadosExtras(prev => ({ ...prev, [param.label]: novoValor }))
    }

    switch (param.tipo) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={param.label}
            value={valor}
            onChange={(e) => atualizarValor(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
          />
        )
      case 'number':
        return (
          <input
            type="number"
            placeholder={param.label}
            value={valor}
            onChange={(e) => atualizarValor(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
          />
        )
      case 'boolean':
        return (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => atualizarValor(true)}
              className={`px-4 py-2 rounded-lg border ${
                valor === true ? 'bg-[#7114dd] text-white' : 'bg-white text-gray-700'
              }`}
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() => atualizarValor(false)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                valor === false 
                  ? 'bg-[#ffa301] text-[#7114dd] border-[#ffa301]' 
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              Não
            </button>
          </div>
        )
      case 'select':
        return (
          <select
            value={valor}
            onChange={(e) => atualizarValor(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
          >
            <option value="">Selecione...</option>
            {param.opcoes?.map(op => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        )
      case 'multiselect':
        const valoresSelecionados = Array.isArray(valor) ? valor : []
        return (
          <div className="border rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">{param.label}</p>
            <div className="space-y-1">
              {param.opcoes?.map(op => (
                <label key={op} className="flex items-center gap-2 cursor-pointer">
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
                  />
                  <span className="text-sm">{op}</span>
                </label>
              ))}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const getTipoAcaoNome = (tipoAcaoId?: string) => {
    const tipo = tiposAcoes.find(t => t.id === tipoAcaoId)
    return tipo?.nome || 'Sem tipo'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Realizada':
        return 'bg-green-100 text-green-700'
      case 'Cancelada':
        return 'bg-red-100 text-red-700'
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-700'
      case 'Realizada Parcialmente':
        return 'bg-blue-100 text-blue-700'
      case 'Reagendada':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const renderSetorSelector = () => {
    const setoresDisponiveis = setores.filter(s => userSetoresIds.includes(s.id))

    if (setoresDisponiveis.length === 0 && !editandoAcao) return null

    return (
      <div className={`mb-6 p-5 rounded-xl border-2 transition-all ${
        !setorConfirmado 
          ? 'border-[#ffa301] bg-linear-to-r from-[#ffa301]/20 to-[#ffa301]/5 shadow-lg shadow-[#ffa301]/20' 
          : 'border-green-200 bg-green-50'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-gray-700">
            <Building2 size={18} className="inline mr-2 text-[#ffa301]" />
            Setor Responsável *
          </label>
          {setorConfirmado && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle size={12} /> Confirmado
            </span>
          )}
        </div>
        
        {!setorConfirmado ? (
          <>
            <div className="relative text-slate-700">
              <select
                value={setorSelecionado || ''}
                onChange={(e) => setSetorSelecionado(e.target.value)}
                className={`w-full p-4 border-2 border-[#ffa301] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffa301] mb-3 text-base bg-white ${
                  animacaoPulse ? 'animate-pulse' : ''
                }`}
                style={{ borderWidth: '2px' }}
              >
                <option value="">🏢 Selecione um setor para continuar</option>
                {setoresDisponiveis.map(setor => (
                  <option key={setor.id} value={setor.id}>
                    🏢 {setor.nome}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#ffa301] pointer-events-none" size={20} />
            </div>
            
            <button
              onClick={handleSetorConfirm}
              disabled={!setorSelecionado}
              className={`w-full bg-linear-to-r from-[#ffa301] to-[#ffa301]/80 text-[#7114dd] font-bold px-6 py-3 rounded-xl hover:from-[#ffa301] hover:to-[#ffa301] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                setorSelecionado ? 'hover:scale-[1.02]' : ''
              }`}
            >
              <CheckCircle size={18} className="inline mr-2" />
              Confirmar Setor
            </button>
            
            <div className="mt-3 p-3 bg-[#ffa301]/10 rounded-lg border border-[#ffa301]/30">
              <p className="text-sm text-[#7114dd] flex items-center gap-2">
                <AlertCircle size={16} />
                <span className="font-medium">Atenção:</span> Selecione o setor responsável para continuar com o cadastro da ação
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#7114dd]/10 rounded-xl flex items-center justify-center">
                <Building2 size={24} className="text-[#7114dd]" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">
                  {setores.find(s => s.id === setorSelecionado)?.nome}
                </p>
                <p className="text-xs text-gray-500">Setor responsável pela ação</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSetorConfirmado(false)
                setSetorSelecionado(null)
                setTipoAcaoId('')
              }}
              className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition"
            >
              Alterar setor
            </button>
          </div>
        )}
      </div>
    )
  }

  const pendentesCount = acoes.filter(a => a.status === 'Pendente' || a.status === 'Reagendada').length
  const realizadasCount = acoes.filter(a => a.status === 'Realizada' || a.status === 'Realizada Parcialmente' || a.status === 'Cancelada').length

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#7114dd]/10 to-[#a94dff]/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7114dd] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#7114dd]/10 to-[#a94dff]/10 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erro</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#7114dd] text-white px-6 py-2 rounded-lg hover:bg-[#a94dff] transition"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }
  
  if (userSetoresIds.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#7114dd]/10 to-[#a94dff]/10 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Acesso Restrito</h2>
          <p className="text-gray-600 mb-4">
            Você não está vinculado a nenhum setor.
          </p>
          <p className="text-sm text-gray-500">
            Entre em contato com o administrador para ser adicionado a um setor.
          </p>
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-left">
            <p className="text-xs font-mono">
              Seu ID: {userPerfilId || 'Não carregado'}<br/>
              Email: {userEmail}<br/>
              Nome: {userNome}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const setoresDoUsuario = setores.filter(s => userSetoresIds.includes(s.id))

  return (
    <div className="min-h-screen text-slate-700 bg-linear-to-br from-[#7114dd]/10 to-[#a94dff]/10 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Gerenciamento de Ações
              </h1>
              <p className="text-gray-500 mt-1">
                Olá, {userNome}!
                {setoresDoUsuario.length > 0 && (
                  <span> • Setor(es): {setoresDoUsuario.map(s => s.nome).join(', ')}</span>
                )}
              </p>
            </div>
            <button
              onClick={() => {
                resetForm()
                setFormExpandido(!formExpandido)
                setMostrarListaAcoes(false)
              }}
              className="flex items-center gap-2 bg-[#7114dd] text-white px-4 py-2 rounded-lg hover:bg-[#a94dff] transition shadow-md"
            >
              <Plus size={20} />
              {formExpandido ? 'Fechar Formulário' : 'Nova Ação'}
            </button>
          </div>
        </div>

        {/* Formulário */}
        {formExpandido && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editandoAcao ? 'Editar Ação' : 'Criar Nova Ação'}
              </h2>
              {editandoAcao && (
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
                >
                  <X size={16} /> Cancelar edição
                </button>
              )}
            </div>

            <div className="space-y-4">
              {renderSetorSelector()}

              {/* Campos condicionais - só aparecem após confirmar o setor */}
              {setorConfirmado && (
                <>
                  {/* Tipo de Ação */}
                  <div className="text-slate-700">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Tipo de Ação *
                    </label>
                    <select
                      value={tipoAcaoId}
                      onChange={(e) => handleTipoAcaoChange(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
                      required
                    >
                      <option value="">Selecione um tipo de ação</option>
                      {tiposAcoesDisponiveis.map((ta) => (
                        <option key={ta.id} value={ta.id}>
                          {ta.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      placeholder="Descreva os detalhes da ação..."
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      rows={3}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
                    />
                  </div>

                  {/* Campos Padrão */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <MapPin size={18} className="inline mr-1" />
                        Local (Escola)
                      </label>
                      <select
                        value={local}
                        onChange={(e) => setLocal(e.target.value)}
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
                      >
                        <option value="">Selecione uma escola</option>
                        {ESCOLAS_OPCOES.map(escola => (
                          <option key={escola} value={escola}>{escola}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7114dd]"
                      >
                        {STATUS_OPCOES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Campos de data com minutos restritos */}
                    <DateTimeLocalInput
                      value={dataInicio}
                      onChange={setDataInicio}
                      label="Data de Início"
                    />

                    <DateTimeLocalInput
                      value={dataFim}
                      onChange={setDataFim}
                      label="Data de Término"
                    />

                    <div className="flex items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={necessitaTransporte}
                          onChange={(e) => setNecessitaTransporte(e.target.checked)}
                          className="rounded accent-[#7114dd]"
                        />
                        <Car size={22} className="text-[#7114dd]" />
                        <span className="text-sm font-medium text-[#7114dd]">Necessita Transporte</span>
                      </label>
                    </div>
                  </div>

                  {/* Campos Personalizados */}
                  {tipoAcaoSelecionado && tipoAcaoSelecionado.parametros_extras.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Plus size={16} className="text-[#7114dd]" />
                        Campos Específicos
                      </h3>
                      <div className="space-y-3">
                        {tipoAcaoSelecionado.parametros_extras.map((param) => (
                          <div key={param.id}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {param.label}
                            </label>
                            {renderizarCampoExtra(param)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Setores Envolvidos */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      <Building2 size={16} className="inline mr-1" />
                      Setores Envolvidos
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {setores.map((setor) => (
                        <button
                          key={setor.id}
                          type="button"
                          onClick={() => toggleSetor(setor.id)}
                          className={`px-3 py-1.5 rounded-full text-sm transition ${
                            setoresSelecionados.includes(setor.id)
                              ? "bg-[#7114dd] text-white shadow-md" 
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          🏢 {setor.nome}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pessoas Envolvidas */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      <Users size={16} className="inline mr-1" />
                      Pessoas Envolvidas
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {usuarios.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => togglePessoa(user.nome)}
                          className={`px-3 py-1.5 rounded-full text-sm transition ${
                            pessoas.includes(user.nome)
                              ? "bg-[#ffa301] text-[#7114dd] shadow-md" 
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          👤 {user.nome}
                        </button>
                      ))}
                      {usuarios.length === 0 && (
                        <p className="text-gray-500 text-sm">Nenhuma pessoa encontrada neste setor</p>
                      )}
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={salvarAcao}
                      disabled={!tipoAcaoId}
                      className="flex-1 bg-[#7114dd] text-white px-6 py-3 rounded-lg hover:bg-[#a94dff] transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
                    >
                      {editandoAcao ? 'Atualizar Ação' : 'Criar Ação'}
                    </button>
                    <button 
                      onClick={resetForm}
                      className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
                    >
                      Limpar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Botão para mostrar/ocultar lista de ações */}
        {acoes.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setMostrarListaAcoes(!mostrarListaAcoes)}
              className="w-full flex items-center justify-between bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#7114dd]/10 rounded-full flex items-center justify-center">
                  <List size={20} className="text-[#7114dd]" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">Ações Cadastradas</h3>
                  <p className="text-sm text-gray-500">
                    {pendentesCount} pendente{pendentesCount !== 1 ? 's' : ''} • {realizadasCount} realizada{realizadasCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[#7114dd]">
                <span className="text-sm font-medium">
                  {mostrarListaAcoes ? 'Ocultar' : 'Visualizar'}
                </span>
                {mostrarListaAcoes ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
          </div>
        )}

        {/* Lista de Ações */}
        {mostrarListaAcoes && acoes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-[#7114dd]" />
              Lista de Ações
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({acoes.length} {acoes.length === 1 ? 'ação' : 'ações'})
              </span>
            </h2>
            <div className="space-y-4">
              {acoes.map((acao) => {
                const setorDaAcao = setores.find(s => s.id === acao.setor_id)
                const setoresEnvolvidos = setores.filter(s => acao.setores_envolvidos?.includes(s.id))
                const tipoAcao = tiposAcoes.find(t => t.id === acao.tipo_acao_id)
                
                return (
                  <div key={acao.id} className="border rounded-xl p-5 hover:shadow-md transition bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {/* Cabeçalho */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <h3 className="font-bold text-lg text-gray-800">
                            {getTipoAcaoNome(acao.tipo_acao_id)} - {new Date(acao.created_at).toLocaleDateString('pt-BR')}
                          </h3>
                          <span className="text-xs bg-[#7114dd]/10 text-[#7114dd] px-2 py-1 rounded-full">
                            {getTipoAcaoNome(acao.tipo_acao_id)}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(acao.status || 'Pendente')}`}>
                            {acao.status}
                          </span>
                          {setorDaAcao && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              🏢 {setorDaAcao.nome}
                            </span>
                          )}
                        </div>
                        
                        {/* Descrição */}
                        {acao.descricao && (
                          <p className="text-gray-600 mb-3">{acao.descricao}</p>
                        )}
                        
                        {/* Local e Datas - usando formatação local */}
                        <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-500">
                          {acao.local && (
                            <span className="flex items-center gap-1">
                              <MapPin size={14} /> {acao.local}
                            </span>
                          )}
                          {acao.data_inicio && (
                            <span className="flex items-center gap-1">
                              <Calendar size={14} /> 
                              Início: {formatarDataParaExibicaoLista(acao.data_inicio)}
                            </span>
                          )}
                          {acao.data_fim && (
                            <span className="flex items-center gap-1">
                              <Calendar size={14} /> 
                              Término: {formatarDataParaExibicaoLista(acao.data_fim)}
                            </span>
                          )}
                          {acao.necessita_transporte && (
                            <span className="flex items-center gap-1 text-amber-600">
                              <Truck size={14} /> Necessita Transporte
                            </span>
                          )}
                        </div>

                        {/* Setores Envolvidos */}
                        {setoresEnvolvidos.length > 0 && (
                          <div className="mt-3 mb-2">
                            <p className="text-xs font-semibold text-gray-500 mb-2">Setores Envolvidos:</p>
                            <div className="flex flex-wrap gap-2">
                              {setoresEnvolvidos.map(setor => (
                                <span key={setor.id} className="text-xs bg-[#7114dd]/10 text-[#7114dd] px-2 py-1 rounded-full">
                                  🏢 {setor.nome}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Campos Personalizados */}
                        {acao.dados_extras && Object.keys(acao.dados_extras).length > 0 && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs font-semibold text-gray-500 mb-2">Informações Específicas:</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(acao.dados_extras).map(([key, valor]) => {
                                if (!valor) return null
                                const valorExibido = Array.isArray(valor) ? valor.join(', ') : 
                                                     typeof valor === 'boolean' ? (valor ? 'Sim' : 'Não') : valor
                                return (
                                  <span key={key} className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                                    {key}: {valorExibido}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Observações */}
                        {acao.observacoes && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                            <p className="text-xs font-semibold text-gray-500 mb-1">Observações:</p>
                            <p className="text-sm text-gray-600">{acao.observacoes}</p>
                          </div>
                        )}
                        
                        {/* Pessoas Envolvidas */}
                        {acao.pessoas && acao.pessoas.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {acao.pessoas.map((pessoa, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                👤 {pessoa}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Datas de criação e atualização */}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-3">
                          <span>
                            Criado em: {new Date(acao.created_at).toLocaleString('pt-BR')}
                          </span>
                          {acao.updated_at && acao.updated_at !== acao.created_at && (
                            <span>
                              Atualizado em: {new Date(acao.updated_at).toLocaleString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2 ml-4">
                        <button 
                          onClick={() => carregarParaEdicao(acao)}
                          className="p-2 text-gray-500 hover:text-[#7114dd] hover:bg-[#7114dd]/10 rounded-lg transition"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => deleteAcao(acao.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {acoes.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">Nenhuma ação encontrada.</p>
            <p className="text-sm text-gray-400 mt-2">Clique em "Nova Ação" para criar sua primeira ação!</p>
          </div>
        )}
      </div>
    </div>
  )
}