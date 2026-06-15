CREATE TABLE IF NOT EXISTS public.acao_locais (
  acao_id UUID NOT NULL REFERENCES public.acoes(id) ON DELETE CASCADE,
  local_id UUID NOT NULL REFERENCES public.locais(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (acao_id, local_id)
);

CREATE INDEX IF NOT EXISTS idx_acao_locais_acao_id ON public.acao_locais(acao_id);
CREATE INDEX IF NOT EXISTS idx_acao_locais_local_id ON public.acao_locais(local_id);

INSERT INTO public.acao_locais (acao_id, local_id)
SELECT a.id, l.id
FROM public.acoes a
JOIN public.locais l ON l.nome = a.local
WHERE a.local IS NOT NULL AND a.local != ''
ON CONFLICT (acao_id, local_id) DO NOTHING;

ALTER TABLE public.acao_locais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso geral acao_locais" ON public.acao_locais;
CREATE POLICY "Acesso geral acao_locais" ON public.acao_locais
  FOR ALL
  USING (true)
  WITH CHECK (true);
