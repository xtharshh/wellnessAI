import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { db } from '../_lib/db.js';
import { HttpError, readJson, route } from '../_lib/http.js';
import { requireUser } from '../_lib/auth.js';
import { mapRecommendation } from '../_lib/mappers.js';

const schema = z.object({
  dismissed: z.boolean().optional(),
  completed: z.boolean().optional(),
});

async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req);
  const id = req.query.id as string;
  if (!id) throw new HttpError(400, 'Missing recommendation id');
  const sql = db();

  if (req.method === 'PATCH') {
    const parsed = schema.safeParse(readJson(req));
    if (!parsed.success) throw new HttpError(400, 'Invalid input');
    const sets: string[] = [];
    const values: any[] = [];
    if (parsed.data.dismissed !== undefined) {
      sets.push(`dismissed = $${sets.length + 3}`);
      values.push(parsed.data.dismissed);
    }
    if (parsed.data.completed !== undefined) {
      sets.push(`completed = $${sets.length + 3}`);
      values.push(parsed.data.completed);
    }
    if (sets.length === 0) throw new HttpError(400, 'Nothing to update');
  const rows = await sql.query(
    `update recommendations set ${sets.join(', ')} where id = $1 and user_id = $2 returning *`,
    [id, user.id, ...values]
  );
    if (rows.length === 0) throw new HttpError(404, 'Recommendation not found.');
    res.status(200).json({ recommendation: mapRecommendation(rows[0]) });
    return;
  }

  // DELETE — hard delete (used for clearing generated sets)
  const out = await sql`delete from recommendations where id = ${id} and user_id = ${user.id} returning id`;
  if (out.length === 0) throw new HttpError(404, 'Recommendation not found.');
  res.status(200).json({ ok: true });
}

export default route(['PATCH', 'DELETE'], handler);
