-- ============================================================================
-- SISTEMA DE SEGUIMIENTO DEMOGRÁFICO Y DE ASISTENCIA MENSUAL COMPLETO
-- ============================================================================
-- Redefine la función para consolidar todas las métricas de clientes al cierre
-- de cada mes, incluyendo edad promedio, género, asistencia horaria, ranking, etc.
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
  sum_pagos NUMERIC;
  sum_ventas NUMERIC;
  sum_gastos NUMERIC;
  sum_sueldos NUMERIC;

  -- Nuevas variables para estadísticas de clientes
  var_nuevos INTEGER;
  var_promedio_edad NUMERIC;
  var_pct_hombres NUMERIC;
  var_pct_mujeres NUMERIC;
  var_inactivos INTEGER;
  var_perdidos INTEGER;
  var_asistencia_por_hora JSONB;
  var_ranking_top5 JSONB;
  var_antiguedad_promedio NUMERIC;
  var_tasa_retencion NUMERIC;
  var_tasa_churn NUMERIC;
  
  -- Variables para cálculo de retención
  var_activos_inicio INTEGER;
  var_dias_inact INTEGER;
  var_dias_perdido INTEGER;
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
  
  -- 1. Calcular pagos del mes anterior
  SELECT COALESCE(SUM(precio), 0)
  INTO sum_pagos
  FROM pagos
  WHERE fecha_cobro >= primer_dia
    AND fecha_cobro <= ultimo_dia;
    
  -- 2. Calcular ventas del mes anterior
  SELECT COALESCE(SUM(total), 0)
  INTO sum_ventas
  FROM ventas
  WHERE created_at >= primer_dia::timestamp
    AND created_at < (ultimo_dia + INTERVAL '1 day')::timestamp;
    
  -- 3. Calcular gastos activos del mes anterior
  SELECT COALESCE(SUM(amount), 0)
  INTO sum_gastos
  FROM monthly_expenses_config
  WHERE year = anio_anterior
    AND month = mes_anterior
    AND is_active = true;
    
  -- 4. Calcular sueldos activos del mes anterior
  SELECT COALESCE(SUM(amount), 0)
  INTO sum_sueldos
  FROM monthly_salaries_config
  WHERE year = anio_anterior
    AND month = mes_anterior
    AND is_active = true;
    
  -- Calcular ingresos netos
  total_ingresos := (sum_pagos + sum_ventas) - (sum_gastos + sum_sueldos);
  
  -- Calcular deuda total al final del mes anterior (usando saldo actual)
  SELECT COALESCE(SUM(saldo), 0)
  INTO total_deuda
  FROM alumnos
  WHERE activo = true AND es_prueba = false;
  
  -- Contar alumnos activos al final del mes anterior
  SELECT COUNT(*)
  INTO total_alumnos_activos
  FROM alumnos
  WHERE activo = true AND es_prueba = false;

  -- ─── CÁLCULO DE ESTADÍSTICAS DE CLIENTES ───
  
  -- A. Nuevos este mes
  SELECT COUNT(*) INTO var_nuevos
  FROM alumnos
  WHERE fecha_registro >= primer_dia AND fecha_registro <= ultimo_dia
    AND es_prueba = false;
    
  -- B. Promedio de edad de activos
  SELECT ROUND(AVG(edad_actual)::numeric, 1) INTO var_promedio_edad
  FROM alumnos
  WHERE activo = true AND edad_actual IS NOT NULL AND es_prueba = false;
  
  -- C. Distribución de género (activos)
  SELECT 
    ROUND((COUNT(CASE WHEN genero = 'Masculino' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 1),
    ROUND((COUNT(CASE WHEN genero = 'Femenino' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 1)
  INTO var_pct_hombres, var_pct_mujeres
  FROM alumnos
  WHERE activo = true AND es_prueba = false;
  
  -- Obtener configuraciones de inactividad de system_settings
  SELECT 
    COALESCE(MIN(alert_2_days_no_attendance), 30),
    COALESCE(MIN(days_without_renewal_lost), 90)
  INTO var_dias_inact, var_dias_perdido
  FROM system_settings;
  
  -- D. Clientes inactivos recuperables (al final del mes anterior)
  SELECT COUNT(*) INTO var_inactivos
  FROM alumnos
  WHERE activo = true AND es_prueba = false
    AND fecha_ultima_asistencia < (ultimo_dia - (var_dias_inact || ' days')::INTERVAL)
    AND fecha_ultima_asistencia >= (ultimo_dia - (var_dias_perdido || ' days')::INTERVAL);
    
  -- E. Clientes perdidos (al final del mes anterior)
  SELECT COUNT(*) INTO var_perdidos
  FROM alumnos
  WHERE activo = true AND es_prueba = false
    AND (fecha_ultima_asistencia < (ultimo_dia - (var_dias_perdido || ' days')::INTERVAL) OR fecha_ultima_asistencia IS NULL);
    
  -- F. Antigüedad promedio (meses) de alumnos activos
  SELECT ROUND(AVG(
    (EXTRACT(YEAR FROM ultimo_dia) - EXTRACT(YEAR FROM fecha_registro)) * 12 +
    (EXTRACT(MONTH FROM ultimo_dia) - EXTRACT(MONTH FROM fecha_registro))
  )::numeric, 1) INTO var_antiguedad_promedio
  FROM alumnos
  WHERE activo = true AND fecha_registro IS NOT NULL AND es_prueba = false;

  -- G. Tasa de retención y churn
  -- Alumnos activos al inicio del mes = Activos registrados antes de primer_dia
  SELECT COUNT(*) INTO var_activos_inicio
  FROM alumnos
  WHERE activo = true AND fecha_registro < primer_dia AND es_prueba = false;
  
  -- Calcular tasas con resguardo de division por cero
  IF var_activos_inicio > 0 THEN
    var_tasa_retencion := ROUND((((total_alumnos_activos - var_nuevos)::NUMERIC / var_activos_inicio) * 100), 1);
    IF var_tasa_retencion > 100 THEN var_tasa_retencion := 100; END IF;
    IF var_tasa_retencion < 0 THEN var_tasa_retencion := 0; END IF;
    var_tasa_churn := 100 - var_tasa_retencion;
  ELSE
    var_tasa_retencion := 100;
    var_tasa_churn := 0;
  END IF;

  -- H. Asistencia por hora del mes anterior (JSONB)
  SELECT COALESCE(json_agg(json_build_object('horario', to_char(h.hora, 'HH24:00'), 'alumnos', COALESCE(cnt.count, 0)))::jsonb, '[]'::jsonb)
  INTO var_asistencia_por_hora
  FROM (
    SELECT generate_series(7, 22) AS h_num
  ) hrs
  CROSS JOIN LATERAL (
    SELECT (hrs.h_num || ':00:00')::TIME AS hora
  ) h
  LEFT JOIN (
    SELECT EXTRACT(HOUR FROM hora)::INTEGER AS h_val, COUNT(*) AS count
    FROM asistencias
    WHERE fecha >= primer_dia AND fecha <= ultimo_dia
    GROUP BY h_val
  ) cnt ON cnt.h_val = hrs.h_num;

  -- I. Ranking Top 5 Asistencia
  SELECT COALESCE(json_agg(r)::jsonb, '[]'::jsonb) INTO var_ranking_top5
  FROM (
    SELECT 
      ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC)::INTEGER AS pos,
      al.nombre,
      LEFT(al.nombre, 1) AS inicial,
      COUNT(*)::INTEGER AS clases,
      COALESCE(al.genero, 'Masculino') AS genero
    FROM asistencias asis
    JOIN alumnos al ON asis.alumno_id = al.id
    WHERE asis.fecha >= primer_dia AND asis.fecha <= ultimo_dia
    GROUP BY al.id, al.nombre, al.genero
    ORDER BY clases DESC
    LIMIT 10
  ) r;

  -- Insertar o actualizar según corresponda
  IF NOT registro_existe THEN
    INSERT INTO estadisticas_mensuales (
      year,
      month,
      ingresos_mes,
      deuda_total,
      alumnos_activos,
      nuevos_este_mes,
      promedio_edad,
      pct_hombres,
      pct_mujeres,
      clientes_inactivos,
      clientes_perdidos,
      antiguedad_promedio,
      tasa_retencion,
      tasa_churn,
      asistencia_por_hora,
      ranking_top5,
      created_at
    ) VALUES (
      anio_anterior,
      mes_anterior,
      total_ingresos,
      total_deuda,
      total_alumnos_activos,
      var_nuevos,
      var_promedio_edad,
      var_pct_hombres,
      var_pct_mujeres,
      var_inactivos,
      var_perdidos,
      var_antiguedad_promedio,
      var_tasa_retencion,
      var_tasa_churn,
      var_asistencia_por_hora,
      var_ranking_top5,
      NOW()
    );
  ELSE
    UPDATE estadisticas_mensuales SET
      ingresos_mes = total_ingresos,
      deuda_total = total_deuda,
      alumnos_activos = total_alumnos_activos,
      nuevos_este_mes = var_nuevos,
      promedio_edad = var_promedio_edad,
      pct_hombres = var_pct_hombres,
      pct_mujeres = var_pct_mujeres,
      clientes_inactivos = var_inactivos,
      clientes_perdidos = var_perdidos,
      antiguedad_promedio = var_antiguedad_promedio,
      tasa_retencion = var_tasa_retencion,
      tasa_churn = var_tasa_churn,
      asistencia_por_hora = var_asistencia_por_hora,
      ranking_top5 = var_ranking_top5
    WHERE year = anio_anterior AND month = mes_anterior;
  END IF;

  RAISE NOTICE 'Estadísticas del mes anterior guardadas/actualizadas con éxito.';
END;
$$;
