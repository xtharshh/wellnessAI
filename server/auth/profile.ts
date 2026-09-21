import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { db } from '../_lib/db.js';
import { HttpError, readJson, route } from '../_lib/http.js';
import { mapUser, requireUser } from '../_lib/auth.js';

// Real columns this time — no JSON-in-display_name hack.
const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(255).optional(),
  displayName: z.string().trim().min(1).max(80).optional(),
  avatarUrl: z.string().trim().max(2048).nullable().optional(),
  privacyConsentAt: z.string().datetime().nullable().optional(),
  onboardingComplete: z.boolean().optional(),
  dob: z.string().trim().max(32).nullable().optional(),
  gender: z.string().trim().max(32).nullable().optional(),
  height: z.number().min(0).max(300).nullable().optional(),
  weight: z.number().min(0).max(1000).nullable().optional(),
  bodyFat: z.number().min(0).max(100).nullable().optional(),
  bloodType: z.string().trim().max(8).nullable().optional(),
  restingHr: z.number().min(0).max(300).nullable().optional(),
  activityLevel: z.string().trim().max(32).nullable().optional(),
  dailyStepsGoal: z.number().int().min(0).max(200000).nullable().optional(),
  sleepDurationGoal: z.number().min(0).max(24).nullable().optional(),
  waterIntakeGoal: z.number().int().min(0).max(20000).nullable().optional(),
});

const COLS: Record<string, string> = {
  email: 'email',
  displayName: 'display_name',
  avatarUrl: 'avatar_url',
  privacyConsentAt: 'privacy_consent_at',
  onboardingComplete: 'onboarding_complete',
  dob: 'dob',
  gender: 'gender',
  height: 'height',
  weight: 'weight',
  bodyFat: 'body_fat',
  bloodType: 'blood_type',
  restingHr: 'resting_hr',
  activityLevel: 'activity_level',
  dailyStepsGoal: 'daily_steps_goal',
  sleepDurationGoal: 'sleep_duration_goal',
  waterIntakeGoal: 'water_intake_goal',
};

export default route(['PATCH'], async (req: VercelRequest, res: VercelResponse) => {
  const user = await requireUser(req);
  const parsed = schema.safeParse(readJson(req));
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid input');
  const patch = parsed.data;
  const keys = Object.keys(patch).filter((k) => (patch as any)[k] !== undefined);
  if (keys.length === 0) throw new HttpError(400, 'Nothing to update');

  const sql = db();
  if (keys.includes('email')) {
    const clash = await sql`
      select id from users where lower(email) = ${(patch.email as string).toLowerCase()} and id != ${user.id} limit 1
    `;
    if (clash.length > 0) throw new HttpError(409, 'That email is already in use.');
  }

  // Build a parameterized update dynamically but safely (whitelisted columns).
  const sets: string[] = [];
  const values: any[] = [];
  keys.forEach((k, i) => {
    sets.push(`${COLS[k]} = $${i + 2}`);
    values.push((patch as any)[k]);
  });
  const rows = await sql.query(
    `update users set ${sets.join(', ')} where id = $1 returning *`,
    [user.id, ...values]
  );
  res.status(200).json({ user: mapUser(rows[0]) });
});
