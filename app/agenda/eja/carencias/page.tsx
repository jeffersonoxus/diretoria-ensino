'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSetorEJA } from '@/hooks/useSetorEJA'
import { AlertTriangle, CheckCircle, School, Filter, BookOpen, Users } from 'lucide-react'

function getSegmento(periodo: string): string {
  const match = periodo.match(/^(\d+)/)
  if (!match) return ''
  const num = parseInt(match[1], 10)
  if (num >= 1 && num <= 4) return '1º segmento'
  if (num >= 5 && num <= 8) return '2º segmento'
  return ''
}

interface Lotacao {
  id: string
  servidor_id: string
  escola_id: string
  turma_id: string
  disciplina: string
  regente: boolean
  servidor: { id: string; nome: string } | null
}

interface Escola {
  id: string
  nome: string
  turmas: Record<string, string[]>
}

interface MatrizRow {
  id: string
  segmento: string
  disciplina: string
}

interface CarenciaItem {
  escolaId: string
  escolaNome: string
  periodo: string
  turma: string
  disciplina: string
  status: 'preenchida' | 'carencia'
  professor: string | null
}

export default function CarenciasPage() {
  const { isSetorEJA, loading } = useSetorEJA()
  const router = useRouter()

  const [escolas, setEscolas] = useState<Escola[]>([])
  const [matriz, setMatriz] = useState<MatrizRow[]>([])
  const [lotacoes, setLotacoes] = useState<Lotacao[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filtroEscola, setFiltroEscola] = useState('')
  const [filtroSegmento, setFiltroSegmento] = useState('')
  const [apenasCarencias, setApenasCarencias] = useState(false)

  useEffect(() => {
    if (!loading && !isSetorEJA) {
      router.push('/agenda')
    }
  }, [loading, isSetorEJA, router])

  useEffect(() => {
    if (!isSetorEJA) return

    setFetching(true)
    setError(null)

    const supabase = createClient()

    Promise.all([
      supabase.from('escolas_eja').select('*').eq('ativa', true).order('nome'),
      supabase.from('eja_matriz').select('*').order('segmento'),
      supabase.from('eja_lotacoes').select('*, servidor:eja_servidores(id, nome)'),
    ])
      .then(([escolasRes, matrizRes, lotacoesRes]) => {
        if (escolasRes.error) throw new Error(escolasRes.error.message)
        if (matrizRes.error) throw new Error(matrizRes.error.message)
        if (lotacoesRes.error) throw new Error(lotacoesRes.error.message)
        setEscolas(escolasRes.data as unknown as Escola[])
        setMatriz(matrizRes.data as MatrizRow[])
        setLotacoes(lotacoesRes.data as unknown as Lotacao[])
      })
      .catch((err) => {
        console.error('Erro ao buscar dados:', err)
        setError(err.message)
      })
      .finally(() => setFetching(false))
  }, [isSetorEJA])

  const lotacaoKey = (l: Lotacao) => `${l.escola_id}|${l.turma_id}|${l.disciplina}`

  const lotacoesMap = useMemo(() => {
    const map = new Map<string, Lotacao>()
    for (const l of lotacoes) {
      map.set(lotacaoKey(l), l)
    }
    return map
  }, [lotacoes])

  const matrizPorPeriodo = useMemo(() => {
    const map = new Map<string, string[]>()
    const segToPeriodos: Record<string, string[]> = {
      '1º segmento': ['1º período', '2º período', '3º período', '4º período'],
      '2º segmento': ['5º período', '6º período', '7º período', '8º período'],
    }
    for (const m of matriz) {
      const periodos = segToPeriodos[m.segmento] || [m.segmento]
      for (const periodo of periodos) {
        const arr = map.get(periodo) || []
        arr.push(m.disciplina)
        map.set(periodo, arr)
      }
    }
    return map
  }, [matriz])

  const escolasFiltradas = useMemo(() => {
    if (!filtroEscola) return escolas
    return escolas.filter((e) => e.id === filtroEscola)
  }, [escolas, filtroEscola])

  const segmentosDisponiveis = useMemo(() => {
    const s = new Set<string>()
    for (const e of escolas) {
      if (e.turmas) {
        for (const periodo of Object.keys(e.turmas)) {
          const seg = getSegmento(periodo)
          if (seg) s.add(seg)
        }
      }
    }
    return Array.from(s).sort()
  }, [escolas])

  const carenciasData = useMemo(() => {
    const items: CarenciaItem[] = []

    for (const escola of escolasFiltradas) {
      if (!escola.turmas) continue

      const periodos = Object.entries(escola.turmas)

      for (const [periodo, turmas] of periodos) {
        const segmento = getSegmento(periodo)
        if (!segmento) continue
        if (filtroSegmento && segmento !== filtroSegmento) continue

        const disciplinasNecessarias = matrizPorPeriodo.get(periodo) || []

        for (const turma of turmas) {
          // Check if turma has a regente (professor covering all disciplines)
          const temRegente = lotacoes.some(l =>
            l.escola_id === escola.id &&
            l.turma_id === turma &&
            l.regente === true
          )

          for (const disciplina of disciplinasNecessarias) {
            const key = `${escola.id}|${turma}|${disciplina}`
            const lotacao = lotacoesMap.get(key)

            // If regente exists, all disciplines except Educação Física are covered
            if (temRegente && disciplina !== 'Educação Física' && !lotacao) {
              items.push({
                escolaId: escola.id,
                escolaNome: escola.nome,
                periodo,
                turma,
                disciplina,
                status: 'preenchida',
                professor: '(regente)',
              })
              continue
            }

            const preenchida = !!lotacao && !!lotacao.servidor

            items.push({
              escolaId: escola.id,
              escolaNome: escola.nome,
              periodo,
              turma,
              disciplina,
              status: preenchida ? 'preenchida' : 'carencia',
              professor: lotacao?.servidor?.nome || null,
            })
          }
        }
      }
    }

    return items
  }, [escolasFiltradas, matrizPorPeriodo, lotacoesMap, filtroSegmento, lotacoes])

  const itemsExibidos = useMemo(() => {
    if (!apenasCarencias) return carenciasData
    return carenciasData.filter((i) => i.status === 'carencia')
  }, [carenciasData, apenasCarencias])

  const stats = useMemo(() => {
    const escolasSet = new Set(carenciasData.map((i) => i.escolaId))
    const turmasSet = new Set(carenciasData.map((i) => `${i.escolaId}|${i.turma}`))
    const totalCarencias = carenciasData.filter((i) => i.status === 'carencia').length
    const totalPreenchidas = carenciasData.filter((i) => i.status === 'preenchida').length

    return {
      totalEscolas: escolasSet.size,
      totalTurmas: turmasSet.size,
      totalCarencias,
      totalPreenchidas,
    }
  }, [carenciasData])

  const agrupadoPorEscola = useMemo(() => {
    const map = new Map<string, CarenciaItem[]>()

    for (const item of itemsExibidos) {
      const arr = map.get(item.escolaId) || []
      arr.push(item)
      map.set(item.escolaId, arr)
    }

    return Array.from(map.entries()).sort((a, b) => {
      const nomeA = escolas.find((e) => e.id === a[0])?.nome || ''
      const nomeB = escolas.find((e) => e.id === b[0])?.nome || ''
      return nomeA.localeCompare(nomeB)
    })
  }, [itemsExibidos, escolas])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    )
  }

  if (!isSetorEJA) return null

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Carências</h1>
            <p className="text-sm text-gray-500">
              Turmas sem professor ou disciplinas descobertas
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Erro ao carregar dados</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {!fetching && matriz.length === 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <BookOpen className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-amber-800 mb-1">
            Configure a Matriz EJA primeiro
          </h2>
          <p className="text-sm text-amber-600 mb-4">
            Para visualizar as carências, é necessário cadastrar as disciplinas
            obrigatórias de cada segmento na Matriz EJA.
          </p>
          <Link
            href="/agenda/eja/matriz"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
          >
            <BookOpen className="w-4 h-4" />
            Ir para Matriz EJA
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <School className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Escolas
            </span>
          </div>
          <span className="text-2xl font-bold text-gray-900">
            {fetching ? '-' : stats.totalEscolas}
          </span>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Users className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Turmas
            </span>
          </div>
          <span className="text-2xl font-bold text-gray-900">
            {fetching ? '-' : stats.totalTurmas}
          </span>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Carências
            </span>
          </div>
          <span className="text-2xl font-bold text-red-600">
            {fetching ? '-' : stats.totalCarencias}
          </span>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <CheckCircle className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Preenchidas
            </span>
          </div>
          <span className="text-2xl font-bold text-emerald-600">
            {fetching ? '-' : stats.totalPreenchidas}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-gray-500">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtros</span>
        </div>

        <select
          value={filtroEscola}
          onChange={(e) => setFiltroEscola(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          <option value="">Todas as escolas</option>
          {escolas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>

        <select
          value={filtroSegmento}
          onChange={(e) => setFiltroSegmento(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          <option value="">Todos os segmentos</option>
          {segmentosDisponiveis.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={apenasCarencias}
            onChange={(e) => setApenasCarencias(e.target.checked)}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-300"
          />
          Mostrar apenas carências
        </label>
      </div>

      {fetching ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
        </div>
      ) : matriz.length === 0 ? null : carenciasData.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-emerald-800 mb-1">
            Nenhuma carência encontrada
          </h2>
          <p className="text-sm text-emerald-600">
            Todas as disciplinas obrigatórias estão preenchidas em todas as turmas.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {agrupadoPorEscola.map(([escolaId, items]) => {
            const escola = escolas.find((e) => e.id === escolaId)
            if (!escola) return null

            const turmasNoEscola = new Map<string, CarenciaItem[]>()
            for (const item of items) {
              const key = `${item.periodo}|${item.turma}`
              const arr = turmasNoEscola.get(key) || []
              arr.push(item)
              turmasNoEscola.set(key, arr)
            }

            const turmasOrdenadas = Array.from(turmasNoEscola.entries()).sort(
              ([a], [b]) => a.localeCompare(b),
            )

            const totalCarenciasEscola = items.filter(
              (i) => i.status === 'carencia',
            ).length

            return (
              <div
                key={escolaId}
                className="bg-white rounded-xl border overflow-hidden"
              >
                <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <School className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-gray-900">{escola.nome}</h3>
                  </div>
                  {totalCarenciasEscola > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {totalCarenciasEscola} carência
                      {totalCarenciasEscola !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Completo
                    </span>
                  )}
                </div>

                <div className="divide-y divide-gray-100">
                  {turmasOrdenadas.map(([key, turmaItems]) => {
                    const [periodo, turma] = key.split('|')
                    return (
                      <div key={key} className="px-6 py-3">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          {periodo} / {turma}
                        </div>
                        <div className="space-y-1.5">
                          {turmaItems.map((item, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center gap-2 text-sm pl-4 ${
                                item.status === 'carencia'
                                  ? 'text-red-700'
                                  : 'text-gray-700'
                              }`}
                            >
                              {item.status === 'carencia' ? (
                                <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                  <AlertTriangle className="w-3 h-3 text-red-500" />
                                </span>
                              ) : (
                                <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                                </span>
                              )}
                              <span className="font-medium">{item.disciplina}</span>
                              {item.professor ? (
                                <span className="text-gray-500">
                                  - {item.professor}
                                </span>
                              ) : (
                                <span className="text-red-500 font-medium">
                                  - CARÊNCIA
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
