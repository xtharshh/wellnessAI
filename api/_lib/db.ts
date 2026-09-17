import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

// Neon HTTP driver — purpose-built for serverless (no connection pooling
// needed, no idle connections). Cached across warm invocations.
let sql: NeonQueryFunction<false, false> | null = null;

export function db(): NeonQueryFunction<false, false> {
  if (!sql) {
    const url = process.env.NEON_DATABASE_URL;
    if (!url) throw new Error('NEON_DATABASE_URL is not configured');
    sql = neon(url);
  }
  return sql;
}
