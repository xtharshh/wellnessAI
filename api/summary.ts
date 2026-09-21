import type { VercelRequest, VercelResponse } from '@vercel/node';

import { db } from './_lib/db';
import { route } from './_lib/http';
import { requireUser } from './_lib/auth';

function pctChange(cur: number, prev: number): number {
  if (!prev) return 0;
  return Number((((cur - prev) / prev) * 100).toFixed(1));
}

export default route(['GET'], async (req: VercelRequest, res: VercelResponse) => {
  const user = await requireUser(req);
  const sql = db();
  const rows = await sql`
    select * from wellness_snapshots
    where user_id = ${user.id}
    order by recorded_at asc
  `;
  if (rows.length === 0) {
    res.status(200).json({ summary: null });
    return;
  }
  const n = (r: any, k: string) => Number(r[k]);
  const latest = rows[rows.length - 1];
  const prev = rows[Math.max(0, rows.length - 8)];
  const wellnessScore = Math.round(
    n(latest, 'mood_score') * 0.35 +
      Math.min(n(latest, 'sleep_hours') / 8, 1) * 100 * 0.25 +
      n(latest, 'activity_level') * 0.2 +
      (100 - n(latest, 'stress_index')) * 0.2
  );
  res.status(200).json({
    summary: {
      wellnessScore,
      moodScore: n(latest, 'mood_score'),
      sleepHours: n(latest, 'sleep_hours'),
      activityLevel: n(latest, 'activity_level'),
      stressIndex: n(latest, 'stress_index'),
      riskLevel: latest.risk_level,
      moodTrend: pctChange(n(latest, 'mood_score'), n(prev, 'mood_score')),
      sleepTrend: pctChange(n(latest, 'sleep_hours'), n(prev, 'sleep_hours')),
      activityTrend: pctChange(n(latest, 'activity_level'), n(prev, 'activity_level')),
      stressTrend: pctChange(n(latest, 'stress_index'), n(prev, 'stress_index')),
      lastUpdated: new Date(latest.recorded_at).toISOString(),
    },
  });
});
