// lib/dadosFixos.ts

import { createClient } from "@/lib/supabase/client"

export interface Escola {
  codigo: string
  nome: string
}

export interface Turma {
  escolaCodigo: string
  segmento: '1º segmento' | '2º segmento'
  periodo: string
  turma: string
  totalAlunos: number
}

// 7 Escolas pré-definidas
export const ESCOLAS_FIXAS: Escola[] = [
  { codigo: 'ESC001', nome: 'EMEB Dr. Gustavo Paiva' },
  { codigo: 'ESC002', nome: 'EMEB Marieta Leão' },
  { codigo: 'ESC003', nome: 'EMEF Dr. Gastão Oiticica' },
  { codigo: 'ESC004', nome: 'EMEF Manoel Gonçalves da Silva' },
  { codigo: 'ESC005', nome: 'EMEF Rosineide Teresa' },
  { codigo: 'ESC006', nome: 'EMEF Professora Maria Alice' },
  { codigo: 'ESC007', nome: 'EMEB Padre Antônio Vieira' }
]

// Períodos por segmento
export const PERIODOS_POR_SEGMENTO = {
  '1º segmento': ['1º período', '2º período', '3º período', '4º período'],
  '2º segmento': ['5º período', '6º período', '7º período', '8º período']
}

// Opções de turmas
export const OPCOES_TURMA = ['Única']

// Gerar todas as turmas pré-definidas para uma escola
export function gerarTurmasDaEscola(escolaCodigo: string): Turma[] {
  const turmas: Turma[] = []
  
  for (const turma of ['Única']) {
    // 1º segmento
    for (const periodo of PERIODOS_POR_SEGMENTO['1º segmento']) {
      turmas.push({
        escolaCodigo,
        segmento: '1º segmento',
        periodo,
        turma,
        totalAlunos: 0
      })
    }
    
    // 2º segmento
    for (const periodo of PERIODOS_POR_SEGMENTO['2º segmento']) {
      turmas.push({
        escolaCodigo,
        segmento: '2º segmento',
        periodo,
        turma,
        totalAlunos: 0
      })
    }
  }
  
  return turmas
}

// Obter todas as turmas de todas as escolas
export function getAllTurmas(): Turma[] {
  let todasTurmas: Turma[] = []
  for (const escola of ESCOLAS_FIXAS) {
    todasTurmas = [...todasTurmas, ...gerarTurmasDaEscola(escola.codigo)]
  }
  return todasTurmas
}

// Obter turmas de uma escola específica
export function getTurmasByEscola(escolaCodigo: string): Turma[] {
  return getAllTurmas().filter(t => t.escolaCodigo === escolaCodigo)
}

// Gerar código de acesso para uma avaliação
export function gerarCodigoAcesso(avaliacaoId: string, escolaCodigo: string, ano: number): string {
  const prefixo = avaliacaoId.slice(0, 4).toUpperCase()
  return `${prefixo}-${escolaCodigo}-${ano}`
}

// Validar código de acesso - FUNÇÃO CORRIGIDA
export function validarCodigoAcesso(codigo: string, avaliacaoId: string, ano: number): { valido: boolean; escola?: Escola } {
  for (const escola of ESCOLAS_FIXAS) {
    const codigoGerado = gerarCodigoAcesso(avaliacaoId, escola.codigo, ano)
    if (codigoGerado === codigo.toUpperCase()) {
      return { valido: true, escola }
    }
  }
  return { valido: false }
}

// Obter todos os códigos de uma avaliação
export function getTodosCodigosAcesso(avaliacaoId: string, ano: number): { codigo: string; escola: Escola }[] {
  return ESCOLAS_FIXAS.map(escola => ({
    codigo: gerarCodigoAcesso(avaliacaoId, escola.codigo, ano),
    escola
  }))
}