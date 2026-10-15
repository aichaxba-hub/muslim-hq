CREATE TABLE public.fitr_prices (
  food text PRIMARY KEY,
  price_per_kg numeric NOT NULL,
  as_of text NOT NULL,
  source text NOT NULL,
  hijri_year int NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fitr_prices TO authenticated;
GRANT ALL ON public.fitr_prices TO service_role;
ALTER TABLE public.fitr_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can read fitr prices" ON public.fitr_prices FOR SELECT TO authenticated USING (true);
INSERT INTO public.fitr_prices (food, price_per_kg, as_of, source, hijri_year) VALUES
('Wheat flour', 1.20, 'September 2026', 'BLS APU0000701111', 1448),
('Black beans', 3.68, 'September 2026', 'BLS APU0000714233', 1448),
('Barley', 5.05, 'September 2026', 'Store-brand retail baseline, adjusted by BLS cereals CPI (CUUR0000SAF111 = 369.585)', 1448);