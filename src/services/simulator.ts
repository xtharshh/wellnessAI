import { initTelemetry, stopTelemetry, getLiveMetrics } from '@/src/services/realAnalytics';
import { apiFetch } from '@/src/services/apiClient';

let simulationInterval: any = null;

export function startAnalyticsSimulation(userId: string) {
  void userId;
  if (simulationInterval) {
    clearInterval(simulationInterval);
  }

  console.log('[simulator] Starting real-time mobile analytics sync');

  try {
    initTelemetry();
  } catch (err) {
    console.error('[simulator] Failed to initialize telemetry:', err);
    return;
  }

  // Ingest REAL analytics measurements every 60 seconds (only when sufficient signal)
  simulationInterval = setInterval(async () => {
    try {
      const metrics = await getLiveMetrics();

      if (!metrics.hasSufficientData) return;
      if (metrics.moodScore === null || metrics.stressIndex === null) return;
      if (metrics.sleepHours === null || metrics.activityLevel === null) return;

      await apiFetch('/api/snapshots', {
        method: 'POST',
        body: {
          moodScore: metrics.moodScore,
          sleepHours: metrics.sleepHours,
          activityLevel: metrics.activityLevel,
          stressIndex: metrics.stressIndex,
          metadata: { source: 'real_device_sensors', telemetry: metrics.rawSignals },
        },
      });
      console.log('[simulator] Synced real device analytics snapshot');
    } catch (err) {
      console.error('Error during analytics sync:', err);
    }
  }, 60000);
}

export function stopAnalyticsSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log('Stopped real-time mobile analytics sync.');
  }
  stopTelemetry();
}
