-- Criar tabela de profissionais
CREATE TABLE public.profissionais (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    especialidade TEXT,
    whatsapp TEXT,
    senha TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;

-- Políticas simples (em um cenário real usaríamos auth.uid(), mas o usuário pediu sistema de senha simples via tabela)
CREATE POLICY "Profissionais são visíveis por todos" ON public.profissionais FOR SELECT USING (true);
CREATE POLICY "Permitir tudo para anon por enquanto" ON public.profissionais FOR ALL USING (true);

-- Adicionar colunas em agendamentos
ALTER TABLE public.agendamentos ADD COLUMN profissional_id UUID REFERENCES public.profissionais(id);
ALTER TABLE public.agendamentos ADD COLUMN profissional_nome TEXT;

-- Adicionar colunas em horarios_bloqueados
ALTER TABLE public.horarios_bloqueados ADD COLUMN profissional_id UUID REFERENCES public.profissionais(id);
ALTER TABLE public.horarios_bloqueados ADD COLUMN profissional_nome TEXT;

-- Inserir Dra. Helena Martins como profissional inicial
INSERT INTO public.profissionais (nome, especialidade, whatsapp, senha)
VALUES ('Dra. Helena Martins', 'Psicóloga Clínica', '5511999999999', 'admin123');

-- Vincular agendamentos e bloqueios existentes à Dra. Helena
DO $$
DECLARE
    helena_id UUID;
BEGIN
    SELECT id INTO helena_id FROM public.profissionais WHERE nome = 'Dra. Helena Martins' LIMIT 1;
    
    UPDATE public.agendamentos SET profissional_id = helena_id, profissional_nome = 'Dra. Helena Martins' WHERE profissional_id IS NULL;
    UPDATE public.horarios_bloqueados SET profissional_id = helena_id, profissional_nome = 'Dra. Helena Martins' WHERE profissional_id IS NULL;
END $$;
