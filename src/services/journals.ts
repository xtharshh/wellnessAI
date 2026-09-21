import { apiFetch } from '@/src/services/apiClient';

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  moodScore: number;
  moodTag: string;
  createdAt: string;
}

export async function getJournals(userId: string): Promise<JournalEntry[]> {
  try {
    const data = await apiFetch<{ journals: Omit<JournalEntry, 'userId'>[] }>('/api/journals');
    return (data.journals || []).map((row) => ({ ...row, userId }));
  } catch (e) {
    console.error('Failed to fetch journal entries:', e);
    return [];
  }
}

export async function createJournalEntry(
  userId: string,
  content: string,
  moodScore: number,
  moodTag: string
): Promise<JournalEntry | null> {
  const data = await apiFetch<{ journal: Omit<JournalEntry, 'userId'> }>('/api/journals', {
    method: 'POST',
    body: { content, moodScore, moodTag },
  });
  return { ...data.journal, userId };
}

export async function deleteJournalEntry(userId: string, id: string): Promise<void> {
  void userId;
  await apiFetch(`/api/journals/${id}`, { method: 'DELETE' });
}
