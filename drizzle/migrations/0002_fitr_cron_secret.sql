CREATE TABLE IF NOT EXISTS public.cron_tokens (name text PRIMARY KEY, token text NOT NULL);
REVOKE ALL ON public.cron_tokens FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.cron_tokens TO service_role;
ALTER TABLE public.cron_tokens ENABLE ROW LEVEL SECURITY;
INSERT INTO public.cron_tokens(name, token) VALUES ('fitr', encode(extensions.gen_random_bytes(32),'hex')) ON CONFLICT (name) DO NOTHING;