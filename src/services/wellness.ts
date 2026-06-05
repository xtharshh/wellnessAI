import { generateWellnessSnapshots } from '@/src/mocks/wellnessData';
import { getJson, setJson, STORAGE_KEYS } from '@/src/services/storage';
import { WellnessSnapshot, WellnessSummary } from '@/src/types/wellness';

function percentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export async function ensureSnapshots(userId: string): Promise<WellnessSnapshot[]> {
  const all = await getJson<Record<string, WellnessSnapshot[]>>(STORAGE_KEYS.snapshots, {});
  if (!all[userId]?.length) {
    all[userId] = generateWellnessSnapshots(30);
    await setJson(STORAGE_KEYS.snapshots, all);
  }
  return all[userId];
}

export async function getSnapshots(userId: string, rangeDays = 30): Promise<WellnessSnapshot[]> {
  const snapshots = await ensureSnapshots(userId);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - rangeDays);
  return snapshots.filter((snapshot) => new Date(snapshot.recordedAt) >= cutoff);
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
  const all = await getJson<Record<string, WellnessSnapshot[]>>(STORAGE_KEYS.snapshots, {});
  const snapshots = all[userId] ?? generateWellnessSnapshots(30);
  const latest = snapshots[snapshots.length - 1];
  const refreshed: WellnessSnapshot = {
    ...latest,
    recordedAt: new Date().toISOString(),
    moodScore: Math.min(100, latest.moodScore + Math.round((Math.random() - 0.5) * 6)),
    sleepHours: Number(Math.max(4, Math.min(9, latest.sleepHours + (Math.random() - 0.5) * 0.4)).toFixed(1)),
    activityLevel: Math.min(100, Math.max(10, latest.activityLevel + Math.round((Math.random() - 0.5) * 8))),
    stressIndex: Math.min(100, Math.max(5, latest.stressIndex + Math.round((Math.random() - 0.5) * 6))),
  };
  refreshed.riskLevel = refreshed.stressIndex < 35 ? 'low' : refreshed.stressIndex < 65 ? 'medium' : 'high';
  all[userId] = [...snapshots.slice(0, -1), refreshed];
  await setJson(STORAGE_KEYS.snapshots, all);
  return all[userId];
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
