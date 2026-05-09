-- Ensure role column exists with proper constraint
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profissionais' AND column_name = 'role') THEN
    ALTER TABLE public.profissionais ADD COLUMN role TEXT DEFAULT 'funcionario';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profissionais' AND column_name = 'senha') THEN
    ALTER TABLE public.profissionais ADD COLUMN senha TEXT;
  END IF;
END $$;

-- Update or insert owner account
-- We use a unique constraint on 'nome' if it exists, or check by name. 
-- For safety in this environment, we'll try to find if she exists.
DO $$
DECLARE
    owner_exists BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM public.profissionais WHERE nome = 'Helena Martins') INTO owner_exists;
    IF owner_exists THEN
        UPDATE public.profissionais SET role = 'owner', senha = '090223' WHERE nome = 'Helena Martins';
    ELSE
        INSERT INTO public.profissionais (nome, especialidade, whatsapp, ativo, role, senha)
        VALUES ('Helena Martins', 'Proprietária', '5511999999999', true, 'owner', '090223');
    END IF;
END $$;
