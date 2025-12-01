-- =============================================
-- AGREGAR COLUMNAS FALTANTES A VEHICLES
-- =============================================

-- Columna is_consignment (vehículo en consignación o no)
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS is_consignment BOOLEAN DEFAULT false;

-- Agregar comentario explicativo
COMMENT ON COLUMN public.vehicles.is_consignment IS 'Indica si el vehículo está en régimen de consignación';

