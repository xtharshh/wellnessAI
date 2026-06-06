import { initTelemetry, stopTelemetry, getLiveMetrics } from '@/src/services/realAnalytics';
import { supabase } from '@/src/services/supabase';

let simulationInterval: any = null;

export function startAnalyticsSimulation(userId: string) {
  if (simulationInterval) {
    clearInterval(simulationInterval);
  }

  console.log('Starting real-time mobile analytics sync for user:', userId);

  // Initialize event listeners / accelerometer
  initTelemetry();

  // Ingest real analytics measurements every 15 seconds
  simulationInterval = setInterval(async () => {
    const metrics = await getLiveMetrics();

    const dbRow = {
      user_id: userId,
      recorded_at: new Date().toISOString(),
      mood_score: metrics.moodScore,
      sleep_hours: metrics.sleepHours,
      activity_level: metrics.activityLevel,
      stress_index: metrics.stressIndex,
      risk_level: metrics.riskLevel,
      metadata: {
        source: 'real_device_sensors',
        telemetry: metrics.rawSignals,
      },
    };

    const { data, error } = await supabase
      .from('wellness_snapshots')
      .insert([dbRow])
      .select()
      .single();

    if (error) {
      console.error('Failed to sync real device analytics snapshot:', error);
    } else {
      console.log('Successfully synced real device analytics snapshot:', data.id);
    }
  }, 15000);
}

export function stopAnalyticsSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log('Stopped real-time mobile analytics sync.');
  }
  stopTelemetry();
}
