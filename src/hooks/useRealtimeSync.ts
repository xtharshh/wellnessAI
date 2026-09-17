import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { stopAnalyticsSimulation } from '@/src/services/simulator';
import { useAuthStore } from '@/src/stores/authStore';

// Polling sync (Neon has no realtime channel): refetch dashboard data every
// 60s while signed in and the app is foregrounded.
export function useRealtimeSync() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) {
      stopAnalyticsSimulation();
      return;
    }
    const sync = () => {
      queryClient.invalidateQueries({ queryKey: ['wellness-summary', user.id] });
      queryClient.invalidateQueries({ queryKey: ['wellness-trends', user.id] });
      queryClient.invalidateQueries({ queryKey: ['recommendations', user.id] });
    };
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') sync();
    }, 60000);
    return () => {
      clearInterval(interval);
      stopAnalyticsSimulation();
    };
  }, [user, queryClient]);
}
