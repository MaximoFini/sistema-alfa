CREATE OR REPLACE FUNCTION crear_alumno_con_cobro(
  p_nombre text,
  p_dni text,
  p_domicilio text,
  p_telefono text,
  p_fecha_nacimiento date,
  p_fecha_registro date,
  p_genero text,
  p_edad_actual integer,
  p_actividad text,
  p_precio numeric,
  p_fecha_cobro date,
  p_medio_pago text,
  p_fecha_inicio date,
  p_fecha_vencimiento date,
  p_cuis_completado boolean DEFAULT false,
  p_email text DEFAULT NULL,
  p_tarjeta text DEFAULT NULL,
  p_alias_transferencia text DEFAULT NULL,
  p_telefono_emergencia text DEFAULT NULL,
  p_observaciones text DEFAULT NULL
) RETURNS json AS $$
DECLARE
  v_alumno_id uuid;
  v_pago_id uuid;
BEGIN
  -- 1. Insertar el alumno con los datos de inscripción iniciales
  INSERT INTO public.alumnos (
    nombre,
    dni,
    domicilio,
    telefono,
    fecha_nacimiento,
    fecha_registro,
    genero,
    edad_actual,
    abono_ultima_inscripcion,
    fecha_proximo_vencimiento,
    actividad_proximo_vencimiento,
    fecha_ultimo_inicio,
    activo,
    cuis_completado,
    cuis_clases_presentadas,
    email,
    telefono_emergencia,
    observaciones
  ) VALUES (
    p_nombre,
    p_dni,
    p_domicilio,
    p_telefono,
    p_fecha_nacimiento,
    p_fecha_registro,
    p_genero,
    p_edad_actual,
    p_actividad,
    p_fecha_vencimiento,
    p_actividad,
    p_fecha_inicio,
    TRUE, -- Queda activo inmediatamente al registrar cobro inicial
    p_cuis_completado,
    0,
    p_email,
    p_telefono_emergencia,
    p_observaciones
  ) RETURNING id INTO v_alumno_id;

  -- 2. Insertar el registro de pago correspondiente
  INSERT INTO public.pagos (
    alumno_id,
    actividad,
    precio,
    fecha_cobro,
    medio_pago,
    fecha_inicio,
    fecha_vencimiento,
    tarjeta,
    alias_transferencia
  ) VALUES (
    v_alumno_id,
    p_actividad,
    p_precio,
    p_fecha_cobro,
    p_medio_pago,
    p_fecha_inicio,
    p_fecha_vencimiento,
    p_tarjeta,
    p_alias_transferencia
  ) RETURNING id INTO v_pago_id;

  RETURN json_build_object(
    'success', TRUE,
    'alumno_id', v_alumno_id,
    'pago_id', v_pago_id
  );
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error al crear alumno con cobro: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
