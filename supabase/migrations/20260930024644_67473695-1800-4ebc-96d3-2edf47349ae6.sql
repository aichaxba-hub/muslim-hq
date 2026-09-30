CREATE TABLE public.answered_duas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'My Duas',
  dua_text text,
  answered_date date NOT NULL DEFAULT CURRENT_DATE,
  reflection text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.answered_duas TO authenticated;
GRANT ALL ON public.answered_duas TO service_role;

ALTER TABLE public.answered_duas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own answered duas"
ON public.answered_duas
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER touch_answered_duas_updated_at
BEFORE UPDATE ON public.answered_duas
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();