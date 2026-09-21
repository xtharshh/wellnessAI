import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { requireNativeModule } from 'expo';

export interface WellbeingMetrics {
  screenTimeMinutes: number;
  unlockCount: number;
  sleepHours: number;
}

const EMPTY: WellbeingMetrics = {
  screenTimeMinutes: 0,
  unlockCount: 0,
  sleepHours: 0,
};

// Lazy-loaded: never require native code at import time, so a missing
// module (Expo Go / web / iOS / stale dev build) can't break the JS bundle.
let cachedModule: any | null | undefined = undefined;

function getModule(): any | null {
  if (cachedModule !== undefined) return cachedModule;
  cachedModule = null;

  if (Platform.OS !== 'android') return cachedModule;

  // Expo Go (StoreClient) cannot load custom native code — stay silent here,
  // callers already render "no live signal" empty states in this case.
  try {
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      return cachedModule;
    }
  } catch {
    // If constants are unavailable, fall through and try the require.
  }

  try {
    cachedModule = requireNativeModule('AndroidWellbeing');
  } catch {
    cachedModule = null;
    if (__DEV__) {
      console.warn(
        '[AndroidWellbeing] Native module not found. ' +
          'Rebuild your dev client with `npx expo run:android` (Expo Go cannot load custom native code).'
      );
    }
  }
  return cachedModule;
}

/** True only when the native module is loaded AND the OS permission is granted. */
export function isModuleAvailable(): boolean {
  return getModule() !== null;
}

export function hasUsageStatsPermission(): boolean {
  const mod = getModule();
  if (!mod) return false;
  try {
    return mod.hasUsageStatsPermission();
  } catch {
    return false;
  }
}

export function requestUsageStatsPermission(): void {
  const mod = getModule();
  if (!mod) return;
  try {
    mod.requestUsageStatsPermission();
  } catch {}
}

export function getSystemWellbeingMetrics(): WellbeingMetrics {
  const mod = getModule();
  if (!mod) return { ...EMPTY };
  try {
    const raw = mod.getSystemWellbeingMetrics();
    return {
      screenTimeMinutes: Number(raw?.screenTimeMinutes) || 0,
      unlockCount: Number(raw?.unlockCount) || 0,
      sleepHours: Number(raw?.sleepHours) || 0,
    };
  } catch {
    return { ...EMPTY };
  }
}
