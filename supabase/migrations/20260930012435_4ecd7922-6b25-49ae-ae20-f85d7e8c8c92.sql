ALTER TABLE public.worship_logs
  ADD COLUMN IF NOT EXISTS fajr_congregation boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS fajr_masjid boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS dhuhr_congregation boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS dhuhr_masjid boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS asr_congregation boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS asr_masjid boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS maghrib_congregation boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS maghrib_masjid boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS isha_congregation boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS isha_masjid boolean DEFAULT false;