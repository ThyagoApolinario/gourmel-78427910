
-- Create vendas table
CREATE TABLE public.vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  receita_id UUID NOT NULL REFERENCES public.receitas(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_venda NUMERIC NOT NULL,
  data_venda DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view all vendas"
  ON public.vendas FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can create their own vendas"
  ON public.vendas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vendas"
  ON public.vendas FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete vendas"
  ON public.vendas FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for performance
CREATE INDEX idx_vendas_receita_id ON public.vendas(receita_id);
CREATE INDEX idx_vendas_data_venda ON public.vendas(data_venda);
CREATE INDEX idx_vendas_user_id ON public.vendas(user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendas;
