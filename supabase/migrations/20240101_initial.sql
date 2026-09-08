-- 20240101_initial.sql - Migración canónica FASE 1: Auth + Empresas + Obras
--
-- ÚNICA migración oficial. Alineada con backend/app/models/ (TimeStampedModel:
-- id, created_at, updated_at, created_by, updated_by, is_active, is_deleted).
-- Idempotente: puede re-ejecutarse en Supabase > SQL Editor sin errores.
-- (El esquema legacy con users.email/password quedó archivado en
--  legacy-express-server/supabase-users-table.sql y NO debe aplicarse.)

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla: companies (Empresas)
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  ruc VARCHAR(20) UNIQUE,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Tabla: users (Usuarios con roles por empresa, vinculados a Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  company_id UUID REFERENCES companies(id) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'supervisor'
    CHECK (role IN ('admin','gerente','supervisor','bodega','consulta')),
  name VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Tabla: projects (Obras)
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  client VARCHAR(255),
  location TEXT,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'planificación',
  wbs_code VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID,
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Columnas de auditoría por si la tabla ya existía con el esquema anterior
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Índices para filtrado por empresa
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);

-- Habilitar Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS: cada empresa solo ve sus propios datos (filtrado por company_id).
-- El backend FastAPI fija app.current_company_id por sesión; el control de
-- roles (admin/gerente/supervisor) vive en el backend, no aquí.
-- current_setting(..., true) devuelve NULL si no está fijado => deniega por defecto.
DROP POLICY IF EXISTS "company_isolation" ON companies;
CREATE POLICY "company_isolation" ON companies
  FOR ALL
  USING (id::text = current_setting('app.current_company_id', true))
  WITH CHECK (id::text = current_setting('app.current_company_id', true));

DROP POLICY IF EXISTS "company_isolation" ON users;
CREATE POLICY "company_isolation" ON users
  FOR ALL
  USING (company_id::text = current_setting('app.current_company_id', true))
  WITH CHECK (company_id::text = current_setting('app.current_company_id', true));

DROP POLICY IF EXISTS "company_isolation" ON projects;
CREATE POLICY "company_isolation" ON projects
  FOR ALL
  USING (company_id::text = current_setting('app.current_company_id', true))
  WITH CHECK (company_id::text = current_setting('app.current_company_id', true));

COMMENT ON TABLE companies IS 'Empresas constructoras de OBRA360';
COMMENT ON TABLE users IS 'Usuarios vinculados a Supabase Auth, con rol por empresa';
COMMENT ON TABLE projects IS 'Obras de construcción de la empresa';
