'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { School, Save, CheckCircle, AlertCircle, BookOpen, ChevronDown, ChevronUp, RotateCcw, Loader2 } from 'lucide-react'
import { ESCOLAS_FIXAS, validarCodigoAcesso, getTurmasByEscola } from '@/lib/dadosFixos'

interface DadosTurma {
  periodo: string
  turma: string
  portugues: {
    matriculados: number
    avaliados: number
    insuficiente: number
    basico: number
    proficiente: number
    avancado: number
  }
  matematica: {
    matriculados: number
    avaliados: number
    insuficiente: number
    basico: number
    proficiente: number
    avancado: number
  }
}

export default function InserirResultados() {
  const supabase = createClient()
  const [codigo, setCodigo] = useState('')
  const [codigoValido, setCodigoValido] = useState(false)
  const [avaliacao, setAvaliacao] = useState<any>(null)
  const [escola, setEscola] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [dados, setDados] = useState<Record<string, DadosTurma>>({})
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>(() => {
    const expanded: Record<string, boolean> = {}
    const periodos = ['1º período', '2º período', '3º período', '4º período', '5º período', '6º período', '7º período', '8º período']
    periodos.forEach(p => { expanded[p] = true })
    return expanded
  })

  async function handleValidarCodigo() {
    if (!codigo.trim()) {
      setErro('Digite o código de acesso')
      return
    }

    setLoading(true)
    setErro('')
    
    try {
      // Buscar avaliações na tabela CORRETA: avaliacoes_eja
      const { data: avaliacoes, error } = await supabase
        .from('avaliacoes_eja')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Erro ao buscar avaliações:', error)
        throw new Error('Erro ao buscar avaliações')
      }
      
      if (!avaliacoes || avaliacoes.length === 0) {
        setErro('Nenhuma avaliação encontrada. Contate o administrador.')
        setLoading(false)
        return
      }
      
      // Procurar avaliação que tenha esse código
      let avaliacaoEncontrada = null
      let escolaEncontrada = null
      
      for (const av of avaliacoes) {
        const resultado = validarCodigoAcesso(codigo, av.id, av.ano)
        if (resultado.valido && resultado.escola) {
          avaliacaoEncontrada = av
          escolaEncontrada = resultado.escola
          break
        }
      }
      
      if (!avaliacaoEncontrada || !escolaEncontrada) {
        setErro('Código inválido. Verifique e tente novamente.')
        setLoading(false)
        return
      }
      
      setAvaliacao(avaliacaoEncontrada)
      setEscola(escolaEncontrada)
      
      // Buscar resultados já salvos na tabela CORRETA: resultados_eja_turma
      const { data: resultadosSalvos, error: resultadosError } = await supabase
        .from('resultados_eja_turma')
        .select('*')
        .eq('avaliacao_id', avaliacaoEncontrada.id)
        .eq('escola_codigo', escolaEncontrada.codigo)
      
      if (resultadosError) {
        console.error('Erro ao buscar resultados salvos:', resultadosError)
      }
      
      // Inicializar dados com todas as turmas
      const turmas = getTurmasByEscola(escolaEncontrada.codigo)
      
      if (!turmas || turmas.length === 0) {
        setErro('Nenhuma turma encontrada para esta escola. Contate o administrador.')
        setLoading(false)
        return
      }
      
      const novosDados: Record<string, DadosTurma> = {}
      
      turmas.forEach(turma => {
        const key = `${turma.periodo}_${turma.turma}`
        const portuguesSalvo = resultadosSalvos?.find(r => 
          r.periodo === turma.periodo && 
          r.turma === turma.turma && 
          r.disciplina === 'Língua Portuguesa'
        )
        const matematicaSalvo = resultadosSalvos?.find(r => 
          r.periodo === turma.periodo && 
          r.turma === turma.turma && 
          r.disciplina === 'Matemática'
        )
        
        novosDados[key] = {
          periodo: turma.periodo,
          turma: turma.turma,
          portugues: {
            matriculados: portuguesSalvo?.alunos_matriculados || turma.totalAlunos || 0,
            avaliados: portuguesSalvo?.alunos_avaliados || 0,
            insuficiente: portuguesSalvo?.nivel_insuficiente || 0,
            basico: portuguesSalvo?.nivel_basico || 0,
            proficiente: portuguesSalvo?.nivel_proficiente || 0,
            avancado: portuguesSalvo?.nivel_avancado || 0
          },
          matematica: {
            matriculados: matematicaSalvo?.alunos_matriculados || turma.totalAlunos || 0,
            avaliados: matematicaSalvo?.alunos_avaliados || 0,
            insuficiente: matematicaSalvo?.nivel_insuficiente || 0,
            basico: matematicaSalvo?.nivel_basico || 0,
            proficiente: matematicaSalvo?.nivel_proficiente || 0,
            avancado: matematicaSalvo?.nivel_avancado || 0
          }
        }
      })
      
      setDados(novosDados)
      setCodigoValido(true)
      
    } catch (err) {
      console.error('Erro na validação:', err)
      setErro('Erro ao validar código. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function atualizarResultado(
    periodo: string,
    turma: string,
    disciplina: 'portugues' | 'matematica',
    campo: string,
    valor: number
  ) {
    setDados(prev => {
      const key = `${periodo}_${turma}`
      if (!prev[key]) return prev
      
      const disciplinaData = { ...prev[key][disciplina] }
      
      if (campo === 'matriculados') {
        disciplinaData.matriculados = Math.max(0, valor)
        if (disciplinaData.avaliados > disciplinaData.matriculados) {
          disciplinaData.avaliados = disciplinaData.matriculados
        }
      } else if (campo === 'avaliados') {
        disciplinaData.avaliados = Math.min(Math.max(0, valor), disciplinaData.matriculados)
      } else {
        disciplinaData[campo as keyof typeof disciplinaData] = Math.max(0, valor)
      }
      
      return {
        ...prev,
        [key]: { ...prev[key], [disciplina]: disciplinaData }
      }
    })
  }

  function validarSoma(periodo: string, turma: string, disciplina: 'portugues' | 'matematica'): boolean {
    const key = `${periodo}_${turma}`
    const data = dados[key]?.[disciplina]
    if (!data) return true
    
    const soma = data.insuficiente + data.basico + data.proficiente + data.avancado
    return soma === data.avaliados
  }

  async function handleEnviar() {
    if (!avaliacao || !escola) {
      setErro('Dados da avaliação não encontrados')
      return
    }
    
    setLoading(true)
    setErro('')
    
    try {
      let salvos = 0
      
      for (const item of Object.values(dados)) {
        // Salvar Português
        if (item.portugues.avaliados > 0 || item.portugues.matriculados > 0) {
          const { error: errorPt } = await supabase
            .from('resultados_eja_turma')
            .upsert({
              avaliacao_id: avaliacao.id,
              escola_codigo: escola.codigo,
              periodo: item.periodo,
              turma: item.turma,
              disciplina: 'Língua Portuguesa',
              alunos_matriculados: item.portugues.matriculados,
              alunos_avaliados: item.portugues.avaliados,
              nivel_insuficiente: item.portugues.insuficiente,
              nivel_basico: item.portugues.basico,
              nivel_proficiente: item.portugues.proficiente,
              nivel_avancado: item.portugues.avancado,
              updated_at: new Date().toISOString()
            }, { 
              onConflict: 'avaliacao_id,escola_codigo,periodo,turma,disciplina' 
            })
          
          if (errorPt) {
            console.error('Erro ao salvar Português:', errorPt)
            throw new Error(`Erro ao salvar ${item.periodo} - Turma ${item.turma} (Português)`)
          }
          salvos++
        }
        
        // Salvar Matemática
        if (item.matematica.avaliados > 0 || item.matematica.matriculados > 0) {
          const { error: errorMat } = await supabase
            .from('resultados_eja_turma')
            .upsert({
              avaliacao_id: avaliacao.id,
              escola_codigo: escola.codigo,
              periodo: item.periodo,
              turma: item.turma,
              disciplina: 'Matemática',
              alunos_matriculados: item.matematica.matriculados,
              alunos_avaliados: item.matematica.avaliados,
              nivel_insuficiente: item.matematica.insuficiente,
              nivel_basico: item.matematica.basico,
              nivel_proficiente: item.matematica.proficiente,
              nivel_avancado: item.matematica.avancado,
              updated_at: new Date().toISOString()
            }, { 
              onConflict: 'avaliacao_id,escola_codigo,periodo,turma,disciplina' 
            })
          
          if (errorMat) {
            console.error('Erro ao salvar Matemática:', errorMat)
            throw new Error(`Erro ao salvar ${item.periodo} - Turma ${item.turma} (Matemática)`)
          }
          salvos++
        }
      }
      
      setSucesso(`${salvos} registros salvos com sucesso! Obrigado pela participação.`)
      
      setTimeout(() => {
        setCodigo('')
        setCodigoValido(false)
        setAvaliacao(null)
        setEscola(null)
        setDados({})
        setSucesso('')
      }, 3000)
      
    } catch (err: any) {
      console.error('Erro ao salvar:', err)
      setErro(err.message || 'Erro ao enviar dados. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function toggleExpandir(periodo: string) {
    setExpandidos(prev => ({ ...prev, [periodo]: !prev[periodo] }))
  }

  function expandirTodos() {
    const novosExpandidos: Record<string, boolean> = {}
    Object.keys(dadosPorPeriodo).forEach(periodo => {
      novosExpandidos[periodo] = true
    })
    setExpandidos(novosExpandidos)
  }

  function recolherTodos() {
    const novosExpandidos: Record<string, boolean> = {}
    Object.keys(dadosPorPeriodo).forEach(periodo => {
      novosExpandidos[periodo] = false
    })
    setExpandidos(novosExpandidos)
  }

  const dadosPorPeriodo = Object.values(dados).reduce((acc, item) => {
    if (!acc[item.periodo]) acc[item.periodo] = []
    acc[item.periodo].push(item)
    return acc
  }, {} as Record<string, DadosTurma[]>)

  const periodosOrdenados = Object.keys(dadosPorPeriodo).sort((a, b) => {
    const numA = parseInt(a.split('º')[0])
    const numB = parseInt(b.split('º')[0])
    return numA - numB
  })

  if (sucesso) {
    return (
      <div className="min-h-screen text-slate-700 bg-linear-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Dados Enviados!</h2>
          <p className="text-gray-600">{sucesso}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition"
          >
            Nova Inserção
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-slate-700 bg-linear-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl mb-4">
            <School size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Inserção de Resultados
          </h1>
          <p className="text-gray-500 mt-2">Utilize o código fornecido pela coordenação</p>
        </div>

        {!codigoValido ? (
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Código de Acesso</label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Ex: AV01-ESC001-2024"
              className="w-full p-3 border rounded-xl font-mono mb-4"
            />
            {erro && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
                <AlertCircle size={18} /> {erro}
              </div>
            )}
            <button
              onClick={handleValidarCodigo}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Validar Código'}
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <School size={24} className="text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{escola?.nome}</h2>
                    <p className="text-gray-500">Avaliação: {avaliacao?.titulo} ({avaliacao?.ano})</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={expandirTodos} className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">Expandir Todos</button>
                  <button onClick={recolherTodos} className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">Recolher Todos</button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {periodosOrdenados.map((periodo) => (
                <div key={periodo} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <button
                    onClick={() => toggleExpandir(periodo)}
                    className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-indigo-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen size={20} className="text-indigo-600" />
                      <h3 className="font-semibold">{periodo}</h3>
                      <span className="text-sm text-gray-500">{dadosPorPeriodo[periodo]?.length} turma(s)</span>
                    </div>
                    {expandidos[periodo] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  
                  {expandidos[periodo] && (
                    <div className="p-6 space-y-6">
                      {dadosPorPeriodo[periodo]?.map((item) => (
                        <div key={`${item.periodo}_${item.turma}`} className="border rounded-xl p-4">
                          <h4 className="font-semibold mb-4">Turma {item.turma}</h4>
                          
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Português */}
                            <div className="bg-blue-50 rounded-xl p-4">
                              <h5 className="font-medium text-blue-800 mb-3">Língua Portuguesa</h5>
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                  <label className="text-xs text-gray-600">Matriculados</label>
                                  <input type="number" value={item.portugues.matriculados}
                                    onChange={(e) => atualizarResultado(item.periodo, item.turma, 'portugues', 'matriculados', parseInt(e.target.value) || 0)}
                                    className="w-full p-2 border rounded-lg" min={0} />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-600">Avaliados</label>
                                  <input type="number" value={item.portugues.avaliados}
                                    onChange={(e) => atualizarResultado(item.periodo, item.turma, 'portugues', 'avaliados', parseInt(e.target.value) || 0)}
                                    className="w-full p-2 border rounded-lg" min={0} />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><label className="text-xs text-red-600">Insuficiente</label>
                                  <input type="number" value={item.portugues.insuficiente}
                                    onChange={(e) => atualizarResultado(item.periodo, item.turma, 'portugues', 'insuficiente', parseInt(e.target.value) || 0)}
                                    className="w-full p-2 border rounded-lg text-sm" min={0} /></div>
                                <div><label className="text-xs text-yellow-600">Básico</label>
                                  <input type="number" value={item.portugues.basico}
                                    onChange={(e) => atualizarResultado(item.periodo, item.turma, 'portugues', 'basico', parseInt(e.target.value) || 0)}
                                    className="w-full p-2 border rounded-lg text-sm" min={0} /></div>
                                <div><label className="text-xs text-blue-600">Proficiente</label>
                                  <input type="number" value={item.portugues.proficiente}
                                    onChange={(e) => atualizarResultado(item.periodo, item.turma, 'portugues', 'proficiente', parseInt(e.target.value) || 0)}
                                    className="w-full p-2 border rounded-lg text-sm" min={0} /></div>
                                <div><label className="text-xs text-green-600">Avançado</label>
                                  <input type="number" value={item.portugues.avancado}
                                    onChange={(e) => atualizarResultado(item.periodo, item.turma, 'portugues', 'avancado', parseInt(e.target.value) || 0)}
                                    className="w-full p-2 border rounded-lg text-sm" min={0} /></div>
                              </div>
                              <div className="mt-2 text-xs text-gray-500 text-right">
                                Soma: {item.portugues.insuficiente + item.portugues.basico + item.portugues.proficiente + item.portugues.avancado} / {item.portugues.avaliados}
                              </div>
                            </div>
                            
                            {/* Matemática */}
                            <div className="bg-purple-50 rounded-xl p-4">
                              <h5 className="font-medium text-purple-800 mb-3">Matemática</h5>
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                  <label className="text-xs text-gray-600">Matriculados</label>
                                  <input type="number" value={item.matematica.matriculados}
                                    onChange={(e) => atualizarResultado(item.periodo, item.turma, 'matematica', 'matriculados', parseInt(e.target.value) || 0)}
                                    className="w-full p-2 border rounded-lg" min={0} />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-600">Avaliados</label>
                                  <input type="number" value={item.matematica.avaliados}
                                    onChange={(e) => atualizarResultado(item.periodo, item.turma, 'matematica', 'avaliados', parseInt(e.target.value) || 0)}
                                    className="w-full p-2 border rounded-lg" min={0} />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><label className="text-xs text-red-600">Insuficiente</label>
                                  <input type="number" value={item.matematica.insuficiente}
                                    onChange={(e) => atualizarResultado(item.periodo, item.turma, 'matematica', 'insuficiente', parseInt(e.target.value) || 0)}
                                    className="w-full p-2 border rounded-lg text-sm" min={0} /></div>
                                <div><label className="text-xs text-yellow-600">Básico</label>
                                  <input type="number" value={item.matematica.basico}
                                    onChange={(e) => atualizarResultado(item.periodo, item.turma, 'matematica', 'basico', parseInt(e.target.value) || 0)}
                                    className="w-full p-2 border rounded-lg text-sm" min={0} /></div>
                                <div><label className="text-xs text-blue-600">Proficiente</label>
                                  <input type="number" value={item.matematica.proficiente}
                                    onChange={(e) => atualizarResultado(item.periodo, item.turma, 'matematica', 'proficiente', parseInt(e.target.value) || 0)}
                                    className="w-full p-2 border rounded-lg text-sm" min={0} /></div>
                                <div><label className="text-xs text-green-600">Avançado</label>
                                  <input type="number" value={item.matematica.avancado}
                                    onChange={(e) => atualizarResultado(item.periodo, item.turma, 'matematica', 'avancado', parseInt(e.target.value) || 0)}
                                    className="w-full p-2 border rounded-lg text-sm" min={0} /></div>
                              </div>
                              <div className="mt-2 text-xs text-gray-500 text-right">
                                Soma: {item.matematica.insuficiente + item.matematica.basico + item.matematica.proficiente + item.matematica.avancado} / {item.matematica.avaliados}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={handleEnviar} disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-2">
                <Save size={20} /> {loading ? 'Enviando...' : 'Enviar Resultados'}
              </button>
              <button onClick={() => window.location.reload()} className="px-6 py-3 bg-gray-200 rounded-xl hover:bg-gray-300 transition">
                <RotateCcw size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}