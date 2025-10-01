-- Allow all authenticated and anonymous users to view chargers
-- This is needed for the public map functionality
CREATE POLICY "Public users can view chargers"
ON public.chargers
FOR SELECT
TO public
USING (true);