-- Migration: Níveis de Acesso
-- Adiciona campo nivel_acesso na tabela perfis

ALTER TABLE perfis ADD COLUMN IF NOT EXISTS nivel_acesso VARCHAR(20) DEFAULT 'tecnico' CHECK (nivel_acesso IN ('tecnico', 'gerencial', 'diretivo', 'administrativo'));

-- Atualiza o admin existente para administrativo
UPDATE perfis SET nivel_acesso = 'administrativo' WHERE email IN ('admin@exemplo.com', 'jeffersonoxus@gmail.com');
