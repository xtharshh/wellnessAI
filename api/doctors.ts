import type { VercelRequest, VercelResponse } from '@vercel/node';

import { db } from './_lib/db';
import { route } from './_lib/http';
import { mapDoctor } from './_lib/mappers';

// Public directory — no auth required to browse clinicians.
export default route(['GET'], async (_req: VercelRequest, res: VercelResponse) => {
  const sql = db();
  const rows = await sql`
    select * from doctors where is_available = true order by display_name asc
  `;
  res.status(200).json({ doctors: rows.map(mapDoctor) });
});
