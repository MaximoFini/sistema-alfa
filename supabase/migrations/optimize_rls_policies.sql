-- ============================================================
-- MIGRACIÓN DE OPTIMIZACIÓN — POLÍTICAS RLS CON SUBQUERIES
-- ============================================================
-- En Postgres, RLS re-evalúa funciones volátiles como auth.uid()
-- y auth.role() por cada fila. Al envolverlas en (SELECT auth.uid())
-- o (SELECT auth.role()), se evalúan una única vez por query,
-- permitiendo que Postgres use caché y aumente la velocidad hasta 100x.
-- ============================================================

-- 1. TABLA: alumnos
DROP POLICY IF EXISTS "Receptionists and Admins can manage alumnos" ON public.alumnos;
CREATE POLICY "Receptionists and Admins can manage alumnos" ON public.alumnos
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND (profiles.role = 'Administrador'::public.user_role OR profiles.role = 'Recepcionista'::public.user_role)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND (profiles.role = 'Administrador'::public.user_role OR profiles.role = 'Recepcionista'::public.user_role)
    )
  );

-- 2. TABLA: pagos
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.pagos;
CREATE POLICY "Allow all for authenticated" ON public.pagos
  FOR ALL
  TO public
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- 3. TABLA: asistencias
DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.asistencias;
CREATE POLICY "Enable ALL for authenticated users" ON public.asistencias
  FOR ALL
  TO public
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- 4. TABLA: payment_methods
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.payment_methods;
CREATE POLICY "Allow all for authenticated users" ON public.payment_methods
  FOR ALL
  TO public
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- 5. TABLA: product_categories
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.product_categories;
CREATE POLICY "Allow all for authenticated users" ON public.product_categories
  FOR ALL
  TO public
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- 6. TABLA: profiles
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT
  TO public
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE
  TO public
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Administrators can update all profiles." ON public.profiles;
CREATE POLICY "Administrators can update all profiles." ON public.profiles
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles profiles_1
      WHERE profiles_1.id = (SELECT auth.uid())
        AND profiles_1.role = 'Administrador'::public.user_role
    )
  );

-- 7. TABLA: exercises
DROP POLICY IF EXISTS "Permitir todo a Recepcionistas y Administradores" ON public.exercises;
CREATE POLICY "Permitir todo a Recepcionistas y Administradores" ON public.exercises
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = ANY (ARRAY['Recepcionista'::public.user_role, 'Administrador'::public.user_role])
    )
  );

DROP POLICY IF EXISTS "Allow users to create their own exercises" ON public.exercises;
CREATE POLICY "Allow users to create their own exercises" ON public.exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Allow users to update their own exercises" ON public.exercises;
CREATE POLICY "Allow users to update their own exercises" ON public.exercises
  FOR UPDATE
  TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Allow users to delete their own exercises" ON public.exercises;
CREATE POLICY "Allow users to delete their own exercises" ON public.exercises
  FOR DELETE
  TO authenticated
  USING (created_by = (SELECT auth.uid()));
