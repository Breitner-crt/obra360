-- 20240101_initial.sql - Migración Fase 1: Auth + Empresas + Obras

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla: companies (Empresas)
CREATE TABLE companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  ruc VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Tabla: users (Usuarios con roles por empresa)
CREATE TABLE users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  role VARCHAR(50) CHECK (role IN ('admin','gerente','supervisor','bodega','consulta')),
  name VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Tabla: projects (Obras)
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  client VARCHAR(255),
  location TEXT,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'planificación',
  wbs_code VARCHAR(100),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS: Cada empresa ve solo sus propios datos
-- El control de roles (admin/gerente/supervisor) se hará en el backend FastAPI
CREATE POLICY "Users can manage own company" ON companies
  FOR ALL USING (auth.uid()::text = current_setting('app.current_company_id'));

CREATE POLICY "Users can view own company projects" ON projects
  FOR SELECT USING (auth.uid()::text = current_setting('app.current_company_id'));

CREATE POLICY "Users can manage own projects" ON projects
  FOR ALL USING (auth.uid()::text = current_setting('app.current_company_id'));

COMMENT ON TABLE projects IS 'Obras de construcción de la empresa';