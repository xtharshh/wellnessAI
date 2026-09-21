import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';

// ─── Watch bridge via Health Connect (Android) ─────────────────────
// Galaxy / Pixel / Wear OS watches sync into Health Connect; we read
// steps, sleep, heart rate and exercise from there. iOS watches sync via
// the iPhone — covered by the pedometer path in steps.ts.
// Everything is lazy-loaded: Expo Go / stale builds get a clean
// "unavailable" instead of a redbox.

const CONNECTED_KEY = 'mindtrace_hc_connected';
const LAST_SYNC_KEY = 'mindtrace_hc_last_sync';
const LAST_DATA_KEY = 'mindtrace_hc_last_data';
const SYNC_TTL_MS = 10 * 60 * 1000;

const PERMS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'ExerciseSession' },
];

const NEEDED = new Set(['Steps', 'SleepSession', 'HeartRate', 'ExerciseSession']);

let hc: any | null | undefined = undefined;

async function loadHC(): Promise<any | null> {
  if (hc !== undefined) return hc;
  hc = null;
  if (Platform.OS !== 'android') return hc;
  try {
    const mod = await import('react-native-health-connect');
    hc = mod;
  } catch {
    hc = null;
  }
  return hc;
}

export type WatchState =
  | 'unsupported' // not Android
  | 'missing-native' // Expo Go / stale dev build
  | 'unavailable' // device can't run Health Connect
  | 'needs-install' // Health Connect app/update required
  | 'not-connected' // available, permission not granted yet
  | 'connected';

export interface WatchData {
  steps: number;
  sleepHours: number | null;
  avgHr: number | null;
  activeMinutes: number;
  syncedAt: string;
}

export async function getWatchState(): Promise<WatchState> {
  if (Platform.OS !== 'android') return 'unsupported';
  const mod = await loadHC();
  if (!mod) return 'missing-native';
  try {
    const status: number = await mod.getSdkStatus();
    if (status === 3) {
      try {
        const granted: any[] = await mod.getGrantedPermissions();
        const has = new Set(
          (granted || []).map((g: any) => g?.recordType).filter(Boolean)
        );
        const allGranted = [...NEEDED].every((r) => has.has(r));
        if (allGranted) return 'connected';
      } catch {}
      return 'not-connected';
    }
    if (status === 2) return 'needs-install';
    return 'unavailable';
  } catch {
    return 'unavailable';
  }
}

async function readAggregates(mod: any): Promise<Omit<WatchData, 'syncedAt'>> {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const dayAgo = new Date(now.getTime() - 24 * 3600 * 1000);
  const between = (start: Date) => ({
    operator: 'between',
    startTime: start.toISOString(),
    endTime: now.toISOString(),
  });

  let steps = 0;
  let sleepHours: number | null = null;
  let avgHr: number | null = null;
  let activeMinutes = 0;

  try {
    const s = await mod.aggregateRecord({ recordType: 'Steps', timeRangeFilter: between(midnight) });
    if (typeof s?.COUNT_TOTAL === 'number') steps = Math.max(0, Math.round(s.COUNT_TOTAL));
  } catch {}
  try {
    const sl = await mod.aggregateRecord({ recordType: 'SleepSession', timeRangeFilter: between(dayAgo) });
    if (typeof sl?.SLEEP_DURATION_TOTAL === 'number') {
      const hrs = sl.SLEEP_DURATION_TOTAL / 3600;
      if (hrs >= 0.5 && hrs <= 16) sleepHours = Number(hrs.toFixed(1));
    }
  } catch {}
  try {
    const hr = await mod.aggregateRecord({ recordType: 'HeartRate', timeRangeFilter: between(dayAgo) });
    if (typeof hr?.BPM_AVG === 'number' && hr.BPM_AVG >= 30 && hr.BPM_AVG <= 220) {
      avgHr = Math.round(hr.BPM_AVG);
    }
  } catch {}
  try {
    const ex = await mod.aggregateRecord({ recordType: 'ExerciseSession', timeRangeFilter: between(midnight) });
    const secs = ex?.EXERCISE_DURATION_TOTAL?.inSeconds;
    if (typeof secs === 'number') activeMinutes = Math.max(0, Math.round(secs / 60));
  } catch {}

  return { steps, sleepHours, avgHr, activeMinutes };
}

/** Connect flow: initialize → request → verify → initial sync. */
export async function connectWatch(): Promise<{ ok: boolean; message: string }> {
  if (Platform.OS !== 'android') {
    return { ok: false, message: 'Watch sync via Health Connect is Android-only. On iPhone, your Apple Watch syncs through the phone automatically.' };
  }
  const mod = await loadHC();
  if (!mod) {
    return {
      ok: false,
      message: 'Health Connect bridge is missing from this build (Expo Go). Rebuild with `npx expo run:android` to enable watch sync.',
    };
  }
  try {
    const status: number = await mod.getSdkStatus();
    if (status === 2) {
      return { ok: false, message: 'Install or update the Health Connect app first, then try again.', };
    }
    if (status !== 3) {
      return { ok: false, message: 'This device cannot run Health Connect.' };
    }
    const okInit: boolean = await mod.initialize();
    if (!okInit) return { ok: false, message: 'Could not start Health Connect. Please try again.' };
    const granted: any[] = await mod.requestPermission(PERMS);
    const has = new Set((granted || []).map((g: any) => g?.recordType).filter(Boolean));
    if (![...NEEDED].every((r) => has.has(r))) {
      return { ok: false, message: 'Grant all four permissions (steps, sleep, heart rate, exercise) to connect your watch.' };
    }
    const data = await readAggregates(mod);
    await AsyncStorage.setItem(CONNECTED_KEY, 'true');
    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    await AsyncStorage.setItem(LAST_DATA_KEY, JSON.stringify(data));
    return { ok: true, message: `Watch connected — ${data.steps.toLocaleString()} steps today.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Watch connection failed.' };
  }
}

/** Cached sync (10-min TTL unless forced). Returns null when unusable. */
export async function syncWatchData(force = false): Promise<WatchData | null> {
  if (Platform.OS !== 'android') return null;
  const mod = await loadHC();
  if (!mod) return null;
  try {
    const flag = await AsyncStorage.getItem(CONNECTED_KEY);
    if (flag !== 'true') return null;
    if (!force) {
      const last = await AsyncStorage.getItem(LAST_SYNC_KEY);
      if (last && Date.now() - parseInt(last, 10) < SYNC_TTL_MS) {
        const cached = await AsyncStorage.getItem(LAST_DATA_KEY);
        if (cached) return { ...JSON.parse(cached), syncedAt: new Date(parseInt(last, 10)).toISOString() };
      }
    }
    const data = await readAggregates(mod);
    const syncedAt = new Date().toISOString();
    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    await AsyncStorage.setItem(LAST_DATA_KEY, JSON.stringify(data));
    return { ...data, syncedAt };
  } catch {
    return null;
  }
}

export async function disconnectWatch(): Promise<void> {
  try {
    await AsyncStorage.setItem(CONNECTED_KEY, 'false');
  } catch {}
}

export async function openWatchSettings(): Promise<void> {
  const mod = await loadHC();
  if (!mod) return;
  try {
    mod.openHealthConnectSettings();
  } catch {}
}

export async function openWatchStore(): Promise<void> {
  try {
    await Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata');
  } catch {}
}
