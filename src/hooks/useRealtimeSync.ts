import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { startAnalyticsSimulation, stopAnalyticsSimulation } from '@/src/services/simulator';
import { supabase } from '@/src/services/supabase';
import { useAuthStore } from '@/src/stores/authStore';

export function useRealtimeSync() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) {
      stopAnalyticsSimulation();
      return;
    }

    // 1. Start simulated background analytics ingestion
    startAnalyticsSimulation(user.id);

    // 2. Subscribe to Supabase Realtime changes
    console.log('Initializing Supabase Realtime subscriptions for user:', user.id);

    const snapshotsChannel = supabase
      .channel('realtime-snapshots')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wellness_snapshots',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Realtime wellness snapshot change received:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['wellness-summary', user.id] });
          queryClient.invalidateQueries({ queryKey: ['wellness-trends', user.id] });
        }
      )
      .subscribe();

    const recsChannel = supabase
      .channel('realtime-recs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recommendations',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Realtime recommendations change received:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['recommendations', user.id] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscriptions...');
      supabase.removeChannel(snapshotsChannel);
      supabase.removeChannel(recsChannel);
      stopAnalyticsSimulation();
    };
  }, [user, queryClient]);
}
