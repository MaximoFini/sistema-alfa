-- ============================================================================
-- SISTEMA DE EGRESOS CONFIGURABLES DEL NEGOCIO
-- ============================================================================
-- Esta migración crea la tabla para gestionar los egresos fijos y variables
-- del negocio que se pueden configurar desde los ajustes de administración.
-- ============================================================================

-- Crear la tabla de egresos configurables
CREATE TABLE IF NOT EXISTS business_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  category VARCHAR(50), -- Para agrupar gastos similares
  description TEXT, -- Descripción opcional del gasto
  is_system BOOLEAN NOT NULL DEFAULT false, -- Para identificar gastos predefinidos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_business_expenses_active ON business_expenses(is_active);
CREATE INDEX IF NOT EXISTS idx_business_expenses_category ON business_expenses(category);

-- Insertar los egresos predefinidos del sistema
INSERT INTO business_expenses (name, amount, is_active, category, is_system) VALUES
  ('Alarma Monitoreo', 0, true, 'seguridad', true),
  ('Alquiler', 0, true, 'infraestructura', true),
  ('Elementos de limpieza', 0, true, 'mantenimiento', true),
  ('Gastos extra', 0, true, 'varios', true),
  ('Librería', 0, true, 'materiales', true),
  ('Mantenimiento', 0, true, 'mantenimiento', true),
  ('Monotributo', 0, true, 'impuestos', true),
  ('Reinversión', 0, true, 'capital', true),
  ('Seguro', 0, true, 'seguridad', true),
  ('Servicio de emergencia', 0, true, 'seguridad', true),
  ('Sistema Clientes', 0, true, 'tecnologia', true)
ON CONFLICT DO NOTHING;

-- Crear tabla para los sueldos (permite múltiples entradas)
CREATE TABLE IF NOT EXISTS business_salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- Nombre del puesto o persona
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT, -- Descripción del puesto o notas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_salaries_active ON business_salaries(is_active);

-- Función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar automáticamente updated_at
CREATE TRIGGER update_business_expenses_updated_at
  BEFORE UPDATE ON business_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_salaries_updated_at
  BEFORE UPDATE ON business_salaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE business_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_salaries ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (permitir todo a usuarios autenticados)
CREATE POLICY "Permitir lectura de egresos a usuarios autenticados"
  ON business_expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir escritura de egresos a usuarios autenticados"
  ON business_expenses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir lectura de sueldos a usuarios autenticados"
  ON business_salaries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir escritura de sueldos a usuarios autenticados"
  ON business_salaries FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FUNCIONES DE UTILIDAD
-- ============================================================================

-- Función para obtener el total de egresos activos
CREATE OR REPLACE FUNCTION get_total_active_expenses()
RETURNS NUMERIC AS $$
DECLARE
  total_expenses NUMERIC;
  total_salaries NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_expenses
  FROM business_expenses
  WHERE is_active = true;
  
  SELECT COALESCE(SUM(amount), 0) INTO total_salaries
  FROM business_salaries
  WHERE is_active = true;
  
  RETURN total_expenses + total_salaries;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener egresos por categoría
CREATE OR REPLACE FUNCTION get_expenses_by_category()
RETURNS TABLE(category VARCHAR, total NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(be.category, 'sin_categoria') as category,
    COALESCE(SUM(be.amount), 0) as total
  FROM business_expenses be
  WHERE be.is_active = true
  GROUP BY be.category
  ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE business_expenses IS 'Tabla de egresos fijos y variables configurables del negocio';
COMMENT ON TABLE business_salaries IS 'Tabla de sueldos del personal del negocio';
COMMENT ON COLUMN business_expenses.is_system IS 'Indica si es un gasto predefinido del sistema (no se puede eliminar)';
COMMENT ON COLUMN business_expenses.is_active IS 'Indica si el gasto está activo y debe contabilizarse';

-- ============================================================================
-- VERIFICACIÓN Y TESTING
-- ============================================================================

-- Ver todos los egresos:
-- SELECT * FROM business_expenses ORDER BY category, name;

-- Ver todos los sueldos:
-- SELECT * FROM business_salaries ORDER BY name;

-- Ver total de egresos activos:
-- SELECT get_total_active_expenses();

-- Ver egresos por categoría:
-- SELECT * FROM get_expenses_by_category();
