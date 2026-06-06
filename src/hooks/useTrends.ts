import { useQuery } from '@tanstack/react-query';

import { getMetricSeries, getSnapshots } from '@/src/services/wellness';
import { useAuthStore } from '@/src/stores/authStore';

export type TrendRange = 7 | 15 | 30 | 90;

export function useTrends(range: TrendRange) {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['wellness-trends', user?.id, range],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const snapshots = await getSnapshots(user.id, range);
      return {
        mood: getMetricSeries(snapshots, 'moodScore'),
        sleep: getMetricSeries(snapshots, 'sleepHours'),
        activity: getMetricSeries(snapshots, 'activityLevel'),
        stress: getMetricSeries(snapshots, 'stressIndex'),
        labels: snapshots.map((snapshot) =>
          new Date(snapshot.recordedAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          }),
        ),
      };
    },
    enabled: !!user,
  });
}
