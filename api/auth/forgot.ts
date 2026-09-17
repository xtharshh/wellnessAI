import { createHash, randomBytes } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { db } from '../_lib/db';
import { HttpError, clientIp, rateLimit, readJson, route } from '../_lib/http';

// Forgot-password: issues a single-use reset token. Delivery needs an email
// provider — if RESEND_API_KEY is set we send via Resend, otherwise 503 with
// a clear message (client surfaces it instead of failing silently).
const schema = z.object({ email: z.string().trim().toLowerCase().email().max(255) });

export default route(['POST'], async (req: VercelRequest, res: VercelResponse) => {
  if (!rateLimit(`forgot:${clientIp(req)}`, 5, 60_000)) {
    throw new HttpError(429, 'Too many attempts. Try again shortly.');
  }
  const parsed = schema.safeParse(readJson(req));
  if (!parsed.success) throw new HttpError(400, 'Invalid email.');
  if (!process.env.RESEND_API_KEY) {
    throw new HttpError(503, 'Password reset by email is not configured yet. Please contact support.');
  }

  const sql = db();
  const rows = await sql`select id from users where lower(email) = ${parsed.data.email} limit 1`;
  // Always respond success to avoid user enumeration; only send if user exists.
  if (rows.length > 0) {
    const token = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(token).digest('hex');
    await sql`
      insert into reset_tokens (user_id, token_hash, expires_at)
      values (${rows[0].id}, ${hash}, now() + interval '30 minutes')
    `;
    const appUrl = process.env.EXPO_PUBLIC_API_URL ?? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : '';
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESET_FROM_EMAIL ?? 'MindTrace <no-reply@mindtrace.ai>',
        to: parsed.data.email,
        subject: 'Reset your MindTrace password',
        text: `Use this code within 30 minutes to reset your password: ${token}\n\n(Enter it in the app${appUrl ? ` or visit ${appUrl}` : ''}.)`,
      }),
    });
  }
  res.status(200).json({ ok: true });
});
