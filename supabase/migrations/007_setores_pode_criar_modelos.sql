-- Migration 007: Adicionar coluna pode_criar_modelos na tabela setores
ALTER TABLE setores ADD COLUMN IF NOT EXISTS pode_criar_modelos BOOLEAN DEFAULT false;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
