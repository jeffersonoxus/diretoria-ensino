-- Migration 006: Adicionar coluna cancelamento_motivo na tabela acoes
-- Cria a tabela acoes se não existir (caso tenha sido criada diretamente no Supabase)
CREATE TABLE IF NOT EXISTS acoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT,
  pessoas TEXT[],
  setores_envolvidos UUID[],
  tipo_acao_id UUID REFERENCES tipo_acao(id) ON DELETE SET NULL,
  setor_id UUID REFERENCES setores(id) ON DELETE SET NULL,
  local TEXT,
  data_inicio TIMESTAMPTZ,
  data_fim TIMESTAMPTZ,
  necessita_transporte BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'Pendente',
  cancelamento_motivo TEXT,
  dados_extras JSONB,
  observacoes TEXT,
  created_by UUID REFERENCES perfis(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES perfis(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adiciona a coluna caso a tabela já exista sem ela
ALTER TABLE acoes ADD COLUMN IF NOT EXISTS cancelamento_motivo TEXT;

-- Refresh schema cache (comando aceito pelo Supabase)
NOTIFY pgrst, 'reload schema';
