-- Remove restrição de setor na consulta de documentos
-- Agora todos os usuários autenticados podem ver todos os documentos
-- Exclusão continua restrita a admin emails (policy existente)

DROP POLICY IF EXISTS "documentos_select_setor" ON documentos;
CREATE POLICY "documentos_select_todos" ON documentos
  FOR SELECT USING (auth.role() = 'authenticated');
