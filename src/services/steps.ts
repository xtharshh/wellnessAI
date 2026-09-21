import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';

// ─── Wearable step service (phone + watch-synced steps) ────────────
// iOS: Core Motion aggregates iPhone + paired Apple Watch steps; the 24h
// query returns real history. Android: hardware sensor while foregrounded;
// background aggregation belongs to Health Connect (see settings note).
// Works in Expo Go — no custom native code required.

const dayKey = () => `mindtrace_steps_${new Date().toISOString().slice(0, 10)}`;

let available: boolean | null = null;
let granted: boolean | null = null;
let todaySteps = 0;
let watcher: { remove: () => void } | null = null;
let started = false;

async function readBucket(): Promise<number> {
  try {
    const v = await AsyncStorage.getItem(dayKey());
    return v ? parseInt(v, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

async function writeBucket(n: number) {
  try {
    await AsyncStorage.setItem(dayKey(), String(n));
  } catch {}
}

export interface StepStatus {
  available: boolean;
  granted: boolean;
  todaySteps: number;
  detail: string;
}

export async function getStepStatus(): Promise<StepStatus> {
  try {
    available = await Pedometer.isAvailableAsync();
  } catch {
    available = false;
  }
  if (!available) {
    return { available: false, granted: false, todaySteps: 0, detail: 'No motion sensor on this device.' };
  }
  try {
    const perm = await Pedometer.getPermissionsAsync();
    granted = perm.granted;
  } catch {
    granted = false;
  }
  todaySteps = await readBucket();
  return {
    available: true,
    granted: !!granted,
    todaySteps,
    detail: granted
      ? `${todaySteps.toLocaleString()} steps today`
      : 'Motion permission needed to count steps.',
  };
}

export async function requestStepPermission(): Promise<boolean> {
  try {
    const res = await Pedometer.requestPermissionsAsync();
    granted = res.granted;
    if (granted) await ensureStepWatcher();
    return !!granted;
  } catch {
    return false;
  }
}

/** Start once per session: iOS backfills today, all platforms watch live. */
export async function ensureStepWatcher(): Promise<void> {
  if (started || Platform.OS === 'web') return;
  started = true;
  try {
    available = await Pedometer.isAvailableAsync();
    if (!available) return;
    const perm = await Pedometer.getPermissionsAsync();
    granted = perm.granted;
    todaySteps = await readBucket();

    if (Platform.OS === 'ios') {
      try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const res = await Pedometer.getStepCountAsync(start, new Date());
        if (res && typeof res.steps === 'number' && res.steps > todaySteps) {
          todaySteps = res.steps;
          await writeBucket(todaySteps);
        }
      } catch {}
    }

    if (!watcher) {
      let last = 0;
      let first = true;
      watcher = Pedometer.watchStepCount((r) => {
        // watchStepCount reports cumulative steps since subscription on most
        // devices — accumulate deltas to stay correct either way.
        if (first) {
          first = false;
          last = r.steps;
          return;
        }
        const delta = r.steps - last;
        last = r.steps;
        if (delta > 0 && delta < 1000) {
          todaySteps += delta;
          writeBucket(todaySteps);
        }
      });
    }
  } catch {}
}

/** Synchronous read for the telemetry engine (updated by the watcher). */
export function getCachedSteps(): number {
  return todaySteps;
}

export function stopStepWatcher() {
  try {
    watcher?.remove();
  } catch {}
  watcher = null;
  started = false;
}
