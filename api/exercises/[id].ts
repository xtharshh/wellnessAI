import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { db } from '../_lib/db';
import { HttpError, readJson, route } from '../_lib/http';
import { requireUser } from '../_lib/auth';
import { mapExercise } from '../_lib/mappers';

const schema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  duration: z.string().trim().max(32).optional(),
  steps: z.array(z.string().max(1000)).optional(),
  explanation: z.string().max(5000).optional(),
  category: z.string().trim().max(32).optional(),
  custom: z.boolean().optional(),
});

const COLS: Record<string, string> = {
  name: 'name',
  duration: 'duration',
  steps: 'steps',
  explanation: 'explanation',
  category: 'category',
  custom: 'custom',
};

async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req);
  const id = req.query.id as string;
  if (!id) throw new HttpError(400, 'Missing exercise id');
  const sql = db();

  if (req.method === 'DELETE') {
    const out = await sql`delete from exercises where id = ${id} and user_id = ${user.id} returning id`;
    if (out.length === 0) throw new HttpError(404, 'Exercise not found.');
    res.status(200).json({ ok: true });
    return;
  }

  const parsed = schema.safeParse(readJson(req));
  if (!parsed.success) throw new HttpError(400, 'Invalid input');
  const patch = parsed.data;
  const keys = Object.keys(patch).filter((k) => (patch as any)[k] !== undefined);
  if (keys.length === 0) throw new HttpError(400, 'Nothing to update');
  const sets: string[] = [];
  const values: any[] = [];
  for (const k of keys) {
    let v = (patch as any)[k];
    if (k === 'steps') v = JSON.stringify(v);
    sets.push(`${COLS[k]} = $${sets.length + 3}${k === 'steps' ? '::jsonb' : ''}`);
    values.push(v);
  }
  const rows = await sql.query(
    `update exercises set ${sets.join(', ')} where id = $1 and user_id = $2 returning *`,
    [id, user.id, ...values]
  );
  if (rows.length === 0) throw new HttpError(404, 'Exercise not found.');
  res.status(200).json({ exercise: mapExercise(rows[0]) });
}

export default route(['PATCH', 'DELETE'], handler);
