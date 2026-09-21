import AsyncStorage from '@react-native-async-storage/async-storage';
import { Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';

import {
  hasUsageStatsPermission,
  getSystemWellbeingMetrics,
} from '@/modules/android-wellbeing';
import { ensureStepWatcher, getCachedSteps } from '@/src/services/steps';
import { syncWatchData } from '@/src/services/healthconnect';

// ─── Real telemetry state (session-only, never seeded) ───
let totalKeypresses = 0;
let backspaces = 0;
let lastKeypressTime = 0;
let keypressIntervalSum = 0;
let keypressIntervalCount = 0;

let totalClicks = 0;
let totalScrolls = 0;
let mouseMoves = 0;

let accelerometerSubscription: any = null;
let acceleration = { x: 0, y: 0, z: 0 };
let motionSampleCount = 0;

const INTERACTION_KEY = 'mindtrace_last_interaction';
const SLEEP_LOG_KEY = 'mindtrace_sleep_duration';
const SESSION_START_KEY = 'mindtrace_session_start';

export function trackInteraction() {
  totalClicks++;
  saveLastInteraction();
}

export function trackKeyPress(key: string) {
  totalKeypresses++;
  if (key === 'Backspace') {
    backspaces++;
  }
  const now = Date.now();
  if (lastKeypressTime > 0) {
    const diff = now - lastKeypressTime;
    if (diff < 2000) {
      keypressIntervalSum += diff;
      keypressIntervalCount++;
    }
  }
  lastKeypressTime = now;
  saveLastInteraction();
}

export function trackScroll() {
  totalScrolls++;
  saveLastInteraction();
}

async function saveLastInteraction() {
  const now = Date.now();
  try {
    const lastStr = await AsyncStorage.getItem(INTERACTION_KEY);
    if (lastStr) {
      const last = parseInt(lastStr, 10);
      const gapHours = (now - last) / (1000 * 60 * 60);
      // Only record sleep windows from REAL inactivity gaps (5-12h)
      if (gapHours >= 5 && gapHours <= 12) {
        await AsyncStorage.setItem(SLEEP_LOG_KEY, gapHours.toFixed(1));
      }
    }
    await AsyncStorage.setItem(INTERACTION_KEY, now.toString());
  } catch {}
}

export function initTelemetry() {
  if (Platform.OS !== 'web') {
    // Wearable/phone steps (pedometer incl. watch-synced steps on iOS).
    ensureStepWatcher().catch(() => {});
  }
  if (!accelerometerSubscription && Platform.OS !== 'web') {
    try {
      Accelerometer.isAvailableAsync()
        .then((available) => {
          if (available) {
            try {
              Accelerometer.setUpdateInterval(1000);
              accelerometerSubscription = Accelerometer.addListener((data) => {
                acceleration = { x: data.x, y: data.y, z: data.z };
                motionSampleCount++;
              });
            } catch (err) {
              console.warn('[telemetry] accelerometer listener failed:', err);
            }
          }
        })
        .catch(() => {});
    } catch {}
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Guard against double-registration
    const w = window as any;
    if (w.__mindtrace_listeners) return;
    w.__mindtrace_listeners = true;

    window.addEventListener('keydown', (e) => trackKeyPress(e.key));
    window.addEventListener('click', () => trackInteraction());
    window.addEventListener('scroll', () => trackScroll(), { passive: true });
    window.addEventListener('mousemove', () => {
      mouseMoves++;
    });
  }

  AsyncStorage.getItem(SESSION_START_KEY).catch(() => null).then(async (v) => {
    if (!v) {
      try {
        await AsyncStorage.setItem(SESSION_START_KEY, Date.now().toString());
      } catch {}
    }
  });
}

export function stopTelemetry() {
  if (accelerometerSubscription) {
    try {
      if (typeof accelerometerSubscription.remove === 'function') {
        accelerometerSubscription.remove();
      }
    } catch {}
    accelerometerSubscription = null;
  }
}

export interface LiveMetrics {
  hasSufficientData: boolean;
  moodScore: number | null;
  sleepHours: number | null;
  activityLevel: number | null;
  stressIndex: number | null;
  riskLevel: 'low' | 'medium' | 'high' | null;
  rawSignals: {
    totalKeypresses: number;
    backspaces: number;
    backspaceRatio: number | null;
    avgKeyInterval: number | null;
    totalClicks: number;
    totalScrolls: number;
    motionMagnitude: number | null;
    motionSamples: number;
    todaySteps: number | null;
    watchSleepHours: number | null;
    watchAvgHr: number | null;
    watchActiveMinutes: number | null;
    androidScreenTime: number | null;
    androidUnlocks: number | null;
  };
  behaviorAnalysis: {
    screenTimeMinutes: number | null;
    sleepIndication: string | null;
    doomScrollingDetected: boolean;
    lateNightUsageDetected: boolean;
    usageSpikesDetected: boolean;
    focusLevel: number | null;
    burnoutProbability: number | null;
    anxietyIndication: number | null;
    sleepHealthScore: number | null;
    emotionalWellnessScore: number | null;
  } | null;
}

/**
 * REAL-ONLY metrics engine.
 * - Returns nulls when there is no real signal (no fake baselines).
 * - hasSufficientData = true only when at least one real source exists.
 */
export async function getLiveMetrics(): Promise<LiveMetrics> {
  const hasPermission = hasUsageStatsPermission();
  const nativeMetrics = hasPermission
    ? getSystemWellbeingMetrics()
    : { screenTimeMinutes: 0, unlockCount: 0, sleepHours: 0 };

  const hasNativeData =
    hasPermission &&
    (nativeMetrics.screenTimeMinutes > 0 ||
      nativeMetrics.unlockCount > 0 ||
      nativeMetrics.sleepHours > 0);

  const hasTypingData = totalKeypresses >= 5 && keypressIntervalCount >= 3;
  const hasInteractionData = totalClicks > 0 || totalScrolls > 0;
  const hasMotionData = motionSampleCount >= 3;
  // Watch data first: Health Connect sleep beats inactivity estimates, and
  // watch steps merge with pedometer steps. Cached (10-min TTL) inside.
  const watch = await syncWatchData().catch(() => null);
  const hasWatchData =
    !!watch && (watch.steps > 0 || watch.sleepHours !== null || watch.activeMinutes > 0);
  const todaySteps = Math.max(getCachedSteps(), watch?.steps ?? 0);
  const hasStepData = todaySteps > 0;

  const hasSufficientData =
    hasNativeData ||
    hasTypingData ||
    hasInteractionData ||
    hasMotionData ||
    hasStepData ||
    hasWatchData;

  const empty: LiveMetrics = {
    hasSufficientData: false,
    moodScore: null,
    sleepHours: null,
    activityLevel: null,
    stressIndex: null,
    riskLevel: null,
    rawSignals: {
      totalKeypresses,
      backspaces,
      backspaceRatio: null,
      avgKeyInterval: null,
      totalClicks,
      totalScrolls,
      motionMagnitude: null,
      motionSamples: motionSampleCount,
      todaySteps: hasStepData ? todaySteps : null,
      watchSleepHours: watch?.sleepHours ?? null,
      watchAvgHr: watch?.avgHr ?? null,
      watchActiveMinutes: watch && watch.activeMinutes > 0 ? watch.activeMinutes : null,
      androidScreenTime: hasPermission ? nativeMetrics.screenTimeMinutes : null,
      androidUnlocks: hasPermission ? nativeMetrics.unlockCount : null,
    },
    behaviorAnalysis: null,
  };

  if (!hasSufficientData) return empty;

  // ─── Sleep: watch session first, then native, then inactivity gap ───
  let sleepHours: number | null = null;
  if (watch?.sleepHours != null) {
    sleepHours = watch.sleepHours;
  } else if (hasPermission && nativeMetrics.sleepHours > 0) {
    sleepHours = Number(nativeMetrics.sleepHours.toFixed(1));
  } else {
    try {
      const stored = await AsyncStorage.getItem(SLEEP_LOG_KEY);
      if (stored) {
        const parsed = parseFloat(stored);
        if (!Number.isNaN(parsed) && parsed >= 3 && parsed <= 12) sleepHours = parsed;
      }
    } catch {}
  }

  // ─── Typing signals (only if real) ───
  const avgKeyInterval =
    keypressIntervalCount > 0 ? Math.round(keypressIntervalSum / keypressIntervalCount) : null;
  const backspaceRatio =
    totalKeypresses > 0 ? Number((backspaces / totalKeypresses).toFixed(3)) : null;

  const motionMagnitude = hasMotionData
    ? Number(Math.sqrt(acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2).toFixed(2))
    : null;

  // ─── Stress / Mood: typing-driven ONLY ───
  let stressIndex: number | null = null;
  let moodScore: number | null = null;

  if (hasTypingData && avgKeyInterval !== null && backspaceRatio !== null) {
    let typingSpeedStress = 0;
    if (avgKeyInterval < 250) typingSpeedStress = 25;
    else if (avgKeyInterval > 600) typingSpeedStress = 15;

    const frictionStress = Math.min(backspaceRatio * 250, 45);
    stressIndex = Math.min(100, Math.max(5, 30 + Math.round(typingSpeedStress + frictionStress)));

    const frictionPenalty = Math.min(backspaceRatio * 200, 40);
    const speedBonus = avgKeyInterval >= 280 && avgKeyInterval <= 450 ? 15 : -10;
    moodScore = Math.min(100, Math.max(5, 75 - Math.round(frictionPenalty) + speedBonus));

    // Excessive unlock checking adds real anxiety load
    if (hasPermission && nativeMetrics.unlockCount > 25) {
      const checkAnxiety = Math.min(20, (nativeMetrics.unlockCount - 25) * 0.8);
      stressIndex = Math.min(100, stressIndex + Math.round(checkAnxiety));
      moodScore = Math.max(5, moodScore - Math.round(checkAnxiety / 2));
    }
  }

  // ─── Activity: interaction + motion + native unlocks + real steps ───
  let activityLevel: number | null = null;
  if (hasInteractionData || hasMotionData || hasNativeData || hasStepData) {
    const totalInteractions = totalClicks * 5 + totalScrolls * 2;
    const motionActivity = motionMagnitude !== null ? Math.min(motionMagnitude * 30, 50) : 0;
    let computed = 45 + Math.round(totalInteractions / 10) + Math.round(motionActivity);
    if (hasNativeData) {
      computed += Math.round(
        Math.min(30, nativeMetrics.unlockCount * 2 + nativeMetrics.screenTimeMinutes / 10)
      );
    }
    if (hasStepData) {
      // ~10k steps ≈ very active day. Steps lift the score but never fake it alone.
      const stepActivity = Math.min(100, Math.round(30 + todaySteps / 120));
      computed = Math.max(computed, stepActivity);
    }
    if (watch && watch.activeMinutes > 0) {
      // Real workout minutes logged by the watch.
      computed += Math.min(25, watch.activeMinutes);
    }
    activityLevel = Math.min(100, Math.max(5, computed));
  }

  const riskLevel =
    stressIndex === null ? null : stressIndex < 35 ? 'low' : stressIndex < 65 ? 'medium' : 'high';

  // ─── Behavior flags from REAL signals only ───
  const currentHour = new Date().getHours();
  const screenTimeMinutes =
    hasPermission && nativeMetrics.screenTimeMinutes > 0 ? nativeMetrics.screenTimeMinutes : null;

  const doomScrollingDetected = totalScrolls > 25 && totalKeypresses < 6;
  const lateNightUsageDetected =
    (currentHour >= 23 || currentHour <= 4) && (totalClicks > 5 || totalScrolls > 5);
  const usageSpikesDetected =
    totalClicks > 40 || totalScrolls > 40 || (hasPermission && nativeMetrics.unlockCount > 30);

  let sleepIndication: string | null = null;
  if (sleepHours !== null) {
    sleepIndication = `Last rest window ~${sleepHours} hrs${
      stressIndex !== null && stressIndex > 60 ? ' • Restless score: Moderate' : ' • Restless score: Low'
    }`;
  }

  const focusLevel =
    stressIndex !== null && backspaceRatio !== null
      ? Math.min(100, Math.max(5, Math.round(100 - backspaceRatio * 150 - stressIndex * 0.25)))
      : null;

  const burnoutProbability =
    stressIndex !== null
      ? Math.min(
          100,
          Math.max(
            5,
            Math.round(
              stressIndex * 0.6 +
                (sleepHours !== null ? (8 - sleepHours) * 6 : 0) +
                (screenTimeMinutes !== null && screenTimeMinutes > 300 ? 10 : 0)
            )
          )
        )
      : null;

  const anxietyIndication =
    stressIndex !== null
      ? Math.min(
          100,
          Math.max(
            5,
            Math.round(
              stressIndex * 0.7 +
                (avgKeyInterval !== null && avgKeyInterval < 300 ? 15 : 0) +
                (hasPermission && nativeMetrics.unlockCount > 20 ? 10 : 0)
            )
          )
        )
      : null;

  const sleepHealthScore =
    sleepHours !== null
      ? Math.min(
          100,
          Math.max(
            5,
            Math.round(
              Math.min(sleepHours / 8, 1.2) * 80 +
                (sleepHours >= 7 && sleepHours <= 9 ? 20 : 0) -
                (lateNightUsageDetected ? 15 : 0)
            )
          )
        )
      : null;

  const emotionalWellnessScore =
    moodScore !== null
      ? Math.min(
          100,
          Math.max(5, Math.round(moodScore * 0.75 + (activityLevel ?? 50) * 0.25))
        )
      : null;

  return {
    hasSufficientData: true,
    moodScore,
    sleepHours,
    activityLevel,
    stressIndex,
    riskLevel,
    rawSignals: {
      totalKeypresses,
      backspaces,
      backspaceRatio: backspaceRatio !== null ? Number((backspaceRatio * 100).toFixed(1)) : null,
      avgKeyInterval,
      totalClicks,
      totalScrolls,
      motionMagnitude,
      motionSamples: motionSampleCount,
      todaySteps: hasStepData ? todaySteps : null,
      watchSleepHours: watch?.sleepHours ?? null,
      watchAvgHr: watch?.avgHr ?? null,
      watchActiveMinutes: watch && watch.activeMinutes > 0 ? watch.activeMinutes : null,
      androidScreenTime: hasPermission ? nativeMetrics.screenTimeMinutes : null,
      androidUnlocks: hasPermission ? nativeMetrics.unlockCount : null,
    },
    behaviorAnalysis: {
      screenTimeMinutes,
      sleepIndication,
      doomScrollingDetected,
      lateNightUsageDetected,
      usageSpikesDetected,
      focusLevel,
      burnoutProbability,
      anxietyIndication,
      sleepHealthScore,
      emotionalWellnessScore,
    },
  };
}

export function resetSessionTelemetry() {
  totalKeypresses = 0;
  backspaces = 0;
  lastKeypressTime = 0;
  keypressIntervalSum = 0;
  keypressIntervalCount = 0;
  totalClicks = 0;
  totalScrolls = 0;
  mouseMoves = 0;
  motionSampleCount = 0;
}
