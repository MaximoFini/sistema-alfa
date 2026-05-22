ALTER TABLE public.accepted_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir CRUD completo a usuarios autenticados" 
ON public.accepted_cards
FOR ALL 
TO authenticated 
USING (true);
