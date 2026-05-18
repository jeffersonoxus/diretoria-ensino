-- Migration 004: Criar tabelas planos_acao e metas
CREATE TABLE IF NOT EXISTS planos_acao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(500) NOT NULL,
  descricao TEXT,
  setor_id UUID REFERENCES setores(id) ON DELETE SET NULL,
  responsavel VARCHAR(255),
  prazo DATE,
  prioridade VARCHAR(20) DEFAULT 'media' CHECK (prioridade IN ('alta', 'media', 'baixa')),
  status VARCHAR(20) DEFAULT 'nao_iniciado' CHECK (status IN ('nao_iniciado', 'em_andamento', 'concluido', 'atrasado')),
  observacoes TEXT,
  criado_por UUID REFERENCES perfis(id) NOT NULL,
  atualizado_por UUID REFERENCES perfis(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID REFERENCES planos_acao(id) ON DELETE CASCADE NOT NULL,
  descricao TEXT NOT NULL,
  concluida BOOLEAN DEFAULT false,
  prazo DATE,
  responsavel VARCHAR(255),
  criado_por UUID REFERENCES perfis(id) NOT NULL,
  atualizado_por UUID REFERENCES perfis(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_planos_acao_setor_id ON planos_acao(setor_id);
CREATE INDEX IF NOT EXISTS idx_planos_acao_criado_por ON planos_acao(criado_por);
CREATE INDEX IF NOT EXISTS idx_planos_acao_status ON planos_acao(status);
CREATE INDEX IF NOT EXISTS idx_metas_plano_id ON metas(plano_id);

-- RLS
ALTER TABLE planos_acao ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

-- Políticas: todos os autenticados podem ver todos os planos
DROP POLICY IF EXISTS "Todos podem ver planos_acao" ON planos_acao;
CREATE POLICY "Todos podem ver planos_acao" ON planos_acao
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Todos podem inserir planos_acao" ON planos_acao;
CREATE POLICY "Todos podem inserir planos_acao" ON planos_acao
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Criador e administrativo podem atualizar planos_acao" ON planos_acao;
CREATE POLICY "Criador e administrativo podem atualizar planos_acao" ON planos_acao
  FOR UPDATE USING (
    criado_por = auth.uid() OR 
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND nivel_acesso IN ('administrativo', 'gerencial', 'diretivo'))
  );

DROP POLICY IF EXISTS "Criador e administrativo podem deletar planos_acao" ON planos_acao;
CREATE POLICY "Criador e administrativo podem deletar planos_acao" ON planos_acao
  FOR DELETE USING (
    criado_por = auth.uid() OR 
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND nivel_acesso IN ('administrativo', 'gerencial'))
  );

-- Políticas para metas
DROP POLICY IF EXISTS "Todos podem ver metas" ON metas;
CREATE POLICY "Todos podem ver metas" ON metas
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Todos podem inserir metas" ON metas;
CREATE POLICY "Todos podem inserir metas" ON metas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Criador e administrativo podem atualizar metas" ON metas;
CREATE POLICY "Criador e administrativo podem atualizar metas" ON metas
  FOR UPDATE USING (
    criado_por = auth.uid() OR 
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND nivel_acesso IN ('administrativo', 'gerencial', 'diretivo'))
  );

DROP POLICY IF EXISTS "Criador e administrativo podem deletar metas" ON metas;
CREATE POLICY "Criador e administrativo podem deletar metas" ON metas
  FOR DELETE USING (
    criado_por = auth.uid() OR 
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND nivel_acesso IN ('administrativo', 'gerencial'))
  );
