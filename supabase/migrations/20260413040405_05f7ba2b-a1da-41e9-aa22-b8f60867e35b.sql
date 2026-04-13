
-- Fix INSERT policies: change from public to authenticated
DROP POLICY IF EXISTS "Users can create their own insumos" ON public.insumos;
CREATE POLICY "Users can create their own insumos" ON public.insumos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own receitas" ON public.receitas;
CREATE POLICY "Users can create their own receitas" ON public.receitas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own composicao" ON public.composicao_receita;
CREATE POLICY "Users can create their own composicao" ON public.composicao_receita
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own categorias" ON public.categorias_receita;
CREATE POLICY "Users can create their own categorias" ON public.categorias_receita
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Fix UPDATE policies: change from public to authenticated
DROP POLICY IF EXISTS "Users can update their own insumos" ON public.insumos;
CREATE POLICY "Users can update their own insumos" ON public.insumos
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own receitas" ON public.receitas;
CREATE POLICY "Users can update their own receitas" ON public.receitas
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own composicao" ON public.composicao_receita;
CREATE POLICY "Users can update their own composicao" ON public.composicao_receita
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own categorias" ON public.categorias_receita;
CREATE POLICY "Users can update their own categorias" ON public.categorias_receita
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Add DELETE policies for users to delete their own records
CREATE POLICY "Users can delete their own insumos" ON public.insumos
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receitas" ON public.receitas
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own composicao" ON public.composicao_receita
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categorias" ON public.categorias_receita
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vendas" ON public.vendas
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own config" ON public.configuracoes_financeiras
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
