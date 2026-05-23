-- ============================================================
-- MIGRACIÓN: AGREGAR RESTRICCIÓN DE DNI ÚNICO EN ALUMNOS
-- ============================================================

ALTER TABLE public.alumnos ADD CONSTRAINT alumnos_dni_unique UNIQUE (dni);
