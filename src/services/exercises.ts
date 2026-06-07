import { supabase } from '@/src/services/supabase';
import { Exercise, Recommendation } from '@/src/types/wellness';

function mapDbRowToExercise(row: any): Exercise {
  return {
    id: row.id,
    name: row.name,
    duration: row.duration,
    steps: row.steps || [],
    explanation: row.explanation,
    category: row.category,
    custom: row.custom,
    createdAt: row.created_at,
  };
}

export async function getExercises(userId: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch exercises:', error);
    return [];
  }

  return (data || []).map(mapDbRowToExercise);
}

export async function createExercise(
  userId: string,
  exercise: Omit<Exercise, 'id' | 'createdAt' | 'custom'> & { custom?: boolean }
): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .insert({
      user_id: userId,
      name: exercise.name,
      duration: exercise.duration,
      steps: exercise.steps,
      explanation: exercise.explanation,
      category: exercise.category,
      custom: exercise.custom ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create exercise: ${error.message}`);
  }

  return mapDbRowToExercise(data);
}

export async function updateExercise(
  userId: string,
  id: string,
  exercise: Partial<Omit<Exercise, 'id' | 'createdAt'>>
): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .update({
      name: exercise.name,
      duration: exercise.duration,
      steps: exercise.steps,
      explanation: exercise.explanation,
      category: exercise.category,
      custom: exercise.custom,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update exercise: ${error.message}`);
  }

  return mapDbRowToExercise(data);
}

export async function deleteExercise(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete exercise: ${error.message}`);
  }
}

export async function saveAISuggestedExercises(userId: string, recommendations: Recommendation[]): Promise<void> {
  const exercisesToSave: Omit<Exercise, 'id' | 'createdAt' | 'custom'>[] = [];
  
  for (const rec of recommendations) {
    try {
      const details = JSON.parse(rec.body);
      if (details.exercise) {
        exercisesToSave.push({
          name: details.exercise.name,
          duration: details.exercise.duration,
          steps: details.exercise.steps,
          explanation: details.exercise.explanation,
          category: rec.category,
        });
      }
    } catch {
      // standard plain text recommendation, skip
    }
  }

  if (exercisesToSave.length === 0) return;

  const existing = await getExercises(userId);
  const existingNames = new Set(existing.map((e) => e.name.toLowerCase().trim()));

  const newExercises = exercisesToSave.filter((e) => !existingNames.has(e.name.toLowerCase().trim()));

  if (newExercises.length === 0) return;

  const dbRows = newExercises.map((e) => ({
    user_id: userId,
    name: e.name,
    duration: e.duration,
    steps: e.steps,
    explanation: e.explanation,
    category: e.category,
    custom: false,
  }));

  const { error } = await supabase.from('exercises').insert(dbRows);
  if (error) {
    console.error('Failed to save AI-suggested exercises:', error);
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

  const existing = await getExercises(userId);
  const existingNames = new Set(existing.map((e) => e.name.toLowerCase().trim()));

  const newExercises = planExercises.filter((e) => !existingNames.has(e.name.toLowerCase().trim()));

  if (newExercises.length === 0) return;

  const dbRows = newExercises.map((e) => ({
    user_id: userId,
    name: e.name,
    duration: e.duration,
    steps: e.steps,
    explanation: e.explanation,
    category: e.category,
    custom: e.custom,
  }));

  const { error } = await supabase.from('exercises').insert(dbRows);
  if (error) {
    throw new Error(`Failed to configure perfect plan: ${error.message}`);
  }
}
