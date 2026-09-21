import { RiskLevel, WellnessSnapshot } from '@/src/types/wellness';

function riskFromStress(stress: number): RiskLevel {
  if (stress < 35) return 'low';
  if (stress < 65) return 'medium';
  return 'high';
}

export function generateWellnessSnapshots(days = 30): WellnessSnapshot[] {
  const snapshots: WellnessSnapshot[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    date.setHours(8 + (i % 5), 30, 0, 0);

    const wave = Math.sin(i / 4) * 12;
    const moodScore = Math.round(Math.min(100, Math.max(35, 68 + wave + (i % 3) * 4)));
    const sleepHours = Number((6.2 + Math.cos(i / 5) * 1.1 + (i % 2) * 0.3).toFixed(1));
    const activityLevel = Math.round(Math.min(100, Math.max(20, 55 + Math.sin(i / 3) * 18)));
    const stressIndex = Math.round(Math.min(100, Math.max(10, 42 - wave + (i % 4) * 3)));

    snapshots.push({
      id: `snap-${i}`,
      recordedAt: date.toISOString(),
      moodScore,
      sleepHours,
      activityLevel,
      stressIndex,
      riskLevel: riskFromStress(stressIndex),
    });
  }

  return snapshots;
}
