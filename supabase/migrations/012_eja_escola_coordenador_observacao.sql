-- Migration: Adiciona coordenador às escolas e observação aos servidores EJA

ALTER TABLE escolas_eja ADD COLUMN IF NOT EXISTS coordenador_id UUID REFERENCES eja_servidores(id) ON DELETE SET NULL;

ALTER TABLE eja_servidores ADD COLUMN IF NOT EXISTS observacao TEXT;
