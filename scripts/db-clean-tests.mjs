// Deletes test users by email prefix. Usage: $env:DATABASE_URL='...'; node scripts/db-clean-tests.mjs [prefix]
import { neon } from '@neondatabase/serverless';

const prefix = process.argv[2] || 'srvtest_';
const sql = neon(process.env.DATABASE_URL);
const rows = await sql`delete from users where email like ${prefix + '%'} returning email`;
console.log('DELETED:', JSON.stringify(rows.map((r) => r.email)));
