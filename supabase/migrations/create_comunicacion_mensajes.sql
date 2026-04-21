-- Tabla para el historial de mensajes enviados desde el módulo de comunicación
-- Guarda el texto, el filtro usado, cuántos alumnos se enviaron y el estado.
-- La integración con WhatsApp Business se conectará al campo `estado`.

CREATE TABLE public.comunicacion_mensajes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  texto text NOT NULL,
  filtro text NOT NULL,
  filtro_label text NOT NULL,
  cantidad integer NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'guardado',
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT comunicacion_mensajes_pkey PRIMARY KEY (id),
  CONSTRAINT comunicacion_mensajes_filtro_check CHECK (filtro IN ('todos', 'activos', 'nuevos', 'en_riesgo', 'inactivos', 'perdidos')),
  CONSTRAINT comunicacion_mensajes_estado_check CHECK (estado IN ('guardado', 'enviado', 'error'))
);
