-- ============================================================
-- OPTIMIZACIÓN DE PERFORMANCE — ÍNDICES EN TABLAS CRÍTICAS
-- ============================================================
-- Ejecutar en Supabase SQL Editor o via CLI
-- Todos usan IF NOT EXISTS para ser idempotentes
-- ============================================================

-- 1. pagos: filtros más frecuentes (verificar-dni + finanzas API)
CREATE INDEX IF NOT EXISTS idx_pagos_fecha_cobro 
  ON pagos(fecha_cobro);

CREATE INDEX IF NOT EXISTS idx_pagos_alumno_vencimiento 
  ON pagos(alumno_id, fecha_vencimiento DESC);

CREATE INDEX IF NOT EXISTS idx_pagos_alumno_inicio 
  ON pagos(alumno_id, fecha_inicio);

-- 2. asistencias: lookup por alumno+fecha (verificar-dni + estadísticas)
CREATE INDEX IF NOT EXISTS idx_asistencias_alumno_fecha 
  ON asistencias(alumno_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_asistencias_fecha 
  ON asistencias(fecha);

-- 3. alumnos: filtros de activo/prueba (queries principales)
CREATE INDEX IF NOT EXISTS idx_alumnos_activo 
  ON alumnos(activo) WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_alumnos_es_prueba 
  ON alumnos(es_prueba) WHERE es_prueba = false;

CREATE INDEX IF NOT EXISTS idx_alumnos_dni 
  ON alumnos(dni);

-- 4. estadisticas_mensuales: ordenamiento frecuente
CREATE INDEX IF NOT EXISTS idx_estadisticas_year_month 
  ON estadisticas_mensuales(year DESC, month DESC);

-- 5. monthly_expenses/salaries: búsqueda por mes (elimina N+1)
CREATE INDEX IF NOT EXISTS idx_monthly_expenses_year_month 
  ON monthly_expenses_config(year, month);

CREATE INDEX IF NOT EXISTS idx_monthly_salaries_year_month 
  ON monthly_salaries_config(year, month);
