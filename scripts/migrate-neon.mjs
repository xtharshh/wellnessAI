// Applies NEON_SCHEMA.sql to the Neon database in DATABASE_URL.
// Usage (PowerShell): $env:DATABASE_URL='postgresql://...'; node scripts/migrate-neon.mjs
// Never commit DATABASE_URL — .env is gitignored; prefer env vars / Vercel dashboard.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schema = readFileSync(join(root, 'NEON_SCHEMA.sql'), 'utf8');
const statements = schema
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith('-- MindTrace') );

const sql = neon(url);
let applied = 0;
for (const stmt of statements) {
  await sql.query(stmt);
  applied += 1;
}
console.log(`Applied ${applied} statements.`);

const tables = await sql`
  select table_name from information_schema.tables
  where table_schema = 'public' and table_type = 'BASE TABLE'
  order by table_name
`;
console.log('Tables:', tables.map((t) => t.table_name).join(', '));
