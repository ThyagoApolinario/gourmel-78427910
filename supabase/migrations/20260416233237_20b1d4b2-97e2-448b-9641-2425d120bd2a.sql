-- Tipo do item dentro do kit
CREATE TYPE public.tipo_item_kit AS ENUM ('receita', 'insumo');

-- Tabela principal de kits
CREATE TABLE public.kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  tempo_montagem_minutos NUMERIC NOT NULL DEFAULT 0,
  zerar_mao_obra BOOLEAN NOT NULL DEFAULT false,
  preco_final_manual NUMERIC,
  desconto_percentual NUMERIC,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own kits" ON public.kits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own kits" ON public.kits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own kits" ON public.kits FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own kits" ON public.kits FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all kits" ON public.kits FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_kits_updated_at
BEFORE UPDATE ON public.kits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de itens do kit
CREATE TABLE public.kit_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kit_id UUID NOT NULL REFERENCES public.kits(id) ON DELETE CASCADE,
  tipo_item public.tipo_item_kit NOT NULL,
  receita_id UUID REFERENCES public.receitas(id) ON DELETE CASCADE,
  insumo_id UUID REFERENCES public.insumos(id) ON DELETE CASCADE,
  quantidade NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT kit_itens_ref_check CHECK (
    (tipo_item = 'receita' AND receita_id IS NOT NULL AND insumo_id IS NULL) OR
    (tipo_item = 'insumo' AND insumo_id IS NOT NULL AND receita_id IS NULL)
  )
);

ALTER TABLE public.kit_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own kit_itens" ON public.kit_itens FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own kit_itens" ON public.kit_itens FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own kit_itens" ON public.kit_itens FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own kit_itens" ON public.kit_itens FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all kit_itens" ON public.kit_itens FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_kit_itens_updated_at
BEFORE UPDATE ON public.kit_itens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_kit_itens_kit_id ON public.kit_itens(kit_id);
CREATE INDEX idx_kit_itens_receita_id ON public.kit_itens(receita_id);
CREATE INDEX idx_kit_itens_insumo_id ON public.kit_itens(insumo_id);

-- Adicionar kit_id em vendas (opcional; mantém receita_id para compatibilidade)
ALTER TABLE public.vendas
  ADD COLUMN kit_id UUID REFERENCES public.kits(id) ON DELETE SET NULL,
  ALTER COLUMN receita_id DROP NOT NULL;

CREATE INDEX idx_vendas_kit_id ON public.vendas(kit_id);