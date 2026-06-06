import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  completeRecommendation,
  dismissRecommendation,
  generateRecommendations,
  getRecommendations,
} from '@/src/services/recommendations';
import { useAuthStore } from '@/src/stores/authStore';

export function useRecommendations() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['recommendations', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const existing = await getRecommendations(user.id);
      if (existing.length) return existing;
      return generateRecommendations(user.id);
    },
    enabled: !!user,
  });

  const regenerate = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      return generateRecommendations(user.id, true);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recommendations', user?.id] }),
  });

  const dismiss = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      await dismissRecommendation(user.id, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recommendations', user?.id] }),
  });

  const complete = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      await completeRecommendation(user.id, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recommendations', user?.id] }),
  });

  return { ...query, regenerate, dismiss, complete };
}
