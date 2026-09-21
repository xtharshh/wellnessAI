import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

import { db } from '../_lib/db.js';
import { HttpError, readJson, route } from '../_lib/http.js';
import { requireUser } from '../_lib/auth.js';
import { mapRecommendation } from '../_lib/mappers.js';

interface Built {
  title: string;
  body: string;
  category: 'sleep' | 'mindfulness' | 'activity' | 'general';
  priority: number;
}

function exercisePayload(description: string, exercise: object) {
  return JSON.stringify({ description, exercise });
}

// Deterministic template engine (mirrors the original client rules).
function buildTemplates(s: any): Built[] {
  const recs: Built[] = [];
  if (s.sleepHours < 7) {
    recs.push({
      title: 'Extend your sleep window',
      body: exercisePayload(
        'Your sleep average is below 7 hours. Try a 30-minute earlier wind-down routine and limit screens after 9 PM.',
        {
          name: 'Screen-Free Wind Down Stretch',
          duration: '5 mins',
          steps: [
            'Sit on your bed with legs crossed.',
            'Inhale deeply, reaching both arms overhead.',
            'Exhale and slowly fold forward, relaxing your neck and shoulders.',
            'Hold the stretch for 5 deep breaths, focusing on relaxing your chest.',
            'Roll up slowly and turn off all lights.',
          ],
          explanation: 'Releases physical tension built up during daily device use and signals your nervous system to prepare for rest.',
        }
      ),
      category: 'sleep',
      priority: 1,
    });
  }
  if (s.stressIndex > 55) {
    recs.push({
      title: 'Reset with a 5-minute trace pause',
      body: exercisePayload(
        'Stress signals are elevated. A short breathing exercise can reduce cortisol patterns detected in your metadata trace.',
        {
          name: '4-7-8 Breathing Technique',
          duration: '3 mins',
          steps: [
            'Exhale completely through your mouth with a whoosh sound.',
            'Close your mouth and inhale quietly through your nose for 4 seconds.',
            'Hold your breath for a count of 7 seconds.',
            'Exhale completely through your mouth for 8 seconds.',
            'Repeat the cycle 4 times.',
          ],
          explanation: 'Activates the parasympathetic nervous system, rapidly reducing heart rate and resetting stress triggers detected in typing dynamics.',
        }
      ),
      category: 'mindfulness',
      priority: 2,
    });
  }
  if (s.activityLevel < 50) {
    recs.push({
      title: 'Add a 15-minute movement block',
      body: exercisePayload(
        'Activity levels are trending low. A brief walk can improve mood and sleep quality within 24 hours.',
        {
          name: 'Dynamic Shoulder Roll & Stretch',
          duration: '2 mins',
          steps: [
            'Stand up straight with feet shoulder-width apart.',
            'Roll your shoulders backward in a slow circle 10 times.',
            'Interlace your fingers behind your back and pull your chest forward.',
            'Reach your arms over your head and stretch to the left, then to the right.',
            'Take a deep breath and sit back down.',
          ],
          explanation: 'Relieves typing-related shoulder tightness and increases localized blood circulation to counteract sedentary intervals.',
        }
      ),
      category: 'activity',
      priority: 3,
    });
  }
  recs.push({
    title: 'Review your weekly wellness trace',
    body: exercisePayload(
      `Your composite wellness score is ${s.wellnessScore}. Check Trends to spot patterns Wellness AI can help you optimize.`,
      {
        name: 'Mindful Posture Check',
        duration: '1 min',
        steps: [
          'Sit tall at the front edge of your seat.',
          'Place your feet flat on the floor, directly under your knees.',
          'Lift your chest, relax your shoulders, and tuck your chin slightly.',
          'Take 3 slow, deep diaphragmatic breaths.',
        ],
        explanation: 'Re-aligns your spine after prolonged screen time, reducing physical fatigue and improving respiratory flow.',
      }
    ),
    category: 'general',
    priority: 4,
  });
  return recs.sort((a, b) => a.priority - b.priority);
}

async function buildWithOpenAI(s: any): Promise<Built[] | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const prompt = `You are Wellness AI, an expert behavioral therapist. Analyze this 14-day wellness trace summary:
- Wellness Score: ${s.wellnessScore}/100
- Mood: ${s.moodScore}/100 (trend: ${s.moodTrend}%)
- Sleep: ${s.sleepHours} hours (trend: ${s.sleepTrend}%)
- Activity Level: ${s.activityLevel}/100 (trend: ${s.activityTrend}%)
- Stress Index: ${s.stressIndex}/100 (trend: ${s.stressTrend}%)
- Risk Level: ${s.riskLevel}
Generate 3 to 4 personalized, actionable recommendations, each with an immediately executable exercise.
Return ONLY a JSON object: {"recommendations": [{"title": "...", "body": "...", "category": "sleep|mindfulness|activity|general", "priority": 1, "exercise": {"name": "...", "duration": "...", "steps": ["..."], "explanation": "..."}}]}`;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    return (parsed.recommendations || []).map((r: any) => ({
      title: r.title || 'Wellness Tip',
      body: r.exercise
        ? JSON.stringify({
            description: r.body,
            exercise: {
              name: r.exercise.name,
              duration: r.exercise.duration,
              steps: r.exercise.steps,
              explanation: r.exercise.explanation,
            },
          })
        : r.body,
      category: (r.category || 'general') as Built['category'],
      priority: r.priority || 3,
    }));
  } catch {
    return null;
  }
}

const schema = z.object({ forceOpenAI: z.boolean().optional() });

export default route(['POST'], async (req: VercelRequest, res: VercelResponse) => {
  const user = await requireUser(req);
  const { forceOpenAI } = schema.parse(readJson(req));
  const sql = db();

  const snaps = await sql`
    select * from wellness_snapshots where user_id = ${user.id} order by recorded_at asc
  `;
  if (snaps.length === 0) {
    res.status(200).json({ recommendations: [] });
    return;
  }

  // Stability cache: reuse when metrics haven't moved (saves OpenAI tokens).
  const existing = await sql`
    select * from recommendations where user_id = ${user.id} and dismissed = false order by priority asc
  `;
  if (existing.length > 0) {
    const last2 = await sql`
      select * from wellness_snapshots where user_id = ${user.id} order by recorded_at desc limit 2
    `;
    if (last2.length === 2) {
      const [c, p] = last2;
      const stable =
        Math.abs(Number(c.mood_score) - Number(p.mood_score)) <= 3 &&
        Math.abs(Number(c.sleep_hours) - Number(p.sleep_hours)) <= 0.5 &&
        Math.abs(Number(c.activity_level) - Number(p.activity_level)) <= 5 &&
        Math.abs(Number(c.stress_index) - Number(p.stress_index)) <= 5;
      if (stable) {
        res.status(200).json({ recommendations: existing.map(mapRecommendation) });
        return;
      }
    }
  }

  const n = (r: any, k: string) => Number(r[k]);
  const latest = snaps[snaps.length - 1];
  const prev = snaps[Math.max(0, snaps.length - 8)];
  const pct = (c: number, p: number) => (p ? Number((((c - p) / p) * 100).toFixed(1)) : 0);
  const summary = {
    wellnessScore: Math.round(
      n(latest, 'mood_score') * 0.35 +
        Math.min(n(latest, 'sleep_hours') / 8, 1) * 100 * 0.25 +
        n(latest, 'activity_level') * 0.2 +
        (100 - n(latest, 'stress_index')) * 0.2
    ),
    moodScore: n(latest, 'mood_score'),
    sleepHours: n(latest, 'sleep_hours'),
    activityLevel: n(latest, 'activity_level'),
    stressIndex: n(latest, 'stress_index'),
    riskLevel: latest.risk_level,
    moodTrend: pct(n(latest, 'mood_score'), n(prev, 'mood_score')),
    sleepTrend: pct(n(latest, 'sleep_hours'), n(prev, 'sleep_hours')),
    activityTrend: pct(n(latest, 'activity_level'), n(prev, 'activity_level')),
    stressTrend: pct(n(latest, 'stress_index'), n(prev, 'stress_index')),
  };

  let built: Built[];
  if (forceOpenAI) {
    built = (await buildWithOpenAI(summary)) ?? buildTemplates(summary);
  } else {
    built = buildTemplates(summary);
  }

  await sql`delete from recommendations where user_id = ${user.id} and dismissed = false`;
  const inserted: any[] = [];
  for (const r of built) {
    const rows = await sql`
      insert into recommendations (user_id, title, body, category, priority)
      values (${user.id}, ${r.title}, ${r.body}, ${r.category}, ${r.priority})
      returning *
    `;
    inserted.push(rows[0]);
    // Mirror AI exercises into the library (dedup by name).
    try {
      const details = JSON.parse(r.body);
      if (details.exercise) {
        const dup = await sql`
          select id from exercises where user_id = ${user.id} and lower(name) = ${String(details.exercise.name).toLowerCase()} limit 1
        `;
        if (dup.length === 0) {
          await sql`
            insert into exercises (user_id, name, duration, steps, explanation, category, custom)
            values (${user.id}, ${details.exercise.name}, ${details.exercise.duration}, ${JSON.stringify(details.exercise.steps || [])}::jsonb, ${details.exercise.explanation || ''}, ${r.category}, false)
          `;
        }
      }
    } catch {}
  }
  res.status(201).json({ recommendations: inserted.map(mapRecommendation) });
});
