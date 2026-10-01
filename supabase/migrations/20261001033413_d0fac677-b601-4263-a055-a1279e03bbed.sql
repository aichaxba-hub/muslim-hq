CREATE TABLE public.worship_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.worship_backups TO authenticated;
GRANT ALL ON public.worship_backups TO service_role;
ALTER TABLE public.worship_backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage worship backups" ON public.worship_backups FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_worship_backups_updated BEFORE UPDATE ON public.worship_backups FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE OR REPLACE FUNCTION public.restore_worship_backup(backup_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  saved jsonb;
  salah_count integer := 0;
  qada_count integer := 0;
  quran_count integer := 0;
  fasting_count integer := 0;
  dhikr_count integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to restore a backup'; END IF;
  SELECT snapshot INTO saved FROM public.worship_backups WHERE id = backup_id AND user_id = auth.uid();
  IF saved IS NULL THEN RAISE EXCEPTION 'Backup not found'; END IF;
  IF jsonb_typeof(saved) <> 'object' THEN RAISE EXCEPTION 'Invalid backup'; END IF;
  INSERT INTO public.worship_logs SELECT r.* FROM jsonb_populate_recordset(NULL::public.worship_logs,
    (SELECT jsonb_agg(jsonb_set(item, '{user_id}', to_jsonb(auth.uid()))) FROM jsonb_array_elements(COALESCE(saved->'worship_logs', '[]'::jsonb)) item)) r
    ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS salah_count = ROW_COUNT;
  INSERT INTO public.qada_prayers SELECT r.* FROM jsonb_populate_recordset(NULL::public.qada_prayers,
    (SELECT jsonb_agg(jsonb_set(item, '{user_id}', to_jsonb(auth.uid()))) FROM jsonb_array_elements(COALESCE(saved->'qada_prayers', '[]'::jsonb)) item)) r
    ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS qada_count = ROW_COUNT;
  INSERT INTO public.quran_logs SELECT r.* FROM jsonb_populate_recordset(NULL::public.quran_logs,
    (SELECT jsonb_agg(jsonb_set(item, '{user_id}', to_jsonb(auth.uid()))) FROM jsonb_array_elements(COALESCE(saved->'quran_logs', '[]'::jsonb)) item)) r
    ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS quran_count = ROW_COUNT;
  INSERT INTO public.fasting_logs SELECT r.* FROM jsonb_populate_recordset(NULL::public.fasting_logs,
    (SELECT jsonb_agg(jsonb_set(item, '{user_id}', to_jsonb(auth.uid()))) FROM jsonb_array_elements(COALESCE(saved->'fasting_logs', '[]'::jsonb)) item)) r
    ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS fasting_count = ROW_COUNT;
  INSERT INTO public.dhikr_logs SELECT r.* FROM jsonb_populate_recordset(NULL::public.dhikr_logs,
    (SELECT jsonb_agg(jsonb_set(item, '{user_id}', to_jsonb(auth.uid()))) FROM jsonb_array_elements(COALESCE(saved->'dhikr_logs', '[]'::jsonb)) item)) r
    ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS dhikr_count = ROW_COUNT;
  RETURN jsonb_build_object('restored', salah_count + qada_count + quran_count + fasting_count + dhikr_count);
END $$;
GRANT EXECUTE ON FUNCTION public.restore_worship_backup(uuid) TO authenticated;