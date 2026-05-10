-- Add preco to servicos if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servicos' AND column_name = 'preco') THEN
        ALTER TABLE public.servicos ADD COLUMN preco DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Add valor_total to agendamentos if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'valor_total') THEN
        ALTER TABLE public.agendamentos ADD COLUMN valor_total DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Add role to profissionais if not exists (for master/owner check)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profissionais' AND column_name = 'role') THEN
        ALTER TABLE public.profissionais ADD COLUMN role TEXT DEFAULT 'funcionario';
    END IF;
END $$;

-- Set Helena Martins as owner
UPDATE public.profissionais SET role = 'owner' WHERE nome ILIKE 'Helena Martins';

-- Ensure indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON public.agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON public.agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_profissional ON public.agendamentos(profissional_id);
