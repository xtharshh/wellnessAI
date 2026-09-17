import { Exercise } from '@/src/types/wellness';
import { apiFetch } from '@/src/services/apiClient';

export async function getExercises(userId: string): Promise<Exercise[]> {
  void userId;
  try {
    const data = await apiFetch<{ exercises: Exercise[] }>('/api/exercises');
    return data.exercises || [];
  } catch (e) {
    console.error('Failed to fetch exercises:', e);
    return [];
  }
}

export async function createExercise(
  userId: string,
  exercise: Omit<Exercise, 'id' | 'createdAt' | 'custom'> & { custom?: boolean }
): Promise<Exercise> {
  void userId;
  const data = await apiFetch<{ exercises: Exercise[] }>('/api/exercises', {
    method: 'POST',
    body: exercise,
  });
  if (!data.exercises || data.exercises.length === 0) {
    throw new Error('Failed to create exercise.');
  }
  return data.exercises[0];
}

export async function updateExercise(
  userId: string,
  id: string,
  exercise: Partial<Omit<Exercise, 'id' | 'createdAt'>>
): Promise<Exercise> {
  void userId;
  const data = await apiFetch<{ exercise: Exercise }>(`/api/exercises/${id}`, {
    method: 'PATCH',
    body: exercise,
  });
  return data.exercise;
}

export async function deleteExercise(userId: string, id: string): Promise<void> {
  void userId;
  await apiFetch(`/api/exercises/${id}`, { method: 'DELETE' });
}

export async function saveAISuggestedExercises(
  userId: string,
  recommendations: { body: string; category: string }[]
): Promise<void> {
  const toSave: { name: string; duration: string; steps: string[]; explanation: string; category: string }[] = [];

  for (const rec of recommendations) {
    try {
      const details = JSON.parse(rec.body);
      if (details.exercise) {
        toSave.push({
          name: details.exercise.name,
          duration: details.exercise.duration,
          steps: details.exercise.steps,
          explanation: details.exercise.explanation,
          category: rec.category,
        });
      }
    } catch {
      // plain-text recommendation, skip
    }
  }

  if (toSave.length === 0) return;

  try {
    await apiFetch('/api/exercises', { method: 'POST', body: { items: toSave } });
  } catch (e) {
    console.error('Failed to save AI-suggested exercises:', e);
  }
}

export async function setupPerfectPlanExercises(userId: string): Promise<void> {
  const planExercises = [
    {
      name: 'Mindful Posture Check',
      duration: '1 min',
      steps: [
        'Sit tall at the front edge of your seat.',
        'Place your feet flat on the floor, directly under your knees.',
        'Lift your chest, relax your shoulders, and tuck your chin slightly.',
        'Take 3 slow, deep diaphragmatic breaths.'
      ],
      explanation: 'Re-aligns your spine after prolonged screen time, reducing physical fatigue and improving respiratory flow.',
      category: 'general',
      custom: true
    },
    {
      name: 'Dynamic Shoulder Roll & Stretch',
      duration: '2 mins',
      steps: [
        'Stand up straight with feet shoulder-width apart.',
        'Roll your shoulders backward in a slow circle 10 times.',
        'Interlace your fingers behind your back and pull your chest forward.',
        'Reach your arms over your head and stretch to the left, then to the right.'
      ],
      explanation: 'Relieves typing-related shoulder tightness and increases localized blood circulation to counteract sedentary intervals.',
      category: 'activity',
      custom: true
    },
    {
      name: 'Cold Reset',
      duration: '2 min',
      steps: [
        'Splash cold water on your face and wrists.',
        'Hold a cold object (ice cube, cold glass) for 30 seconds.',
        'Take 5 slow breaths while feeling the cold sensation.'
      ],
      explanation: 'Cold exposure activates the vagus nerve and instantly reduces stress hormones, helping to reset your mental state during overwhelming moments.',
      category: 'activity',
      custom: true
    }
  ];

  try {
    await apiFetch('/api/exercises', { method: 'POST', body: { items: planExercises } });
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Failed to configure perfect plan.');
  }
}
