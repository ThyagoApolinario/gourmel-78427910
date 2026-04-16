
-- 1) Tabela metodos_pagamento
CREATE TABLE public.metodos_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  taxa_percentual NUMERIC NOT NULL DEFAULT 0,
  is_padrao_precificacao BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.metodos_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own metodos" ON public.metodos_pagamento
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own metodos" ON public.metodos_pagamento
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own metodos" ON public.metodos_pagamento
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own metodos" ON public.metodos_pagamento
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all metodos" ON public.metodos_pagamento
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_metodos_pagamento_updated_at
  BEFORE UPDATE ON public.metodos_pagamento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Garantir apenas um padrão por usuário
CREATE UNIQUE INDEX idx_metodos_pagamento_padrao_unico
  ON public.metodos_pagamento (user_id)
  WHERE is_padrao_precificacao = true;

CREATE INDEX idx_metodos_pagamento_user ON public.metodos_pagamento (user_id, ativo);

-- 2) Snapshot na tabela vendas (imutabilidade histórica)
ALTER TABLE public.vendas
  ADD COLUMN metodo_pagamento_id UUID REFERENCES public.metodos_pagamento(id) ON DELETE SET NULL,
  ADD COLUMN metodo_pagamento_nome TEXT,
  ADD COLUMN taxa_aplicada NUMERIC,
  ADD COLUMN custo_insumos_snapshot NUMERIC,
  ADD COLUMN valor_liquido_real NUMERIC;

CREATE INDEX idx_vendas_metodo ON public.vendas (metodo_pagamento_id);

-- 3) Trigger: calcular valor_liquido_real automaticamente ao inserir/atualizar
CREATE OR REPLACE FUNCTION public.calc_valor_liquido_venda()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_taxa NUMERIC;
  v_bruto NUMERIC;
  v_taxa_valor NUMERIC;
  v_custo NUMERIC;
BEGIN
  v_taxa := COALESCE(NEW.taxa_aplicada, 0);
  v_custo := COALESCE(NEW.custo_insumos_snapshot, 0);
  v_bruto := COALESCE(NEW.preco_venda, 0) * COALESCE(NEW.quantidade, 0);
  v_taxa_valor := v_bruto * v_taxa / 100;
  NEW.valor_liquido_real := v_bruto - v_taxa_valor - v_custo;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calc_valor_liquido
  BEFORE INSERT OR UPDATE OF preco_venda, quantidade, taxa_aplicada, custo_insumos_snapshot
  ON public.vendas
  FOR EACH ROW EXECUTE FUNCTION public.calc_valor_liquido_venda();

-- 4) Seed: criar métodos padrão para usuários existentes
INSERT INTO public.metodos_pagamento (user_id, nome, taxa_percentual, is_padrao_precificacao, ordem)
SELECT u.user_id, 'PIX', 0, false, 1 FROM (SELECT DISTINCT user_id FROM public.configuracoes_financeiras) u;
INSERT INTO public.metodos_pagamento (user_id, nome, taxa_percentual, is_padrao_precificacao, ordem)
SELECT u.user_id, 'Dinheiro', 0, false, 2 FROM (SELECT DISTINCT user_id FROM public.configuracoes_financeiras) u;
INSERT INTO public.metodos_pagamento (user_id, nome, taxa_percentual, is_padrao_precificacao, ordem)
SELECT u.user_id, 'Débito', 2, false, 3 FROM (SELECT DISTINCT user_id FROM public.configuracoes_financeiras) u;
INSERT INTO public.metodos_pagamento (user_id, nome, taxa_percentual, is_padrao_precificacao, ordem)
SELECT u.user_id, 'Crédito à Vista', 3.5, true, 4 FROM (SELECT DISTINCT user_id FROM public.configuracoes_financeiras) u;
INSERT INTO public.metodos_pagamento (user_id, nome, taxa_percentual, is_padrao_precificacao, ordem)
SELECT u.user_id, 'Crédito Parcelado', 4.5, false, 5 FROM (SELECT DISTINCT user_id FROM public.configuracoes_financeiras) u;

-- 5) Função helper: ao criar novo usuário com config financeira, semear métodos
CREATE OR REPLACE FUNCTION public.seed_metodos_pagamento_default()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.metodos_pagamento WHERE user_id = NEW.user_id) THEN
    INSERT INTO public.metodos_pagamento (user_id, nome, taxa_percentual, is_padrao_precificacao, ordem) VALUES
      (NEW.user_id, 'PIX', 0, false, 1),
      (NEW.user_id, 'Dinheiro', 0, false, 2),
      (NEW.user_id, 'Débito', 2, false, 3),
      (NEW.user_id, 'Crédito à Vista', 3.5, true, 4),
      (NEW.user_id, 'Crédito Parcelado', 4.5, false, 5);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seed_metodos_pagamento
  AFTER INSERT ON public.configuracoes_financeiras
  FOR EACH ROW EXECUTE FUNCTION public.seed_metodos_pagamento_default();

-- 6) Remover taxa_cartao das configurações financeiras (motor passa a usar método padrão)
ALTER TABLE public.configuracoes_financeiras DROP COLUMN taxa_cartao;
