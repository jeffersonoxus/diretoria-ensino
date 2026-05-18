-- Migration: Permitir exclusão de setores sem perder documentos
-- Altera FKs para que a exclusão de um setor:
--   - Mantenha documentos órfãos (setor_id → NULL)
--   - Remova limites_setor e upload_tickets automaticamente (CASCADE)

-- 1. Remover a constraint NOT NULL + FK existente em documentos.setor_id
ALTER TABLE documentos
  DROP CONSTRAINT IF EXISTS documentos_setor_id_fkey,
  ALTER COLUMN setor_id DROP NOT NULL;

-- 2. Recriar a FK com ON DELETE SET NULL
ALTER TABLE documentos
  ADD CONSTRAINT documentos_setor_id_fkey
  FOREIGN KEY (setor_id) REFERENCES setores(id) ON DELETE SET NULL;

-- 3. Criar índice para buscas com setor_id IS NULL
CREATE INDEX IF NOT EXISTS idx_documentos_setor_id_null
  ON documentos(setor_id) WHERE setor_id IS NULL;

-- 4. Adicionar ON DELETE CASCADE em limites_setor
ALTER TABLE limites_setor
  DROP CONSTRAINT IF EXISTS limites_setor_setor_id_fkey,
  ADD CONSTRAINT limites_setor_setor_id_fkey
  FOREIGN KEY (setor_id) REFERENCES setores(id) ON DELETE CASCADE;

-- 5. Adicionar ON DELETE CASCADE em upload_tickets
ALTER TABLE upload_tickets
  DROP CONSTRAINT IF EXISTS upload_tickets_setor_id_fkey,
  ADD CONSTRAINT upload_tickets_setor_id_fkey
  FOREIGN KEY (setor_id) REFERENCES setores(id) ON DELETE CASCADE;

-- 6. Atualizar RLS policy SELECT para incluir admins vendo documentos com setor_id NULL
DROP POLICY IF EXISTS "documentos_select_setor" ON documentos;
CREATE POLICY "documentos_select_setor" ON documentos
  FOR SELECT USING (
    auth.email() IN ('admin@exemplo.com', 'jeffersonoxus@gmail.com')
    OR (
      setor_id IS NOT NULL
      AND setor_id IN (
        SELECT s.id FROM setores s 
        WHERE s.pessoas @> ARRAY[(SELECT id FROM perfis WHERE email = auth.email())]::text[]
      )
    )
  );

-- 7. Atualizar RLS policy UPDATE para tratar NULL corretamente
DROP POLICY IF EXISTS "documentos_update_setor" ON documentos;
CREATE POLICY "documentos_update_setor" ON documentos
  FOR UPDATE USING (
    setor_id IS NOT NULL
    AND setor_id IN (
      SELECT s.id FROM setores s 
      WHERE s.pessoas @> ARRAY[(SELECT id FROM perfis WHERE email = auth.email())]::text[]
    )
  );
