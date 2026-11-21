CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS locations (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('municipio', 'macrodistrito')),
  department text NOT NULL DEFAULT 'La Paz' CHECK (department <> ''),
  UNIQUE (name, type)
);

-- La tabla distingue la geometría cargada de su fuente. No etiquetar una
-- aproximación como límite oficial sin verificación externa.
CREATE TABLE IF NOT EXISTS urban_reference_areas (
  id text PRIMARY KEY,
  name text NOT NULL,
  source text NOT NULL,
  area geography(MultiPolygon, 4326) NOT NULL,
  CONSTRAINT urban_reference_areas_area_valid_check CHECK (ST_IsValid(area::geometry)),
  CONSTRAINT urban_reference_areas_area_not_empty_check CHECK (NOT ST_IsEmpty(area::geometry))
);

CREATE TABLE IF NOT EXISTS seismic_events (
  id text PRIMARY KEY,
  occurred_at timestamptz NOT NULL,
  magnitude numeric(3,1) NOT NULL CHECK (magnitude BETWEEN 0 AND 10),
  magnitude_type text NOT NULL CHECK (magnitude_type IN ('Mw', 'Ml')),
  -- Los CHECK de magnitud, tipo, profundidad y epicentro también están en
  -- db/migrations/001_sprint1_hardening.sql para bases ya existentes.
  depth_km numeric(7,2) NOT NULL CHECK (depth_km >= 0),
  epicenter geography(Point, 4326) NOT NULL,
  location_id text REFERENCES locations(id),
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT seismic_events_epicenter_check CHECK (ST_IsValid(epicenter::geometry))
);

CREATE INDEX IF NOT EXISTS seismic_events_occurred_at_idx ON seismic_events (occurred_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS seismic_events_location_idx ON seismic_events (location_id);
CREATE INDEX IF NOT EXISTS seismic_events_epicenter_gix ON seismic_events USING gist (epicenter);
