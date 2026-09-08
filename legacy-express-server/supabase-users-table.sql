-- ARCHIVADO 2026-09-08: esquema del backend Express legacy (JWT + bcrypt,
-- tabla users con email/password). NO aplicar sobre la base oficial.
-- Esquema oficial: supabase/migrations/20240101_initial.sql
-- (users vinculados a auth.users de Supabase Auth, sin columna password).
-- Se conserva solo como referencia para migrar datos si hiciera falta.
--
-- SQL original para crear tablas en Supabase PostgreSQL:

-- 1. Crear tabla users (almacena usuarios registrados con hash de contraseña)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'supervisor',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS (Cada usuario solo ve sus propios datos)
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = current_setting('app.current_user_id'));

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = current_setting('app.current_user_id'));

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = current_setting('app.current_user_id'));

-- 5. Comentario
COMMENT ON TABLE users IS 'Tabla de usuarios registrados en OBRA360 con autenticación JWT + bcrypt';