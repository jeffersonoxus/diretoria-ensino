-- Migration: Adiciona campo regente (unidocência) para lotações da EJA
-- Quando um professor de 1º segmento é regente, ele cobre todas as disciplinas
-- exceto Educação Física naquela turma.

ALTER TABLE eja_lotacoes ADD COLUMN IF NOT EXISTS regente BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_eja_lotacoes_regente ON eja_lotacoes(regente);
