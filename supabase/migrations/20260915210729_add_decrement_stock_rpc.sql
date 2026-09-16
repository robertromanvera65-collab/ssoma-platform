/*
# Add decrement_stock RPC function

## Purpose
Provides an atomic stock decrement for EPP deliveries. When an EPP delivery is registered,
the catalog stock is reduced by the delivered quantity, clamped at zero.

## Security
- SECURITY DEFINER so it can run with the caller's privileges while doing an atomic UPDATE.
- Only decrements; never increments. Clamps at 0 to prevent negative stock.
*/

CREATE OR REPLACE FUNCTION public.decrement_stock(p_id uuid, p_qty int)
RETURNS void AS $$
BEGIN
  UPDATE public.epp_catalog
  SET stock = GREATEST(0, stock - p_qty)
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
