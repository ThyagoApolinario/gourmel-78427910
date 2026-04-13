ALTER TABLE public.composicao_receita
ADD COLUMN unidade_medida public.unidade_medida NOT NULL DEFAULT 'g'::unidade_medida;