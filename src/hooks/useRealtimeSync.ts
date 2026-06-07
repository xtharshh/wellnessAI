import { useEffect } from 'react';

import { startAnalyticsSimulation, stopAnalyticsSimulation } from '@/src/services/simulator';
import { useAuthStore } from '@/src/stores/authStore';

export function useRealtimeSync() {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      stopAnalyticsSimulation();
      return;
    }

    // Start simulated background analytics ingestion
    startAnalyticsSimulation(user.id);

    return () => {
      stopAnalyticsSimulation();
    };
  }, [user]);
}
