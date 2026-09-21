import { createHash } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { db } from '../_lib/db.js';
import { HttpError, readJson, route } from '../_lib/http.js';
import { hashPassword, requireUser, verifyPassword } from '../_lib/auth.js';

// Password change (authenticated). Forgot-password email reset requires
// RESEND_API_KEY — see /api/auth/forgot.ts.
const schema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

export default route(['POST'], async (req: VercelRequest, res: VercelResponse) => {
  const user = await requireUser(req);
  const parsed = schema.safeParse(readJson(req));
  if (!parsed.success) throw new HttpError(400, 'Invalid input');

  const sql = db();
  const rows = await sql`select password_hash from users where id = ${user.id} limit 1`;
  const { verifyPassword } = await import('../_lib/auth.js');
  if (!(await verifyPassword(parsed.data.currentPassword, rows[0].password_hash))) {
    throw new HttpError(401, 'Current password is incorrect.');
  }
  await sql`update users set password_hash = ${await hashPassword(parsed.data.newPassword)} where id = ${user.id}`;
  // Invalidate all other sessions after a password change.
  const token = (req.headers.authorization ?? '').slice(7).trim();
  const keep = createHash('sha256').update(token).digest('hex');
  await sql`delete from sessions where user_id = ${user.id} and token_hash != ${keep}`;
  res.status(200).json({ ok: true });
});
