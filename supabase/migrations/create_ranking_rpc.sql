-- ============================================================
-- RPC: get_ranking_asistencias_mes
-- Devuelve el ranking de alumnos por asistencias en un mes dado
-- Reemplaza el fetch masivo de asistencias+join en EstadisticasPage
-- ============================================================

CREATE OR REPLACE FUNCTION get_ranking_asistencias_mes(
  p_year INTEGER,
  p_month INTEGER,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  alumno_id UUID,
  nombre TEXT,
  genero TEXT,
  total_clases BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  fecha_inicio TEXT;
  fecha_fin TEXT;
BEGIN
  fecha_inicio := to_char(make_date(p_year, p_month, 1), 'YYYY-MM-DD');
  fecha_fin := to_char(
    (make_date(p_year, p_month, 1) + INTERVAL '1 month' - INTERVAL '1 day'),
    'YYYY-MM-DD'
  );
  
  RETURN QUERY
  SELECT 
    a.alumno_id,
    al.nombre::TEXT,
    COALESCE(al.genero, 'Masculino')::TEXT as genero,
    COUNT(*)::BIGINT as total_clases
  FROM asistencias a
  JOIN alumnos al ON a.alumno_id = al.id
  WHERE a.fecha::TEXT >= fecha_inicio
    AND a.fecha::TEXT <= fecha_fin
  GROUP BY a.alumno_id, al.nombre, al.genero
  ORDER BY total_clases DESC
  LIMIT p_limit;
END;
$$;

-- Comentario: Para usar esta función desde el cliente:
-- const { data } = await supabase.rpc('get_ranking_asistencias_mes', {
--   p_year: 2026, p_month: 5, p_limit: 10
-- });
