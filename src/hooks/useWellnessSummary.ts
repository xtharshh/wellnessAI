import { useQuery } from '@tanstack/react-query';

import { getMetricSeries, getSnapshots, getWellnessSummary } from '@/src/services/wellness';
import { useAuthStore } from '@/src/stores/authStore';

export function useWellnessSummary() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['wellness-summary', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const [summary, snapshots] = await Promise.all([
        getWellnessSummary(user.id),
        getSnapshots(user.id, 14),
      ]);
      return {
        summary,
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
