-- Sprint 1 — endurecimiento del esquema.
-- Idempotente: se puede ejecutar varias veces sin perder datos.
BEGIN;

-- 1. Departamento explícito para acotar el catálogo a La Paz.
ALTER TABLE locations ADD COLUMN IF NOT EXISTS department text;
UPDATE locations SET department = 'La Paz' WHERE department IS NULL OR department = '';
ALTER TABLE locations ALTER COLUMN department SET DEFAULT 'La Paz';
ALTER TABLE locations ALTER COLUMN department SET NOT NULL;

-- 2. Restricciones de dominio que TypeORM no creó en la base viva.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'locations_type_check') THEN
    ALTER TABLE locations
      ADD CONSTRAINT locations_type_check CHECK (type IN ('municipio', 'macrodistrito'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'locations_department_check') THEN
    ALTER TABLE locations
      ADD CONSTRAINT locations_department_check CHECK (department <> '');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'locations_name_type_key') THEN
    ALTER TABLE locations
      ADD CONSTRAINT locations_name_type_key UNIQUE (name, type);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seismic_events_magnitude_check') THEN
    ALTER TABLE seismic_events
      ADD CONSTRAINT seismic_events_magnitude_check CHECK (magnitude BETWEEN 0 AND 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seismic_events_magnitude_type_check') THEN
    ALTER TABLE seismic_events
      ADD CONSTRAINT seismic_events_magnitude_type_check CHECK (magnitude_type IN ('Mw', 'Ml'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seismic_events_depth_km_check') THEN
    ALTER TABLE seismic_events
      ADD CONSTRAINT seismic_events_depth_km_check CHECK (depth_km >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seismic_events_epicenter_check') THEN
    ALTER TABLE seismic_events
      ADD CONSTRAINT seismic_events_epicenter_check CHECK (ST_IsValid(epicenter::geometry));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'urban_reference_areas_area_valid_check') THEN
    ALTER TABLE urban_reference_areas
      ADD CONSTRAINT urban_reference_areas_area_valid_check CHECK (ST_IsValid(area::geometry));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'urban_reference_areas_area_not_empty_check') THEN
    ALTER TABLE urban_reference_areas
      ADD CONSTRAINT urban_reference_areas_area_not_empty_check CHECK (NOT ST_IsEmpty(area::geometry));
  END IF;
END $$;

-- 3. Índices que exige RNF05 y que la base viva no tenía.
CREATE INDEX IF NOT EXISTS seismic_events_occurred_at_idx
  ON seismic_events (occurred_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS seismic_events_location_idx
  ON seismic_events (location_id);
CREATE INDEX IF NOT EXISTS seismic_events_epicenter_gix
  ON seismic_events USING gist (epicenter);

COMMIT;
