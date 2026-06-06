import { requireNativeModule } from 'expo';
import { Platform } from 'react-native';

export interface WellbeingMetrics {
  screenTimeMinutes: number;
  unlockCount: number;
  sleepHours: number;
}

let AndroidWellbeing: any = null;

if (Platform.OS === 'android') {
  try {
    AndroidWellbeing = requireNativeModule('AndroidWellbeing');
  } catch (e) {
    console.warn('AndroidWellbeing native module is not available. Ensure you have run expo prebuild.');
  }
}

export function hasUsageStatsPermission(): boolean {
  if (Platform.OS !== 'android' || !AndroidWellbeing) return false;
  try {
    return AndroidWellbeing.hasUsageStatsPermission();
  } catch {
    return false;
  }
}

export function requestUsageStatsPermission(): void {
  if (Platform.OS !== 'android' || !AndroidWellbeing) return;
  try {
    AndroidWellbeing.requestUsageStatsPermission();
  } catch {}
}

export function getSystemWellbeingMetrics(): WellbeingMetrics {
  if (Platform.OS !== 'android' || !AndroidWellbeing) {
    return {
      screenTimeMinutes: 0,
      unlockCount: 0,
      sleepHours: 0,
    };
  }
  try {
    return AndroidWellbeing.getSystemWellbeingMetrics();
  } catch {
    return {
      screenTimeMinutes: 0,
      unlockCount: 0,
      sleepHours: 0,
    };
  }
}
