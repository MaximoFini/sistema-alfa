-- Test simple para verificar que Realtime funciona
-- Ejecuta este INSERT en el SQL Editor de Supabase:

INSERT INTO alumnos (
  nombre, 
  dni, 
  domicilio, 
  telefono, 
  fecha_nacimiento, 
  fecha_registro, 
  genero, 
  edad_actual
) VALUES (
  'TEST REALTIME',
  '99999999',
  'Test Address',
  '1234567890',
  '2000-01-01',
  CURRENT_DATE,
  'Masculino',
  24
);

-- Si Realtime está configurado correctamente:
-- 1. Verás en la consola del navegador: "[Realtime] Cambio detectado en alumnos: INSERT"
-- 2. La lista en /inicio se actualizará automáticamente
-- 3. Verás el nuevo alumno "TEST REALTIME" aparecer sin recargar

-- Para limpiar el test:
DELETE FROM alumnos WHERE dni = '99999999';
