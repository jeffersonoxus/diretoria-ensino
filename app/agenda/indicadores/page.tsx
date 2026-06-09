'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import {
  TrendingUp, TrendingDown, Users, BookOpen, AlertTriangle,
  BarChart3, Target, Eye
} from 'lucide-react'

// ==================== DADOS SIMULADOS ====================

const ESCOLAS = [
  { id: '1', nome: 'EMEB Dr. Gustavo Paiva', bairro: 'Centro' },
  { id: '2', nome: 'EMEB Marieta Leão', bairro: 'Mangabeira' },
  { id: '3', nome: 'EMEF Dr. Gastão Oiticica', bairro: 'Jardim' },
  { id: '4', nome: 'EMEF Manoel Gonçalves da Silva', bairro: 'Boa Vista' },
  { id: '5', nome: 'EMEF Rosineide Teresa', bairro: 'Canuto' },
]

const ETAPAS = ['Anos Iniciais', 'Anos Finais', 'EJA']

const CORES = {
  municipal: '#7114dd',
  municipal_sec: '#ffa301',
  municipal_ter: '#24cffd',
  estadual: '#2563eb',
  estadual_sec: '#dc2626',
  nacional: '#16a34a',
  nacional_sec: '#f59e0b',
  insuficiente: '#ef4444',
  basico: '#f59e0b',
  proficiente: '#22c55e',
  avancado: '#3b82f6',
}

interface IndicadorEscola {
  nome: string
  aprovacao: number
  reproducao: number
  abandono: number
  distorcao: number
  ideb: number
  nota_port: number
  nota_mat: number
  prof_pt: number
  prof_mat: number
}

const DADOS_ESCOLAS: IndicadorEscola[] = [
  { nome: 'EMEB Dr. Gustavo Paiva', aprovacao: 92.4, reproducao: 5.8, abandono: 1.8, distorcao: 12.3, ideb: 5.2, nota_port: 215.6, nota_mat: 218.3, prof_pt: 48.2, prof_mat: 45.6 },
  { nome: 'EMEB Marieta Leão', aprovacao: 88.7, reproducao: 8.2, abandono: 3.1, distorcao: 18.7, ideb: 4.8, nota_port: 208.4, nota_mat: 205.7, prof_pt: 41.5, prof_mat: 38.9 },
  { nome: 'EMEF Dr. Gastão Oiticica', aprovacao: 94.1, reproducao: 4.3, abandono: 1.6, distorcao: 9.8, ideb: 5.5, nota_port: 221.3, nota_mat: 224.8, prof_pt: 52.6, prof_mat: 50.1 },
  { nome: 'EMEF Manoel Gonçalves', aprovacao: 85.2, reproducao: 10.5, abandono: 4.3, distorcao: 22.1, ideb: 4.3, nota_port: 198.7, nota_mat: 195.2, prof_pt: 36.8, prof_mat: 33.4 },
  { nome: 'EMEF Rosineide Teresa', aprovacao: 90.8, reproducao: 6.7, abandono: 2.5, distorcao: 14.5, ideb: 5.0, nota_port: 212.1, nota_mat: 209.6, prof_pt: 44.9, prof_mat: 42.3 },
]

const IDEB_HISTORICO = [
  { ano: '2017', municipal: 4.1, estadual: 4.3, nacional: 5.0 },
  { ano: '2019', municipal: 4.4, estadual: 4.6, nacional: 5.2 },
  { ano: '2021', municipal: 4.6, estadual: 4.8, nacional: 5.3 },
  { ano: '2023', municipal: 4.9, estadual: 5.0, nacional: 5.5 },
  { ano: '2025', municipal: 5.1, estadual: 5.2, nacional: 5.6 },
]

const IDEB_META = [
  { ano: '2017', municipal: 4.1, meta: 4.1 },
  { ano: '2019', municipal: 4.4, meta: 4.5 },
  { ano: '2021', municipal: 4.6, meta: 4.9 },
  { ano: '2023', municipal: 4.9, meta: 5.2 },
  { ano: '2025', municipal: 5.1, meta: 5.5 },
]

const SAEB_POR_ETAPA = [
  { etapa: 'Anos Iniciais', portugues: 215.4, matematica: 218.7, estadual_pt: 208.2, nacional_pt: 220.1, estadual_mat: 210.5, nacional_mat: 222.3 },
  { etapa: 'Anos Finais', portugues: 248.6, matematica: 245.3, estadual_pt: 241.0, nacional_pt: 255.4, estadual_mat: 238.2, nacional_mat: 252.8 },
  { etapa: 'EJA', portugues: 198.3, matematica: 195.1, estadual_pt: 192.0, nacional_pt: 205.6, estadual_mat: 189.4, nacional_mat: 202.1 },
]

const SAEB_PT_COMPARATIVO = [
  { etapa: 'Anos Iniciais', rio_largo: 215.4, alagoas: 208.2, brasil: 220.1 },
  { etapa: 'Anos Finais', rio_largo: 248.6, alagoas: 241.0, brasil: 255.4 },
  { etapa: 'EJA', rio_largo: 198.3, alagoas: 192.0, brasil: 205.6 },
]

const SAEB_MAT_COMPARATIVO = [
  { etapa: 'Anos Iniciais', rio_largo: 218.7, alagoas: 210.5, brasil: 222.3 },
  { etapa: 'Anos Finais', rio_largo: 245.3, alagoas: 238.2, brasil: 252.8 },
  { etapa: 'EJA', rio_largo: 195.1, alagoas: 189.4, brasil: 202.1 },
]

const RENDIMENTO_POR_ETAPA = [
  { etapa: 'Anos Iniciais', aprovacao: 93.5, reproducao: 4.8, abandono: 1.7, distorcao: 8.2 },
  { etapa: 'Anos Finais', aprovacao: 87.2, reproducao: 9.6, abandono: 3.2, distorcao: 19.5 },
  { etapa: 'EJA', aprovacao: 76.8, reproducao: 12.4, abandono: 10.8, distorcao: 35.2 },
]

const DISTRIBUICAO_NIVEIS_SAEB = [
  { nivel: 'Insuficiente', pt: 22.5, mat: 25.8, cor: CORES.insuficiente },
  { nivel: 'Básico', pt: 34.2, mat: 32.6, cor: CORES.basico },
  { nivel: 'Proficiente', pt: 28.6, mat: 27.4, cor: CORES.proficiente },
  { nivel: 'Avançado', pt: 14.7, mat: 14.2, cor: CORES.avancado },
]

const ESCOLAS_IDEB = ESCOLAS.map(e => {
  const dados = DADOS_ESCOLAS.find(d => d.nome.includes(e.nome.split(' - ')[0]?.split('(')[0]?.trim() || ''))
  return {
    nome: e.nome.split(' - ')[0],
    ideb: dados?.ideb || 0,
    meta: (dados?.ideb || 0) + 0.4,
  }
})

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
  if (!active || !payload) return null
  return (
    <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100 text-sm">
      <p className="font-semibold text-gray-800 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-bold">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function IndicadoresPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loadingAcesso, setLoadingAcesso] = useState(true)

  useEffect(() => {
    const verificarAcesso = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      const { data: perfil } = await supabase
        .from('perfis')
        .select('id, nivel_acesso')
        .eq('email', user.email)
        .single()

      if (perfil) {
        const temAcessoAmplo = perfil.nivel_acesso === 'gerencial' || perfil.nivel_acesso === 'diretivo' || perfil.nivel_acesso === 'administrativo'

        if (!temAcessoAmplo) {
          const { data: setores } = await supabase
            .from('setores')
            .select('id')
            .contains('pessoas', [perfil.id])

          if (!setores || setores.length === 0) {
            router.push('/agenda/perfil')
            return
          }
        }
      }

      setLoadingAcesso(false)
    }
    verificarAcesso()
  }, [])

  const [etapaFiltro, setEtapaFiltro] = useState('todas')
  const [escolaFiltro, setEscolaFiltro] = useState('todas')
  const [expandirDetalhes, setExpandirDetalhes] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState<'rendimento' | 'ideb' | 'saeb' | 'comparativo'>('rendimento')

  const dadosEscolaFiltrada = useMemo(() => {
    if (escolaFiltro === 'todas') return DADOS_ESCOLAS
    return DADOS_ESCOLAS.filter(e => e.nome.includes(escolaFiltro))
  }, [escolaFiltro])

  const mediasMunicipais = useMemo(() => {
    const total = DADOS_ESCOLAS.length
    return {
      aprovacao: DADOS_ESCOLAS.reduce((s, e) => s + e.aprovacao, 0) / total,
      reproducao: DADOS_ESCOLAS.reduce((s, e) => s + e.reproducao, 0) / total,
      abandono: DADOS_ESCOLAS.reduce((s, e) => s + e.abandono, 0) / total,
      distorcao: DADOS_ESCOLAS.reduce((s, e) => s + e.distorcao, 0) / total,
      ideb: DADOS_ESCOLAS.reduce((s, e) => s + e.ideb, 0) / total,
      prof_pt: DADOS_ESCOLAS.reduce((s, e) => s + e.prof_pt, 0) / total,
      prof_mat: DADOS_ESCOLAS.reduce((s, e) => s + e.prof_mat, 0) / total,
    }
  }, [])

  const dadosRendimento = useMemo(() => {
    if (etapaFiltro === 'todas') return RENDIMENTO_POR_ETAPA
    return RENDIMENTO_POR_ETAPA.filter(r => r.etapa === etapaFiltro)
  }, [etapaFiltro])

  const etapaSelecionada = etapaFiltro === 'todas' ? null : etapaFiltro

  if (loadingAcesso) return null

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Indicadores Educacionais</h1>
          <p className="text-gray-500 text-sm mt-1">
            Rio Largo - AL • Dados simulados para demonstração
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={escolaFiltro}
            onChange={(e) => setEscolaFiltro(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
          >
            <option value="todas">Todas as escolas</option>
            {ESCOLAS.map(e => (
              <option key={e.id} value={e.nome.split(' - ')[0]}>{e.nome}</option>
            ))}
          </select>
          <select
            value={etapaFiltro}
            onChange={(e) => setEtapaFiltro(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
          >
            <option value="todas">Todas as etapas</option>
            {ETAPAS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Aprovação</span>
            <TrendingUp size={16} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{mediasMunicipais.aprovacao.toFixed(1)}%</p>
          <p className="text-xs text-green-600 mt-1">Média da rede</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Reprovação</span>
            <TrendingDown size={16} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{mediasMunicipais.reproducao.toFixed(1)}%</p>
          <p className="text-xs text-red-600 mt-1">Média da rede</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Abandono</span>
            <AlertTriangle size={16} className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{mediasMunicipais.abandono.toFixed(1)}%</p>
          <p className="text-xs text-orange-600 mt-1">Média da rede</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Distorção Idade-Série</span>
            <Users size={16} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{mediasMunicipais.distorcao.toFixed(1)}%</p>
          <p className="text-xs text-purple-600 mt-1">Média da rede</p>
        </div>
      </div>

      {/* Abas de navegação */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'rendimento', label: 'Rendimento', icon: BookOpen },
          { id: 'ideb', label: 'IDEB', icon: Target },
          { id: 'saeb', label: 'SAEB', icon: BarChart3 },
          { id: 'comparativo', label: 'Comparativo', icon: Eye },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setAbaAtiva(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              abaAtiva === tab.id ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ABA: Rendimento */}
      {abaAtiva === 'rendimento' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Rendimento por Etapa</h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={dadosRendimento}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="etapa" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Legend />
                <Bar dataKey="aprovacao" name="Aprovação" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reproducao" name="Reprovação" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="abandono" name="Abandono" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {RENDIMENTO_POR_ETAPA.map(etapa => (
              <div key={etapa.etapa} className="bg-white rounded-xl p-4 shadow-sm border">
                <h3 className="font-semibold text-gray-800 mb-3">{etapa.etapa}</h3>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-green-600">Aprovação</span>
                      <span className="font-bold">{etapa.aprovacao}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${etapa.aprovacao}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-red-600">Reprovação</span>
                      <span className="font-bold">{etapa.reproducao}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${etapa.reproducao}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-orange-600">Abandono</span>
                      <span className="font-bold">{etapa.abandono}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${etapa.abandono}%` }} />
                    </div>
                  </div>
                  <div className="pt-2 border-t mt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-600">Distorção I-S</span>
                      <span className="font-bold text-purple-700">{etapa.distorcao}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA: IDEB */}
      {abaAtiva === 'ideb' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Evolução do IDEB - Anos Iniciais</h2>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={IDEB_HISTORICO}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="ano" tick={{ fontSize: 12 }} />
                <YAxis domain={[3, 6]} tick={{ fontSize: 12 }} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Legend />
                <Line type="monotone" dataKey="municipal" name="Rio Largo" stroke={CORES.municipal} strokeWidth={3} dot={{ r: 6 }} />
                <Line type="monotone" dataKey="estadual" name="Alagoas" stroke={CORES.estadual} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="nacional" name="Brasil" stroke={CORES.nacional} strokeWidth={2} strokeDasharray="3 3" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">IDEB Real vs Meta</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={IDEB_META}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="ano" tick={{ fontSize: 12 }} />
                  <YAxis domain={[3, 6]} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Legend />
                  <Bar dataKey="municipal" name="Alcançado" fill={CORES.municipal} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="meta" name="Meta" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">IDEB por Escola (2025)</h2>
              <div className="space-y-4">
                {ESCOLAS_IDEB.sort((a, b) => b.ideb - a.ideb).map(escola => {
                  const diff = escola.ideb - escola.meta
                  const atingiu = diff >= 0
                  return (
                    <div key={escola.nome}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{escola.nome}</span>
                        <span className="font-bold flex items-center gap-1">
                          {escola.ideb.toFixed(1)}
                          {atingiu
                            ? <TrendingUp size={14} className="text-green-500" />
                            : <TrendingDown size={14} className="text-red-500" />
                          }
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 relative">
                        <div
                          className={`h-2.5 rounded-full ${atingiu ? 'bg-green-500' : 'bg-orange-400'}`}
                          style={{ width: `${Math.min(100, (escola.ideb / escola.meta) * 100)}%` }}
                        />
                        <div
                          className="absolute top-0 h-2.5 border-l-2 border-red-500"
                          style={{ left: `${Math.min(100, (escola.meta / Math.max(...ESCOLAS_IDEB.map(e => e.meta))) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Meta: {escola.meta.toFixed(1)} • {atingiu ? 'Meta atingida' : `Faltam ${(escola.meta - escola.ideb).toFixed(1)}`}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA: SAEB */}
      {abaAtiva === 'saeb' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Português - Comparativo por Etapa</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={SAEB_PT_COMPARATIVO}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="etapa" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Legend />
                  <Bar dataKey="rio_largo" name="Rio Largo" fill={CORES.municipal} radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="alagoas" name="Alagoas" fill={CORES.estadual} radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="brasil" name="Brasil" fill={CORES.nacional} radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Matemática - Comparativo por Etapa</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={SAEB_MAT_COMPARATIVO}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="etapa" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Legend />
                  <Bar dataKey="rio_largo" name="Rio Largo" fill={CORES.municipal_sec} radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="alagoas" name="Alagoas" fill={CORES.estadual_sec} radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="brasil" name="Brasil" fill={CORES.nacional_sec} radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Distribuição por Nível - Português</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={DISTRIBUICAO_NIVEIS_SAEB.map(d => ({ name: d.nivel, value: d.pt, cor: d.cor }))}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                    dataKey="value" label={({ name, value }) => `${name} ${value}%`}
                  >
                    {DISTRIBUICAO_NIVEIS_SAEB.map((d, i) => (
                      <Cell key={i} fill={d.cor} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Distribuição por Nível - Matemática</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={DISTRIBUICAO_NIVEIS_SAEB.map(d => ({ name: d.nivel, value: d.mat, cor: d.cor }))}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                    dataKey="value" label={({ name, value }) => `${name} ${value}%`}
                  >
                    {DISTRIBUICAO_NIVEIS_SAEB.map((d, i) => (
                      <Cell key={i} fill={d.cor} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-6 md:col-span-2">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Proficiência por Escola</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-600">Escola</th>
                      <th className="text-center p-3 font-medium text-gray-600">Português</th>
                      <th className="text-center p-3 font-medium text-gray-600">Matemática</th>
                      <th className="text-center p-3 font-medium text-gray-600">% Prof. PT</th>
                      <th className="text-center p-3 font-medium text-gray-600">% Prof. MAT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DADOS_ESCOLAS.sort((a, b) => b.prof_pt + b.prof_mat - (a.prof_pt + a.prof_mat)).map((e, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium">{e.nome}</td>
                        <td className="p-3 text-center">{e.nota_port.toFixed(1)}</td>
                        <td className="p-3 text-center">{e.nota_mat.toFixed(1)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            e.prof_pt >= 50 ? 'bg-green-100 text-green-700' : e.prof_pt >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {e.prof_pt.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            e.prof_mat >= 50 ? 'bg-green-100 text-green-700' : e.prof_mat >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {e.prof_mat.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA: Comparativo */}
      {abaAtiva === 'comparativo' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Comparativo Municipal × Estadual × Nacional</h2>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={[
                { indicador: 'IDEB', municipal: 5.1, estadual: 5.2, nacional: 5.6 },
                { indicador: 'Aprovação', municipal: 90.2, estadual: 87.5, nacional: 92.1 },
                { indicador: 'Profic. PT', municipal: 44.8, estadual: 41.2, nacional: 48.5 },
                { indicador: 'Profic. MAT', municipal: 42.1, estadual: 38.6, nacional: 46.2 },
                { indicador: 'Distorção (inv.)', municipal: 84.5, estadual: 82.0, nacional: 87.3 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="indicador" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Legend />
                <Bar dataKey="municipal" name="Rio Largo" fill={CORES.municipal} radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="estadual" name="Alagoas" fill={CORES.estadual} radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="nacional" name="Brasil" fill={CORES.nacional} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { titulo: 'IDEB', municipal: 5.1, estadual: 5.2, nacional: 5.6, dif: -0.5 },
              { titulo: 'Proficiência PT', municipal: 44.8, estadual: 41.2, nacional: 48.5, dif: -3.7 },
              { titulo: 'Proficiência MAT', municipal: 42.1, estadual: 38.6, nacional: 46.2, dif: -4.1 },
            ].map(item => (
              <div key={item.titulo} className="bg-white rounded-xl p-4 shadow-sm border">
                <h3 className="font-semibold text-gray-800 mb-3">{item.titulo}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-700">Rio Largo</span>
                    <span className="font-bold">{item.municipal.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Alagoas</span>
                    <span>{item.estadual.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Brasil</span>
                    <span>{item.nacional.toFixed(1)}</span>
                  </div>
                  <div className="pt-2 border-t mt-2 flex justify-between">
                    <span className="text-gray-500">Dif. p/ Brasil</span>
                    <span className={`font-bold ${item.dif >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.dif >= 0 ? '+' : ''}{item.dif.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Indicadores por Escola (Ranking)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-600">#</th>
                    <th className="text-left p-3 font-medium text-gray-600">Escola</th>
                    <th className="text-center p-3 font-medium text-gray-600">Aprovação</th>
                    <th className="text-center p-3 font-medium text-gray-600">IDEB</th>
                    <th className="text-center p-3 font-medium text-gray-600">Profic. PT</th>
                    <th className="text-center p-3 font-medium text-gray-600">Profic. MAT</th>
                    <th className="text-center p-3 font-medium text-gray-600">Distorção</th>
                  </tr>
                </thead>
                <tbody>
                  {DADOS_ESCOLAS.sort((a, b) => b.ideb - a.ideb).map((e, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-300'
                        }`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="p-3 font-medium">{e.nome}</td>
                      <td className="p-3 text-center text-green-600 font-bold">{e.aprovacao}%</td>
                      <td className="p-3 text-center font-bold">{e.ideb.toFixed(1)}</td>
                      <td className="p-3 text-center">{e.prof_pt.toFixed(1)}%</td>
                      <td className="p-3 text-center">{e.prof_mat.toFixed(1)}%</td>
                      <td className="p-3 text-center text-red-600">{e.distorcao}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
