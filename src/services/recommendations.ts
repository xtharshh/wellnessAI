import { getJson, setJson, STORAGE_KEYS } from '@/src/services/storage';
import { getWellnessSummary } from '@/src/services/wellness';
import { Recommendation, WellnessSummary } from '@/src/types/wellness';

function buildRecommendations(summary: WellnessSummary): Recommendation[] {
  const now = new Date().toISOString();
  const recs: Recommendation[] = [];

  if (summary.sleepHours < 7) {
    recs.push({
      id: `rec-sleep-${Date.now()}`,
      title: 'Extend your sleep window',
      body: 'Your sleep average is below 7 hours. Try a 30-minute earlier wind-down routine and limit screens after 9 PM.',
      category: 'sleep',
      priority: 1,
      generatedAt: now,
      dismissed: false,
      completed: false,
    });
  }

  if (summary.stressIndex > 55) {
    recs.push({
      id: `rec-mind-${Date.now() + 1}`,
      title: 'Reset with a 5-minute trace pause',
      body: 'Stress signals are elevated. A short breathing exercise can reduce cortisol patterns detected in your metadata trace.',
      category: 'mindfulness',
      priority: 2,
      generatedAt: now,
      dismissed: false,
      completed: false,
    });
  }

  if (summary.activityLevel < 50) {
    recs.push({
      id: `rec-act-${Date.now() + 2}`,
      title: 'Add a 15-minute movement block',
      body: 'Activity levels are trending low. A brief walk can improve mood and sleep quality within 24 hours.',
      category: 'activity',
      priority: 3,
      generatedAt: now,
      dismissed: false,
      completed: false,
    });
  }

  recs.push({
    id: `rec-gen-${Date.now() + 3}`,
    title: 'Review your weekly wellness trace',
    body: `Your composite wellness score is ${summary.wellnessScore}. Check Trends to spot patterns MindTrace can help you optimize.`,
    category: 'general',
    priority: 4,
    generatedAt: now,
    dismissed: false,
    completed: false,
  });

  return recs.sort((a, b) => a.priority - b.priority);
}

export async function getRecommendations(userId: string): Promise<Recommendation[]> {
  const all = await getJson<Record<string, Recommendation[]>>(STORAGE_KEYS.recommendations, {});
  return (all[userId] ?? []).filter((rec) => !rec.dismissed);
}

export async function generateRecommendations(userId: string): Promise<Recommendation[]> {
  const summary = await getWellnessSummary(userId);
  const recs = buildRecommendations(summary);
  const all = await getJson<Record<string, Recommendation[]>>(STORAGE_KEYS.recommendations, {});
  all[userId] = recs;
  await setJson(STORAGE_KEYS.recommendations, all);
  return recs;
}

export async function dismissRecommendation(userId: string, id: string): Promise<void> {
  const all = await getJson<Record<string, Recommendation[]>>(STORAGE_KEYS.recommendations, {});
  all[userId] = (all[userId] ?? []).map((rec) =>
    rec.id === id ? { ...rec, dismissed: true } : rec,
  );
  await setJson(STORAGE_KEYS.recommendations, all);
}

export async function completeRecommendation(userId: string, id: string): Promise<void> {
  const all = await getJson<Record<string, Recommendation[]>>(STORAGE_KEYS.recommendations, {});
  all[userId] = (all[userId] ?? []).map((rec) =>
    rec.id === id ? { ...rec, completed: true } : rec,
  );
  await setJson(STORAGE_KEYS.recommendations, all);
}
