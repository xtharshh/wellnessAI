import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getJournals, createJournalEntry, deleteJournalEntry, JournalEntry } from '@/src/services/journals';
import { useAuthStore } from '@/src/stores/authStore';

export function useJournals() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['journals', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      return getJournals(user.id);
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { content: string; moodScore: number; moodTag: string }) => {
      if (!user) throw new Error('Not authenticated');
      return createJournalEntry(user.id, payload.content, payload.moodScore, payload.moodTag);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals', user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      return deleteJournalEntry(user.id, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals', user?.id] });
    },
  });

  return {
    ...query,
    createEntry: createMutation,
    deleteEntry: deleteMutation,
  };
}
