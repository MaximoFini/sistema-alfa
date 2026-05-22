-- Migración para crear la tabla de categorías de productos y sus políticas de seguridad RLS

CREATE TABLE IF NOT EXISTS public.product_categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT product_categories_pkey PRIMARY KEY (id),
    CONSTRAINT product_categories_name_key UNIQUE (name)
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para permitir accesos a usuarios autenticados
CREATE POLICY "Allow all for authenticated users" ON public.product_categories
    AS PERMISSIVE FOR ALL
    TO public
    USING (auth.role() = 'authenticated'::text);

-- Seed de datos iniciales
INSERT INTO public.product_categories (name, is_active)
VALUES 
    ('General', true),
    ('Indumentaria', true),
    ('Suplementacion', true)
ON CONFLICT (name) DO NOTHING;
