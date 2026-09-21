// Generic SQL migration runner (TCP via node-postgres — reliable path).
// Usage: $env:PG_URL='postgresql://...'; node scripts/migrate-sql.mjs <file.sql>
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/migrate-sql.mjs <file.sql>');
  process.exit(1);
}
if (!process.env.PG_URL) {
  console.error('PG_URL is not set.');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sqlText = readFileSync(resolve(root, file), 'utf8');
const client = new pg.Client({ connectionString: process.env.PG_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query('begin');
  await client.query(sqlText);
  await client.query('commit');
  console.log(`APPLIED: ${file}`);
} catch (e) {
  try { await client.query('rollback'); } catch {}
  console.error('MIGRATION FAILED:', e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
