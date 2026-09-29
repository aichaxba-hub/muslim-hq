CREATE TABLE public.ramadan_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  salah_goal text, quran_goal text, fasting_goal text, dua_goal text, intention text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ramadan_plans TO authenticated;
GRANT ALL ON public.ramadan_plans TO service_role;
ALTER TABLE public.ramadan_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ramadan plan" ON public.ramadan_plans FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_ramadan_plans_updated BEFORE UPDATE ON public.ramadan_plans FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.ramadan_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  log_date date NOT NULL,
  items jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ramadan_checklist TO authenticated;
GRANT ALL ON public.ramadan_checklist TO service_role;
ALTER TABLE public.ramadan_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ramadan checklist" ON public.ramadan_checklist FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_ramadan_checklist_updated BEFORE UPDATE ON public.ramadan_checklist FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();