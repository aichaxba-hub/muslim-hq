ALTER TABLE public.profiles ADD COLUMN zakat_anniversary date;

CREATE TABLE public.zakat_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  zakat_entry_id uuid NOT NULL REFERENCES public.zakat_entries(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  paid_on date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zakat_payments TO authenticated;
GRANT ALL ON public.zakat_payments TO service_role;
ALTER TABLE public.zakat_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own Zakat payments" ON public.zakat_payments FOR ALL TO authenticated USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.zakat_entries z WHERE z.id = zakat_entry_id AND z.user_id = auth.uid())) WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.zakat_entries z WHERE z.id = zakat_entry_id AND z.user_id = auth.uid()));
CREATE TRIGGER touch_zakat_payments_updated_at BEFORE UPDATE ON public.zakat_payments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();