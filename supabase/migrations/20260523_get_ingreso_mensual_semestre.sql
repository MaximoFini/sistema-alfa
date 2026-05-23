-- ============================================================================
-- Migration: get_ingreso_mensual_semestre RPC
-- Fase 3B: Migrar Agregaciones Financieras a SQL
--
-- Reemplaza el procesamiento in-memory de 4 queries batch en Node.js por una
-- función Postgres que calcula los ingresos mensuales netos del semestre
-- directamente en la base de datos.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_ingreso_mensual_semestre(
  p_year      INT,
  p_semester  INT  -- 1 = Ene-Jun, 2 = Jul-Dic
)
RETURNS TABLE(mes TEXT, monto NUMERIC)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_mes_inicio INT;
  v_mes_fin    INT;
BEGIN
  -- Determinar rango del semestre
  IF p_semester = 1 THEN
    v_mes_inicio := 1;
    v_mes_fin    := 6;
  ELSE
    v_mes_inicio := 7;
    v_mes_fin    := 12;
  END IF;

  RETURN QUERY
  WITH
  -- Generar los 6 meses del semestre como serie
  meses AS (
    SELECT generate_series(v_mes_inicio, v_mes_fin) AS num_mes
  ),

  -- Sumar pagos agrupados por mes
  pagos_por_mes AS (
    SELECT
      EXTRACT(MONTH FROM fecha_cobro::date)::INT AS num_mes,
      SUM(precio)::NUMERIC                        AS total_pagos
    FROM pagos
    WHERE
      EXTRACT(YEAR FROM fecha_cobro::date)::INT = p_year
      AND EXTRACT(MONTH FROM fecha_cobro::date)::INT BETWEEN v_mes_inicio AND v_mes_fin
    GROUP BY EXTRACT(MONTH FROM fecha_cobro::date)::INT
  ),

  -- Sumar ventas agrupadas por mes
  ventas_por_mes AS (
    SELECT
      EXTRACT(MONTH FROM created_at::date)::INT AS num_mes,
      SUM(total)::NUMERIC                        AS total_ventas
    FROM ventas
    WHERE
      EXTRACT(YEAR FROM created_at::date)::INT = p_year
      AND EXTRACT(MONTH FROM created_at::date)::INT BETWEEN v_mes_inicio AND v_mes_fin
    GROUP BY EXTRACT(MONTH FROM created_at::date)::INT
  ),

  -- Sumar gastos activos configurados por mes
  gastos_por_mes AS (
    SELECT
      month AS num_mes,
      SUM(amount)::NUMERIC AS total_gastos
    FROM monthly_expenses_config
    WHERE
      year     = p_year
      AND is_active = true
      AND month BETWEEN v_mes_inicio AND v_mes_fin
    GROUP BY month
  ),

  -- Sumar sueldos activos configurados por mes
  sueldos_por_mes AS (
    SELECT
      month AS num_mes,
      SUM(amount)::NUMERIC AS total_sueldos
    FROM monthly_salaries_config
    WHERE
      year     = p_year
      AND is_active = true
      AND month BETWEEN v_mes_inicio AND v_mes_fin
    GROUP BY month
  )

  SELECT
    -- Nombre abreviado del mes en español
    CASE m.num_mes
      WHEN 1  THEN 'Ene'
      WHEN 2  THEN 'Feb'
      WHEN 3  THEN 'Mar'
      WHEN 4  THEN 'Abr'
      WHEN 5  THEN 'May'
      WHEN 6  THEN 'Jun'
      WHEN 7  THEN 'Jul'
      WHEN 8  THEN 'Ago'
      WHEN 9  THEN 'Sep'
      WHEN 10 THEN 'Oct'
      WHEN 11 THEN 'Nov'
      WHEN 12 THEN 'Dic'
    END::TEXT AS mes,

    -- Ingreso neto = (pagos + ventas) - (gastos + sueldos)
    (
      COALESCE(p.total_pagos,   0)
      + COALESCE(v.total_ventas, 0)
      - COALESCE(g.total_gastos, 0)
      - COALESCE(s.total_sueldos, 0)
    ) AS monto

  FROM meses m
  LEFT JOIN pagos_por_mes   p ON p.num_mes = m.num_mes
  LEFT JOIN ventas_por_mes  v ON v.num_mes = m.num_mes
  LEFT JOIN gastos_por_mes  g ON g.num_mes = m.num_mes
  LEFT JOIN sueldos_por_mes s ON s.num_mes = m.num_mes
  ORDER BY m.num_mes;
END;
$$;

-- Permisos: permitir ejecución a roles autenticados y service_role
GRANT EXECUTE ON FUNCTION get_ingreso_mensual_semestre(INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ingreso_mensual_semestre(INT, INT) TO service_role;
