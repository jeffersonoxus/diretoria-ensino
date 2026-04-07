// lib/dadosAvaliacao.ts

export interface Habilidade {
  codigo: string
  descricao: string
  modalidade: string
  disciplina: string
}

// Habilidades por modalidade (apenas EJA)
export const HABILIDADES_POR_MODALIDADE: Record<string, Habilidade[]> = {
  "EJA 1º segmento": [
    // Língua Portuguesa
    { codigo: "EJA1LP01", descricao: "Compreender a função social da leitura e da escrita", modalidade: "EJA 1º segmento", disciplina: "Língua Portuguesa" },
    { codigo: "EJA1LP02", descricao: "Identificar informações explícitas em textos de diferentes gêneros", modalidade: "EJA 1º segmento", disciplina: "Língua Portuguesa" },
    { codigo: "EJA1LP03", descricao: "Produzir textos simples considerando a situação comunicativa", modalidade: "EJA 1º segmento", disciplina: "Língua Portuguesa" },
    // Matemática
    { codigo: "EJA1MA01", descricao: "Reconhecer e utilizar números naturais em situações cotidianas", modalidade: "EJA 1º segmento", disciplina: "Matemática" },
    { codigo: "EJA1MA02", descricao: "Resolver problemas envolvendo adição e subtração", modalidade: "EJA 1º segmento", disciplina: "Matemática" },
    { codigo: "EJA1MA03", descricao: "Identificar e relacionar figuras geométricas planas", modalidade: "EJA 1º segmento", disciplina: "Matemática" },
    // Ciências
    { codigo: "EJA1CI01", descricao: "Identificar os principais órgãos do corpo humano e suas funções", modalidade: "EJA 1º segmento", disciplina: "Ciências" },
    { codigo: "EJA1CI02", descricao: "Reconhecer a importância da água para os seres vivos", modalidade: "EJA 1º segmento", disciplina: "Ciências" },
    // Geografia
    { codigo: "EJA1GE01", descricao: "Identificar os elementos que compõem o espaço geográfico", modalidade: "EJA 1º segmento", disciplina: "Geografia" },
    // História
    { codigo: "EJA1HI01", descricao: "Reconhecer a importância da memória e do patrimônio cultural", modalidade: "EJA 1º segmento", disciplina: "História" }
  ],
  "EJA 2º segmento": [
    // Língua Portuguesa
    { codigo: "EJA2LP01", descricao: "Analisar e interpretar textos de diferentes gêneros", modalidade: "EJA 2º segmento", disciplina: "Língua Portuguesa" },
    { codigo: "EJA2LP02", descricao: "Produzir textos considerando a norma-padrão", modalidade: "EJA 2º segmento", disciplina: "Língua Portuguesa" },
    { codigo: "EJA2LP03", descricao: "Identificar tese e argumentos em textos argumentativos", modalidade: "EJA 2º segmento", disciplina: "Língua Portuguesa" },
    // Matemática
    { codigo: "EJA2MA01", descricao: "Resolver problemas envolvendo operações com números racionais", modalidade: "EJA 2º segmento", disciplina: "Matemática" },
    { codigo: "EJA2MA02", descricao: "Interpretar informações apresentadas em gráficos e tabelas", modalidade: "EJA 2º segmento", disciplina: "Matemática" },
    { codigo: "EJA2MA03", descricao: "Resolver problemas envolvendo equações do 1º grau", modalidade: "EJA 2º segmento", disciplina: "Matemática" },
    // Ciências
    { codigo: "EJA2CI01", descricao: "Compreender os conceitos básicos de ecologia e sustentabilidade", modalidade: "EJA 2º segmento", disciplina: "Ciências" },
    { codigo: "EJA2CI02", descricao: "Identificar os estados físicos da matéria e suas transformações", modalidade: "EJA 2º segmento", disciplina: "Ciências" },
    // Geografia
    { codigo: "EJA2GE01", descricao: "Analisar as dinâmicas populacionais e migratórias", modalidade: "EJA 2º segmento", disciplina: "Geografia" },
    // História
    { codigo: "EJA2HI01", descricao: "Compreender os principais processos históricos brasileiros", modalidade: "EJA 2º segmento", disciplina: "História" }
  ]
}

// Disciplinas disponíveis
export const DISCIPLINAS_OPCOES = [
  "Língua Portuguesa",
  "Matemática",
  "Ciências",
  "Geografia",
  "História"
]

// Escolas da rede
export const ESCOLAS_OPCOES = [
  "EMEB Dr. Gustavo Paiva",
  "EMEB Marieta Leão",
  "EMEF Dr. Gastão Oiticica",
  "EMEF Manoel Gonçalves da Silva",
  "EMEF Rosineide Teresa",
]

// Séries para EJA
export const getSeriesEJA = (modalidade: string) => {
  if (modalidade === "EJA 1º segmento") {
    return ["1º período", "2º período", "3º período", "4º período"]
  } else if (modalidade === "EJA 2º segmento") {
    return ["5º período", "6º período", "7º período", "8º período"]
  }
  return []
}

// Obter habilidades por modalidade e disciplina
export const getHabilidadesByModalidadeEDisciplina = (modalidade: string, disciplina: string): Habilidade[] => {
  const habilidades = HABILIDADES_POR_MODALIDADE[modalidade] || []
  if (!disciplina) return []
  return habilidades.filter(h => h.disciplina === disciplina)
}

// Obter habilidades por modalidade (mantido para compatibilidade)
export const getHabilidadesByModalidade = (modalidade: string): Habilidade[] => {
  return HABILIDADES_POR_MODALIDADE[modalidade] || []
}