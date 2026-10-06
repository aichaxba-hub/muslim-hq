ALTER TABLE public.worship_logs
  ADD COLUMN IF NOT EXISTS fajr_sunnah_before boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dhuhr_sunnah_before boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dhuhr_sunnah_after boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS maghrib_sunnah_after boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS isha_sunnah_after boolean NOT NULL DEFAULT false;