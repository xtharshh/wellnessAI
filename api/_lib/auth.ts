import { createHash, randomBytes, scrypt as _scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { VercelRequest } from '@vercel/node';

import { db } from './db.js';
import { HttpError, getBearer } from './http.js';

const scrypt = promisify(_scrypt);

export interface ApiUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  privacyConsentAt: string | null;
  onboardingComplete: boolean;
  createdAt: string;
  dob?: string | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  bodyFat?: number | null;
  bloodType?: string | null;
  restingHr?: number | null;
  activityLevel?: string | null;
  dailyStepsGoal?: number | null;
  sleepDurationGoal?: number | null;
  waterIntakeGoal?: number | null;
}

export function mapUser(row: any): ApiUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name ?? '',
    avatarUrl: row.avatar_url ?? null,
    privacyConsentAt: row.privacy_consent_at ? new Date(row.privacy_consent_at).toISOString() : null,
    onboardingComplete: !!row.onboarding_complete,
    createdAt: new Date(row.created_at).toISOString(),
    dob: row.dob ?? null,
    gender: row.gender ?? null,
    height: row.height !== null && row.height !== undefined ? Number(row.height) : null,
    weight: row.weight !== null && row.weight !== undefined ? Number(row.weight) : null,
    bodyFat: row.body_fat !== null && row.body_fat !== undefined ? Number(row.body_fat) : null,
    bloodType: row.blood_type ?? null,
    restingHr: row.resting_hr !== null && row.resting_hr !== undefined ? Number(row.resting_hr) : null,
    activityLevel: row.activity_level ?? null,
    dailyStepsGoal: row.daily_steps_goal ?? null,
    sleepDurationGoal:
      row.sleep_duration_goal !== null && row.sleep_duration_goal !== undefined
        ? Number(row.sleep_duration_goal)
        : null,
    waterIntakeGoal: row.water_intake_goal ?? null,
  };
}

// scrypt password hashing (pure node:crypto — no native deps, Vercel-safe).
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const dk = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${dk.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [, salt, hash] = stored.split('$');
    if (!salt || !hash) return false;
    const dk = (await scrypt(password, salt, 64)) as Buffer;
    const a = Buffer.from(dk.toString('hex'), 'hex');
    const b = Buffer.from(hash, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function sha256Hex(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

const SESSION_DAYS = 30;

export async function createSession(userId: string): Promise<{ token: string; expiresAt: string }> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  const sql = db();
  await sql`
    insert into sessions (user_id, token_hash, expires_at)
    values (${userId}, ${sha256Hex(token)}, ${expiresAt})
  `;
  return { token, expiresAt };
}

export async function requireUser(req: VercelRequest): Promise<ApiUser> {
  const token = getBearer(req);
  const sql = db();
  const rows = await sql`
    select u.* from sessions s
    join users u on u.id = s.user_id
    where s.token_hash = ${sha256Hex(token)} and s.expires_at > now()
    limit 1
  `;
  if (rows.length === 0) throw new HttpError(401, 'Invalid or expired session');
  return mapUser(rows[0]);
}

export async function destroySession(req: VercelRequest): Promise<void> {
  try {
    const token = getBearer(req);
    const sql = db();
    await sql`delete from sessions where token_hash = ${sha256Hex(token)}`;
  } catch {
    // Logout is best-effort.
  }
}
