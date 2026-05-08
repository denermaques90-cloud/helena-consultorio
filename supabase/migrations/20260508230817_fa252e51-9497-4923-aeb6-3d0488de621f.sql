
-- Tabela: servicos
CREATE TABLE public.servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tempo_minutos INTEGER NOT NULL DEFAULT 50,
  preco NUMERIC(10,2) DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: agendamentos
CREATE TABLE public.agendamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_nome TEXT NOT NULL,
  cliente_whatsapp TEXT NOT NULL,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  servico_id UUID,
  servico_ids UUID[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'confirmado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_agendamentos_data ON public.agendamentos(data);

-- Tabela: horarios_bloqueados
CREATE TABLE public.horarios_bloqueados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  hora TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bloqueados_data ON public.horarios_bloqueados(data);

-- Tabela: config (1 linha global, dia_semana = -1 = global)
CREATE TABLE public.config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dia_semana INTEGER NOT NULL DEFAULT -1,
  hora_abre TIME NOT NULL DEFAULT '08:00',
  hora_fecha TIME NOT NULL DEFAULT '20:00',
  intervalo_min INTEGER NOT NULL DEFAULT 50,
  senha_admin TEXT NOT NULL DEFAULT 'admin123',
  whatsapp_contato TEXT DEFAULT '5511999999999',
  instagram TEXT DEFAULT 'helenamartins.psi',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios_bloqueados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

-- Acesso público (demo - admin protegido por senha no front)
CREATE POLICY "servicos_all" ON public.servicos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "agendamentos_all" ON public.agendamentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "bloqueados_all" ON public.horarios_bloqueados FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "config_all" ON public.config FOR ALL USING (true) WITH CHECK (true);

-- Seed
INSERT INTO public.config (dia_semana, hora_abre, hora_fecha, intervalo_min, senha_admin, whatsapp_contato, instagram)
VALUES (-1, '08:00', '20:00', 50, 'admin123', '5511999999999', 'helenamartins.psi');

INSERT INTO public.servicos (nome, tempo_minutos, preco) VALUES
  ('Psicoterapia Individual', 50, 250),
  ('Atendimento Online', 50, 220),
  ('Primeira Consulta', 50, 200),
  ('Orientação Psicológica', 50, 230);
