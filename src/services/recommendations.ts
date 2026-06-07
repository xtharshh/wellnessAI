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

export interface LifestyleItem {
  id: string;
  title: string;
  creator: string;
  category: 'books' | 'movies' | 'songs' | 'podcasts' | 'meditation' | 'productivity' | 'stress-relief';
  description: string;
  reason: string;
  imageUrl?: string;
  linkUrl?: string;
}

export async function getLifestyleRecommendations(userId: string): Promise<LifestyleItem[]> {
  const summary = await getWellnessSummary(userId);
  const stress = summary.stressIndex;
  const mood = summary.moodScore;

  const recs: LifestyleItem[] = [];

  // 1. Books
  if (stress > 55) {
    recs.push({
      id: 'book-1',
      title: 'Burnout: The Secret to Unlocking the Stress Cycle',
      creator: 'Emily Nagoski',
      category: 'books',
      description: 'An essential guide explaining how to complete the stress cycle and release biological tension.',
      reason: `Recommended because your Stress Index is elevated (${stress}%)`,
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
      linkUrl: 'https://www.goodreads.com/book/show/42927286-burnout'
    });
  } else {
    recs.push({
      id: 'book-2',
      title: 'The Power of Now',
      creator: 'Eckhart Tolle',
      category: 'books',
      description: 'A transformative guide to present-moment awareness, helping quiet anxious thoughts.',
      reason: 'Recommended to help maintain your stable mental state.',
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=400&q=80',
      linkUrl: 'https://www.goodreads.com/book/show/6708.The_Power_of_Now'
    });
  }
  recs.push({
    id: 'book-3',
    title: 'Digital Minimalism',
    creator: 'Cal Newport',
    category: 'books',
    description: 'Practical tactics for setting healthy boundaries with screens and online social spaces.',
    reason: 'Recommended for digital wellbeing support.',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80',
    linkUrl: 'https://www.goodreads.com/book/show/40672036-digital-minimalism'
  });

  // 2. Songs
  if (stress > 50) {
    recs.push({
      id: 'song-1',
      title: 'Weightless',
      creator: 'Marconi Union',
      category: 'songs',
      description: 'An ambient track scientifically shown to reduce overall anxiety levels by 65%.',
      reason: `Recommended to soothe stress indicators (${stress}%)`,
      imageUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=400&q=80',
      linkUrl: 'https://www.youtube.com/watch?v=UfcAVejslrU'
    });
    recs.push({
      id: 'song-2',
      title: 'Strawberry Swing',
      creator: 'Coldplay',
      category: 'songs',
      description: 'A relaxing song with a steady, calming tempo perfect for an active break.',
      reason: 'Recommended for a peaceful mental interval.',
      imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=400&q=80',
      linkUrl: 'https://www.youtube.com/watch?v=h3pJZSTQqIg'
    });
  } else {
    recs.push({
      id: 'song-3',
      title: 'Lovely Day',
      creator: 'Bill Withers',
      category: 'songs',
      description: 'An upbeat, soul-warming classic designed to lift your emotional wellness.',
      reason: `Recommended to boost your Mood Score (${mood}%)`,
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
      linkUrl: 'https://www.youtube.com/watch?v=sYi7uEvEEmk'
    });
  }

  // 3. Movies
  if (stress > 50) {
    recs.push({
      id: 'movie-1',
      title: 'Amélie',
      creator: 'Jean-Pierre Jeunet',
      category: 'movies',
      description: 'A whimsical, lighthearted journey that instills immediate joy and calm.',
      reason: 'Recommended for light stress relief.',
      imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80',
      linkUrl: 'https://www.imdb.com/title/tt0211915/'
    });
  } else {
    recs.push({
      id: 'movie-2',
      title: 'Soul',
      creator: 'Pixar',
      category: 'movies',
      description: 'A beautiful animated story about finding purpose in the simple, quiet moments of life.',
      reason: 'Recommended to support healthy reflection.',
      imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
      linkUrl: 'https://www.imdb.com/title/tt2948356/'
    });
  }

  // 4. Podcasts
  recs.push({
    id: 'pod-1',
    title: 'The Mindful Kind',
    creator: 'Rachael Kable',
    category: 'podcasts',
    description: 'Bite-sized episodes sharing practical, realistic advice on incorporating mindfulness into a busy day.',
    reason: 'Recommended for convenient wellness guidance.',
    imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80',
    linkUrl: 'https://open.spotify.com/show/47n6K0PzV1lK9q3n8J1y3X'
  });
  if (summary.sleepHours < 7) {
    recs.push({
      id: 'pod-2',
      title: 'Sleep With Me',
      creator: 'Drew Ackerman',
      category: 'podcasts',
      description: 'Dull, boring stories designed to quiet an overactive mind and ease you gently into deep rest.',
      reason: `Recommended since your sleep duration is low (${summary.sleepHours} hrs)`,
      imageUrl: 'https://images.unsplash.com/photo-1520206183501-b80af970d040?auto=format&fit=crop&w=400&q=80',
      linkUrl: 'https://open.spotify.com/show/6asx12fPx4uwyljOLj77Cz'
    });
  }

  // 5. Meditation
  recs.push({
    id: 'med-1',
    title: '5-Minute Box Breathing Session',
    creator: 'MindTrace Coaches',
    category: 'meditation',
    description: 'Autonomic nervous system reset utilizing a 4-4-4-4 breathing cadence to suppress cortisol.',
    reason: `Recommended to balance your Stress Index (${stress}%)`,
    imageUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=400&q=80',
    linkUrl: 'https://www.youtube.com/watch?v=tEmt1FnA59k'
  });
  recs.push({
    id: 'med-2',
    title: 'Deep Body Scan',
    creator: 'MindTrace Coaches',
    category: 'meditation',
    description: 'A guided relaxation practice focusing on releasing localized tension from the forehead to the feet.',
    reason: 'Recommended to release physical tension.',
    imageUrl: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=400&q=80',
    linkUrl: 'https://www.youtube.com/watch?v=15q-yMcKu_4'
  });

  // 6. Productivity & Stress Relief Activities
  recs.push({
    id: 'prod-1',
    title: 'Pomodoro Screen-Off Break',
    creator: 'MindTrace Habits',
    category: 'productivity',
    description: 'Close your eyes and turn away from all light-emitting displays for 5 minutes after 25 minutes of focus.',
    reason: 'Recommended to lower eye strain indices.',
    imageUrl: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=400&q=80',
    linkUrl: 'https://en.wikipedia.org/wiki/Pomodoro_Technique'
  });
  recs.push({
    id: 'stress-1',
    title: 'Vagus Nerve Cold Water Splash',
    creator: 'MindTrace Habits',
    category: 'stress-relief',
    description: 'Splash cold water onto your face or hold an ice pack on your chest for 15 seconds to lower heart rate.',
    reason: `Recommended to decrease active anxiety triggers (${stress}%)`,
    imageUrl: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=400&q=80',
    linkUrl: 'https://www.psychologytoday.com/us/blog/the-athletes-way/201905/vagus-nerve-stimulation-without-implants'
  });

  return recs;
}
