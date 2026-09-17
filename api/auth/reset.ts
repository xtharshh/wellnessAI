import { createHash } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { db } from '../_lib/db';
import { HttpError, clientIp, rateLimit, readJson, route } from '../_lib/http';
import { hashPassword } from '../_lib/auth';

const schema = z.object({
  token: z.string().trim().min(32).max(128),
  newPassword: z.string().min(8).max(128),
});

export default route(['POST'], async (req: VercelRequest, res: VercelResponse) => {
  if (!rateLimit(`reset:${clientIp(req)}`, 10, 60_000)) {
    throw new HttpError(429, 'Too many attempts. Try again shortly.');
  }
  const parsed = schema.safeParse(readJson(req));
  if (!parsed.success) throw new HttpError(400, 'Invalid reset code or password.');

  const sql = db();
  const hash = createHash('sha256').update(parsed.data.token).digest('hex');
  const rows = await sql`
    select user_id from reset_tokens
    where token_hash = ${hash} and used_at is null and expires_at > now()
    limit 1
  `;
  if (rows.length === 0) throw new HttpError(400, 'This reset code is invalid or expired.');

  await sql`update users set password_hash = ${await hashPassword(parsed.data.newPassword)} where id = ${rows[0].user_id}`;
  await sql`update reset_tokens set used_at = now() where token_hash = ${hash}`;
  await sql`delete from sessions where user_id = ${rows[0].user_id}`;
  res.status(200).json({ ok: true });
});
