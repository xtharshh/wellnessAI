import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { db } from './_lib/db.js';
import { HttpError, readJson, route } from './_lib/http.js';
import { requireUser } from './_lib/auth.js';

function mapSnapshot(row: any) {
  return {
    id: row.id,
    recordedAt: new Date(row.recorded_at).toISOString(),
    moodScore: Number(row.mood_score),
    sleepHours: Number(row.sleep_hours),
    activityLevel: Number(row.activity_level),
    stressIndex: Number(row.stress_index),
    riskLevel: row.risk_level,
  };
}

const postSchema = z.object({
  moodScore: z.number().min(0).max(100),
  sleepHours: z.number().min(0).max(24),
  activityLevel: z.number().min(0).max(100),
  stressIndex: z.number().min(0).max(100),
  metadata: z.record(z.string(), z.any()).optional(),
});

function riskOf(stress: number): string {
  return stress < 35 ? 'low' : stress < 65 ? 'medium' : 'high';
}

async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req);
  const sql = db();

  if (req.method === 'GET') {
    const days = Math.min(Math.max(Number(req.query.range ?? 30) || 30, 1), 365);
    const rows = await sql`
      select * from wellness_snapshots
      where user_id = ${user.id} and recorded_at >= now() - (${days}::int * interval '1 day')
      order by recorded_at asc
    `;
    res.status(200).json({ snapshots: rows.map(mapSnapshot) });
    return;
  }

  // POST — ingest one real telemetry snapshot
  const parsed = postSchema.safeParse(readJson(req));
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid snapshot.');
  const s = parsed.data;
  const rows = await sql`
    insert into wellness_snapshots (user_id, mood_score, sleep_hours, activity_level, stress_index, risk_level, metadata)
    values (${user.id}, ${s.moodScore}, ${s.sleepHours}, ${s.activityLevel}, ${s.stressIndex}, ${riskOf(s.stressIndex)}, ${JSON.stringify(s.metadata ?? { source: 'device' })}::jsonb)
    returning *
  `;
  res.status(201).json({ snapshot: mapSnapshot(rows[0]) });
}

export default route(['GET', 'POST'], handler);
