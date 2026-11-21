-- Sprint 1 — datos de referencia de La Paz.
-- ADVERTENCIA: el área urbana de este archivo es una APROXIMACIÓN para que
-- RF1.03 sea funcional y verificable. NO es un límite oficial. Reemplazar por
-- una geometría oficial validada antes de usar el sistema en operación real.
BEGIN;

-- 1. Macrodistritos de La Paz (etiquetas administrativas; sin polígonos).
INSERT INTO locations (id, name, type, department) VALUES
  ('cotahuma',   'Cotahuma',   'macrodistrito', 'La Paz'),
  ('max-paredes','Max Paredes','macrodistrito', 'La Paz'),
  ('zona-centro','Zona Centro','macrodistrito', 'La Paz'),
  ('san-antonio','San Antonio','macrodistrito', 'La Paz'),
  ('periferica', 'Periférica', 'macrodistrito', 'La Paz'),
  ('mallasa',    'Mallasa',    'macrodistrito', 'La Paz'),
  ('sur',        'Sur',        'macrodistrito', 'La Paz')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    type = EXCLUDED.type,
    department = EXCLUDED.department;

-- 2. Área urbana referencial: buffer geodésico de 10 km desde Plaza Murillo.
-- Se guarda como MultiPolygon/geography para que ST_Distance funcione.
INSERT INTO urban_reference_areas (id, name, source, area)
VALUES (
  'la-paz',
  'Radio urbano de referencia de La Paz (10 km)',
  'Aproximación Sprint 1: buffer geodésico de 10 km desde Plaza Murillo. No es un límite oficial; reemplazar por una geometría oficial verificada.',
  ST_Multi(
    ST_Buffer(
      ST_SetSRID(ST_MakePoint(-68.1336, -16.4956), 4326)::geography,
      10000
    )::geometry
  )::geography
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    source = EXCLUDED.source,
    area = EXCLUDED.area;

COMMIT;
