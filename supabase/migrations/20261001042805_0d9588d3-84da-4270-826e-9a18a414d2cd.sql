ALTER TABLE public.profiles ADD COLUMN quran_daily_goal integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_quran_daily_goal_range'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_quran_daily_goal_range CHECK (quran_daily_goal IS NULL OR (quran_daily_goal >= 5 AND quran_daily_goal <= 100));
  END IF;
END $$;