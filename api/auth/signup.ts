import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { db } from '../_lib/db';
import { HttpError, clientIp, rateLimit, readJson, route } from '../_lib/http';
import { createSession, mapUser } from '../_lib/auth';
import { hashPassword } from '../_lib/auth';

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(80),
});

export default route(['POST'], async (req: VercelRequest, res: VercelResponse) => {
  if (!rateLimit(`signup:${clientIp(req)}`, 10, 60_000)) {
    throw new HttpError(429, 'Too many attempts. Try again shortly.');
  }
  const parsed = schema.safeParse(readJson(req));
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid input');
  const { email, password, displayName } = parsed.data;

  const sql = db();
  const existing = await sql`select id from users where lower(email) = ${email} limit 1`;
  if (existing.length > 0) throw new HttpError(409, 'An account with this email already exists.');

  const passwordHash = await hashPassword(password);
  const rows = await sql`
    insert into users (email, password_hash, display_name)
    values (${email}, ${passwordHash}, ${displayName})
    returning *
  `;
  const user = mapUser(rows[0]);
  await sql`
    insert into user_settings (user_id) values (${user.id})
    on conflict (user_id) do nothing
  `;
  const { token } = await createSession(user.id);
  res.status(201).json({ token, user });
});
