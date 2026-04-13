-- Drop the old SELECT policy
DROP POLICY "Users can view their own insumos" ON public.insumos;

-- Create new SELECT policy allowing all authenticated users to view all insumos
CREATE POLICY "Authenticated users can view all insumos"
ON public.insumos
FOR SELECT
TO authenticated
USING (true);