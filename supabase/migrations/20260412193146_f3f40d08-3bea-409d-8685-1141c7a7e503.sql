
-- Enum: categoria do insumo
CREATE TYPE public.categoria_insumo AS ENUM ('ingrediente', 'embalagem');

-- Enum: unidade de medida
CREATE TYPE public.unidade_medida AS ENUM ('g', 'kg', 'ml', 'l', 'un');

-- Tabela: insumos
CREATE TABLE public.insumos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  marca TEXT,
  fornecedor TEXT,
  categoria categoria_insumo NOT NULL DEFAULT 'ingrediente',
  preco_compra NUMERIC(10,4) NOT NULL,
  peso_volume_embalagem NUMERIC(10,4) NOT NULL,
  unidade_medida unidade_medida NOT NULL DEFAULT 'g',
  custo_unitario NUMERIC(10,6) GENERATED ALWAYS AS (preco_compra / NULLIF(peso_volume_embalagem, 0)) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insumos" ON public.insumos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own insumos" ON public.insumos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own insumos" ON public.insumos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own insumos" ON public.insumos FOR DELETE USING (auth.uid() = user_id);

-- Tabela: categorias_receita
CREATE TABLE public.categorias_receita (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categorias_receita ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categorias" ON public.categorias_receita FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own categorias" ON public.categorias_receita FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categorias" ON public.categorias_receita FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categorias" ON public.categorias_receita FOR DELETE USING (auth.uid() = user_id);

-- Tabela: receitas
CREATE TABLE public.receitas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria_id UUID REFERENCES public.categorias_receita(id) ON DELETE SET NULL,
  rendimento_quantidade NUMERIC(10,2),
  rendimento_unidade TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own receitas" ON public.receitas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own receitas" ON public.receitas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own receitas" ON public.receitas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own receitas" ON public.receitas FOR DELETE USING (auth.uid() = user_id);

-- Tabela: composicao_receita
CREATE TABLE public.composicao_receita (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receita_id UUID NOT NULL REFERENCES public.receitas(id) ON DELETE CASCADE,
  insumo_id UUID NOT NULL REFERENCES public.insumos(id) ON DELETE CASCADE,
  quantidade NUMERIC(10,4) NOT NULL,
  fator_rendimento NUMERIC(5,4) NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.composicao_receita ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own composicao" ON public.composicao_receita FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own composicao" ON public.composicao_receita FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own composicao" ON public.composicao_receita FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own composicao" ON public.composicao_receita FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers de updated_at
CREATE TRIGGER update_insumos_updated_at BEFORE UPDATE ON public.insumos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categorias_receita_updated_at BEFORE UPDATE ON public.categorias_receita FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_receitas_updated_at BEFORE UPDATE ON public.receitas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_composicao_receita_updated_at BEFORE UPDATE ON public.composicao_receita FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
