-- Migration: Adiciona vinculo explícito entre servidor e escolas
-- Permite vincular um profissional a uma ou mais escolas mesmo sem lotação
-- O campo é preenchido automaticamente ao criar lotação

ALTER TABLE eja_servidores ADD COLUMN IF NOT EXISTS escola_ids UUID[] DEFAULT '{}';

-- GIN index for array search
CREATE INDEX IF NOT EXISTS idx_eja_servidores_escola_ids ON eja_servidores USING GIN (escola_ids);
