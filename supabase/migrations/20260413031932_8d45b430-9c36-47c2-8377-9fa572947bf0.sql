-- Receitas
DROP POLICY "Users can view their own receitas" ON public.receitas;
CREATE POLICY "Authenticated users can view all receitas"
ON public.receitas FOR SELECT TO authenticated USING (true);

-- Categorias
DROP POLICY "Users can view their own categorias" ON public.categorias_receita;
CREATE POLICY "Authenticated users can view all categorias"
ON public.categorias_receita FOR SELECT TO authenticated USING (true);

-- Composição de receitas
DROP POLICY "Users can view their own composicao" ON public.composicao_receita;
CREATE POLICY "Authenticated users can view all composicao"
ON public.composicao_receita FOR SELECT TO authenticated USING (true);