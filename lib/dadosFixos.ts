// lib/dadosFixos.ts

export interface Escola {
  id: string
  codigo: string
  nome: string
  turmas: Record<string, string[]> // período -> array de nomes de turmas
  ativa: boolean
  created_at: string
}

export interface Habilidade {
  id: string
  disciplina: string
  periodo: string
  codigo: string
  descricao: string
  ordem: number
}

// Períodos disponíveis (ordem fixa)
export const PERIODOS = [
  '1º período', '2º período', '3º período', '4º período',
  '5º período', '6º período', '7º período', '8º período'
]

// Habilidades fixas por disciplina e período
export const HABILIDADES_FIXAS: Habilidade[] = [
  // Língua Portuguesa - 1º período
  { id: 'LP1', disciplina: 'Língua Portuguesa', periodo: '1º período', codigo: 'LP01', descricao: 'Identificar letras do alfabeto', ordem: 1 },
  { id: 'LP2', disciplina: 'Língua Portuguesa', periodo: '1º período', codigo: 'LP02', descricao: 'Reconhecer sílabas simples', ordem: 2 },
  { id: 'LP3', disciplina: 'Língua Portuguesa', periodo: '1º período', codigo: 'LP03', descricao: 'Ler palavras simples', ordem: 3 },
  
  // Língua Portuguesa - 2º período
  { id: 'LP4', disciplina: 'Língua Portuguesa', periodo: '2º período', codigo: 'LP04', descricao: 'Ler frases simples', ordem: 1 },
  { id: 'LP5', disciplina: 'Língua Portuguesa', periodo: '2º período', codigo: 'LP05', descricao: 'Interpretar texto curto', ordem: 2 },
  
  // Língua Portuguesa - 3º período
  { id: 'LP6', disciplina: 'Língua Portuguesa', periodo: '3º período', codigo: 'LP06', descricao: 'Identificar ideia principal', ordem: 1 },
  { id: 'LP7', disciplina: 'Língua Portuguesa', periodo: '3º período', codigo: 'LP07', descricao: 'Fazer inferências', ordem: 2 },
  
  // Língua Portuguesa - 4º período
  { id: 'LP8', disciplina: 'Língua Portuguesa', periodo: '4º período', codigo: 'LP08', descricao: 'Identificar gêneros textuais', ordem: 1 },
  { id: 'LP9', disciplina: 'Língua Portuguesa', periodo: '4º período', codigo: 'LP09', descricao: 'Produzir texto narrativo', ordem: 2 },
  
  // Matemática - 1º período
  { id: 'M1', disciplina: 'Matemática', periodo: '1º período', codigo: 'M01', descricao: 'Identificar números de 0 a 9', ordem: 1 },
  { id: 'M2', disciplina: 'Matemática', periodo: '1º período', codigo: 'M02', descricao: 'Contar objetos até 10', ordem: 2 },
  
  // Matemática - 2º período
  { id: 'M3', disciplina: 'Matemática', periodo: '2º período', codigo: 'M03', descricao: 'Realizar adição simples', ordem: 1 },
  { id: 'M4', disciplina: 'Matemática', periodo: '2º período', codigo: 'M04', descricao: 'Realizar subtração simples', ordem: 2 },
  
  // Matemática - 3º período
  { id: 'M5', disciplina: 'Matemática', periodo: '3º período', codigo: 'M05', descricao: 'Resolver problemas de adição', ordem: 1 },
  { id: 'M6', disciplina: 'Matemática', periodo: '3º período', codigo: 'M06', descricao: 'Resolver problemas de subtração', ordem: 2 },
  
  // Matemática - 4º período
  { id: 'M7', disciplina: 'Matemática', periodo: '4º período', codigo: 'M07', descricao: 'Multiplicação simples', ordem: 1 },
  { id: 'M8', disciplina: 'Matemática', periodo: '4º período', codigo: 'M08', descricao: 'Divisão simples', ordem: 2 },
]

// Função para obter habilidades por disciplina e período
export function getHabilidadesPorPeriodo(disciplina: string, periodo: string): Habilidade[] {
  return HABILIDADES_FIXAS.filter(
    h => h.disciplina === disciplina && h.periodo === periodo
  )
}

// Função para gerar código de acesso
export function gerarCodigoAcesso(avaliacaoId: string, escolaCodigo: string, ano: number): string {
  const prefixo = avaliacaoId.slice(0, 4).toUpperCase()
  return `${prefixo}-${escolaCodigo}-${ano}`
}

// Validar código de acesso
export function validarCodigoAcesso(codigo: string, avaliacao: any, escolaCodigo: string): { valido: boolean; mensagem?: string } {
  const codigoGerado = gerarCodigoAcesso(avaliacao.id, escolaCodigo, avaliacao.ano)
  
  if (codigoGerado !== codigo.toUpperCase()) {
    return { valido: false, mensagem: 'Código inválido' }
  }
  
  if (!avaliacao.ativa) {
    return { valido: false, mensagem: 'Esta avaliação está desativada' }
  }
  
  if (avaliacao.data_limite_insercao && new Date() > new Date(avaliacao.data_limite_insercao)) {
    return { valido: false, mensagem: 'Prazo de inserção encerrado' }
  }
  
  return { valido: true }
}

// Calcular percentual de proficientes
export function calcularPercentualProficiente(resultado: any): number {
  const total = (resultado.nivel_insuficiente || 0) + 
                (resultado.nivel_basico || 0) + 
                (resultado.nivel_proficiente || 0) + 
                (resultado.nivel_avancado || 0)
  
  if (total === 0) return 0
  
  const proficientes = (resultado.nivel_proficiente || 0) + (resultado.nivel_avancado || 0)
  return (proficientes / total) * 100
}

// Calcular média da rede
export function calcularMediaRede(resultados: any[]): number {
  let totalProficiente = 0
  let totalAlunos = 0
  
  resultados.forEach(r => {
    const totalNiveis = (r.nivel_insuficiente || 0) + 
                       (r.nivel_basico || 0) + 
                       (r.nivel_proficiente || 0) + 
                       (r.nivel_avancado || 0)
    totalProficiente += (r.nivel_proficiente || 0) + (r.nivel_avancado || 0)
    totalAlunos += totalNiveis
  })
  
  return totalAlunos > 0 ? (totalProficiente / totalAlunos) * 100 : 0
}

// Constantes para tipos de gráfico
export const TIPOS_GRAFICO = {
  BARRA: 'barra',
  BARRA_HORIZONTAL: 'barra_horizontal',
  PIZZA: 'pizza',
  LINHA: 'linha'
} as const

export type TipoGrafico = typeof TIPOS_GRAFICO[keyof typeof TIPOS_GRAFICO]

export const MODALIDADES_VISUALIZACAO = {
  QUANTITATIVO: 'quantitativo',
  PERCENTUAL: 'percentual'
} as const

export type ModalidadeVisualizacao = typeof MODALIDADES_VISUALIZACAO[keyof typeof MODALIDADES_VISUALIZACAO]

// Cores dos níveis
export const CORES_NIVEIS = {
  insuficiente: '#FF6B6B',
  basico: '#FFB347',
  proficiente: '#4ECDC4',
  avancado: '#45B7D1'
}