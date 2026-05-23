-- ============================================================================
-- MIGRACIÓN: SISTEMA DE TRAZABILIDAD Y CARGA DE HISTORIAL FINANCIERO
-- ============================================================================

-- 1. Agregar columnas de trazabilidad a la tabla de estadísticas mensuales
ALTER TABLE estadisticas_mensuales 
ADD COLUMN IF NOT EXISTS es_importado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS origen_importacion TEXT,
ADD COLUMN IF NOT EXISTS fecha_importacion TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notas_importacion TEXT;

-- 2. Crear tabla de auditoría para importaciones financieras
CREATE TABLE IF NOT EXISTS audit_importaciones_financieras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  descripcion TEXT NOT NULL,
  registros_afectados INTEGER,
  datos_importados JSONB,
  creado_por TEXT DEFAULT 'Antigravity AI Agent'
);

-- 3. Habilitar RLS y políticas seguras para la tabla de auditoría
ALTER TABLE audit_importaciones_financieras ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audit_importaciones_financieras' 
      AND policyname = 'Permitir todo a usuarios autenticados'
  ) THEN
    CREATE POLICY "Permitir todo a usuarios autenticados" ON audit_importaciones_financieras 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END
$$;

-- 4. Cargar/Actualizar estadísticas históricas de ingresos del mes (NETO)
-- Si el registro ya existe (por ejemplo, tiene datos de alumnos o género),
-- se actualiza únicamente ingresos_mes e información de trazabilidad.
-- Si no existe, se inserta con valores demográficos base seguros.
INSERT INTO estadisticas_mensuales (
  year, month, ingresos_mes, es_importado, origen_importacion, fecha_importacion, notas_importacion, alumnos_activos, deuda_total
) VALUES
  -- 2026
  (2026, 1, 6185230.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $6,185,230.00 neto', 153, 0),
  (2026, 2, 4546742.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $4,546,742.00 neto', 127, 0),
  (2026, 3, 8893412.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $8,893,412.00 neto', 138, 0),
  (2026, 4, 10373000.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $10,373,000.00 neto', 24, 0),
  (2026, 5, 8430750.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $8,430,750.00 neto (mes en curso/cierre)', 14, 0),
  -- 2025
  (2025, 1, 2808330.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $2,808,330.00 neto', 105, 0),
  (2025, 2, 3412179.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $3,412,179.00 neto', 116, 0),
  (2025, 3, 3475400.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $3,475,400.00 neto', 129, 0),
  (2025, 4, 3409277.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $3,409,277.00 neto', 129, 0),
  (2025, 5, 4206577.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $4,206,577.00 neto', 152, 0),
  (2025, 6, 3276260.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $3,276,260.00 neto', 118, 0),
  (2025, 7, 4461042.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $4,461,042.00 neto', 125, 0),
  (2025, 8, 5159195.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $5,159,195.00 neto', 161, 0),
  (2025, 9, 8475400.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $8,475,400.00 neto', 166, 0),
  (2025, 10, 5172800.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $5,172,800.00 neto', 148, 0),
  (2025, 11, 6622000.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $6,622,000.00 neto', 125, 0),
  (2025, 12, 3089410.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $3,089,410.00 neto', 104, 0),
  -- 2024
  (2024, 1, 1186048.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $1,186,048.00 neto', 101, 0),
  (2024, 2, 874672.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $874,672.00 neto', 95, 0),
  (2024, 3, 868297.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $868,297.00 neto', 82, 0),
  (2024, 4, 1039117.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $1,039,117.00 neto', 100, 0),
  (2024, 5, 1413665.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $1,413,665.00 neto', 107, 0),
  (2024, 6, 1602045.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $1,602,045.00 neto', 101, 0),
  (2024, 7, 2388641.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $2,388,641.00 neto', 113, 0),
  (2024, 8, 1805822.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $1,805,822.00 neto', 118, 0),
  (2024, 9, 1974307.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $1,974,307.00 neto', 124, 0),
  (2024, 10, 2333250.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $2,333,250.00 neto', 112, 0),
  (2024, 11, 2307482.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $2,307,482.00 neto', 108, 0),
  (2024, 12, 986275.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $986,275.00 neto', 68, 0),
  -- 2023
  (2023, 1, 267728.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $267,728.00 neto', 86, 0),
  (2023, 2, 189538.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $189,538.00 neto', 94, 0),
  (2023, 3, 341670.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $341,670.00 neto', 138, 0),
  (2023, 4, 303020.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $303,020.00 neto', 119, 0),
  (2023, 5, 486965.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $486,965.00 neto', 115, 0),
  (2023, 6, 513328.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $513,328.00 neto', 127, 0),
  (2023, 7, 467870.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $467,870.00 neto', 123, 0),
  (2023, 8, 631844.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $631,844.00 neto', 124, 0),
  (2023, 9, 552633.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $552,633.00 neto', 130, 0),
  (2023, 10, 723700.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $723,700.00 neto', 128, 0),
  (2023, 11, 900225.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $900,225.00 neto', 106, 0),
  (2023, 12, 224910.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $224,910.00 neto', 70, 0),
  -- 2022
  (2022, 1, 160198.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $160,198.00 neto', 47, 0),
  (2022, 2, 126476.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $126,476.00 neto', 41, 0),
  (2022, 3, 182131.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $182,131.00 neto', 72, 0),
  (2022, 4, 177779.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $177,779.00 neto', 65, 0),
  (2022, 5, 44160.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $44,160.00 neto', 48, 0),
  (2022, 6, 69386.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $69,386.00 neto', 52, 0),
  (2022, 7, 83460.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $83,460.00 neto', 55, 0),
  (2022, 8, 128806.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $128,806.00 neto', 68, 0),
  (2022, 9, 19678.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $19,678.00 neto', 55, 0),
  (2022, 10, 131300.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $131,300.00 neto', 73, 0),
  (2022, 11, 160420.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: $160,420.00 neto', 73, 0),
  (2022, 12, -30122.00, true, 'Otro Sistema', NOW(), 'Estadísticas importadas: -$30,122.00 neto (pérdida)', 37, 0)
ON CONFLICT (year, month) DO UPDATE SET
  ingresos_mes = EXCLUDED.ingresos_mes,
  es_importado = EXCLUDED.es_importado,
  origen_importacion = EXCLUDED.origen_importacion,
  fecha_importacion = EXCLUDED.fecha_importacion,
  notas_importacion = EXCLUDED.notas_importacion;

-- 5. Registrar la auditoría de la importación
INSERT INTO audit_importaciones_financieras (
  descripcion, registros_afectados, datos_importados
) VALUES (
  'Importación manual de ingresos mensuales netos históricos (2022-2026) desde captura de pantalla',
  53,
  '{
    "origen": "Otro sistema (captura de pantalla provista)",
    "rango": "Enero 2022 - Mayo 2026",
    "total_años": 5,
    "total_meses": 53,
    "tipo_dato": "Ingresos mensuales NETOS",
    "comentario": "Se actualizaron/insertaron los registros mensuales del historial de ingresos neto de manera que queden persistidos con plena trazabilidad y reflejo en el panel."
  }'::jsonb
);
