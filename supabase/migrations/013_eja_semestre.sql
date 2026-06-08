-- Migration: Adiciona campo semestre às lotações EJA para separar 2026.1 / 2026.2

ALTER TABLE eja_lotacoes ADD COLUMN IF NOT EXISTS semestre TEXT NOT NULL DEFAULT '2026.1';
CREATE INDEX IF NOT EXISTS idx_eja_lotacoes_semestre ON eja_lotacoes(semestre);
