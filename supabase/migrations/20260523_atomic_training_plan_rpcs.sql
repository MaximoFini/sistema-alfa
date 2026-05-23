-- ============================================================
-- Fase 1 - Seguridad e Integridad Transaccional
-- Migración: RPCs atómicas para planes de entrenamiento
-- Fecha: 2026-05-23
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- RPC 1: crear_plan_entrenamiento_completo
-- Inserta plan + días + ejercicios en una única transacción.
-- Recibe un JSONB con la siguiente estructura:
-- {
--   "coach_id":       "uuid",
--   "title":          "string",
--   "description":    "string|null",
--   "start_date":     "YYYY-MM-DD",
--   "end_date":       "YYYY-MM-DD",
--   "total_days":     number,
--   "days_per_week":  number,
--   "total_weeks":    number,
--   "plan_type":      "string",
--   "difficulty_level": "string|null",
--   "is_template":    boolean,
--   "days": [
--     { "temp_id": "string", "day_number": number, "day_name": "string", "display_order": number }
--   ],
--   "exercises": [
--     {
--       "temp_day_id": "string",   -- referencia al temp_id del día
--       "stage_id":     "uuid|null",
--       "stage_name":   "string|null",
--       "exercise_name":"string",
--       "video_url":    "string|null",
--       "series":       number,
--       "reps":         "string",
--       "carga":        "string",
--       "pause":        "string",
--       "notes":        "string|null",
--       "coach_instructions": "string|null",
--       "display_order":number,
--       "write_weight": boolean
--     }
--   ]
-- }
-- Retorna el registro del plan creado (training_plans.*).
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.crear_plan_entrenamiento_completo(plan_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan          training_plans%ROWTYPE;
  v_day           JSONB;
  v_exercise      JSONB;
  v_inserted_day  training_plan_days%ROWTYPE;
  -- Mapa temp_id -> real UUID del día
  v_day_id_map    JSONB := '{}';
  v_real_day_id   UUID;
  v_temp_day_id   TEXT;
BEGIN
  -- ── 1. Insertar el plan ──────────────────────────────────
  INSERT INTO training_plans (
    coach_id,
    title,
    description,
    start_date,
    end_date,
    total_days,
    days_per_week,
    total_weeks,
    plan_type,
    difficulty_level,
    is_template,
    is_archived
  )
  VALUES (
    (plan_data->>'coach_id')::UUID,
    plan_data->>'title',
    plan_data->>'description',
    (plan_data->>'start_date')::DATE,
    (plan_data->>'end_date')::DATE,
    (plan_data->>'total_days')::INT,
    (plan_data->>'days_per_week')::INT,
    (plan_data->>'total_weeks')::INT,
    COALESCE(plan_data->>'plan_type', 'custom'),
    plan_data->>'difficulty_level',
    COALESCE((plan_data->>'is_template')::BOOLEAN, FALSE),
    FALSE
  )
  RETURNING * INTO v_plan;

  -- ── 2. Insertar los días y construir el mapa de IDs ──────
  FOR v_day IN SELECT * FROM jsonb_array_elements(plan_data->'days')
  LOOP
    INSERT INTO training_plan_days (
      plan_id,
      day_number,
      day_name,
      display_order
    )
    VALUES (
      v_plan.id,
      (v_day->>'day_number')::INT,
      v_day->>'day_name',
      (v_day->>'display_order')::INT
    )
    RETURNING * INTO v_inserted_day;

    -- Guardar la relación temp_id → uuid real
    v_day_id_map := v_day_id_map || jsonb_build_object(
      v_day->>'temp_id',
      v_inserted_day.id::TEXT
    );
  END LOOP;

  -- ── 3. Insertar los ejercicios ───────────────────────────
  FOR v_exercise IN SELECT * FROM jsonb_array_elements(plan_data->'exercises')
  LOOP
    v_temp_day_id := v_exercise->>'temp_day_id';
    v_real_day_id := (v_day_id_map->>v_temp_day_id)::UUID;

    -- Saltar si no se puede resolver el día (no debería ocurrir)
    CONTINUE WHEN v_real_day_id IS NULL;

    INSERT INTO training_plan_exercises (
      day_id,
      stage_id,
      stage_name,
      exercise_name,
      video_url,
      series,
      reps,
      carga,
      pause,
      notes,
      coach_instructions,
      display_order,
      write_weight
    )
    VALUES (
      v_real_day_id,
      NULLIF(v_exercise->>'stage_id', '')::UUID,
      v_exercise->>'stage_name',
      v_exercise->>'exercise_name',
      v_exercise->>'video_url',
      (v_exercise->>'series')::INT,
      v_exercise->>'reps',
      COALESCE(v_exercise->>'carga', '-'),
      v_exercise->>'pause',
      v_exercise->>'notes',
      v_exercise->>'coach_instructions',
      COALESCE((v_exercise->>'display_order')::INT, 0),
      COALESCE((v_exercise->>'write_weight')::BOOLEAN, FALSE)
    );
  END LOOP;

  -- ── 4. Retornar el plan creado como JSONB ────────────────
  RETURN to_jsonb(v_plan);

EXCEPTION WHEN OTHERS THEN
  -- La transacción se revierte automáticamente (LANGUAGE plpgsql)
  RAISE;
END;
$$;

-- Otorgar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.crear_plan_entrenamiento_completo(JSONB) TO authenticated;


-- ────────────────────────────────────────────────────────────
-- RPC 2: duplicar_plan_entrenamiento
-- Duplica un plan existente (con sus días y ejercicios) en
-- una única transacción atómica.
-- Retorna el nuevo plan como JSONB.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.duplicar_plan_entrenamiento(
  p_plan_id  UUID,
  p_coach_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_original_plan   training_plans%ROWTYPE;
  v_new_plan        training_plans%ROWTYPE;
  v_original_day    training_plan_days%ROWTYPE;
  v_new_day         training_plan_days%ROWTYPE;
  v_exercise        training_plan_exercises%ROWTYPE;
BEGIN
  -- ── 1. Obtener el plan original ──────────────────────────
  SELECT * INTO v_original_plan
  FROM training_plans
  WHERE id = p_plan_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan no encontrado: %', p_plan_id;
  END IF;

  -- ── 2. Crear el nuevo plan ───────────────────────────────
  INSERT INTO training_plans (
    coach_id,
    title,
    description,
    start_date,
    end_date,
    total_days,
    days_per_week,
    total_weeks,
    plan_type,
    difficulty_level,
    is_template,
    is_archived
  )
  VALUES (
    p_coach_id,
    v_original_plan.title || ' (Copia)',
    v_original_plan.description,
    v_original_plan.start_date,
    v_original_plan.end_date,
    v_original_plan.total_days,
    v_original_plan.days_per_week,
    v_original_plan.total_weeks,
    v_original_plan.plan_type,
    v_original_plan.difficulty_level,
    v_original_plan.is_template,
    FALSE
  )
  RETURNING * INTO v_new_plan;

  -- ── 3. Duplicar días y ejercicios ────────────────────────
  FOR v_original_day IN
    SELECT * FROM training_plan_days
    WHERE plan_id = p_plan_id
    ORDER BY display_order
  LOOP
    -- Crear el nuevo día
    INSERT INTO training_plan_days (
      plan_id,
      day_number,
      day_name,
      display_order
    )
    VALUES (
      v_new_plan.id,
      v_original_day.day_number,
      v_original_day.day_name,
      v_original_day.display_order
    )
    RETURNING * INTO v_new_day;

    -- Copiar ejercicios del día original al nuevo
    FOR v_exercise IN
      SELECT * FROM training_plan_exercises
      WHERE day_id = v_original_day.id
      ORDER BY display_order
    LOOP
      INSERT INTO training_plan_exercises (
        day_id,
        stage_id,
        stage_name,
        exercise_name,
        video_url,
        series,
        reps,
        carga,
        pause,
        notes,
        coach_instructions,
        display_order,
        write_weight
      )
      VALUES (
        v_new_day.id,
        v_exercise.stage_id,
        v_exercise.stage_name,
        v_exercise.exercise_name,
        v_exercise.video_url,
        v_exercise.series,
        v_exercise.reps,
        v_exercise.carga,
        v_exercise.pause,
        v_exercise.notes,
        v_exercise.coach_instructions,
        v_exercise.display_order,
        v_exercise.write_weight
      );
    END LOOP;
  END LOOP;

  -- ── 4. Retornar el nuevo plan como JSONB ─────────────────
  RETURN to_jsonb(v_new_plan);

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- Otorgar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.duplicar_plan_entrenamiento(UUID, UUID) TO authenticated;
