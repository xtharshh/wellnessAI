import { supabase } from '@/src/services/supabase';
import { getWellnessSummary } from '@/src/services/wellness';
import { Recommendation, WellnessSummary, RecommendationCategory } from '@/src/types/wellness';
import { saveAISuggestedExercises } from '@/src/services/exercises';

function mapDbRecToModel(row: any): Recommendation {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category as RecommendationCategory,
    priority: row.priority,
    generatedAt: row.generated_at,
    dismissed: row.dismissed,
    completed: row.completed,
  };
}

function buildRecommendations(summary: WellnessSummary): Recommendation[] {
  const now = new Date().toISOString();
  const recs: Recommendation[] = [];

  if (summary.sleepHours < 7) {
    recs.push({
      id: '',
      title: 'Extend your sleep window',
      body: JSON.stringify({
        description: 'Your sleep average is below 7 hours. Try a 30-minute earlier wind-down routine and limit screens after 9 PM.',
        exercise: {
          name: 'Screen-Free Wind Down Stretch',
          duration: '5 mins',
          steps: [
            'Sit on your bed with legs crossed.',
            'Inhale deeply, reaching both arms overhead.',
            'Exhale and slowly fold forward, relaxing your neck and shoulders.',
            'Hold the stretch for 5 deep breaths, focusing on relaxing your chest.',
            'Roll up slowly and turn off all lights.'
          ],
          explanation: 'Releases physical tension built up during daily device use and signals your nervous system to prepare for rest.'
        }
      }),
      category: 'sleep',
      priority: 1,
      generatedAt: now,
      dismissed: false,
      completed: false,
    });
  }

  if (summary.stressIndex > 55) {
    recs.push({
      id: '',
      title: 'Reset with a 5-minute trace pause',
      body: JSON.stringify({
        description: 'Stress signals are elevated. A short breathing exercise can reduce cortisol patterns detected in your metadata trace.',
        exercise: {
          name: '4-7-8 Breathing Technique',
          duration: '3 mins',
          steps: [
            'Exhale completely through your mouth with a whoosh sound.',
            'Close your mouth and inhale quietly through your nose for 4 seconds.',
            'Hold your breath for a count of 7 seconds.',
            'Exhale completely through your mouth for 8 seconds.',
            'Repeat the cycle 4 times.'
          ],
          explanation: 'Activates the parasympathetic nervous system, rapidly reducing heart rate and resetting stress triggers detected in typing dynamics.'
        }
      }),
      category: 'mindfulness',
      priority: 2,
      generatedAt: now,
      dismissed: false,
      completed: false,
    });
  }

  if (summary.activityLevel < 50) {
    recs.push({
      id: '',
      title: 'Add a 15-minute movement block',
      body: JSON.stringify({
        description: 'Activity levels are trending low. A brief walk can improve mood and sleep quality within 24 hours.',
        exercise: {
          name: 'Dynamic Shoulder Roll & Stretch',
          duration: '2 mins',
          steps: [
            'Stand up straight with feet shoulder-width apart.',
            'Roll your shoulders backward in a slow circle 10 times.',
            'Interlace your fingers behind your back and pull your chest forward.',
            'Reach your arms over your head and stretch to the left, then to the right.',
            'Take a deep breath and sit back down.'
          ],
          explanation: 'Relieves typing-related shoulder tightness and increases localized blood circulation to counteract sedentary intervals.'
        }
      }),
      category: 'activity',
      priority: 3,
      generatedAt: now,
      dismissed: false,
      completed: false,
    });
  }

  recs.push({
    id: '',
    title: 'Review your weekly wellness trace',
    body: JSON.stringify({
      description: `Your composite wellness score is ${summary.wellnessScore}. Check Trends to spot patterns MindTrace can help you optimize.`,
      exercise: {
        name: 'Mindful Posture Check',
        duration: '1 min',
        steps: [
          'Sit tall at the front edge of your seat.',
          'Place your feet flat on the floor, directly under your knees.',
          'Lift your chest, relax your shoulders, and tuck your chin slightly.',
          'Take 3 slow, deep diaphragmatic breaths.'
        ],
        explanation: 'Re-aligns your spine after prolonged screen time, reducing physical fatigue and improving respiratory flow.'
      }
    }),
    category: 'general',
    priority: 4,
    generatedAt: now,
    dismissed: false,
    completed: false,
  });

  return recs.sort((a, b) => a.priority - b.priority);
}

export async function getRecommendations(userId: string): Promise<Recommendation[]> {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('user_id', userId)
    .eq('dismissed', false)
    .order('priority', { ascending: true });

  if (error) {
    console.error('Failed to fetch recommendations:', error);
    return [];
  }

  return (data || []).map(mapDbRecToModel);
}

async function fetchOpenAIRecommendations(summary: WellnessSummary): Promise<Recommendation[]> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
  if (!apiKey) {
    console.warn('No OPENAI_API_KEY found in environment variables. Falling back to templates.');
    return buildRecommendations(summary);
  }

  const prompt = `You are MindTrace AI, an expert behavioral therapist and clinical psychologist. Analyze the user's latest 14-day wellness trace summary:
- Wellness Score: ${summary.wellnessScore}/100
- Mood: ${summary.moodScore}/100 (trend: ${summary.moodTrend}%)
- Sleep: ${summary.sleepHours} hours (trend: ${summary.sleepTrend}%)
- Activity Level: ${summary.activityLevel}/100 (trend: ${summary.activityTrend}%)
- Stress Index: ${summary.stressIndex}/100 (trend: ${summary.stressTrend}%)
- Risk Level: ${summary.riskLevel}

Based on this telemetry, generate 3 to 4 highly personalized, realistic, and actionable recommendations. Each recommendation MUST include a specific exercise or activity the user can execute immediately. Reference typing dynamics (e.g. typing velocity, key intervals, backspaces), accelerometer logs, or device sleep gaps.

Return ONLY a JSON object with this exact structure:
{
  "recommendations": [
    {
      "title": "Short punchy recommendation title",
      "body": "Personalized description/explanation of why they need this based on their typing or movement telemetry.",
      "category": "sleep", // must be one of: "sleep", "mindfulness", "activity", "general"
      "priority": 1,
      "exercise": {
        "name": "Name of proposed exercise",
        "duration": "e.g. 5 mins",
        "steps": [
          "Step 1 instruction...",
          "Step 2 instruction...",
          "Step 3 instruction..."
        ],
        "explanation": "Brief description of why this specific exercise helps correct their abnormal metrics."
      }
    }
  ]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API status ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty content returned from OpenAI');
  }

  const parsed = JSON.parse(content);
  const now = new Date().toISOString();
  
  return (parsed.recommendations || []).map((r: any) => {
    const bodyPayload = r.exercise ? JSON.stringify({
      description: r.body,
      exercise: {
        name: r.exercise.name,
        duration: r.exercise.duration,
        steps: r.exercise.steps,
        explanation: r.exercise.explanation,
      }
    }) : r.body;

    return {
      id: '',
      title: r.title || 'Wellness Tip',
      body: bodyPayload,
      category: (r.category || 'general') as RecommendationCategory,
      priority: r.priority || 3,
      generatedAt: now,
      dismissed: false,
      completed: false,
    };
  });
}

export async function generateRecommendations(userId: string, forceOpenAI: boolean = false): Promise<Recommendation[]> {
  const summary = await getWellnessSummary(userId);
  const existingRecs = await getRecommendations(userId);

  // 1. Cache Check: check if the metrics have changed compared to the previous snapshot.
  if (existingRecs.length > 0) {
    try {
      const { data: snapshots, error } = await supabase
        .from('wellness_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(2);

      if (!error && snapshots && snapshots.length >= 2) {
        const current = snapshots[0];
        const previous = snapshots[1];

        // Check if all metrics are stable
        const isStable = Math.abs(current.mood_score - previous.mood_score) <= 3 &&
                         Math.abs(current.sleep_hours - previous.sleep_hours) <= 0.5 &&
                         Math.abs(current.activity_level - previous.activity_level) <= 5 &&
                         Math.abs(current.stress_index - previous.stress_index) <= 5;

        if (isStable) {
          console.log('Telemetry metrics are stable. Reusing previously generated recommendations to save tokens.');
          return existingRecs;
        }
      }
    } catch (cacheErr) {
      console.warn('Failed to execute stability cache check, proceeding to regenerate:', cacheErr);
    }
  }

  // 2. Generate Recommendations
  let recs: Recommendation[] = [];
  if (forceOpenAI) {
    try {
      recs = await fetchOpenAIRecommendations(summary);
    } catch (e) {
      console.error('OpenAI recommendation generation failed, falling back to templates:', e);
      recs = buildRecommendations(summary);
    }
  } else {
    recs = buildRecommendations(summary);
  }

  const dbRows = recs.map((r) => ({
    user_id: userId,
    title: r.title,
    body: r.body,
    category: r.category,
    priority: r.priority,
    generated_at: r.generatedAt,
    dismissed: r.dismissed,
    completed: r.completed,
  }));

  // Clear existing non-dismissed ones to avoid duplicates
  await supabase
    .from('recommendations')
    .delete()
    .eq('user_id', userId)
    .eq('dismissed', false);

  const { data, error } = await supabase
    .from('recommendations')
    .insert(dbRows)
    .select();

  if (error) {
    console.error('Failed to generate recommendations:', error);
    return (data || []).map(mapDbRecToModel);
  }

  const mappedRecs = (data || []).map(mapDbRecToModel);

  // 3. Save AI exercises to the Exercises Library
  try {
    await saveAISuggestedExercises(userId, mappedRecs);
  } catch (saveErr) {
    console.error('Failed to save suggested exercises to library:', saveErr);
  }

  return mappedRecs;
}

export async function dismissRecommendation(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('recommendations')
    .update({ dismissed: true })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to dismiss recommendation:', error);
  }
}

export async function completeRecommendation(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('recommendations')
    .update({ completed: true })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to complete recommendation:', error);
  }
}
