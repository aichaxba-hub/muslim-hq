ALTER TABLE public.duas ADD COLUMN IF NOT EXISTS is_custom boolean NOT NULL DEFAULT false;

UPDATE public.duas SET is_custom = true WHERE arabic IS NULL;