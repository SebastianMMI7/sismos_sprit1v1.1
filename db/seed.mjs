#!/usr/bin/env node
/**
 * Aplica db/seed.sql sobre una base existente.
 * Es idempotente para las filas con ON CONFLICT (id) DO NOTHING.
 *
 * Uso: node db/seed.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
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

const client = new Client({ connectionString: databaseUrl });
await client.connect();
try {
  await client.query(readFileSync(join(here, 'seed.sql'), 'utf8'));
  const result = await client.query('SELECT count(*)::int AS events FROM sismos');
  console.log(`Seed aplicado. Eventos en la base: ${result.rows[0].events}`);
} finally {
  await client.end();
}
