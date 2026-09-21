import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/src/stores/authStore';
import { getGardenStats } from '@/src/services/garden';

export function useGarden() {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ['garden', user?.id],
    queryFn: () => {
      if (!user) throw new Error('Not authenticated');
      return getGardenStats(user.id);
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
