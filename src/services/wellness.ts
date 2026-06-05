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

  // Seed data
  const mockSnapshots = generateWellnessSnapshots(30);
  const dbRows = mockSnapshots.map((s) => ({
    user_id: userId,
    recorded_at: s.recordedAt,
    mood_score: s.moodScore,
    sleep_hours: s.sleepHours,
    activity_level: s.activityLevel,
    stress_index: s.stressIndex,
    risk_level: s.riskLevel,
    metadata: {},
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('wellness_snapshots')
    .insert(dbRows)
    .select();

  if (insertError) {
    console.error('Failed to seed snapshots:', insertError);
  }

  return (inserted || [])
    .map(mapDbSnapshotToModel)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
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

  const wellnessScore = Math.round(
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

  const refreshed = {
    mood_score: Math.min(100, latest.moodScore + Math.round((Math.random() - 0.5) * 6)),
    sleep_hours: Number(Math.max(4, Math.min(9, latest.sleepHours + (Math.random() - 0.5) * 0.4)).toFixed(1)),
    activity_level: Math.min(100, Math.max(10, latest.activityLevel + Math.round((Math.random() - 0.5) * 8))),
    stress_index: Math.min(100, Math.max(5, latest.stressIndex + Math.round((Math.random() - 0.5) * 6))),
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
