-- 20240104_daily_logs.sql - FASE 4 mínima: parte diario de campo
-- Idempotente: ejecutar en Supabase > SQL Editor.
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,
  progress_percent INTEGER NOT NULL DEFAULT 0
    CHECK (progress_percent >= 0 AND progress_percent <= 100),
  note TEXT,
  photo_url TEXT,
  reported_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_project ON daily_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_activity ON daily_logs(activity_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(log_date);

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_isolation" ON daily_logs;
CREATE POLICY "company_isolation" ON daily_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = daily_logs.project_id
        AND p.company_id::text = current_setting('app.current_company_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = daily_logs.project_id
        AND p.company_id::text = current_setting('app.current_company_id', true)
    )
  );

COMMENT ON TABLE daily_logs IS 'Partes diarios de campo: avance por actividad (Fase 4 OBRA360)';
