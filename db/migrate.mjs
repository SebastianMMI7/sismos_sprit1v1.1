#!/usr/bin/env node
/**
 * Ejecuta, en orden alfabético, los archivos .sql de db/migrations/.
 *
 * Uso:
 *   node db/migrate.mjs
 *   DATABASE_URL=postgresql://... node db/migrate.mjs
 *
 * Si no existe DATABASE_URL, intenta leer frontend/.env.local.
 * Las migraciones incluyen BEGIN/COMMIT; si una falla, PostgreSQL aborta esa
 * transacción y el proceso termina con código 1 para no continuar a ciegas.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const here = dirname(fileURLToPath(import.meta.url));

function readDatabaseUrlFromEnvFile() {
  const envPath = join(here, '..', 'frontend', '.env.local');
  if (!existsSync(envPath)) return null;
  const line = readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .map((value) => value.trim())
    .find((value) => value.startsWith('DATABASE_URL='));
  if (!line) return null;
  return line.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
}

const databaseUrl = process.env.DATABASE_URL || readDatabaseUrlFromEnvFile();
if (!databaseUrl) {
  console.error('Falta DATABASE_URL (variable de entorno o frontend/.env.local).');
  process.exit(1);
}

const migrationsDir = join(here, 'migrations');
const files = readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort((a, b) => a.localeCompare(b));

if (files.length === 0) {
  console.log('No hay migraciones para ejecutar.');
  process.exit(0);
}

const client = new Client({ connectionString: databaseUrl });
await client.connect();
try {
  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    console.log(`Aplicando ${file}...`);
    await client.query(sql);
    console.log(`OK ${file}`);
  }
  const check = await client.query(`
    SELECT
      (SELECT count(*)::int FROM sismos) AS total_sismos,
      (SELECT count(*)::int FROM municipios) AS total_municipios,
      (SELECT count(*)::int FROM macrodistritos) AS total_macrodistritos,
      (SELECT count(*)::int FROM tipos_magnitud) AS total_tipos_magnitud,
      (SELECT count(*)::int FROM estados_sismo) AS total_estados_sismo,
      (SELECT count(*)::int FROM fuentes_sismicas) AS total_fuentes_sismicas,
      (SELECT count(*)::int FROM urban_reference_areas) AS urban_areas
  `);
  console.log('Verificación:', check.rows[0]);
} finally {
  await client.end();
}
