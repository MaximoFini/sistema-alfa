-- Migración para añadir tarjeta y alias de transferencia a la tabla ventas
ALTER TABLE public.ventas 
ADD COLUMN tarjeta text,
ADD COLUMN alias_transferencia text;
