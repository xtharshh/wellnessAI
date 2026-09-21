import type { WellnessSnapshot } from '@/src/types/wellness';
import { apiFetch } from '@/src/services/apiClient';

// ─── "Why Am I Feeling This Way?" — pattern explanations ──────────
// Careful language throughout: patterns in YOUR data, never medical claims.
// Pure functions over real snapshots (+ optional live flags). No network.

export type InsightType =
  | 'sleep-stress'
  | 'activity-mood'
  | 'rest-dip'
  | 'late-nights'
  | 'recovery'
  | 'baseline-shift';

export type Confidence = 'emerging' | 'steady' | 'strong';

export interface PatternEvidence {
  label: string;
  value: string;
}

export interface PatternInsight {
  key: string;
  type: InsightType;
  title: string;
  explanation: string;
  confidence: Confidence;
  daysObserved: number;
  evidence: PatternEvidence[];
  suggestion: string;
  ctaLabel: string;
  ctaRoute: string;
  correction?: string | null;
}

export type FeedbackAction = 'helpful' | 'dismissed' | 'hidden_type' | 'corrected';

export interface InsightFeedback {
  key: string;
  type: string;
  action: FeedbackAction;
  note?: string | null;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const pct = (cur: number, base: number) =>
  base ? Math.round(((cur - base) / base) * 100) : 0;

function confidenceFor(days: number): Confidence {
  if (days >= 10) return 'strong';
  if (days >= 7) return 'steady';
  return 'emerging';
}

export interface LiveFlags {
  lateNightUsageDetected?: boolean;
  screenTimeMinutes?: number | null;
}

/**
 * Detect co-movement patterns across the user's own history.
 * Returns at most 4 insights, strongest effect first. Empty = not enough data.
 */
export function detectPatterns(
  snapshots: WellnessSnapshot[],
  live?: LiveFlags | null
): PatternInsight[] {
  if (snapshots.length < 4) return [];
  const out: (PatternInsight & { effect: number })[] = [];
  const n = snapshots.length;

  const sleepAvg = avg(snapshots.map((s) => s.sleepHours));
  const stressAvg = avg(snapshots.map((s) => s.stressIndex));
  const moodAvg = avg(snapshots.map((s) => s.moodScore));

  // 1. Shorter sleep + higher stress appearing together.
  {
    const together = snapshots.filter(
      (s) => s.sleepHours < sleepAvg * 0.92 && s.stressIndex > stressAvg * 1.08
    );
    const share = Math.round((together.length / n) * 100);
    if (together.length >= 3 && share >= 35) {
      out.push({
        key: `sleep-stress:${n}`,
        type: 'sleep-stress',
        title: 'Shorter sleep, heavier days',
        explanation: `Over the last ${n} days, shorter sleep and higher stress appeared together on ${together.length} days. Your data suggests rest length and tension move together — not proof, just your pattern.`,
        confidence: confidenceFor(n),
        daysObserved: n,
        effect: share,
        evidence: [
          { label: 'Together on', value: `${together.length} of ${n} days` },
          { label: 'Your sleep avg', value: `${sleepAvg.toFixed(1)}h` },
          { label: 'Your stress avg', value: `${Math.round(stressAvg)}` },
        ],
        suggestion: 'Try a 30-minute earlier wind-down tonight and watch tomorrow.',
        ctaLabel: 'Open sleep details',
        ctaRoute: '/modal?metric=sleep',
      });
    }
  }

  // 2. Movement days lift mood.
  {
    const active = snapshots.filter((s) => s.activityLevel >= 60);
    const sedentary = snapshots.filter((s) => s.activityLevel < 40);
    if (active.length >= 2 && sedentary.length >= 2) {
      const delta = pct(avg(active.map((s) => s.moodScore)), avg(sedentary.map((s) => s.moodScore)));
      if (delta >= 8) {
        out.push({
          key: `activity-mood:${n}`,
          type: 'activity-mood',
          title: 'Movement lifts your mood',
          explanation: `On your ${active.length} most active days, mood averaged ${delta}% higher than on ${sedentary.length} sedentary days. Your check-ins show movement often precedes better-feeling days.`,
          confidence: confidenceFor(n),
          daysObserved: n,
          effect: delta,
          evidence: [
            { label: 'Active-day mood', value: `${Math.round(avg(active.map((s) => s.moodScore)))}` },
            { label: 'Quiet-day mood', value: `${Math.round(avg(sedentary.map((s) => s.moodScore)))}` },
            { label: 'Your mood avg', value: `${Math.round(moodAvg)}` },
          ],
          suggestion: 'A 10-minute walk without your phone is a good next test.',
          ctaLabel: 'Browse movement',
          ctaRoute: '/(tabs)/exercises',
        });
      }
    }
  }

  // 3. Recent rest dip vs personal baseline.
  {
    const recent = snapshots.slice(-3);
    const baseline = snapshots.slice(0, Math.max(1, n - 3));
    const recentAvg = avg(recent.map((s) => s.sleepHours));
    const baseAvg = avg(baseline.map((s) => s.sleepHours));
    const drop = pct(recentAvg, baseAvg);
    if (recent.length >= 3 && baseAvg > 0 && drop <= -15) {
      out.push({
        key: `rest-dip:${n}`,
        type: 'rest-dip',
        title: 'Your rest dipped lately',
        explanation: `Your last 3 nights averaged ${recentAvg.toFixed(1)}h against your usual ${baseAvg.toFixed(1)}h (${drop}%). Something shifted — worth one small repair tonight.`,
        confidence: confidenceFor(n),
        daysObserved: n,
        effect: Math.abs(drop),
        evidence: [
          { label: 'Last 3 nights', value: `${recentAvg.toFixed(1)}h` },
          { label: 'Your usual', value: `${baseAvg.toFixed(1)}h` },
        ],
        suggestion: 'Set a fixed wake time tomorrow — it anchors the whole night.',
        ctaLabel: 'Wind-down guide',
        ctaRoute: '/(tabs)/breath',
      });
    }
  }

  // 4. Late nights + live tension.
  {
    const late = live?.lateNightUsageDetected === true;
    const latest = snapshots[n - 1];
    if (late && latest.stressIndex > stressAvg) {
      out.push({
        key: `late-nights:${n}`,
        type: 'late-nights',
        title: 'Late nights, louder mind',
        explanation: `You're active late right now while stress sits above your average (${Math.round(latest.stressIndex)} vs usual ${Math.round(stressAvg)}). Screens after midnight and next-day tension often travel together in your data.`,
        confidence: 'emerging',
        daysObserved: n,
        effect: Math.round(latest.stressIndex - stressAvg),
        evidence: [
          { label: 'Right now', value: 'Late-night activity' },
          { label: 'Stress now', value: `${Math.round(latest.stressIndex)}` },
          { label: 'Your usual', value: `${Math.round(stressAvg)}` },
        ],
        suggestion: 'Digital sunset: screens off 30 minutes before bed tonight.',
        ctaLabel: 'Calm down now',
        ctaRoute: '/(tabs)/breath',
      });
    }
  }

  // 5. Recovery wins (positive, stabilizing).
  {
    let recoveries = 0;
    for (let i = 1; i < n; i++) {
      const prev = snapshots[i - 1];
      const cur = snapshots[i];
      if (prev.stressIndex >= 65 && cur.stressIndex <= prev.stressIndex * 0.8 && cur.activityLevel >= 50) {
        recoveries += 1;
      }
    }
    if (recoveries >= 2) {
      out.push({
        key: `recovery:${n}`,
        type: 'recovery',
        title: 'You bounce back with movement',
        explanation: `After high-stress days, your stress eased notably ${recoveries} times — and movement was part of each recovery. Your check-ins show activity often helps you reset.`,
        confidence: confidenceFor(n),
        daysObserved: n,
        effect: recoveries * 10,
        evidence: [
          { label: 'Recoveries spotted', value: `${recoveries}` },
          { label: 'Common thread', value: 'Active next day' },
        ],
        suggestion: 'After your next heavy day, plan one walk before judging the week.',
        ctaLabel: 'Plan a walk',
        ctaRoute: '/(tabs)/exercises',
      });
    }
  }

  // 6. Overall baseline shift (last 3 vs prior average wellness).
  {
    const score = (s: WellnessSnapshot) =>
      s.moodScore * 0.35 +
      Math.min(s.sleepHours / 8, 1) * 100 * 0.25 +
      s.activityLevel * 0.2 +
      (100 - s.stressIndex) * 0.2;
    if (n >= 7) {
      const recentAvg = avg(snapshots.slice(-3).map(score));
      const baseAvg = avg(snapshots.slice(0, n - 3).map(score));
      const shift = pct(recentAvg, baseAvg);
      if (Math.abs(shift) >= 10) {
        const up = shift > 0;
        out.push({
          key: `baseline-shift:${n}`,
          type: 'baseline-shift',
          title: up ? 'You’re trending upward' : 'A gentle downward drift',
          explanation: up
            ? `Your last 3 days score ${Math.round(recentAvg)} against your usual ${Math.round(baseAvg)} (+${shift}%). Whatever changed — keep it.`
            : `Your last 3 days score ${Math.round(recentAvg)} against your usual ${Math.round(baseAvg)} (${shift}%). Small, early, reversible — one repair at a time.`,
          confidence: confidenceFor(n),
          daysObserved: n,
          effect: Math.abs(shift),
          evidence: [
            { label: 'Last 3 days', value: `${Math.round(recentAvg)}` },
            { label: 'Your usual', value: `${Math.round(baseAvg)}` },
          ],
          suggestion: up ? 'Journal what worked — future-you will thank you.' : 'Pick one Thing for Today and let the rest wait.',
          ctaLabel: up ? 'Journal the win' : 'Get one small step',
          ctaRoute: up ? '/(tabs)/journal' : '/(tabs)/recommendations',
        });
      }
    }
  }

  return out
    .sort((a, b) => b.effect - a.effect)
    .slice(0, 4)
    .map(({ effect: _effect, ...clean }): PatternInsight => clean);
}

/** Apply stored feedback: hide dismissed keys + hidden types, attach corrections. */
export function applyFeedback(
  insights: PatternInsight[],
  feedback: InsightFeedback[]
): PatternInsight[] {
  const dismissed = new Set(
    feedback.filter((f) => f.action === 'dismissed').map((f) => f.key)
  );
  const hiddenTypes = new Set(
    feedback.filter((f) => f.action === 'hidden_type').map((f) => f.type)
  );
  const corrections = new Map(
    feedback.filter((f) => f.action === 'corrected' && f.note).map((f) => [f.key, f.note as string])
  );
  return insights
    .filter((i) => !dismissed.has(i.key) && !hiddenTypes.has(i.type))
    .map((i) => ({ ...i, correction: corrections.get(i.key) ?? null }));
}

// ─── Feedback persistence (Neon) ───────────────────────────────────

export async function getInsightFeedback(userId: string): Promise<InsightFeedback[]> {
  void userId;
  try {
    const data = await apiFetch<{ feedback: InsightFeedback[] }>('/api/insights/feedback');
    return data.feedback || [];
  } catch {
    return [];
  }
}

export async function postInsightFeedback(
  userId: string,
  input: { key: string; type: string; action: FeedbackAction; note?: string }
): Promise<void> {
  void userId;
  await apiFetch('/api/insights/feedback', { method: 'POST', body: input });
}
