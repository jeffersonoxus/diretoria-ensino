-- Migration: Adiciona CPF ao cadastro de servidores EJA

ALTER TABLE eja_servidores ADD COLUMN IF NOT EXISTS cpf TEXT;

CREATE INDEX IF NOT EXISTS idx_eja_servidores_cpf ON eja_servidores(cpf);
