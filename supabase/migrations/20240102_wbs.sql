-- 20240102_wbs.sql - Migración FASE 2: WBS + Actividades + Dependencias
-- Idempotente: puede re-ejecutarse en Supabase > SQL Editor sin errores.

-- Tabla: activities (ítems de la WBS, jerárquicos por parent_id)
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  wbs_code VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'planificada'
    CHECK (status IN ('planificada','en_progreso','completada','detenida','cancelada')),
  start_date DATE,
  end_date DATE,
  duration_days INTEGER,
  progress_percent INTEGER NOT NULL DEFAULT 0
    CHECK (progress_percent >= 0 AND progress_percent <= 100),
  weight_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  assigned_to UUID REFERENCES users(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Tabla: activity_dependencies (predecesora -> sucesora)
CREATE TABLE IF NOT EXISTS activity_dependencies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  predecessor_id UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  successor_id UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  dep_type VARCHAR(2) NOT NULL DEFAULT 'FS'
    CHECK (dep_type IN ('FS','SS','FF','SF')),
  lag_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE,
  CONSTRAINT uq_activity_dep UNIQUE (predecessor_id, successor_id),
  CONSTRAINT chk_no_self_dep CHECK (predecessor_id <> successor_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_parent_id ON activities(parent_id);
CREATE INDEX IF NOT EXISTS idx_activity_dep_pred ON activity_dependencies(predecessor_id);
CREATE INDEX IF NOT EXISTS idx_activity_dep_succ ON activity_dependencies(successor_id);

-- RLS: aislamiento por empresa vía el proyecto padre
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_dependencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_isolation" ON activities;
CREATE POLICY "company_isolation" ON activities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = activities.project_id
        AND p.company_id::text = current_setting('app.current_company_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = activities.project_id
        AND p.company_id::text = current_setting('app.current_company_id', true)
    )
  );

DROP POLICY IF EXISTS "company_isolation" ON activity_dependencies;
CREATE POLICY "company_isolation" ON activity_dependencies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN projects p ON p.id = a.project_id
      WHERE a.id = activity_dependencies.successor_id
        AND p.company_id::text = current_setting('app.current_company_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN projects p ON p.id = a.project_id
      WHERE a.id = activity_dependencies.successor_id
        AND p.company_id::text = current_setting('app.current_company_id', true)
    )
  );

COMMENT ON TABLE activities IS 'Actividades de la WBS por obra (Fase 2 OBRA360)';
COMMENT ON TABLE activity_dependencies IS 'Dependencias FS/SS/FF/SF entre actividades';
