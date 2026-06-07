import { supabase } from '@/src/services/supabase';

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  moodScore: number;
  moodTag: string;
  createdAt: string;
}

export async function getJournals(userId: string): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch journal entries:', error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    content: row.content,
    moodScore: row.mood_score,
    moodTag: row.mood_tag,
    createdAt: row.created_at,
  }));
}

export async function createJournalEntry(
  userId: string,
  content: string,
  moodScore: number,
  moodTag: string
): Promise<JournalEntry | null> {
  const { data, error } = await supabase
    .from('journals')
    .insert([
      {
        user_id: userId,
        content,
        mood_score: moodScore,
        mood_tag: moodTag,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Failed to create journal entry:', error);
    throw new Error(error.message);
  }

  return {
    id: data.id,
    userId: data.user_id,
    content: data.content,
    moodScore: data.mood_score,
    moodTag: data.mood_tag,
    createdAt: data.created_at,
  };
}

export async function deleteJournalEntry(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('journals')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to delete journal entry:', error);
    throw new Error(error.message);
  }
}
