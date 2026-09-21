import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { db } from '../_lib/db.js';
import { HttpError, readJson, route } from '../_lib/http.js';
import { requireUser } from '../_lib/auth.js';

const postSchema = z.object({
  key: z.string().trim().min(1).max(200),
  type: z.string().trim().max(64).default(''),
  action: z.enum(['helpful', 'dismissed', 'hidden_type', 'corrected']),
  note: z.string().trim().max(2000).nullable().optional(),
});

async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req);
  const sql = db();

  if (req.method === 'GET') {
    const rows = await sql`
      select insight_key as "key", insight_type as "type", action, note
      from insight_feedback where user_id = ${user.id} order by created_at desc
    `;
    res.status(200).json({ feedback: rows });
    return;
  }

  const parsed = postSchema.safeParse(readJson(req));
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid feedback.');
  const f = parsed.data;
  await sql.query(
    `insert into insight_feedback (user_id, insight_key, insight_type, action, note)
     values ($1, $2, $3, $4, $5)
     on conflict (user_id, insight_key, action)
     do update set note = excluded.note, created_at = now()`,
    [user.id, f.key, f.type, f.action, f.note ?? null]
  );
  res.status(201).json({ ok: true });
}

export default route(['GET', 'POST'], handler);
