-- Financial settings table (one row per user)
CREATE TABLE public.configuracoes_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  taxa_cartao numeric NOT NULL DEFAULT 5.0,
  impostos numeric NOT NULL DEFAULT 5.0,
  margem_desejada numeric NOT NULL DEFAULT 30.0,
  pro_labore numeric NOT NULL DEFAULT 3000.0,
  horas_mes numeric NOT NULL DEFAULT 160.0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.configuracoes_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own config"
ON public.configuracoes_financeiras FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own config"
ON public.configuracoes_financeiras FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own config"
ON public.configuracoes_financeiras FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_config_updated_at
BEFORE UPDATE ON public.configuracoes_financeiras
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add production time to receitas
ALTER TABLE public.receitas ADD COLUMN tempo_producao_minutos numeric DEFAULT NULL;