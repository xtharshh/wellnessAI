import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/src/stores/authStore';
import { useWellnessSummary } from '@/src/hooks/useWellnessSummary';
import {
  applyFeedback,
  detectPatterns,
  getInsightFeedback,
  postInsightFeedback,
  type FeedbackAction,
  type PatternInsight,
} from '@/src/services/whyFeel';

export function useWhyFeeling() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { data: wellness } = useWellnessSummary();

  const feedbackQuery = useQuery({
    queryKey: ['insight-feedback', user?.id],
    queryFn: () => {
      if (!user) throw new Error('Not authenticated');
      return getInsightFeedback(user.id);
    },
    enabled: !!user,
  });

  const snapshotsQuery = useQuery({
    queryKey: ['why-snapshots', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { getSnapshots } = await import('@/src/services/wellness');
      return getSnapshots(user.id, 30);
    },
    enabled: !!user,
  });

  const live = wellness?.liveMetrics?.behaviorAnalysis ?? null;
  const raw: PatternInsight[] = snapshotsQuery.data
    ? detectPatterns(snapshotsQuery.data, {
        lateNightUsageDetected: live?.lateNightUsageDetected,
        screenTimeMinutes: live?.screenTimeMinutes,
      })
    : [];
  const insights = applyFeedback(raw, feedbackQuery.data ?? []);

  const send = useMutation({
    mutationFn: async (input: { key: string; type: string; action: FeedbackAction; note?: string }) => {
      if (!user) throw new Error('Not authenticated');
      await postInsightFeedback(user.id, input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insight-feedback', user?.id] }),
  });

  return {
    insights,
    isLoading: snapshotsQuery.isLoading || feedbackQuery.isLoading,
    hasHistory: (snapshotsQuery.data?.length ?? 0) >= 4,
    feedback: send.mutate,
    feedbackPending: send.isPending,
  };
}
