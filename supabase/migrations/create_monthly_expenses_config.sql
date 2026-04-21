-- ============================================================================
-- CONFIGURACIÓN MENSUAL DE EGRESOS
-- ============================================================================
-- Almacena la configuración de gastos y sueldos de cada mes por separado.
-- Cuando se accede a un mes sin datos, se auto-puebla desde el mes anterior.
-- ============================================================================

-- Tabla de gastos mensuales
CREATE TABLE IF NOT EXISTS public.monthly_expenses_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  year smallint NOT NULL,
  month smallint NOT NULL CHECK (month >= 1 AND month <= 12),
  name character varying NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  category character varying,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT monthly_expenses_config_pkey PRIMARY KEY (id)
);

-- Tabla de sueldos mensuales
CREATE TABLE IF NOT EXISTS public.monthly_salaries_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  year smallint NOT NULL,
  month smallint NOT NULL CHECK (month >= 1 AND month <= 12),
  name character varying NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT monthly_salaries_config_pkey PRIMARY KEY (id)
);

-- Índices para acelerar búsquedas por año/mes
CREATE INDEX IF NOT EXISTS monthly_expenses_config_year_month_idx
  ON public.monthly_expenses_config (year, month);

CREATE INDEX IF NOT EXISTS monthly_salaries_config_year_month_idx
  ON public.monthly_salaries_config (year, month);

-- ============================================================================
-- GASTOS BASE PREDETERMINADOS
-- ============================================================================
-- Se insertan en business_expenses como plantilla.
-- El hook los copia al primer mes cuando no hay datos previos.
-- Solo se insertan si la tabla está vacía para no duplicar.
-- ============================================================================

INSERT INTO public.business_expenses (name, amount, is_active, category, is_system)
SELECT name, 0, true, category, true
FROM (VALUES
  ('Alarma Monitoreo',       'Servicios'),
  ('Alquiler',               'Gastos fijos'),
  ('Elementos de limpieza',  'Gastos fijos'),
  ('Gastos extra',           'Variable'),
  ('Librería',               'Variable'),
  ('Mantenimiento',          'Gastos fijos'),
  ('Monotributo',            'Impuestos'),
  ('Reinversión',            'Variable'),
  ('Seguro',                 'Gastos fijos'),
  ('Servicio de emergencia', 'Servicios'),
  ('Sistema Clientes',       'Servicios')
) AS t(name, category)
WHERE NOT EXISTS (SELECT 1 FROM public.business_expenses LIMIT 1);
