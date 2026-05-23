-- Migration: Add color column to product_categories table
ALTER TABLE public.product_categories ADD COLUMN IF NOT EXISTS color text DEFAULT 'purple';

-- Seed existing categories with their current color mappings
UPDATE public.product_categories SET color = 'sky' WHERE name = 'General';
UPDATE public.product_categories SET color = 'orange' WHERE name = 'Indumentaria';
UPDATE public.product_categories SET color = 'emerald' WHERE name = 'Suplementacion';
