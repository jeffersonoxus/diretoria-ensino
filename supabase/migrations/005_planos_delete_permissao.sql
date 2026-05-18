-- Migration 005: Permitir que nível gerencial também possa deletar planos e metas
-- Requisito: gerencial e administrativo podem editar e apagar

DROP POLICY IF EXISTS "Criador e administrativo podem deletar planos_acao" ON planos_acao;
CREATE POLICY "Criador e administrativo podem deletar planos_acao" ON planos_acao
  FOR DELETE USING (
    criado_por = auth.uid() OR
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND nivel_acesso IN ('administrativo', 'gerencial'))
  );

DROP POLICY IF EXISTS "Criador e administrativo podem deletar metas" ON metas;
CREATE POLICY "Criador e administrativo podem deletar metas" ON metas
  FOR DELETE USING (
    criado_por = auth.uid() OR
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND nivel_acesso IN ('administrativo', 'gerencial'))
  );
