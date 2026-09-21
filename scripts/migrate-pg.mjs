// TCP migration via node-postgres (bypasses the serverless driver).
// Usage: $env:PG_URL='postgresql://user:pass@host/db?sslmode=require'; node scripts/migrate-pg.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const url = process.env.PG_URL;
if (!url) {
  console.error('PG_URL is not set.');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schema = readFileSync(join(root, 'NEON_SCHEMA.sql'), 'utf8');

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log('CONNECTED');
try {
  await client.query('begin');
  await client.query(schema);
  await client.query('commit');
  console.log('SCHEMA APPLIED');
  const { rows } = await client.query(
    "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by table_name"
  );
  console.log('TABLES:', rows.map((r) => r.table_name).join(', '));
} catch (e) {
  try { await client.query('rollback'); } catch {}
  console.error('MIGRATION FAILED:', e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
