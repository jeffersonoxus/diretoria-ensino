-- Migration: Módulo EJA - Gestão de Pessoal
-- Cria tabelas para servidores, lotações e matriz da EJA

-- 1. EJA SERVIDORES
CREATE TABLE IF NOT EXISTS eja_servidores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  matricula TEXT,
  funcao TEXT NOT NULL,
  carga_horaria_base INTEGER,
  escolas_ids UUID[] DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Allow null matricula and remove unique constraint (not all professionals have a registration number)
ALTER TABLE eja_servidores ALTER COLUMN matricula DROP NOT NULL;
ALTER TABLE eja_servidores DROP CONSTRAINT IF EXISTS eja_servidores_matricula_key;

-- Add classificacao column if it doesn't exist (tables may have been created before this migration was updated)
ALTER TABLE eja_servidores ADD COLUMN IF NOT EXISTS classificacao TEXT NOT NULL DEFAULT '1º segmento';
-- Drop and recreate the CHECK constraint to ensure it's correct
ALTER TABLE eja_servidores DROP CONSTRAINT IF EXISTS eja_servidores_classificacao_check;
ALTER TABLE eja_servidores ADD CONSTRAINT eja_servidores_classificacao_check CHECK (classificacao IN ('1º segmento', '2º segmento', 'Educação Física', 'Coordenador'));
-- Remove disciplina column if it exists from earlier schema
ALTER TABLE eja_servidores DROP COLUMN IF EXISTS disciplina;

ALTER TABLE eja_servidores ENABLE ROW LEVEL SECURITY;

-- 2. EJA LOTAÇÕES
CREATE TABLE IF NOT EXISTS eja_lotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID NOT NULL REFERENCES eja_servidores(id) ON DELETE CASCADE,
  escola_id UUID NOT NULL REFERENCES escolas_eja(id) ON DELETE CASCADE,
  turma_id TEXT,
  disciplina TEXT,
  carga_horaria INTEGER,
  funcao_na_lotacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE eja_lotacoes ENABLE ROW LEVEL SECURITY;

-- 3. EJA MATRIZ (disciplinas obrigatórias por segmento)
CREATE TABLE IF NOT EXISTS eja_matriz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segmento TEXT NOT NULL,
  disciplina TEXT NOT NULL,
  ch_prevista INTEGER,
  turmas_por_professor INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(segmento, disciplina)
);

ALTER TABLE eja_matriz ENABLE ROW LEVEL SECURITY;

-- 4. EJA MATRIZ ESCOLA (variações por escola, opcional)
CREATE TABLE IF NOT EXISTS eja_matriz_escola (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES escolas_eja(id) ON DELETE CASCADE,
  segmento TEXT NOT NULL,
  disciplina TEXT NOT NULL,
  ch_prevista INTEGER,
  turmas_por_professor INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(escola_id, segmento, disciplina)
);

ALTER TABLE eja_matriz_escola ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES =====
-- Acesso liberado para autenticados (permissão controlada via UI/client-side)

DROP POLICY IF EXISTS "eja_servidores_select" ON eja_servidores;
CREATE POLICY "eja_servidores_select" ON eja_servidores
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "eja_servidores_insert" ON eja_servidores;
CREATE POLICY "eja_servidores_insert" ON eja_servidores
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "eja_servidores_update" ON eja_servidores;
CREATE POLICY "eja_servidores_update" ON eja_servidores
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "eja_servidores_delete" ON eja_servidores;
CREATE POLICY "eja_servidores_delete" ON eja_servidores
  FOR DELETE USING (auth.role() = 'authenticated');

--

DROP POLICY IF EXISTS "eja_lotacoes_select" ON eja_lotacoes;
CREATE POLICY "eja_lotacoes_select" ON eja_lotacoes
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "eja_lotacoes_insert" ON eja_lotacoes;
CREATE POLICY "eja_lotacoes_insert" ON eja_lotacoes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "eja_lotacoes_update" ON eja_lotacoes;
CREATE POLICY "eja_lotacoes_update" ON eja_lotacoes
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "eja_lotacoes_delete" ON eja_lotacoes;
CREATE POLICY "eja_lotacoes_delete" ON eja_lotacoes
  FOR DELETE USING (auth.role() = 'authenticated');

--

DROP POLICY IF EXISTS "eja_matriz_select" ON eja_matriz;
CREATE POLICY "eja_matriz_select" ON eja_matriz
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "eja_matriz_insert" ON eja_matriz;
CREATE POLICY "eja_matriz_insert" ON eja_matriz
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "eja_matriz_update" ON eja_matriz;
CREATE POLICY "eja_matriz_update" ON eja_matriz
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "eja_matriz_delete" ON eja_matriz;
CREATE POLICY "eja_matriz_delete" ON eja_matriz
  FOR DELETE USING (auth.role() = 'authenticated');

--

DROP POLICY IF EXISTS "eja_matriz_escola_select" ON eja_matriz_escola;
CREATE POLICY "eja_matriz_escola_select" ON eja_matriz_escola
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "eja_matriz_escola_insert" ON eja_matriz_escola;
CREATE POLICY "eja_matriz_escola_insert" ON eja_matriz_escola
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "eja_matriz_escola_update" ON eja_matriz_escola;
CREATE POLICY "eja_matriz_escola_update" ON eja_matriz_escola
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "eja_matriz_escola_delete" ON eja_matriz_escola;
CREATE POLICY "eja_matriz_escola_delete" ON eja_matriz_escola
  FOR DELETE USING (auth.role() = 'authenticated');

-- ===== ÍNDICES =====
CREATE INDEX IF NOT EXISTS idx_eja_servidores_matricula ON eja_servidores(matricula);
CREATE INDEX IF NOT EXISTS idx_eja_servidores_funcao ON eja_servidores(funcao);
CREATE INDEX IF NOT EXISTS idx_eja_servidores_classificacao ON eja_servidores(classificacao);
CREATE INDEX IF NOT EXISTS idx_eja_servidores_ativo ON eja_servidores(ativo);
CREATE INDEX IF NOT EXISTS idx_eja_lotacoes_servidor ON eja_lotacoes(servidor_id);
CREATE INDEX IF NOT EXISTS idx_eja_lotacoes_escola ON eja_lotacoes(escola_id);
CREATE INDEX IF NOT EXISTS idx_eja_lotacoes_turma ON eja_lotacoes(turma_id);
