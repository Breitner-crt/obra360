-- 20240103_activity_costs.sql - FASE 2 extra: costo + metrado por actividad
-- Idempotente: ejecutar en Supabase > SQL Editor.
ALTER TABLE activities ADD COLUMN IF NOT EXISTS quantity DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS unit VARCHAR(20);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(15,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN activities.quantity IS 'Metrado: cantidad (ej. 35)';
COMMENT ON COLUMN activities.unit IS 'Unidad de metrado: m, m2, m3, kg, und, glb, hh';
COMMENT ON COLUMN activities.unit_cost IS 'Costo unitario S/. (PU). Total = quantity * unit_cost';
COMMENT ON COLUMN activities.duration_days IS 'Duración en días (se puede cargar manual o calcular de inicio-fin)';
COMMENT ON COLUMN activities.weight_percent IS 'Ponderación 0-100 para avance (NO es masa ni duración)';
