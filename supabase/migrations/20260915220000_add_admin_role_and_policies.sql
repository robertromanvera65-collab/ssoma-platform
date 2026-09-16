/*
# Admin role and management policies

## Overview
Adds a real admin/permissions system on top of the existing schema:
- `profiles.is_admin` flags a user as platform administrator.
- A SECURITY DEFINER helper `public.is_admin(uid)` lets RLS policies check
  admin status without recursive-RLS issues on the `profiles` table itself.
- Admins can now view/manage every user's profile, and update/delete any
  record across all SSOMA tables (not just their own).

## IMPORTANT — after running this migration
Promote your own account to admin by running (replace with your email):

  UPDATE profiles SET is_admin = true
  WHERE id = (SELECT id FROM auth.users WHERE email = 'tu-correo@ejemplo.com');
*/

-- 1. Admin flag on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- 2. Helper function (SECURITY DEFINER bypasses RLS to avoid recursive policy checks)
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = uid), false);
$$;

-- 3. profiles: admins can see and edit every profile
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "select_own_or_admin_profile" ON profiles;
CREATE POLICY "select_own_or_admin_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "update_own_or_admin_profile" ON profiles;
CREATE POLICY "update_own_or_admin_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

-- 4. incidentes: admins can update/delete any row
DROP POLICY IF EXISTS "update_incidentes" ON incidentes;
CREATE POLICY "update_incidentes" ON incidentes FOR UPDATE
  TO authenticated USING (auth.uid() = created_by OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = created_by OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "delete_incidentes" ON incidentes;
CREATE POLICY "delete_incidentes" ON incidentes FOR DELETE
  TO authenticated USING (auth.uid() = created_by OR public.is_admin(auth.uid()));

-- 5. epp_catalog: admins can update/delete any row
DROP POLICY IF EXISTS "update_epp_catalog" ON epp_catalog;
CREATE POLICY "update_epp_catalog" ON epp_catalog FOR UPDATE
  TO authenticated USING (auth.uid() = created_by OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = created_by OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "delete_epp_catalog" ON epp_catalog;
CREATE POLICY "delete_epp_catalog" ON epp_catalog FOR DELETE
  TO authenticated USING (auth.uid() = created_by OR public.is_admin(auth.uid()));

-- 6. epp_entregas: admins can update/delete any row
DROP POLICY IF EXISTS "update_epp_entregas" ON epp_entregas;
CREATE POLICY "update_epp_entregas" ON epp_entregas FOR UPDATE
  TO authenticated USING (auth.uid() = created_by OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = created_by OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "delete_epp_entregas" ON epp_entregas;
CREATE POLICY "delete_epp_entregas" ON epp_entregas FOR DELETE
  TO authenticated USING (auth.uid() = created_by OR public.is_admin(auth.uid()));

-- 7. capacitaciones: admins can update/delete any row
DROP POLICY IF EXISTS "update_capacitaciones" ON capacitaciones;
CREATE POLICY "update_capacitaciones" ON capacitaciones FOR UPDATE
  TO authenticated USING (auth.uid() = created_by OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = created_by OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "delete_capacitaciones" ON capacitaciones;
CREATE POLICY "delete_capacitaciones" ON capacitaciones FOR DELETE
  TO authenticated USING (auth.uid() = created_by OR public.is_admin(auth.uid()));

-- 8. inspecciones: admins can update/delete any row
DROP POLICY IF EXISTS "update_inspecciones" ON inspecciones;
CREATE POLICY "update_inspecciones" ON inspecciones FOR UPDATE
  TO authenticated USING (auth.uid() = created_by OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = created_by OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "delete_inspecciones" ON inspecciones;
CREATE POLICY "delete_inspecciones" ON inspecciones FOR DELETE
  TO authenticated USING (auth.uid() = created_by OR public.is_admin(auth.uid()));
