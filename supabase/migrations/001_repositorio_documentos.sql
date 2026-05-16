-- Migration: Módulo Repositório de Documentos
-- Cria as tabelas necessárias e configura RLS

-- 1. CATEGORIAS DE DOCUMENTO
CREATE TABLE IF NOT EXISTS categorias_documento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  setor_id UUID REFERENCES setores(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE categorias_documento ENABLE ROW LEVEL SECURITY;

-- 2. FORMATOS DE DOCUMENTO
CREATE TABLE IF NOT EXISTS formatos_documento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  extensao VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE formatos_documento ENABLE ROW LEVEL SECURITY;

-- 3. DOCUMENTOS (tabela principal)
CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(500) NOT NULL,
  descricao TEXT,
  categoria_id UUID REFERENCES categorias_documento(id) ON DELETE SET NULL,
  formato_id UUID REFERENCES formatos_documento(id) ON DELETE SET NULL,
  setor_id UUID REFERENCES setores(id) NOT NULL,
  arquivo_url TEXT NOT NULL,
  arquivo_nome VARCHAR(500) NOT NULL,
  arquivo_tamanho BIGINT NOT NULL,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'pendente', 'rejeitado')),
  motivo_tamanho TEXT,
  tags TEXT[] DEFAULT '{}',
  codigo_acesso VARCHAR(50) UNIQUE,
  criado_por UUID REFERENCES perfis(id) NOT NULL,
  aprovado_por UUID REFERENCES perfis(id),
  atualizado_por UUID REFERENCES perfis(id),
  substituido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- 4. LIMITES DE STORAGE POR SETOR
CREATE TABLE IF NOT EXISTS limites_setor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setor_id UUID REFERENCES setores(id) UNIQUE NOT NULL,
  storage_limit_bytes BIGINT NOT NULL DEFAULT 524288000, -- 500 MB default
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE limites_setor ENABLE ROW LEVEL SECURITY;

-- 5. UPLOAD_TICKETS (para validação server-side pré-upload)
CREATE TABLE IF NOT EXISTS upload_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setor_id UUID REFERENCES setores(id) NOT NULL,
  criado_por UUID REFERENCES perfis(id) NOT NULL,
  arquivo_nome VARCHAR(500) NOT NULL,
  arquivo_tamanho BIGINT NOT NULL,
  usado BOOLEAN DEFAULT false,
  expira_em TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE upload_tickets ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES =====

-- CATEGORIAS: todos autenticados podem ver, admin gerencia
CREATE POLICY "categorias_select_autenticado" ON categorias_documento
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "categorias_insert_admin" ON categorias_documento
  FOR INSERT WITH CHECK (auth.email() IN ('admin@exemplo.com', 'jeffersonoxus@gmail.com'));

CREATE POLICY "categorias_update_admin" ON categorias_documento
  FOR UPDATE USING (auth.email() IN ('admin@exemplo.com', 'jeffersonoxus@gmail.com'));

CREATE POLICY "categorias_delete_admin" ON categorias_documento
  FOR DELETE USING (auth.email() IN ('admin@exemplo.com', 'jeffersonoxus@gmail.com'));

-- FORMATOS: todos autenticados podem ver, admin gerencia
CREATE POLICY "formatos_select_autenticado" ON formatos_documento
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "formatos_insert_admin" ON formatos_documento
  FOR INSERT WITH CHECK (auth.email() IN ('admin@exemplo.com', 'jeffersonoxus@gmail.com'));

CREATE POLICY "formatos_update_admin" ON formatos_documento
  FOR UPDATE USING (auth.email() IN ('admin@exemplo.com', 'jeffersonoxus@gmail.com'));

CREATE POLICY "formatos_delete_admin" ON formatos_documento
  FOR DELETE USING (auth.email() IN ('admin@exemplo.com', 'jeffersonoxus@gmail.com'));

-- DOCUMENTOS: RLS principal
-- SELECT: usuário vê documentos do seu setor OU se for admin
CREATE POLICY "documentos_select_setor" ON documentos
  FOR SELECT USING (
    auth.email() IN ('admin@exemplo.com', 'jeffersonoxus@gmail.com')
    OR setor_id IN (
      SELECT s.id FROM setores s 
      WHERE s.pessoas @> ARRAY[(SELECT id FROM perfis WHERE email = auth.email())]::text[]
    )
  );

-- INSERT: usuário autenticado pode inserir
CREATE POLICY "documentos_insert_autenticado" ON documentos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: admin pode alterar status (aprovar/rejeitar); usuário comum pode editar docs do seu setor
CREATE POLICY "documentos_update_admin" ON documentos
  FOR UPDATE USING (auth.email() IN ('admin@exemplo.com', 'jeffersonoxus@gmail.com'));

CREATE POLICY "documentos_update_setor" ON documentos
  FOR UPDATE USING (
    setor_id IN (
      SELECT s.id FROM setores s 
      WHERE s.pessoas @> ARRAY[(SELECT id FROM perfis WHERE email = auth.email())]::text[]
    )
  );

-- DELETE: apenas admin
CREATE POLICY "documentos_delete_admin" ON documentos
  FOR DELETE USING (auth.email() IN ('admin@exemplo.com', 'jeffersonoxus@gmail.com'));

-- LIMITES_SETOR: todos veem, admin gerencia
CREATE POLICY "limites_select_autenticado" ON limites_setor
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "limites_insert_admin" ON limites_setor
  FOR INSERT WITH CHECK (auth.email() IN ('admin@exemplo.com', 'jeffersonoxus@gmail.com'));

CREATE POLICY "limites_update_admin" ON limites_setor
  FOR UPDATE USING (auth.email() IN ('admin@exemplo.com', 'jeffersonoxus@gmail.com'));

CREATE POLICY "limites_delete_admin" ON limites_setor
  FOR DELETE USING (auth.email() IN ('admin@exemplo.com', 'jeffersonoxus@gmail.com'));

-- UPLOAD_TICKETS: cada usuário vê seus próprios tickets
CREATE POLICY "tickets_select_proprio" ON upload_tickets
  FOR SELECT USING (criado_por = (SELECT id FROM perfis WHERE email = auth.email()));

CREATE POLICY "tickets_insert_autenticado" ON upload_tickets
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "tickets_update_proprio" ON upload_tickets
  FOR UPDATE USING (criado_por = (SELECT id FROM perfis WHERE email = auth.email()));

-- ===== ÍNDICES =====
CREATE INDEX IF NOT EXISTS idx_documentos_setor_id ON documentos(setor_id);
CREATE INDEX IF NOT EXISTS idx_documentos_categoria_id ON documentos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_documentos_status ON documentos(status);
CREATE INDEX IF NOT EXISTS idx_documentos_codigo_acesso ON documentos(codigo_acesso);
CREATE INDEX IF NOT EXISTS idx_documentos_criado_por ON documentos(criado_por);
CREATE INDEX IF NOT EXISTS idx_documentos_tags ON documentos USING GIN(tags);
