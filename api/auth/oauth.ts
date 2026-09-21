import { randomBytes } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { db } from '../_lib/db';
import { HttpError, clientIp, rateLimit, readJson, route } from '../_lib/http';
import { createSession, hashPassword, mapUser } from '../_lib/auth';

const schema = z.object({
  provider: z.literal('google'),
  idToken: z.string().min(10).max(8192),
});

interface GoogleInfo {
  sub: string;
  email?: string;
  email_verified?: string;
  name?: string;
  picture?: string;
}

// Verify the Google ID token with Google itself (TLS) and bind the audience
// to our OAuth client so tokens minted for other apps are rejected.
async function verifyGoogle(idToken: string): Promise<GoogleInfo> {
  const expectedAud = process.env.GOOGLE_OAUTH_CLIENT_ID;
  let info: GoogleInfo;
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) throw new Error(`tokeninfo: ${res.status}`);
    info = (await res.json()) as GoogleInfo;
  } catch {
    throw new HttpError(401, 'Google sign-in failed. Please try again.');
  }
  if (!info.email || info.email_verified !== 'true') {
    throw new HttpError(401, 'Google account email is not verified.');
  }
  if (expectedAud && (info as any).aud !== expectedAud) {
    throw new HttpError(401, 'Google token was issued for a different app.');
  }
  return info;
}

export default route(['POST'], async (req: VercelRequest, res: VercelResponse) => {
  if (!rateLimit(`oauth:${clientIp(req)}`, 15, 60_000)) {
    throw new HttpError(429, 'Too many attempts. Try again shortly.');
  }
  const parsed = schema.safeParse(readJson(req));
  if (!parsed.success) throw new HttpError(400, 'Invalid OAuth request.');

  const info = await verifyGoogle(parsed.data.idToken);
  const email = info.email!.toLowerCase();
  const sql = db();

  let rows = await sql`select * from users where lower(email) = ${email} limit 1`;
  if (rows.length === 0) {
    // First Google sign-in: provision the account (random password — OAuth only).
    const created = await sql`
      insert into users (email, password_hash, display_name, avatar_url)
      values (${email}, ${await hashPassword(randomBytes(32).toString('hex'))}, ${info.name ?? email.split('@')[0]}, ${info.picture ?? null})
      returning *
    `;
    rows = created;
    await sql`insert into user_settings (user_id) values (${rows[0].id}) on conflict do nothing`;
  } else if (!rows[0].avatar_url && info.picture) {
    await sql`update users set avatar_url = ${info.picture} where id = ${rows[0].id}`;
    rows[0].avatar_url = info.picture;
  }

  const user = mapUser(rows[0]);
  const { token } = await createSession(user.id);
  res.status(200).json({ token, user });
});
