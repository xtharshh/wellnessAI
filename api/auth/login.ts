import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { db } from '../_lib/db.js';
import { HttpError, clientIp, rateLimit, readJson, route } from '../_lib/http.js';
import { createSession, mapUser, verifyPassword } from '../_lib/auth.js';

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(1).max(128),
});

export default route(['POST'], async (req: VercelRequest, res: VercelResponse) => {
  if (!rateLimit(`login:${clientIp(req)}`, 15, 60_000)) {
    throw new HttpError(429, 'Too many attempts. Try again shortly.');
  }
  const parsed = schema.safeParse(readJson(req));
  if (!parsed.success) throw new HttpError(400, 'Invalid email or password.');
  const { email, password } = parsed.data;

  const sql = db();
  const rows = await sql`select * from users where lower(email) = ${email} limit 1`;
  // Uniform message to avoid user enumeration.
  if (rows.length === 0) throw new HttpError(401, 'Invalid email or password.');
  const ok = await verifyPassword(password, rows[0].password_hash);
  if (!ok) throw new HttpError(401, 'Invalid email or password.');

  const user = mapUser(rows[0]);
  const { token } = await createSession(user.id);
  res.status(200).json({ token, user });
});
