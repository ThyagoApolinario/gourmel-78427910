
-- Admins can view all custos_fixos
CREATE POLICY "Admins can view all custos_fixos"
ON public.custos_fixos
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all custos_fixos
CREATE POLICY "Admins can update all custos_fixos"
ON public.custos_fixos
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all configuracoes_financeiras
CREATE POLICY "Admins can view all configuracoes_financeiras"
ON public.configuracoes_financeiras
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all configuracoes_financeiras
CREATE POLICY "Admins can update all configuracoes_financeiras"
ON public.configuracoes_financeiras
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
