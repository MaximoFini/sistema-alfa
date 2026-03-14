-- ============================================================================
-- CONFIGURACIÓN DE SUPABASE REALTIME
-- ============================================================================
-- Ejecuta estos comandos en el SQL Editor de Supabase Dashboard
-- para habilitar correctamente las actualizaciones en tiempo real
-- ============================================================================

-- 1. Verificar que Realtime esté habilitado en las tablas
-- ============================================================================
-- Ve a: Database > Replication en Supabase Dashboard
-- Asegúrate de que estas tablas tengan la replicación HABILITADA:
--   ✅ alumnos (INSERT, UPDATE, DELETE)
--   ✅ asistencias (INSERT)
--   ✅ pagos (INSERT)

-- 2. Verificar políticas RLS
-- ============================================================================
-- Las políticas RLS pueden bloquear eventos de Realtime.
-- Verifica las políticas actuales:

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('alumnos', 'asistencias', 'pagos');

-- Si no hay políticas o RLS está deshabilitado, ejecuta:

-- Habilitar RLS en las tablas (si no está habilitado)
ALTER TABLE alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- Crear políticas permisivas para SELECT (necesario para Realtime)
-- IMPORTANTE: Ajusta estas políticas según tus necesidades de seguridad

-- Política para alumnos
DROP POLICY IF EXISTS "Permitir SELECT a todos" ON alumnos;
CREATE POLICY "Permitir SELECT a todos" 
ON alumnos FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Permitir INSERT a todos" ON alumnos;
CREATE POLICY "Permitir INSERT a todos" 
ON alumnos FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir UPDATE a todos" ON alumnos;
CREATE POLICY "Permitir UPDATE a todos" 
ON alumnos FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Permitir DELETE a todos" ON alumnos;
CREATE POLICY "Permitir DELETE a todos" 
ON alumnos FOR DELETE 
USING (true);

-- Política para asistencias
DROP POLICY IF EXISTS "Permitir SELECT a todos" ON asistencias;
CREATE POLICY "Permitir SELECT a todos" 
ON asistencias FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Permitir INSERT a todos" ON asistencias;
CREATE POLICY "Permitir INSERT a todos" 
ON asistencias FOR INSERT 
WITH CHECK (true);

-- Política para pagos
DROP POLICY IF EXISTS "Permitir SELECT a todos" ON pagos;
CREATE POLICY "Permitir SELECT a todos" 
ON pagos FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Permitir INSERT a todos" ON pagos;
CREATE POLICY "Permitir INSERT a todos" 
ON pagos FOR INSERT 
WITH CHECK (true);

-- 3. Verificar que las publicaciones incluyan las tablas
-- ============================================================================
-- Verifica qué tablas están en la publicación de Realtime:

SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Si las tablas NO aparecen, agrégalas manualmente:

ALTER PUBLICATION supabase_realtime ADD TABLE alumnos;
ALTER PUBLICATION supabase_realtime ADD TABLE asistencias;
ALTER PUBLICATION supabase_realtime ADD TABLE pagos;

-- 4. Verificar configuración de Realtime
-- ============================================================================
-- Consulta para verificar que todo esté configurado correctamente:

SELECT 
  t.tablename,
  t.schemaname,
  CASE WHEN p.tablename IS NOT NULL THEN '✅ SI' ELSE '❌ NO' END as "En Publicación",
  CASE WHEN c.relrowsecurity THEN '✅ SI' ELSE '❌ NO' END as "RLS Habilitado"
FROM pg_tables t
LEFT JOIN pg_publication_tables p 
  ON p.tablename = t.tablename 
  AND p.schemaname = t.schemaname 
  AND p.pubname = 'supabase_realtime'
LEFT JOIN pg_class c 
  ON c.relname = t.tablename
WHERE t.tablename IN ('alumnos', 'asistencias', 'pagos')
  AND t.schemaname = 'public';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- tablename    | En Publicación | RLS Habilitado
-- -------------|----------------|----------------
-- alumnos      | ✅ SI          | ✅ SI
-- asistencias  | ✅ SI          | ✅ SI
-- pagos        | ✅ SI          | ✅ SI
-- ============================================================================
