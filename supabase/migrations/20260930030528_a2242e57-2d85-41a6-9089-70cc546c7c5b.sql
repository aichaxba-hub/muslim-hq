CREATE TABLE public.quran_study_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  goal_date date NOT NULL DEFAULT CURRENT_DATE,
  surah_number integer NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  surah_name text NOT NULL,
  start_ayah integer NOT NULL DEFAULT 1 CHECK (start_ayah > 0),
  end_ayah integer NOT NULL CHECK (end_ayah > 0),
  last_completed_ayah integer NOT NULL DEFAULT 0 CHECK (last_completed_ayah >= 0),
  completed boolean NOT NULL DEFAULT false,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT quran_study_goals_valid_range CHECK (end_ayah >= start_ayah),
  CONSTRAINT quran_study_goals_valid_progress CHECK (last_completed_ayah = 0 OR last_completed_ayah BETWEEN start_ayah AND end_ayah)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quran_study_goals TO authenticated;
GRANT ALL ON public.quran_study_goals TO service_role;

ALTER TABLE public.quran_study_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own Quran study goals"
ON public.quran_study_goals
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER touch_quran_study_goals_updated_at
BEFORE UPDATE ON public.quran_study_goals
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();