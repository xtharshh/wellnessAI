import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { db } from './_lib/db';
import { HttpError, readJson, route } from './_lib/http';
import { requireUser } from './_lib/auth';
import { mapJournal } from './_lib/mappers';

const postSchema = z.object({
  content: z.string().trim().min(1).max(10000),
  moodScore: z.number().min(0).max(100).default(50),
  moodTag: z.string().trim().max(32).default(''),
});

async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req);
  const sql = db();

  if (req.method === 'GET') {
    const rows = await sql`
      select * from journals where user_id = ${user.id} order by created_at desc limit 200
    `;
    res.status(200).json({ journals: rows.map(mapJournal) });
    return;
  }

  const parsed = postSchema.safeParse(readJson(req));
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid entry.');
  const rows = await sql`
    insert into journals (user_id, content, mood_score, mood_tag)
    values (${user.id}, ${parsed.data.content}, ${parsed.data.moodScore}, ${parsed.data.moodTag})
    returning *
  `;
  res.status(201).json({ journal: mapJournal(rows[0]) });
}

export default route(['GET', 'POST'], handler);
