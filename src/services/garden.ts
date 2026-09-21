import { getExercises } from '@/src/services/exercises';
import { getJournals } from '@/src/services/journals';
import { getSnapshots } from '@/src/services/wellness';

// ─── Wellness Garden data (doc §33) ──────────────────────────────
// Growth comes ONLY from real events in the last 30 days. No streaks,
// no shame — "X of 30 days engaged", plants simply grow at your pace.

export type GrowthStage = 0 | 1 | 2 | 3 | 4;

export interface GardenPlant {
  kind: 'bloom' | 'vine' | 'sun';
  name: string;
  fedBy: string;
  count: number;
  goal: number;
  stage: GrowthStage;
}

export interface GardenStats {
  activeDays: number;
  windowDays: number;
  plants: GardenPlant[];
  stars: number; // journals this week, max 7
}

function stageFor(count: number): GrowthStage {
  if (count >= 10) return 4;
  if (count >= 6) return 3;
  if (count >= 3) return 2;
  if (count >= 1) return 1;
  return 0;
}

function activeStage(days: number): GrowthStage {
  if (days >= 21) return 4;
  if (days >= 15) return 3;
  if (days >= 10) return 2;
  if (days >= 5) return 1;
  return 0;
}

const dayKey = (iso: string) => iso.slice(0, 10);

export async function getGardenStats(userId: string): Promise<GardenStats> {
  const [journals, snapshots, exercises] = await Promise.all([
    getJournals(userId).catch(() => []),
    getSnapshots(userId, 30).catch(() => []),
    getExercises(userId).catch(() => []),
  ]);

  const cutoff = Date.now() - 30 * 86400000;
  const recentJournals = journals.filter((j) => new Date(j.createdAt).getTime() >= cutoff);
  const activeDays = new Set<string>();
  for (const j of recentJournals) activeDays.add(dayKey(j.createdAt));
  for (const s of snapshots) activeDays.add(dayKey(s.recordedAt));

  const weekCutoff = Date.now() - 7 * 86400000;
  const stars = Math.min(
    7,
    recentJournals.filter((j) => new Date(j.createdAt).getTime() >= weekCutoff).length
  );

  return {
    activeDays: activeDays.size,
    windowDays: 30,
    stars,
    plants: [
      {
        kind: 'bloom',
        name: 'Reflection Bloom',
        fedBy: `${recentJournals.length} journal entries`,
        count: recentJournals.length,
        goal: 10,
        stage: stageFor(recentJournals.length),
      },
      {
        kind: 'vine',
        name: 'Movement Vine',
        fedBy: `${exercises.length} practices in library`,
        count: exercises.length,
        goal: 10,
        stage: stageFor(exercises.length),
      },
      {
        kind: 'sun',
        name: 'Rhythm Sun',
        fedBy: `${activeDays.size} active days`,
        count: activeDays.size,
        goal: 21,
        stage: activeStage(activeDays.size),
      },
    ],
  };
}
