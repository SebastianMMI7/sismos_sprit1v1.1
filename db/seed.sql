-- ==============================================================
-- DATOS SEMILLA PARA SISMOPAZ (Sprint 1)
-- ==============================================================

-- 1. Usuario del sistema
INSERT INTO usuarios (id_usuario, nombres, apellidos, correo, password_hash, telefono, estado, fecha_registro)
VALUES (1, 'Sismólogo', 'Sistema', 'sismologo@sismopaz.bo', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lew.kZepx9aI6hD2K', '+591 2 2222222', true, now())
ON CONFLICT (id_usuario) DO NOTHING;

-- 2. Municipios de La Paz
INSERT INTO municipios (id_municipio, nombre, departamento, codigo_ine) VALUES
  (1, 'La Paz', 'La Paz', '020101'),
  (2, 'El Alto', 'La Paz', '020105'),
  (3, 'Viacha', 'La Paz', '020801'),
  (4, 'Achocalla', 'La Paz', '020104'),
  (5, 'Palca', 'La Paz', '020102'),
  (6, 'Mecapaca', 'La Paz', '020103')
ON CONFLICT (id_municipio) DO UPDATE
SET nombre = EXCLUDED.nombre,
    departamento = EXCLUDED.departamento,
    codigo_ine = EXCLUDED.codigo_ine;

-- 3. Macrodistritos de La Paz
INSERT INTO macrodistritos (id_macrodistrito, id_municipio, nombre, descripcion) VALUES
  (1, 1, 'Cotahuma', 'Macrodistrito urbano 1 de La Paz'),
  (2, 1, 'Max Paredes', 'Macrodistrito urbano 2 de La Paz'),
  (3, 1, 'Periférica', 'Macrodistrito urbano 3 de La Paz'),
  (4, 1, 'San Antonio', 'Macrodistrito urbano 4 de La Paz'),
  (5, 1, 'Sur', 'Macrodistrito urbano 5 de La Paz'),
  (6, 1, 'Mallasa', 'Macrodistrito urbano 6 de La Paz'),
  (7, 1, 'Centro', 'Macrodistrito urbano 7 de La Paz (Zona Centro)'),
  (8, 1, 'Hampaturi', 'Macrodistrito rural 8 de La Paz'),
  (9, 1, 'Zongo', 'Macrodistrito rural 9 de La Paz')
ON CONFLICT (id_macrodistrito) DO UPDATE
SET nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    id_municipio = EXCLUDED.id_municipio;

-- 4. Tipos de Magnitud (Mw, Ml)
INSERT INTO tipos_magnitud (id_tipo_magnitud, codigo, nombre, descripcion) VALUES
  (1, 'Mw', 'Magnitud de Momento', 'Escala sismológica de magnitud de momento sísmico'),
  (2, 'Ml', 'Magnitud Local', 'Escala local o de Richter para eventos regionales')
ON CONFLICT (id_tipo_magnitud) DO UPDATE
SET codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion;

-- 5. Estados de Sismo
INSERT INTO estados_sismo (id_estado_sismo, nombre, descripcion) VALUES
  (1, 'Pendiente', 'Evento sísmico detectado preliminarmente, en espera de revisión'),
  (2, 'Revisado', 'Evento verificado por sismólogo profesional'),
  (3, 'Publicado', 'Evento oficial publicado en el catálogo público')
ON CONFLICT (id_estado_sismo) DO UPDATE
SET nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion;

-- 6. Fuentes Sísmicas
INSERT INTO fuentes_sismicas (id_fuente, nombre, tipo, institucion, url, es_oficial, activa) VALUES
  (1, 'Observatorio San Calixto', 'Observatorio', 'OSC Bolivia', 'https://www.sancalixto.org.bo', true, true),
  (2, 'USGS Earthquake Hazards', 'Institucional', 'United States Geological Survey', 'https://earthquake.usgs.gov', false, true),
  (3, 'Red SismoPaz', 'Red Local', 'Sistema SismoPaz La Paz', 'http://localhost:3000', true, true)
ON CONFLICT (id_fuente) DO UPDATE
SET nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    institucion = EXCLUDED.institucion,
    url = EXCLUDED.url,
    es_oficial = EXCLUDED.es_oficial,
    activa = EXCLUDED.activa;

-- 7. Eventos Sísmicos (15 eventos representativos)
INSERT INTO sismos (id_sismo, id_tipo_magnitud, id_estado_sismo, id_usuario_registro, id_municipio, id_macrodistrito, id_fuente, fecha_hora_utc, magnitud, profundidad_km, latitud, longitud, ubicacion_referencia) VALUES
  (1,  1, 3, 1, 1, 7, 1, '2024-10-18T14:32:18Z', 4.20, 18.40, -16.480000, -68.120000, 'Centro / La Paz'),
  (2,  2, 3, 1, 2, NULL, 1, '2024-09-09T02:15:43Z', 3.60, 45.00, -16.510000, -68.220000, 'El Alto'),
  (3,  1, 3, 1, 3, NULL, 1, '2024-08-21T19:05:12Z', 4.80, 83.20, -16.650000, -68.290000, 'Viacha'),
  (4,  2, 3, 1, 4, NULL, 1, '2024-07-15T08:46:30Z', 2.90, 12.80, -16.570000, -68.160000, 'Achocalla'),
  (5,  2, 3, 1, 5, NULL, 1, '2024-06-11T23:21:07Z', 3.70, 34.60, -16.590000, -67.950000, 'Palca'),
  (6,  1, 3, 1, 6, NULL, 1, '2024-05-04T16:10:55Z', 4.10, 72.00, -16.680000, -68.000000, 'Mecapaca'),
  (7,  2, 3, 1, 1, 3, 1, '2024-04-18T06:27:31Z', 3.20, 27.30, -16.420000, -68.150000, 'Periférica / La Paz'),
  (8,  1, 3, 1, 2, NULL, 2, '2024-03-02T11:42:09Z', 4.50, 55.40, -16.470000, -68.190000, 'El Alto'),
  (9,  2, 3, 1, 3, NULL, 1, '2024-02-14T20:35:12Z', 2.70,  9.00, -16.600000, -68.240000, 'Viacha'),
  (10, 1, 3, 1, 6, NULL, 1, '2024-01-24T03:08:44Z', 3.90, 94.10, -16.610000, -68.060000, 'Mecapaca'),
  (11, 2, 3, 1, 5, NULL, 1, '2023-12-07T09:12:06Z', 3.10, 21.70, -16.550000, -67.980000, 'Palca'),
  (12, 1, 3, 1, 4, NULL, 1, '2023-11-16T13:55:29Z', 4.00, 64.20, -16.540000, -68.140000, 'Achocalla'),
  (13, 2, 3, 1, 1, 7, 3, '2023-10-10T15:22:11Z', 3.40, 15.20, -16.500000, -68.135000, 'Centro / La Paz'),
  (14, 1, 3, 1, 1, 1, 3, '2023-09-15T07:05:40Z', 4.00, 38.50, -16.510000, -68.150000, 'Cotahuma / La Paz'),
  (15, 2, 3, 1, 1, 5, 3, '2023-08-20T21:48:03Z', 2.80,  8.40, -16.540000, -68.120000, 'Sur / La Paz')
ON CONFLICT (id_sismo) DO UPDATE
SET id_tipo_magnitud = EXCLUDED.id_tipo_magnitud,
    id_estado_sismo = EXCLUDED.id_estado_sismo,
    id_municipio = EXCLUDED.id_municipio,
    id_macrodistrito = EXCLUDED.id_macrodistrito,
    id_fuente = EXCLUDED.id_fuente,
    fecha_hora_utc = EXCLUDED.fecha_hora_utc,
    magnitud = EXCLUDED.magnitud,
    profundidad_km = EXCLUDED.profundidad_km,
    latitud = EXCLUDED.latitud,
    longitud = EXCLUDED.longitud,
    ubicacion_referencia = EXCLUDED.ubicacion_referencia;

-- 8. Área Urbana Referencial (RF1.03)
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
