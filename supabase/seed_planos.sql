-- Seed: Planos de Ação sugeridos
-- Rode após a migration 004_planos_acao.sql

DO $$
DECLARE
  v_setor_pedagogico UUID;
  v_setor_eja UUID;
  v_setor_admin UUID;
  v_perfil_admin UUID;
  v_perfil_jefferson UUID;
BEGIN
  -- Buscar setores existentes
  SELECT id INTO v_setor_pedagogico FROM setores WHERE nome ILIKE '%pedag%' LIMIT 1;
  SELECT id INTO v_setor_eja FROM setores WHERE nome ILIKE '%eja%' OR nome ILIKE '%educação de jovens%' LIMIT 1;
  SELECT id INTO v_setor_admin FROM setores WHERE nome ILIKE '%admin%' OR nome ILIKE '%dien%' OR nome ILIKE '%diretoria%' LIMIT 1;
  IF v_setor_pedagogico IS NULL THEN SELECT id INTO v_setor_pedagogico FROM setores LIMIT 1; END IF;
  IF v_setor_eja IS NULL THEN v_setor_eja := v_setor_pedagogico; END IF;
  IF v_setor_admin IS NULL THEN v_setor_admin := v_setor_pedagogico; END IF;

  -- Buscar perfis
  SELECT id INTO v_perfil_admin FROM perfis WHERE email = 'admin@exemplo.com' LIMIT 1;
  SELECT id INTO v_perfil_jefferson FROM perfis WHERE email = 'jeffersonoxus@gmail.com' LIMIT 1;
  IF v_perfil_admin IS NULL THEN SELECT id INTO v_perfil_admin FROM perfis LIMIT 1; END IF;
  IF v_perfil_jefferson IS NULL THEN v_perfil_jefferson := v_perfil_admin; END IF;

  -- ==================== PLANOS ====================
  INSERT INTO planos_acao (id, titulo, descricao, setor_id, responsavel, prazo, prioridade, status, observacoes, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'a0000000-0000-0000-0000-000000000001', 'Melhoria do IDEB - Anos Iniciais',
    'Plano para elevar o IDEB da rede municipal de 4.9 para 5.5 até 2027.',
    v_setor_pedagogico, 'Coordenação Pedagógica', '2027-12-31', 'alta', 'em_andamento',
    'Necessário articular com todas as escolas da rede.', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM planos_acao WHERE id = 'a0000000-0000-0000-0000-000000000001');

  INSERT INTO planos_acao (id, titulo, descricao, setor_id, responsavel, prazo, prioridade, status, observacoes, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'a0000000-0000-0000-0000-000000000002', 'Busca Ativa e Combate ao Abandono',
    'Estratégias para reduzir o abandono escolar na EJA e Anos Finais.',
    v_setor_eja, 'Setor EJA', '2025-12-31', 'alta', 'em_andamento', NULL,
    v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM planos_acao WHERE id = 'a0000000-0000-0000-0000-000000000002');

  INSERT INTO planos_acao (id, titulo, descricao, setor_id, responsavel, prazo, prioridade, status, observacoes, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'a0000000-0000-0000-0000-000000000003', 'Fortalecimento da EJA',
    'Reestruturação pedagógica e administrativa da Educação de Jovens e Adultos.',
    v_setor_eja, 'Coordenação EJA', '2025-12-31', 'media', 'em_andamento',
    'Aguardando liberação de recursos do FNDE para material didático.',
    v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM planos_acao WHERE id = 'a0000000-0000-0000-0000-000000000003');

  INSERT INTO planos_acao (id, titulo, descricao, setor_id, responsavel, prazo, prioridade, status, observacoes, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'a0000000-0000-0000-0000-000000000004', 'Implementação das Avaliações Diagnósticas',
    'Criação e aplicação de avaliações diagnósticas padronizadas para toda a rede.',
    v_setor_pedagogico, 'DIEN', '2025-08-31', 'alta', 'concluido',
    'Avaliações aplicadas com sucesso em todas as turmas.',
    v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM planos_acao WHERE id = 'a0000000-0000-0000-0000-000000000004');

  INSERT INTO planos_acao (id, titulo, descricao, setor_id, responsavel, prazo, prioridade, status, observacoes, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'a0000000-0000-0000-0000-000000000005', 'Formação Continuada de Professores',
    'Programa anual de formação continuada em parceria com universidades.',
    v_setor_pedagogico, 'Coordenação de Formação', '2025-12-31', 'alta', 'em_andamento', NULL,
    v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM planos_acao WHERE id = 'a0000000-0000-0000-0000-000000000005');

  INSERT INTO planos_acao (id, titulo, descricao, setor_id, responsavel, prazo, prioridade, status, observacoes, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'a0000000-0000-0000-0000-000000000006', 'Modernização da Gestão Escolar',
    'Digitalização dos processos administrativos e pedagógicos das escolas.',
    v_setor_admin, 'Secretaria de Educação', '2026-06-30', 'baixa', 'nao_iniciado', NULL,
    v_perfil_jefferson, v_perfil_jefferson, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM planos_acao WHERE id = 'a0000000-0000-0000-0000-000000000006');

  -- ==================== METAS (plano 1 - IDEB) ====================
  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
    'Formação continuada para 100% dos professores de Língua Portuguesa', true, '2025-06-30',
    'Coordenação de Formação', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000001');

  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
    'Formação continuada para 100% dos professores de Matemática', true, '2025-06-30',
    'Coordenação de Formação', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000002');

  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
    'Implementar avaliações diagnósticas bimestrais em todas as escolas', false, '2025-08-31',
    'DIEN', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000003');

  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
    'Reduzir distorção idade-série para abaixo de 15%', false, '2026-06-30',
    'Coordenação', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000004');

  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
    'Atingir proficiência média de 50% em Português no SAEB', false, '2027-12-31',
    'Toda a rede', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000005');

  -- ==================== METAS (plano 2 - Busca Ativa) ====================
  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002',
    'Mapear 100% dos alunos infrequentes mensalmente', true, '2025-04-30',
    'Secretarias Escolares', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000006');

  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002',
    'Reduzir abandono na EJA para abaixo de 5%', false, '2025-12-31',
    'Setor EJA', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000007');

  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002',
    'Implementar programa de tutoria para alunos com risco de abandono', false, '2025-09-30',
    'Coordenação', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000008');

  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000002',
    'Visitas domiciliares para 100% dos alunos faltosos crônicos', false, '2025-12-31',
    'Assistência Social', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000009');

  -- ==================== METAS (plano 3 - EJA) ====================
  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000003',
    'Elaborar novo currículo da EJA alinhado à BNCC', true, '2025-05-31',
    'Equipe Pedagógica', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000010');

  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000003',
    'Capacitar professores da EJA em metodologias específicas', false, '2025-08-31',
    'Coordenação de Formação', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000011');

  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000003',
    'Adquirir material didático específico para EJA', false, '2025-10-31',
    'Setor de Compras', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000012');

  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000003',
    'Aumentar matrículas da EJA em 20%', false, '2025-12-31',
    'Setor EJA', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000013');

  -- ==================== METAS (plano 4 - Avaliações) ====================
  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000004',
    'Elaborar matriz de habilidades por etapa/disciplina', true, '2025-03-31',
    'DIEN', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000014');

  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000004',
    'Criar banco de itens alinhado à BNCC', true, '2025-04-30',
    'Equipe Pedagógica', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000015');

  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000004',
    'Aplicar avaliação diagnóstica em todas as turmas', true, '2025-06-30',
    'Escolas', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000016');

  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000004',
    'Devolutiva dos resultados para as escolas', true, '2025-07-31',
    'DIEN', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000017');

  -- ==================== METAS (plano 5 - Formação) ====================
  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000005',
    '80h de formação em Língua Portuguesa para professores', false, '2025-11-30',
    'Coordenação de Formação', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000018');

  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000005',
    '80h de formação em Matemática para professores', false, '2025-11-30',
    'Coordenação de Formação', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000019');

  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000005',
    '40h de formação em Tecnologias Educacionais', true, '2025-06-30',
    'Coordenação de Formação', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000020');

  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000005',
    'Carga horária total: 200h de formação por professor/ano', false, '2025-12-31',
    'Coordenação de Formação', v_perfil_admin, v_perfil_admin, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000021');

  -- ==================== METAS (plano 6 - Modernização) ====================
  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000006',
    'Implementar sistema de diário de classe digital', false, '2026-03-31',
    'TI', v_perfil_jefferson, v_perfil_jefferson, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000022');

  INSERT INTO metas (id, plano_id, descricao, concluida, prazo, responsavel, criado_por, atualizado_por, created_at, updated_at)
  SELECT 'b0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000006',
    'Digitalizar acervo de documentos das escolas', false, '2026-06-30',
    'Secretarias', v_perfil_jefferson, v_perfil_jefferson, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM metas WHERE id = 'b0000000-0000-0000-0000-000000000023');

END $$;
