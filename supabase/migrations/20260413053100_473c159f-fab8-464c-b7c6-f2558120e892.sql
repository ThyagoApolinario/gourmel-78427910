
-- Create enum for fixed cost categories
CREATE TYPE public.categoria_custo_fixo AS ENUM (
  'aluguel_cozinha',
  'energia_agua',
  'internet',
  'marketing',
  'pro_labore',
  'ferramentas_software',
  'outros'
);

-- Create custos_fixos table
CREATE TABLE public.custos_fixos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  categoria categoria_custo_fixo NOT NULL DEFAULT 'outros',
  valor_mensal NUMERIC NOT NULL DEFAULT 0,
  percentual_rateio NUMERIC NOT NULL DEFAULT 100,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custos_fixos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own custos_fixos"
ON public.custos_fixos FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custos_fixos"
ON public.custos_fixos FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custos_fixos"
ON public.custos_fixos FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custos_fixos"
ON public.custos_fixos FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any custos_fixos"
ON public.custos_fixos FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_custos_fixos_updated_at
BEFORE UPDATE ON public.custos_fixos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
