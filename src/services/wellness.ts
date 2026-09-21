import { WellnessSnapshot, WellnessSummary } from '@/src/types/wellness';
import { apiFetch } from '@/src/services/apiClient';
import { getLiveMetrics } from '@/src/services/realAnalytics';

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export async function ensureSnapshots(userId: string): Promise<WellnessSnapshot[]> {
  void userId;
  // REAL-ONLY: server returns history; empty = new user, UI shows onboarding empty state.
  return getSnapshots(userId, 365);
}

export async function getSnapshots(userId: string, rangeDays = 30): Promise<WellnessSnapshot[]> {
  void userId;
  try {
    const data = await apiFetch<{ snapshots: WellnessSnapshot[] }>(
      `/api/snapshots?range=${Math.max(1, Math.min(rangeDays, 365))}`
    );
    return data.snapshots;
  } catch (e) {
    console.error('Failed to fetch snapshots:', e);
    return [];
  }
}

export async function getWellnessSummary(userId: string): Promise<WellnessSummary | null> {
  void userId;
  try {
    const data = await apiFetch<{ summary: WellnessSummary | null }>('/api/summary');
    return data.summary;
  } catch (e) {
    console.error('Failed to fetch wellness summary:', e);
    return null;
  }
}

export async function refreshLatestSnapshot(userId: string): Promise<WellnessSnapshot[]> {
  // REAL-ONLY: sync live device telemetry as a NEW snapshot. No random jitter.
  const live = await getLiveMetrics();

  if (!live.hasSufficientData) {
    return ensureSnapshots(userId);
  }

  const existing = await ensureSnapshots(userId);
  const last = existing[existing.length - 1];

  const mood = live.moodScore ?? last?.moodScore ?? null;
  const sleep = live.sleepHours ?? last?.sleepHours ?? null;
  const activity = live.activityLevel ?? last?.activityLevel ?? null;
  const stress = live.stressIndex ?? last?.stressIndex ?? null;

  if (mood === null || sleep === null || activity === null || stress === null) {
    return existing;
  }

  try {
    await apiFetch('/api/snapshots', {
      method: 'POST',
      body: {
        moodScore: mood,
        sleepHours: sleep,
        activityLevel: activity,
        stressIndex: stress,
        metadata: { source: 'real_device_sensors', telemetry: live.rawSignals },
      },
    });
  } catch (e) {
    console.error('Failed to sync live snapshot:', e);
  }

  return ensureSnapshots(userId);
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
