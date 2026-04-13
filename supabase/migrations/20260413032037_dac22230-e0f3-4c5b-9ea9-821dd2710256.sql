-- Insumos: only admins can delete
DROP POLICY "Users can delete their own insumos" ON public.insumos;
CREATE POLICY "Admins can delete insumos"
ON public.insumos FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Receitas: only admins can delete
DROP POLICY "Users can delete their own receitas" ON public.receitas;
CREATE POLICY "Admins can delete receitas"
ON public.receitas FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Categorias: only admins can delete
DROP POLICY "Users can delete their own categorias" ON public.categorias_receita;
CREATE POLICY "Admins can delete categorias"
ON public.categorias_receita FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Composicao: only admins can delete
DROP POLICY "Users can delete their own composicao" ON public.composicao_receita;
CREATE POLICY "Admins can delete composicao"
ON public.composicao_receita FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));