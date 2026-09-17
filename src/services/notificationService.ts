import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';

export const STORAGE_KEYS = {
  BREAKS_ENABLED: 'mindtrace_breaks_enabled',
  HYDRATION_ENABLED: 'mindtrace_hydration_enabled',
  BREAK_INTERVAL: 'mindtrace_break_interval',
  HYDRATION_TARGET: 'mindtrace_hydration_target',
};

type NotificationsModule = typeof import('expo-notifications');

// ─── Lazy native loader ──────────────────────────────────────────────
// expo-notifications throws at import time inside Expo Go (push removed
// since SDK 53) and is absent on web. A static import would poison every
// module that (transitively) imports this service — including app/_layout,
// which is exactly the "missing default export" + "ErrorBoundary of
// undefined" cascade. So we dynamic-import on first real use only.
let cachedNative: NotificationsModule | null | undefined = undefined;
let warnedOnce = false;

function isExpoGo(): boolean {
  try {
    return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  } catch {
    return false;
  }
}

async function getNativeNotifications(): Promise<NotificationsModule | null> {
  if (cachedNative !== undefined) return cachedNative;
  if (Platform.OS === 'web' || isExpoGo()) {
    cachedNative = null;
    return cachedNative;
  }
  try {
    cachedNative = await import('expo-notifications');
  } catch {
    cachedNative = null;
    if (__DEV__ && !warnedOnce) {
      warnedOnce = true;
      console.warn(
        '[notifications] expo-notifications unavailable in this runtime (Expo Go?). Reminders are disabled for this session.'
      );
    }
  }
  return cachedNative;
}

// Web notification manager
class WebNotificationManager {
  private static breakTimer: any = null;
  private static hydrationTimer: any = null;

  static async requestPermission(): Promise<string> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        const status = await Notification.requestPermission();
        return status;
      }
      return Notification.permission;
    }
    return 'denied';
  }

  static cancelAll() {
    if (this.breakTimer) {
      clearInterval(this.breakTimer);
      this.breakTimer = null;
    }
    if (this.hydrationTimer) {
      clearInterval(this.hydrationTimer);
      this.hydrationTimer = null;
    }
  }

  static scheduleBreakReminder(intervalMins: number) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    if (this.breakTimer) clearInterval(this.breakTimer);

    const intervalMs = intervalMins * 60 * 1000;
    this.breakTimer = setInterval(() => {
      try {
        new Notification('Time for a Screen Break! ⏳', {
          body: `You've been on your device for ${intervalMins} minutes. Rest your eyes and stretch!`,
        });
      } catch (e) {
        console.warn('Failed to show web notification:', e);
      }
    }, intervalMs);
  }

  static scheduleHydrationReminder(targetMl: number) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    if (this.hydrationTimer) clearInterval(this.hydrationTimer);

    // Default hydration reminder frequency is every 2 hours (7200 seconds)
    const intervalMs = 7200 * 1000;
    this.hydrationTimer = setInterval(() => {
      try {
        new Notification('Stay Hydrated! 💧', {
          body: `Keep up with your daily ${(targetMl / 1000).toFixed(1)}L target. Take a sip of water now!`,
        });
      } catch (e) {
        console.warn('Failed to show web notification:', e);
      }
    }, intervalMs);
  }
}

// Unified Notification Service
export const NotificationService = {
  async init() {
    try {
      if (Platform.OS === 'web') {
        // On Web: initialize running timers if saved preferences exist
        const be = await AsyncStorage.getItem(STORAGE_KEYS.BREAKS_ENABLED);
        const he = await AsyncStorage.getItem(STORAGE_KEYS.HYDRATION_ENABLED);
        const bi = await AsyncStorage.getItem(STORAGE_KEYS.BREAK_INTERVAL);
        const ht = await AsyncStorage.getItem(STORAGE_KEYS.HYDRATION_TARGET);

        const breaksEnabled = be === 'true';
        const hydrationEnabled = he === 'true';
        const breakInterval = bi ? parseInt(bi, 10) : 45;
        const hydrationTarget = ht ? parseInt(ht, 10) : 2500;

        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            if (breaksEnabled) {
              WebNotificationManager.scheduleBreakReminder(breakInterval);
            }
            if (hydrationEnabled) {
              WebNotificationManager.scheduleHydrationReminder(hydrationTarget);
            }
          }
        }
        return;
      }

      const N = await getNativeNotifications();
      if (!N) return; // Expo Go / unsupported runtime: reminders unavailable, app keeps running.

      // SDK 57 requires shouldShowBanner + shouldShowList (shouldShowAlert is deprecated).
      N.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      if (Platform.OS === 'android') {
        await N.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: N.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    } catch (e) {
      console.warn('Failed to initialize notifications:', e);
    }
  },

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        const status = await WebNotificationManager.requestPermission();
        return status === 'granted';
      }
      const N = await getNativeNotifications();
      if (!N) return false;
      const { status: existingStatus } = await N.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await N.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch (e) {
      console.warn('Error requesting notification permissions:', e);
      return false;
    }
  },

  async saveAndSchedule(
    breaksEnabled: boolean,
    hydrationEnabled: boolean,
    breakInterval: number,
    hydrationTarget: number
  ): Promise<{ success: boolean; text: string }> {
    try {
      // 1. Save preferences
      await AsyncStorage.setItem(STORAGE_KEYS.BREAKS_ENABLED, String(breaksEnabled));
      await AsyncStorage.setItem(STORAGE_KEYS.HYDRATION_ENABLED, String(hydrationEnabled));
      await AsyncStorage.setItem(STORAGE_KEYS.BREAK_INTERVAL, String(breakInterval));
      await AsyncStorage.setItem(STORAGE_KEYS.HYDRATION_TARGET, String(hydrationTarget));

      let scheduledText = 'Your settings have been saved.';

      if (Platform.OS === 'web') {
        WebNotificationManager.cancelAll();
        if (breaksEnabled || hydrationEnabled) {
          const hasPermission = await this.requestPermissions();
          if (hasPermission) {
            const scheduled = [];
            if (breaksEnabled) {
              WebNotificationManager.scheduleBreakReminder(breakInterval);
              scheduled.push('Screen Break');
            }
            if (hydrationEnabled) {
              WebNotificationManager.scheduleHydrationReminder(hydrationTarget);
              scheduled.push('Hydration');
            }
            if (scheduled.length > 0) {
              scheduledText = `Settings saved. Active notifications scheduled: ${scheduled.join(' & ')}.`;
            }
          } else {
            scheduledText = 'Settings saved, but browser notification permission was denied. Please enable them in your site settings.';
          }
        }
        return { success: true, text: scheduledText };
      }

      // Native (dev build / standalone only — no-op in Expo Go)
      const N = await getNativeNotifications();
      if (!N) {
        return {
          success: true,
          text: 'Settings saved. Native reminders need a development build — they are unavailable in Expo Go.',
        };
      }

      // Cancel all existing scheduled notifications
      await N.cancelAllScheduledNotificationsAsync();

      if (breaksEnabled || hydrationEnabled) {
        const hasPermission = await this.requestPermissions();
        if (hasPermission) {
          const scheduled = [];
          if (breaksEnabled) {
            // SDK 57: repeating triggers need an explicit type; channelId lives
            // on the trigger (not on content). iOS requires >= 60s when repeating.
            await N.scheduleNotificationAsync({
              content: {
                title: 'Time for a Screen Break! ⏳',
                body: `You've been on your device for ${breakInterval} minutes. Rest your eyes and stretch!`,
                sound: true,
              },
              trigger: {
                type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
                channelId: 'default',
                seconds: Math.max(breakInterval * 60, 60),
                repeats: true,
              },
            });
            scheduled.push('Screen Break');
          }

          if (hydrationEnabled) {
            await N.scheduleNotificationAsync({
              content: {
                title: 'Stay Hydrated! 💧',
                body: `Keep up with your daily ${(hydrationTarget / 1000).toFixed(1)}L target. Take a sip of water now!`,
                sound: true,
              },
              trigger: {
                type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
                channelId: 'default',
                seconds: 7200, // 2 hours
                repeats: true,
              },
            });
            scheduled.push('Hydration');
          }

          if (scheduled.length > 0) {
            scheduledText = `Settings saved. Active notifications scheduled: ${scheduled.join(' & ')}.`;
          }
        } else {
          scheduledText = 'Settings saved, but notifications permission was denied. Please enable them in your system settings.';
        }
      }

      return { success: true, text: scheduledText };
    } catch (e) {
      console.warn('Error saving and scheduling reminders:', e);
      return { success: false, text: 'Failed to save settings.' };
    }
  },

  async sendTestNotification(): Promise<{ success: boolean; text: string }> {
    try {
      if (Platform.OS === 'web') {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
          return { success: false, text: 'Notification permission is denied. Please enable it in settings.' };
        }
        if (typeof window !== 'undefined' && 'Notification' in window) {
          try {
            new Notification('MindTrace Test Alert 🔔', {
              body: 'Great news! Your reminders and alerts system is configured correctly.',
            });
          } catch (e) {
            console.warn('Failed to construct Web Notification:', e);
          }
        }
        return { success: true, text: 'Test notification sent!' };
      }

      const N = await getNativeNotifications();
      if (!N) {
        return { success: false, text: 'Native notifications need a development build — unavailable in Expo Go.' };
      }
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return { success: false, text: 'Notification permission is denied. Please enable it in settings.' };
      }

      await N.scheduleNotificationAsync({
        content: {
          title: 'MindTrace Test Alert 🔔',
          body: 'Great news! Your reminders and alerts system is configured correctly.',
          sound: true,
        },
        trigger: null, // immediately
      });
      return { success: true, text: 'Test notification sent!' };
    } catch (e) {
      console.warn('Error sending test notification:', e);
      return { success: false, text: 'Failed to send test notification.' };
    }
  },
};
