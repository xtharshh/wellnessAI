import type { VercelRequest, VercelResponse } from '@vercel/node';

import { route } from './_lib/http';
import { db } from './_lib/db';

export default route(['GET'], async (_req: VercelRequest, res: VercelResponse) => {
  // Read probe against Neon — proves wiring without writing.
  let neon = 'down';
  try {
    const sql = db();
    await sql`select 1`;
    neon = 'up';
  } catch {
    neon = 'down';
  }
  res.status(neon === 'up' ? 200 : 503).json({ ok: neon === 'up', neon, time: new Date().toISOString() });
});
