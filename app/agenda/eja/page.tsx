'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSetorEJA } from '@/hooks/useSetorEJA'
import { FileSpreadsheet, Users, ClipboardList, BookOpen, AlertTriangle, School, GraduationCap, ArrowRight, Clock, Building2, AlertCircle } from 'lucide-react'

export default function EJAPage() {
  const { isSetorEJA, loading } = useSetorEJA()
  const router = useRouter()
  const [stats, setStats] = useState({ servidores: 0, escolas: 0, lotacoes: 0, carencias: 0, naoLotados: 0, escolasComCarencia: 0, matrizCompleta: true })
  const [ultimasLotacoes, setUltimasLotacoes] = useState<any[]>([])

  useEffect(() => {
    if (!loading && !isSetorEJA) {
      router.push('/agenda')
    }
  }, [loading, isSetorEJA, router])

  useEffect(() => {
    if (!isSetorEJA) return
    const supabase = createClient()

    function getSegmento(periodo: string): string {
      const match = periodo.match(/^(\d+)/)
      if (!match) return ''
      const num = parseInt(match[1], 10)
      if (num >= 1 && num <= 4) return '1º segmento'
      if (num >= 5 && num <= 8) return '2º segmento'
      return ''
    }

    Promise.all([
      supabase.from('eja_servidores').select('id', { count: 'exact', head: true }).eq('ativo', true),
      supabase.from('escolas_eja').select('*', { count: 'exact', head: true }).eq('ativa', true),
      supabase.from('eja_lotacoes').select('*', { count: 'exact', head: true }),
      supabase.from('eja_servidores').select('id').eq('ativo', true),
      supabase.from('eja_lotacoes').select('servidor_id, escola_id, turma_id, disciplina, regente'),
      supabase.from('escolas_eja').select('id, nome, turmas').eq('ativa', true),
      supabase.from('eja_matriz').select('segmento, disciplina'),
      supabase.from('eja_lotacoes')
        .select('*, servidor:eja_servidores(id, nome), escola:escolas_eja(id, nome)')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('eja_matriz_escola').select('escola_id'),
    ]).then(([serv, esc, lot, todosServ, todosLot, escolasRes, matrizRes, ultimasRes, matrizEscolaRes]) => {
      const servidoresComLotacao = new Set(todosLot.data?.map(l => l.servidor_id) || [])
      const naoLotados = (todosServ.data || []).filter(s => !servidoresComLotacao.has(s.id)).length

      const segToPeriodos: Record<string, string[]> = {
        '1º segmento': ['1º período', '2º período', '3º período', '4º período'],
        '2º segmento': ['5º período', '6º período', '7º período', '8º período'],
      }
      const matrizPorPeriodo = new Map<string, string[]>()
      for (const m of (matrizRes.data || [])) {
        const periodos = segToPeriodos[m.segmento as string] || [m.segmento as string]
        for (const periodo of periodos) {
          const arr = matrizPorPeriodo.get(periodo) || []
          arr.push(m.disciplina as string)
          matrizPorPeriodo.set(periodo, arr)
        }
      }

      const lotacoesSet = new Set<string>()
      const regentesSet = new Set<string>()
      for (const l of (todosLot.data || [])) {
        lotacoesSet.add(`${l.escola_id}|${l.turma_id}|${l.disciplina}`)
        if (l.regente) regentesSet.add(`${l.escola_id}|${l.turma_id}`)
      }

      let carencias = 0
      const escolasComCarenciaSet = new Set<string>()
      for (const escola of (escolasRes.data || []) as any[]) {
        if (!escola.turmas) continue
        for (const [periodo, turmas] of Object.entries(escola.turmas as Record<string, string[]>)) {
          const segmento = getSegmento(periodo)
          if (!segmento) continue
          const disciplinas = matrizPorPeriodo.get(periodo) || []
          for (const turma of turmas) {
            const temRegente = regentesSet.has(`${escola.id}|${turma}`)
            for (const disciplina of disciplinas) {
              if (temRegente && disciplina !== 'Educação Física') continue
              const key = `${escola.id}|${turma}|${disciplina}`
              if (!lotacoesSet.has(key)) {
                carencias++
                escolasComCarenciaSet.add(escola.id)
              }
            }
          }
        }
      }

      // Check if matriz is complete (tem registros na geral e cada ativa tem config na escola OU geral já cobre)
      const temMatrizGeral = (matrizRes.data || []).length > 0
      const escolasIds = new Set((escolasRes.data || []).map((e: any) => e.id))
      const escolasComMatrizPropria = new Set((matrizEscolaRes.data || []).map((m: any) => m.escola_id))
      const matrizCompleta = temMatrizGeral || [...escolasIds].every(id => escolasComMatrizPropria.has(id))

      setStats({
        servidores: serv.count || 0,
        escolas: esc.count || 0,
        lotacoes: lot.count || 0,
        carencias,
        naoLotados,
        escolasComCarencia: escolasComCarenciaSet.size,
        matrizCompleta,
      })

      if (ultimasRes.data) setUltimasLotacoes(ultimasRes.data as any[])
    })
  }, [isSetorEJA])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  )

  if (!isSetorEJA) return null

  const sections = [
    {
      title: 'Cadastro',
      cards: [
        {
          href: '/agenda/eja/escolas',
          icon: School,
          label: 'Escolas',
          desc: 'Gerenciar cadastro de escolas e turmas da EJA',
          count: stats.escolas,
          color: 'from-indigo-500 to-indigo-600',
          bg: 'bg-indigo-50',
          iconBg: 'bg-indigo-100',
          iconColor: 'text-indigo-600',
          warning: undefined as string | undefined,
        },
        {
          href: '/agenda/eja/servidores',
          icon: Users,
          label: 'Servidores',
          desc: 'Cadastro de professores, coordenadores e demais servidores da EJA',
          count: stats.servidores,
          color: 'from-blue-500 to-blue-600',
          bg: 'bg-blue-50',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          extra: stats.naoLotados > 0 ? `${stats.naoLotados} não lotados` : '',
          warning: undefined as string | undefined,
        },
      ],
    },
    {
      title: 'Configuração',
      cards: [
        {
          href: '/agenda/eja/matriz',
          icon: BookOpen,
          label: 'Matriz EJA',
          desc: 'Configurar disciplinas obrigatórias e carga horária por segmento',
          count: stats.carencias !== undefined ? undefined : undefined,
          color: 'from-amber-500 to-amber-600',
          bg: 'bg-amber-50',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          warning: !stats.matrizCompleta ? 'Nenhuma disciplina cadastrada' : undefined,
        },
      ],
    },
    {
      title: 'Operacional',
      cards: [
        {
          href: '/agenda/eja/lotacoes',
          icon: ClipboardList,
          label: 'Lotações',
          desc: 'Vincular servidores a turmas e escolas, definir carga horária',
          count: stats.lotacoes,
          color: 'from-emerald-500 to-emerald-600',
          bg: 'bg-emerald-50',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          warning: undefined as string | undefined,
        },
        {
          href: '/agenda/eja/carencias',
          icon: AlertTriangle,
          label: 'Carências',
          desc: 'Visualizar turmas sem professor ou disciplinas descobertas',
          count: stats.carencias,
          color: 'from-red-500 to-red-600',
          bg: 'bg-red-50',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          extra: stats.escolasComCarencia > 0 ? `${stats.escolasComCarencia} escolas` : '',
          warning: undefined as string | undefined,
        },
        {
          href: '/agenda/avaliacoes',
          icon: FileSpreadsheet,
          label: 'Avaliações',
          desc: 'Gerenciar avaliações diagnósticas, resultados e relatórios',
          color: 'from-purple-500 to-purple-600',
          bg: 'bg-purple-50',
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-600',
          warning: undefined as string | undefined,
        },
      ],
    },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">EJA</h1>
            <p className="text-sm text-gray-500">Educação de Jovens e Adultos</p>
          </div>
        </div>
      </div>

      {!stats.matrizCompleta && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            Matriz curricular ainda não configurada.{' '}
            <Link href="/agenda/eja/matriz" className="underline font-medium hover:text-amber-900">
              Configurar agora
            </Link>
          </p>
        </div>
      )}

      <div className="space-y-10">
        {sections.map(section => (
          <div key={section.title}>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
              {section.title}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {section.cards.map(card => (
                <Link key={card.href} href={card.href}
                  className={`group relative ${card.bg} rounded-2xl border p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                        <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{card.label}</h3>
                        <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                  </div>
                  {card.count !== undefined && (
                    <div className="mt-4 flex items-center gap-2">
                      <span className={`text-2xl font-bold bg-white px-3 py-1 rounded-lg shadow-sm ${card.color.replace('from-', 'text-').replace(' to-', '')}`}>
                        {card.count}
                      </span>
                      <span className="text-sm text-gray-400">registros</span>
                      {card.extra && (
                        <span className="text-xs text-red-500 font-medium ml-auto">{card.extra}</span>
                      )}
                    </div>
                  )}
                  {card.warning && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600">
                      <AlertCircle size={14} />
                      {card.warning}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {ultimasLotacoes.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            Últimas Lotações
          </h2>
          <div className="bg-white rounded-2xl border shadow-sm divide-y divide-gray-100">
            {ultimasLotacoes.map((lot: any) => (
              <Link key={lot.id} href="/agenda/eja/lotacoes"
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/80 transition-colors"
              >
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {lot.servidor?.nome}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {lot.escola?.nome}
                    {lot.turma_id && ` • ${lot.turma_id}`}
                    {lot.regente ? ' • Regente' : lot.disciplina && ` • ${lot.disciplina}`}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
