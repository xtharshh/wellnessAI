import type { VercelRequest, VercelResponse } from '@vercel/node';

import { db } from '../_lib/db.js';
import { HttpError, route } from '../_lib/http.js';
import { requireUser } from '../_lib/auth.js';

export default route(['DELETE'], async (req: VercelRequest, res: VercelResponse) => {
  const user = await requireUser(req);
  const id = req.query.id as string;
  if (!id) throw new HttpError(400, 'Missing journal id');
  const sql = db();
  const out = await sql`delete from journals where id = ${id} and user_id = ${user.id} returning id`;
  if (out.length === 0) throw new HttpError(404, 'Entry not found.');
  res.status(200).json({ ok: true });
});
