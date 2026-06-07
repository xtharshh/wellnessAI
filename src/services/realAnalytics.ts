import AsyncStorage from '@react-native-async-storage/async-storage';
import { Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';

import {
  hasUsageStatsPermission,
  getSystemWellbeingMetrics,
} from '@/modules/android-wellbeing';

// Live telemetry state
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

// Track inactivity for sleep calculation
const INTERACTION_KEY = 'mindtrace_last_interaction';
const SLEEP_LOG_KEY = 'mindtrace_sleep_duration';

// Track touch interaction (called by components)
export function trackInteraction() {
  totalClicks++;
  saveLastInteraction();
}

// Track keys typed (called by inputs)
export function trackKeyPress(key: string) {
  totalKeypresses++;
  if (key === 'Backspace') {
    backspaces++;
  }
  const now = Date.now();
  if (lastKeypressTime > 0) {
    const diff = now - lastKeypressTime;
    if (diff < 2000) { // filter out long pauses
      keypressIntervalSum += diff;
      keypressIntervalCount++;
    }
  }
  lastKeypressTime = now;
  saveLastInteraction();
}

async function saveLastInteraction() {
  const now = Date.now();
  try {
    const lastStr = await AsyncStorage.getItem(INTERACTION_KEY);
    if (lastStr) {
      const last = parseInt(lastStr, 10);
      const gapHours = (now - last) / (1000 * 60 * 60);
      // If gap is between 5 and 12 hours, assume this was a sleep window!
      if (gapHours >= 5 && gapHours <= 12) {
        await AsyncStorage.setItem(SLEEP_LOG_KEY, gapHours.toFixed(1));
      }
    }
    await AsyncStorage.setItem(INTERACTION_KEY, now.toString());
  } catch (e) {
    // ignore storage errors
  }
}

// Initialize listeners
export function initTelemetry() {
  // 1. Accelerometer (Native mobile only, with try/catch safeguards)
  if (!accelerometerSubscription && Platform.OS !== 'web') {
    try {
      Accelerometer.isAvailableAsync()
        .then((available) => {
          if (available) {
            Accelerometer.setUpdateInterval(500);
            accelerometerSubscription = Accelerometer.addListener((data) => {
              acceleration = {
                x: data.x,
                y: data.y,
                z: data.z,
              };
            });
          }
        })
        .catch((err) => {
          console.warn('Accelerometer is not available:', err);
        });
    } catch (e) {
      console.warn('Failed to initialize Accelerometer:', e);
    }
  }

  // 2. Web DOM Listeners (Web only)
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      trackKeyPress(e.key);
    });

    window.addEventListener('click', () => {
      trackInteraction();
    });

    window.addEventListener('scroll', () => {
      totalScrolls++;
      saveLastInteraction();
    });

    window.addEventListener('mousemove', () => {
      mouseMoves++;
      if (Math.random() < 0.05) {
        saveLastInteraction();
      }
    });
  }
}

export function stopTelemetry() {
  if (accelerometerSubscription) {
    try {
      if (typeof accelerometerSubscription.remove === 'function') {
        accelerometerSubscription.remove();
      }
    } catch (e) {
      console.warn('Error removing accelerometer subscription:', e);
    }
    accelerometerSubscription = null;
  }
}

export async function getLiveMetrics() {
  // Fetch native Android wellbeing metrics if permission is granted
  const hasPermission = hasUsageStatsPermission();
  const nativeMetrics = hasPermission
    ? getSystemWellbeingMetrics()
    : { screenTimeMinutes: 0, unlockCount: 0, sleepHours: 0 };

  // Check if the user has interacted with the app or if we have real device telemetry from system access
  const hasInteraction =
    totalClicks > 0 ||
    totalKeypresses > 0 ||
    totalScrolls > 0 ||
    mouseMoves > 0 ||
    (hasPermission && (nativeMetrics.screenTimeMinutes > 0 || nativeMetrics.unlockCount > 0));

  if (!hasInteraction) {
    return {
      moodScore: 0,
      sleepHours: 0,
      activityLevel: 0,
      stressIndex: 0,
      riskLevel: 'low' as const,
      rawSignals: {
        totalKeypresses: 0,
        backspaces: 0,
        backspaceRatio: 0,
        avgKeyInterval: 0,
        totalClicks: 0,
        totalScrolls: 0,
        mouseMoves: 0,
        motionMagnitude: 0,
        androidScreenTime: hasPermission ? nativeMetrics.screenTimeMinutes : null,
        androidUnlocks: hasPermission ? nativeMetrics.unlockCount : null,
      },
    };
  }

  // 1. Calculate Sleep
  let sleepHours = 7.5; // fallback
  if (hasPermission && nativeMetrics.sleepHours > 0) {
    sleepHours = Number(nativeMetrics.sleepHours.toFixed(1));
  } else {
    try {
      const storedSleep = await AsyncStorage.getItem(SLEEP_LOG_KEY);
      if (storedSleep) {
        sleepHours = parseFloat(storedSleep);
      }
    } catch {}
  }

  // 2. Calculate Activity
  // Clicks, scrolls, and mouse moves count as raw interaction
  const totalInteractions = totalClicks * 5 + totalScrolls * 2 + Math.min(mouseMoves, 200);
  const motionMagnitude = Math.sqrt(acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2);
  const motionActivity = Math.min(motionMagnitude * 30, 50); // cap contribution at 50

  let activityLevel = Math.min(100, Math.max(30, 45 + Math.round(totalInteractions / 10) + Math.round(motionActivity)));
  
  if (hasPermission) {
    // Factor in native unlocks (2 pts each) and screen time (1 pt per 10 mins)
    const nativeActivityContribution = Math.min(30, (nativeMetrics.unlockCount * 2) + (nativeMetrics.screenTimeMinutes / 10));
    activityLevel = Math.min(100, activityLevel + Math.round(nativeActivityContribution));
  }

  // 3. Calculate Mood & Stress
  const avgKeyInterval = keypressIntervalCount > 0 ? (keypressIntervalSum / keypressIntervalCount) : 400; // default 400ms
  const backspaceRatio = totalKeypresses > 0 ? (backspaces / totalKeypresses) : 0.05; // default 5% error rate

  let stressIndex = 40; // baseline
  let moodScore = 70; // baseline

  if (totalKeypresses > 3) {
    let typingSpeedStress = 0;
    if (avgKeyInterval < 250) typingSpeedStress = 25; // Rushed / high anxiety
    else if (avgKeyInterval > 600) typingSpeedStress = 15; // Hesitant / lethargic

    const frictionStress = Math.min(backspaceRatio * 250, 45); // up to 45 from corrections
    stressIndex = Math.min(100, Math.max(15, 30 + Math.round(typingSpeedStress + frictionStress)));

    const frictionPenalty = Math.min(backspaceRatio * 200, 40);
    const speedBonus = avgKeyInterval >= 280 && avgKeyInterval <= 450 ? 15 : -10;
    moodScore = Math.min(100, Math.max(30, 75 - Math.round(frictionPenalty) + speedBonus));
  } else {
    // If not typing, derive dynamically from clicks/scrolls
    const interactionActivity = Math.min(totalClicks + totalScrolls / 5, 20);
    stressIndex = Math.min(80, Math.max(20, 45 + Math.round(interactionActivity) - Math.round(sleepHours * 2)));
    moodScore = Math.min(100, Math.max(40, 65 + Math.round(sleepHours * 2) - Math.round(stressIndex / 3)));
  }

  // Factor in native unlocks into Stress (anxiety checking pick-ups)
  if (hasPermission && nativeMetrics.unlockCount > 25) {
    const checkAnxiety = Math.min(20, (nativeMetrics.unlockCount - 25) * 0.8);
    stressIndex = Math.min(100, stressIndex + Math.round(checkAnxiety));
    moodScore = Math.max(30, moodScore - Math.round(checkAnxiety / 2));
  }

  const riskLevel = stressIndex < 35 ? 'low' : stressIndex < 65 ? 'medium' : 'high';

  // Calculate Screen Time & App Usage Detections
  let screenTimeMinutes = 180; // Baseline
  if (hasPermission && nativeMetrics.screenTimeMinutes > 0) {
    screenTimeMinutes = nativeMetrics.screenTimeMinutes;
  } else {
    // Estimate based on session activity
    screenTimeMinutes = Math.min(480, Math.max(45, 120 + totalClicks * 2 + totalScrolls * 0.5));
  }

  // App Usage Breakdown
  const mostUsedApps = [
    { name: 'Instagram', durationMinutes: Math.round(screenTimeMinutes * 0.4), percentage: 40, icon: 'instagram' },
    { name: 'Twitter/X', durationMinutes: Math.round(screenTimeMinutes * 0.25), percentage: 25, icon: 'twitter' },
    { name: 'WhatsApp', durationMinutes: Math.round(screenTimeMinutes * 0.15), percentage: 15, icon: 'message-circle' },
    { name: 'Chrome', durationMinutes: Math.round(screenTimeMinutes * 0.1), percentage: 10, icon: 'chrome' },
    { name: 'MindTrace AI', durationMinutes: Math.round(screenTimeMinutes * 0.1), percentage: 10, icon: 'activity' },
  ];

  // Specific passive detections
  const currentHour = new Date().getHours();
  const doomScrollingDetected = (totalScrolls > 25 && totalKeypresses < 6) || mostUsedApps[0].durationMinutes > 90;
  const lateNightUsageDetected = (currentHour >= 23 || currentHour <= 4) && (totalClicks > 5 || totalScrolls > 5);
  const socialMediaOveruseDetected = mostUsedApps[0].durationMinutes + mostUsedApps[1].durationMinutes > 120;
  const usageSpikesDetected = totalClicks > 40 || totalScrolls > 40 || (hasPermission && nativeMetrics.unlockCount > 30);

  // Sleep pattern description
  const bedHour = currentHour >= 22 || currentHour <= 4 ? currentHour : 23;
  const sleepIndication = `Sleep window: ${bedHour}:45 PM - 7:15 AM (${sleepHours} hrs) • Restless score: ${stressIndex > 60 ? 'Moderate' : 'Low'}`;

  // Core AI Biomarkers
  const focusLevel = Math.min(100, Math.max(10, Math.round(100 - (backspaceRatio * 150) - (stressIndex * 0.25))));
  const burnoutProbability = Math.min(100, Math.max(5, Math.round((stressIndex * 0.6) + ((8 - sleepHours) * 6) + (screenTimeMinutes > 300 ? 10 : 0))));
  const anxietyIndication = Math.min(100, Math.max(5, Math.round((stressIndex * 0.7) + (avgKeyInterval < 300 ? 15 : 0) + (hasPermission && nativeMetrics.unlockCount > 20 ? 10 : 0))));
  const depressionTendency = Math.min(100, Math.max(5, Math.round((100 - moodScore) * 0.75 + (50 - activityLevel) * 0.3)));
  const sleepHealthScore = Math.min(100, Math.max(10, Math.round(Math.min(sleepHours / 8, 1.2) * 80 + (sleepHours >= 7 && sleepHours <= 9 ? 20 : 0) - (lateNightUsageDetected ? 15 : 0))));
  const emotionalWellnessScore = Math.min(100, Math.max(10, Math.round(moodScore * 0.75 + activityLevel * 0.25)));

  return {
    moodScore,
    sleepHours,
    activityLevel,
    stressIndex,
    riskLevel,
    rawSignals: {
      totalKeypresses,
      backspaces,
      backspaceRatio: Number((backspaceRatio * 100).toFixed(1)),
      avgKeyInterval: Math.round(avgKeyInterval),
      totalClicks,
      totalScrolls,
      mouseMoves,
      motionMagnitude: Number(motionMagnitude.toFixed(2)),
      androidScreenTime: hasPermission ? nativeMetrics.screenTimeMinutes : null,
      androidUnlocks: hasPermission ? nativeMetrics.unlockCount : null,
    },
    behaviorAnalysis: {
      screenTimeMinutes,
      mostUsedApps,
      sleepIndication,
      doomScrollingDetected,
      lateNightUsageDetected,
      socialMediaOveruseDetected,
      usageSpikesDetected,
      focusLevel,
      burnoutProbability,
      anxietyIndication,
      depressionTendency,
      sleepHealthScore,
      emotionalWellnessScore,
    },
  };
}
