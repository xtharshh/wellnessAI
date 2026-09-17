import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { db } from './_lib/db';
import { HttpError, readJson, route } from './_lib/http';
import { requireUser } from './_lib/auth';
import { mapExercise } from './_lib/mappers';

const itemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  duration: z.string().trim().max(32).default(''),
  steps: z.array(z.string().max(1000)).default([]),
  explanation: z.string().max(5000).default(''),
  category: z.string().trim().max(32).default('general'),
  custom: z.boolean().default(true),
});

async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req);
  const sql = db();

  if (req.method === 'GET') {
    const rows = await sql`
      select * from exercises where user_id = ${user.id} order by created_at desc
    `;
    res.status(200).json({ exercises: rows.map(mapExercise) });
    return;
  }

  // POST — single object or { items: [...] } bulk (dedup by name)
  const body = readJson(req);
  const items = Array.isArray((body as any).items) ? (body as any).items : [body];
  const created: any[] = [];
  for (const raw of items) {
    const parsed = itemSchema.safeParse(raw);
    if (!parsed.success) continue;
    const e = parsed.data;
    const dup = await sql`
      select id from exercises where user_id = ${user.id} and lower(name) = ${e.name.toLowerCase()} limit 1
    `;
    if (dup.length > 0) continue;
    const rows = await sql`
      insert into exercises (user_id, name, duration, steps, explanation, category, custom)
      values (${user.id}, ${e.name}, ${e.duration}, ${JSON.stringify(e.steps)}::jsonb, ${e.explanation}, ${e.category}, ${e.custom})
      returning *
    `;
    created.push(mapExercise(rows[0]));
  }
  res.status(201).json({ exercises: created });
}

export default route(['GET', 'POST'], handler);
