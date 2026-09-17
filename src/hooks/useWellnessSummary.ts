import { useQuery } from '@tanstack/react-query';

import { getMetricSeries, getSnapshots, getWellnessSummary } from '@/src/services/wellness';
import { getLiveMetrics } from '@/src/services/realAnalytics';
import { useAuthStore } from '@/src/stores/authStore';

export function useWellnessSummary() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['wellness-summary', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const [summary, snapshots, liveMetrics] = await Promise.all([
        getWellnessSummary(user.id),
        getSnapshots(user.id, 14),
        getLiveMetrics(),
      ]);
      return {
        summary,
        hasData: !!summary && snapshots.length > 0,
        liveMetrics,
        series: {
          mood: getMetricSeries(snapshots, 'moodScore'),
          sleep: getMetricSeries(snapshots, 'sleepHours'),
          activity: getMetricSeries(snapshots, 'activityLevel'),
          stress: getMetricSeries(snapshots, 'stressIndex'),
        },
      };
    },
    enabled: !!user,
  });
}
