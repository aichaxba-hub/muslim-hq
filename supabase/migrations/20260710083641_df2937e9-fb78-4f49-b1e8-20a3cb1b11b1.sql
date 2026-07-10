
-- Helper for updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  location_label TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  calc_method TEXT DEFAULT 'MoonsightingCommittee',
  theme TEXT DEFAULT 'light',
  onboarding_complete BOOLEAN DEFAULT false,
  seeded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- WORSHIP LOGS (daily)
CREATE TABLE public.worship_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  log_date DATE NOT NULL,
  fajr_status TEXT,
  dhuhr_status TEXT,
  asr_status TEXT,
  maghrib_status TEXT,
  isha_status TEXT,
  excused BOOLEAN DEFAULT false,
  excuse_type TEXT,
  sunnah BOOLEAN DEFAULT false,
  nafl BOOLEAN DEFAULT false,
  congregation BOOLEAN DEFAULT false,
  jummah BOOLEAN DEFAULT false,
  fasted BOOLEAN DEFAULT false,
  fast_type TEXT,
  quran_pages INT DEFAULT 0,
  quran_juz NUMERIC DEFAULT 0,
  quran_minutes INT DEFAULT 0,
  tafsir BOOLEAN DEFAULT false,
  dhikr_count INT DEFAULT 0,
  intention TEXT,
  remembered_allah BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.worship_logs TO authenticated;
GRANT ALL ON public.worship_logs TO service_role;
ALTER TABLE public.worship_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own worship" ON public.worship_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_worship_updated BEFORE UPDATE ON public.worship_logs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- QADA
CREATE TABLE public.qada_prayers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  prayer TEXT NOT NULL,
  missed_date DATE,
  made_up_date DATE,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qada_prayers TO authenticated;
GRANT ALL ON public.qada_prayers TO service_role;
ALTER TABLE public.qada_prayers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own qada" ON public.qada_prayers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_qada_updated BEFORE UPDATE ON public.qada_prayers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- QURAN LOGS
CREATE TABLE public.quran_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  log_date DATE NOT NULL,
  surah TEXT,
  juz NUMERIC,
  pages INT DEFAULT 0,
  minutes INT DEFAULT 0,
  tafsir BOOLEAN DEFAULT false,
  reflection TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quran_logs TO authenticated;
GRANT ALL ON public.quran_logs TO service_role;
ALTER TABLE public.quran_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own quran" ON public.quran_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- FASTING LOGS
CREATE TABLE public.fasting_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  log_date DATE NOT NULL,
  fast_type TEXT,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fasting_logs TO authenticated;
GRANT ALL ON public.fasting_logs TO service_role;
ALTER TABLE public.fasting_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own fasting" ON public.fasting_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DHIKR LOGS
CREATE TABLE public.dhikr_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  log_date DATE NOT NULL,
  category TEXT,
  count INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dhikr_logs TO authenticated;
GRANT ALL ON public.dhikr_logs TO service_role;
ALTER TABLE public.dhikr_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dhikr" ON public.dhikr_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DUAS (per-user vault; seeded on signup)
CREATE TABLE public.duas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  arabic TEXT,
  transliteration TEXT,
  translation TEXT,
  source TEXT,
  category TEXT,
  when_to_recite TEXT,
  favorited BOOLEAN DEFAULT false,
  personal_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.duas TO authenticated;
GRANT ALL ON public.duas TO service_role;
ALTER TABLE public.duas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own duas" ON public.duas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_duas_updated BEFORE UPDATE ON public.duas FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- REFLECTIONS
CREATE TABLE public.reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  week_start DATE,
  mood TEXT,
  closest_to_allah TEXT,
  fell_short TEXT,
  distraction TEXT,
  sincere_dua TEXT,
  one_change TEXT,
  wins TEXT,
  struggles TEXT,
  gratitude TEXT,
  next_intention TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reflections TO authenticated;
GRANT ALL ON public.reflections TO service_role;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reflections" ON public.reflections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_reflections_updated BEFORE UPDATE ON public.reflections FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- GOALS
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  why TEXT,
  quarter TEXT,
  target_date DATE,
  status TEXT DEFAULT 'Not Started',
  linked_habits TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals" ON public.goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ZAKAT
CREATE TABLE public.zakat_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  year INT NOT NULL,
  asset_type TEXT,
  amount NUMERIC DEFAULT 0,
  nisab NUMERIC DEFAULT 0,
  zakat_due NUMERIC DEFAULT 0,
  paid BOOLEAN DEFAULT false,
  date_paid DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zakat_entries TO authenticated;
GRANT ALL ON public.zakat_entries TO service_role;
ALTER TABLE public.zakat_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own zakat" ON public.zakat_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SADAQAH
CREATE TABLE public.sadaqah_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  log_date DATE NOT NULL,
  amount NUMERIC DEFAULT 0,
  cause TEXT,
  notes TEXT,
  ramadan BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sadaqah_logs TO authenticated;
GRANT ALL ON public.sadaqah_logs TO service_role;
ALTER TABLE public.sadaqah_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sadaqah" ON public.sadaqah_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
