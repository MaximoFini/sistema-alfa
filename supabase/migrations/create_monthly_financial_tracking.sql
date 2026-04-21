-- ============================================================================
-- SISTEMA DE SEGUIMIENTO FINANCIERO MENSUAL
-- ============================================================================
-- Este script configura el sistema para guardar estadísticas financieras
-- mensuales automáticamente al final de cada mes.
-- ============================================================================

-- 1. Función para calcular y guardar estadísticas del mes anterior
-- ============================================================================
CREATE OR REPLACE FUNCTION guardar_estadisticas_mes_anterior()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  mes_anterior INTEGER;
  anio_anterior INTEGER;
  primer_dia DATE;
  ultimo_dia DATE;
  total_ingresos NUMERIC;
  total_deuda NUMERIC;
  total_alumnos_activos INTEGER;
  registro_existe BOOLEAN;
BEGIN
  -- Calcular el mes anterior
  mes_anterior := EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER;
  anio_anterior := EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER;
  
  -- Calcular primer y último día del mes anterior
  primer_dia := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE;
  ultimo_dia := (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day')::DATE;
  
  -- Verificar si ya existe un registro para ese mes
  SELECT EXISTS(
    SELECT 1 FROM estadisticas_mensuales 
    WHERE year = anio_anterior AND month = mes_anterior
  ) INTO registro_existe;
  
  -- Si no existe, crear el registro con las estadísticas
  IF NOT registro_existe THEN
    -- Calcular ingresos del mes anterior
    SELECT COALESCE(SUM(precio), 0)
    INTO total_ingresos
    FROM pagos
    WHERE fecha_cobro >= primer_dia
      AND fecha_cobro <= ultimo_dia;
    
    -- Calcular deuda total al final del mes (usando el último día)
    SELECT COALESCE(SUM(saldo), 0)
    INTO total_deuda
    FROM alumnos
    WHERE activo = true;
    
    -- Contar alumnos activos al final del mes
    SELECT COUNT(*)
    INTO total_alumnos_activos
    FROM alumnos
    WHERE activo = true;
    
    -- Insertar el registro
    INSERT INTO estadisticas_mensuales (
      year,
      month,
      ingresos_mes,
      deuda_total,
      alumnos_activos,
      created_at
    ) VALUES (
      anio_anterior,
      mes_anterior,
      total_ingresos,
      total_deuda,
      total_alumnos_activos,
      NOW()
    );
    
    RAISE NOTICE 'Estadísticas guardadas para %/%: Ingresos=$%, Deuda=$%, Alumnos=%',
      mes_anterior, anio_anterior, total_ingresos, total_deuda, total_alumnos_activos;
  ELSE
    RAISE NOTICE 'Ya existen estadísticas para %/%. No se creó registro duplicado.', mes_anterior, anio_anterior;
  END IF;
END;
$$;

-- ============================================================================
-- 2. Función para verificar si cambió el mes y guardar estadísticas
-- ============================================================================
CREATE OR REPLACE FUNCTION verificar_y_guardar_estadisticas_mensuales()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  mes_actual INTEGER;
  anio_actual INTEGER;
  ultimo_registro_mes INTEGER;
  ultimo_registro_anio INTEGER;
BEGIN
  -- Obtener mes y año actual
  mes_actual := EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER;
  anio_actual := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
  
  -- Obtener el último registro guardado
  SELECT month, year INTO ultimo_registro_mes, ultimo_registro_anio
  FROM estadisticas_mensuales
  ORDER BY year DESC, month DESC
  LIMIT 1;
  
  -- Si no hay registros o si cambió el mes, guardar estadísticas
  IF ultimo_registro_mes IS NULL OR ultimo_registro_anio IS NULL THEN
    -- No hay registros previos, guardar el mes anterior si aplica
    IF EXTRACT(DAY FROM CURRENT_DATE) >= 1 THEN
      PERFORM guardar_estadisticas_mes_anterior();
    END IF;
  ELSE
    -- Verificar si el mes actual es diferente al último registrado
    IF (anio_actual > ultimo_registro_anio) OR 
       (anio_actual = ultimo_registro_anio AND mes_actual > ultimo_registro_mes) THEN
      PERFORM guardar_estadisticas_mes_anterior();
    END IF;
  END IF;
END;
$$;

-- ============================================================================
-- 3. INSTRUCCIONES DE USO
-- ============================================================================
-- Para ejecutar manualmente y guardar las estadísticas del mes anterior:
-- SELECT guardar_estadisticas_mes_anterior();

-- Para verificar automáticamente si cambió el mes:
-- SELECT verificar_y_guardar_estadisticas_mensuales();

-- ============================================================================
-- 4. CONFIGURACIÓN DE EJECUCIÓN AUTOMÁTICA (OPCIONAL)
-- ============================================================================
-- Si tu base de datos soporta pg_cron, puedes programar la función para que
-- se ejecute automáticamente cada día al inicio del día:

-- Primero, habilita la extensión pg_cron (solo una vez):
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Luego programa la tarea (ejecutar como superusuario):
-- SELECT cron.schedule(
--   'guardar-estadisticas-mensuales',
--   '0 1 * * *',  -- Ejecutar a la 1 AM todos los días
--   'SELECT verificar_y_guardar_estadisticas_mensuales();'
-- );

-- Para ver las tareas programadas:
-- SELECT * FROM cron.job;

-- Para eliminar la tarea programada:
-- SELECT cron.unschedule('guardar-estadisticas-mensuales');

-- ============================================================================
-- 5. ALTERNATIVA: Ejecutar desde una Edge Function o API
-- ============================================================================
-- Si no tienes acceso a pg_cron, puedes:
-- 1. Crear un endpoint API que llame a verificar_y_guardar_estadisticas_mensuales()
-- 2. Usar un servicio externo (Vercel Cron, GitHub Actions, etc.) para llamar
--    a ese endpoint una vez al día

-- ============================================================================
-- 6. VERIFICACIÓN Y TESTING
-- ============================================================================

-- Ver todas las estadísticas guardadas:
-- SELECT * FROM estadisticas_mensuales ORDER BY year DESC, month DESC;

-- Forzar el guardado del mes anterior (para testing):
-- SELECT guardar_estadisticas_mes_anterior();

-- Ver los ingresos del mes actual (calculados en tiempo real):
-- SELECT 
--   COALESCE(SUM(precio), 0) as ingresos_mes_actual
-- FROM pagos
-- WHERE fecha_cobro >= DATE_TRUNC('month', CURRENT_DATE)
--   AND fecha_cobro < DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
