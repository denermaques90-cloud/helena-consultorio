ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Update RLS policies if necessary (usually they just use auth.uid() or are public for selection)
-- If there are specific policies, we might need to filter by deleted_at, but we'll handle that in the application logic for now.
