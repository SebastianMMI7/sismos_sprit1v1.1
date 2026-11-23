-- ==============================================================
-- SISTEMA DE INFORMACIÓN DE DATOS SÍSMICOS (SISMOPAZ)
-- LA PAZ - BOLIVIA
-- Esquema Lógico Normalizado hasta 3FN - Sprint 1
-- ==============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. SEGURIDAD: USUARIOS (requerido por FK id_usuario_registro)
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario SERIAL PRIMARY KEY,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(30),
  estado BOOLEAN NOT NULL DEFAULT true,
  fecha_registro TIMESTAMP NOT NULL DEFAULT now(),
  fecha_actualizacion TIMESTAMP
);

-- 2. ORGANIZACIÓN TERRITORIAL: MUNICIPIOS
CREATE TABLE IF NOT EXISTS municipios (
  id_municipio SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  departamento VARCHAR(100) NOT NULL,
  codigo_ine VARCHAR(30),
  UNIQUE (nombre, departamento)
);

-- 3. ORGANIZACIÓN TERRITORIAL: MACRODISTRITOS
CREATE TABLE IF NOT EXISTS macrodistritos (
  id_macrodistrito SERIAL PRIMARY KEY,
  id_municipio INT NOT NULL REFERENCES municipios(id_municipio) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255),
  UNIQUE (id_municipio, nombre)
);

-- 4. CATÁLOGOS SISMOLÓGICOS: TIPOS DE MAGNITUD (Mw, Ml)
CREATE TABLE IF NOT EXISTS tipos_magnitud (
  id_tipo_magnitud SERIAL PRIMARY KEY,
  codigo VARCHAR(10) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255)
);

-- 5. CATÁLOGOS SISMOLÓGICOS: ESTADOS DE SISMO
CREATE TABLE IF NOT EXISTS estados_sismo (
  id_estado_sismo SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255)
);

-- 6. CATÁLOGOS SISMOLÓGICOS: FUENTES SÍSMICAS
CREATE TABLE IF NOT EXISTS fuentes_sismicas (
  id_fuente SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  tipo VARCHAR(50),
  institucion VARCHAR(150),
  url VARCHAR(255),
  es_oficial BOOLEAN NOT NULL DEFAULT false,
  activa BOOLEAN NOT NULL DEFAULT true
);

-- 7. TABLA PRINCIPAL: SISMOS (EVENTOS SÍSMICOS)
CREATE TABLE IF NOT EXISTS sismos (
  id_sismo SERIAL PRIMARY KEY,
  id_tipo_magnitud INT NOT NULL REFERENCES tipos_magnitud(id_tipo_magnitud),
  id_estado_sismo INT NOT NULL REFERENCES estados_sismo(id_estado_sismo),
  id_usuario_registro INT NOT NULL REFERENCES usuarios(id_usuario),
  id_municipio INT REFERENCES municipios(id_municipio),
  id_macrodistrito INT REFERENCES macrodistritos(id_macrodistrito),
  id_fuente INT REFERENCES fuentes_sismicas(id_fuente),
  fecha_hora_utc TIMESTAMPTZ NOT NULL,
  magnitud DECIMAL(4,2) NOT NULL CHECK (magnitud BETWEEN 0 AND 10),
  profundidad_km DECIMAL(7,2) NOT NULL CHECK (profundidad_km >= 0),
  latitud DECIMAL(9,6) NOT NULL CHECK (latitud BETWEEN -90 AND 90),
  longitud DECIMAL(9,6) NOT NULL CHECK (longitud BETWEEN -180 AND 180),
  ubicacion_referencia VARCHAR(255),
  fecha_registro TIMESTAMP NOT NULL DEFAULT now(),
  fecha_ultima_actualizacion TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sismos_fecha_hora_utc ON sismos (fecha_hora_utc DESC);
CREATE INDEX IF NOT EXISTS idx_sismos_magnitud ON sismos (magnitud DESC);
CREATE INDEX IF NOT EXISTS idx_sismos_lat_lon ON sismos (latitud, longitud);
CREATE INDEX IF NOT EXISTS idx_sismos_macrodistrito ON sismos (id_macrodistrito);
CREATE INDEX IF NOT EXISTS idx_sismos_municipio ON sismos (id_municipio);
CREATE INDEX IF NOT EXISTS idx_sismos_geom_gist ON sismos USING gist (ST_SetSRID(ST_MakePoint(longitud, latitud), 4326));

-- 8. REFERENCIA ESPACIAL: RADIO URBANO (RF1.03)
CREATE TABLE IF NOT EXISTS urban_reference_areas (
  id text PRIMARY KEY,
  name text NOT NULL,
  source text NOT NULL,
  area geography(MultiPolygon, 4326) NOT NULL,
  CONSTRAINT urban_reference_areas_area_valid_check CHECK (ST_IsValid(area::geometry)),
  CONSTRAINT urban_reference_areas_area_not_empty_check CHECK (NOT ST_IsEmpty(area::geometry))
);
