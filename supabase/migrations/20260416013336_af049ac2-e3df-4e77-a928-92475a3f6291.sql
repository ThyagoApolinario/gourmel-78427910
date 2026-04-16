ALTER TABLE public.receitas
ADD COLUMN mes_producao DATE DEFAULT (date_trunc('month', CURRENT_DATE))::date;