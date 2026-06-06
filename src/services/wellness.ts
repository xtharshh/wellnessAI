import { generateWellnessSnapshots } from '@/src/mocks/wellnessData';
import { supabase } from '@/src/services/supabase';
import { WellnessSnapshot, WellnessSummary, RiskLevel } from '@/src/types/wellness';

function percentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function mapDbSnapshotToModel(row: any): WellnessSnapshot {
  return {
    id: row.id,
    recordedAt: row.recorded_at,
    moodScore: row.mood_score,
    sleepHours: row.sleep_hours,
    activityLevel: row.activity_level,
    stressIndex: row.stress_index,
    riskLevel: row.risk_level as RiskLevel,
  };
}

export async function ensureSnapshots(userId: string): Promise<WellnessSnapshot[]> {
  const { data: existing, error } = await supabase
    .from('wellness_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: true });

  if (existing && existing.length > 0) {
    return existing.map(mapDbSnapshotToModel);
  }

  // Seed a single initial 0 baseline snapshot for new signups instead of 15 days of fake mock history
  const initialRow = {
    user_id: userId,
    recorded_at: new Date().toISOString(),
    mood_score: 0,
    sleep_hours: 0,
    activity_level: 0,
    stress_index: 0,
    risk_level: 'low',
    metadata: { source: 'initial_signup_baseline' },
  };

  const { data: inserted, error: insertError } = await supabase
    .from('wellness_snapshots')
    .insert([initialRow])
    .select();

  if (insertError) {
    console.error('Failed to seed initial baseline snapshot:', insertError);
  }

  return (inserted || [])
    .map(mapDbSnapshotToModel);
}

export async function getSnapshots(userId: string, rangeDays = 30): Promise<WellnessSnapshot[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - rangeDays);

  const { data, error } = await supabase
    .from('wellness_snapshots')
    .select('*')
    .eq('user_id', userId)
    .gte('recorded_at', cutoff.toISOString())
    .order('recorded_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch snapshots:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return ensureSnapshots(userId);
  }

  return data.map(mapDbSnapshotToModel);
}

export async function getWellnessSummary(userId: string): Promise<WellnessSummary> {
  const snapshots = await ensureSnapshots(userId);
  const latest = snapshots[snapshots.length - 1];
  const previous = snapshots[Math.max(0, snapshots.length - 8)];

  const wellnessScore = (latest.moodScore === 0 && latest.sleepHours === 0 && latest.activityLevel === 0)
    ? 0
    : Math.round(
        latest.moodScore * 0.35 +
          Math.min(latest.sleepHours / 8, 1) * 100 * 0.25 +
          latest.activityLevel * 0.2 +
          (100 - latest.stressIndex) * 0.2,
      );

  return {
    wellnessScore,
    moodScore: latest.moodScore,
    sleepHours: latest.sleepHours,
    activityLevel: latest.activityLevel,
    stressIndex: latest.stressIndex,
    riskLevel: latest.riskLevel,
    moodTrend: percentChange(latest.moodScore, previous.moodScore),
    sleepTrend: percentChange(latest.sleepHours, previous.sleepHours),
    activityTrend: percentChange(latest.activityLevel, previous.activityLevel),
    stressTrend: percentChange(latest.stressIndex, previous.stressIndex),
    lastUpdated: latest.recordedAt,
  };
}

export async function refreshLatestSnapshot(userId: string): Promise<WellnessSnapshot[]> {
  const snapshots = await ensureSnapshots(userId);
  if (snapshots.length === 0) return [];

  const latest = snapshots[snapshots.length - 1];

  // If starting from 0 (signup baseline), initialize to realistic baselines first
  const baseMood = latest.moodScore === 0 ? 70 : latest.moodScore;
  const baseSleep = latest.sleepHours === 0 ? 7.5 : latest.sleepHours;
  const baseActivity = latest.activityLevel === 0 ? 50 : latest.activityLevel;
  const baseStress = latest.stressIndex === 0 ? 30 : latest.stressIndex;

  const refreshed = {
    mood_score: Math.min(100, Math.max(0, baseMood + Math.round((Math.random() - 0.5) * 6))),
    sleep_hours: Number(Math.max(0, Math.min(12, baseSleep + (Math.random() - 0.5) * 0.4)).toFixed(1)),
    activity_level: Math.min(100, Math.max(0, baseActivity + Math.round((Math.random() - 0.5) * 8))),
    stress_index: Math.min(100, Math.max(0, baseStress + Math.round((Math.random() - 0.5) * 6))),
    recorded_at: new Date().toISOString(),
    risk_level: '',
  };

  refreshed.risk_level = refreshed.stress_index < 35 ? 'low' : refreshed.stress_index < 65 ? 'medium' : 'high';

  const { error } = await supabase
    .from('wellness_snapshots')
    .update(refreshed)
    .eq('id', latest.id);

  if (error) {
    console.error('Failed to update latest snapshot:', error);
  }

  const { data: updated } = await supabase
    .from('wellness_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: true });

  return (updated || []).map(mapDbSnapshotToModel);
}

export function getMetricSeries(
  snapshots: WellnessSnapshot[],
  key: 'moodScore' | 'sleepHours' | 'activityLevel' | 'stressIndex',
): number[] {
  return snapshots.map((snapshot) => snapshot[key]);
}

export function getWeeklyAverages(snapshots: WellnessSnapshot[]) {
  const last7 = snapshots.slice(-7);
  return {
    mood: Math.round(average(last7.map((s) => s.moodScore))),
    sleep: Number(average(last7.map((s) => s.sleepHours)).toFixed(1)),
    activity: Math.round(average(last7.map((s) => s.activityLevel))),
    stress: Math.round(average(last7.map((s) => s.stressIndex))),
  };
}
