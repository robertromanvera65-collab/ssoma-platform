/*
# SSOMA Platform Schema — Safety, Health, and Environment Management

## Overview
This migration creates the complete database schema for a SSOMA (Seguridad, Salud Ocupacional y Medio Ambiente) management platform.
The app requires authentication (sign-in screen), so all tables use owner-scoped RLS with `auth.uid()`.

## New Tables

### 1. profiles
- `id` (uuid, PK, references auth.users) — one row per user
- `full_name` (text) — display name
- `role` (text) — job role/title (e.g. "Supervisor de Seguridad")
- `department` (text) — department name
- `created_at` (timestamptz)

### 2. incidentes (Incidents)
- `id` (uuid, PK)
- `fecha` (date) — when the incident occurred
- `tipo` (text) — accidente / casi-accidente / condicion insegura / acto inseguro
- `severidad` (text) — leve / moderado / grave / critico
- `descripcion` (text) — what happened
- `ubicacion` (text) — where it happened
- `area` (text) — organizational area
- `estado` (text) — reportado / investigando / cerrado
- `acciones` (text) — corrective actions taken
- `created_by` (uuid, references auth.users) — who reported it
- `created_at` (timestamptz)

### 3. epp_catalog (PPE Catalog)
- `id` (uuid, PK)
- `nombre` (text) — equipment name (e.g. "Casco de seguridad")
- `categoria` (text) — cabeza / ojos / oidos / respiratorio / manos / pies / cuerpo
- `talla` (text) — size if applicable
- `stock` (int, default 0) — current inventory
- `stock_minimo` (int, default 0) — minimum stock threshold
- `norma` (text) — certification standard (e.g. "ANSI Z89.1")
- `created_at` (timestamptz)

### 4. epp_entregas (PPE Deliveries)
- `id` (uuid, PK)
- `fecha` (date) — delivery date
- `trabajador` (text) — worker name
- `documento` (text) — worker ID/document
- `epp_catalog_id` (uuid, references epp_catalog) — which equipment
- `cantidad` (int) — quantity delivered
- `firma` (text) — digital signature or confirmation
- `created_by` (uuid, references auth.users)
- `created_at` (timestamptz)

### 5. capacitaciones (Trainings)
- `id` (uuid, PK)
- `titulo` (text) — training title
- `tema` (text) — topic (e.g. "Altura", "Espacios confinados")
- `fecha` (date) — training date
- `duracion_horas` (int) — duration in hours
- `instructor` (text) — instructor name
- `modalidad` (text) — presencial / virtual / mixta
- `estado` (text) — programada / completada / cancelada
- `asistentes` (int) — number of attendees
- `created_by` (uuid, references auth.users)
- `created_at` (timestamptz)

### 6. inspecciones (Inspections)
- `id` (uuid, PK)
- `titulo` (text) — inspection title
- `fecha` (date) — inspection date
- `area` (text) — area inspected
- `inspector` (text) — inspector name
- `tipo` (text) — rutina / especial / seguimiento
- `checklist` (jsonb) — checklist items with pass/fail
- `puntaje` (int) — compliance score percentage
- `hallazgos` (text) — findings
- `estado` (text) — programada / en-proceso / completada
- `created_by` (uuid, references auth.users)
- `created_at` (timestamptz)

## Security
- RLS enabled on ALL tables.
- profiles: owner-scoped (user can only see/edit their own profile)
- All SSOMA module tables: authenticated users can read all organizational data (shared safety data),
  but only the creator can modify/delete. Any authenticated user can create new records.
- created_by columns default to auth.uid() so inserts work without explicitly passing the owner.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role text DEFAULT '',
  department text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Incidentes table
CREATE TABLE IF NOT EXISTS incidentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  tipo text NOT NULL DEFAULT 'accidente',
  severidad text NOT NULL DEFAULT 'leve',
  descripcion text NOT NULL DEFAULT '',
  ubicacion text DEFAULT '',
  area text DEFAULT '',
  estado text NOT NULL DEFAULT 'reportado',
  acciones text DEFAULT '',
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE incidentes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_incidentes" ON incidentes;
CREATE POLICY "select_incidentes" ON incidentes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_incidentes" ON incidentes;
CREATE POLICY "insert_incidentes" ON incidentes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "update_incidentes" ON incidentes;
CREATE POLICY "update_incidentes" ON incidentes FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "delete_incidentes" ON incidentes;
CREATE POLICY "delete_incidentes" ON incidentes FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- EPP Catalog table
CREATE TABLE IF NOT EXISTS epp_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL DEFAULT '',
  categoria text NOT NULL DEFAULT 'cuerpo',
  talla text DEFAULT '',
  stock int NOT NULL DEFAULT 0,
  stock_minimo int NOT NULL DEFAULT 0,
  norma text DEFAULT '',
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE epp_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_epp_catalog" ON epp_catalog;
CREATE POLICY "select_epp_catalog" ON epp_catalog FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_epp_catalog" ON epp_catalog;
CREATE POLICY "insert_epp_catalog" ON epp_catalog FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "update_epp_catalog" ON epp_catalog;
CREATE POLICY "update_epp_catalog" ON epp_catalog FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "delete_epp_catalog" ON epp_catalog;
CREATE POLICY "delete_epp_catalog" ON epp_catalog FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- EPP Entregas table
CREATE TABLE IF NOT EXISTS epp_entregas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  trabajador text NOT NULL DEFAULT '',
  documento text DEFAULT '',
  epp_catalog_id uuid REFERENCES epp_catalog(id) ON DELETE SET NULL,
  cantidad int NOT NULL DEFAULT 1,
  firma text DEFAULT '',
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE epp_entregas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_epp_entregas" ON epp_entregas;
CREATE POLICY "select_epp_entregas" ON epp_entregas FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_epp_entregas" ON epp_entregas;
CREATE POLICY "insert_epp_entregas" ON epp_entregas FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "update_epp_entregas" ON epp_entregas;
CREATE POLICY "update_epp_entregas" ON epp_entregas FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "delete_epp_entregas" ON epp_entregas;
CREATE POLICY "delete_epp_entregas" ON epp_entregas FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- Capacitaciones table
CREATE TABLE IF NOT EXISTS capacitaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL DEFAULT '',
  tema text DEFAULT '',
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  duracion_horas int NOT NULL DEFAULT 1,
  instructor text DEFAULT '',
  modalidad text NOT NULL DEFAULT 'presencial',
  estado text NOT NULL DEFAULT 'programada',
  asistentes int NOT NULL DEFAULT 0,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE capacitaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_capacitaciones" ON capacitaciones;
CREATE POLICY "select_capacitaciones" ON capacitaciones FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_capacitaciones" ON capacitaciones;
CREATE POLICY "insert_capacitaciones" ON capacitaciones FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "update_capacitaciones" ON capacitaciones;
CREATE POLICY "update_capacitaciones" ON capacitaciones FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "delete_capacitaciones" ON capacitaciones;
CREATE POLICY "delete_capacitaciones" ON capacitaciones FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- Inspecciones table
CREATE TABLE IF NOT EXISTS inspecciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL DEFAULT '',
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  area text DEFAULT '',
  inspector text DEFAULT '',
  tipo text NOT NULL DEFAULT 'rutina',
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  puntaje int NOT NULL DEFAULT 0,
  hallazgos text DEFAULT '',
  estado text NOT NULL DEFAULT 'programada',
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inspecciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_inspecciones" ON inspecciones;
CREATE POLICY "select_inspecciones" ON inspecciones FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_inspecciones" ON inspecciones;
CREATE POLICY "insert_inspecciones" ON inspecciones FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "update_inspecciones" ON inspecciones;
CREATE POLICY "update_inspecciones" ON inspecciones FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "delete_inspecciones" ON inspecciones;
CREATE POLICY "delete_inspecciones" ON inspecciones FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_incidentes_created_by ON incidentes(created_by);
CREATE INDEX IF NOT EXISTS idx_incidentes_fecha ON incidentes(fecha);
CREATE INDEX IF NOT EXISTS idx_epp_entregas_created_by ON epp_entregas(created_by);
CREATE INDEX IF NOT EXISTS idx_epp_entregas_fecha ON epp_entregas(fecha);
CREATE INDEX IF NOT EXISTS idx_capacitaciones_created_by ON capacitaciones(created_by);
CREATE INDEX IF NOT EXISTS idx_capacitaciones_fecha ON capacitaciones(fecha);
CREATE INDEX IF NOT EXISTS idx_inspecciones_created_by ON inspecciones(created_by);
CREATE INDEX IF NOT EXISTS idx_inspecciones_fecha ON inspecciones(fecha);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();