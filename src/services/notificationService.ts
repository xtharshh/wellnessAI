import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export const STORAGE_KEYS = {
  BREAKS_ENABLED: 'mindtrace_breaks_enabled',
  HYDRATION_ENABLED: 'mindtrace_hydration_enabled',
  BREAK_INTERVAL: 'mindtrace_break_interval',
  HYDRATION_TARGET: 'mindtrace_hydration_target',
};

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
      if (Platform.OS !== 'web') {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }
      } else {
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
      }
    } catch (e) {
      console.warn('Failed to initialize notifications:', e);
    }
  },

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS !== 'web') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
              allowAnnouncements: true,
            },
          });
          finalStatus = status;
        }
        return finalStatus === 'granted';
      } else {
        const status = await WebNotificationManager.requestPermission();
        return status === 'granted';
      }
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

      if (Platform.OS !== 'web') {
        // Cancel all existing scheduled notifications
        await Notifications.cancelAllScheduledNotificationsAsync();

        if (breaksEnabled || hydrationEnabled) {
          const hasPermission = await this.requestPermissions();
          if (hasPermission) {
            const scheduled = [];
            if (breaksEnabled) {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: 'Time for a Screen Break! ⏳',
                  body: `You've been on your device for ${breakInterval} minutes. Rest your eyes and stretch!`,
                  sound: true,
                  android: {
                    channelId: 'default',
                  },
                },
                trigger: {
                  seconds: breakInterval * 60,
                  repeats: true,
                },
              });
              scheduled.push('Screen Break');
            }

            if (hydrationEnabled) {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: 'Stay Hydrated! 💧',
                  body: `Keep up with your daily ${(hydrationTarget / 1000).toFixed(1)}L target. Take a sip of water now!`,
                  sound: true,
                  android: {
                    channelId: 'default',
                  },
                },
                trigger: {
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
      } else {
        // Web Platform
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
      }

      return { success: true, text: scheduledText };
    } catch (e) {
      console.warn('Error saving and scheduling reminders:', e);
      return { success: false, text: 'Failed to save settings.' };
    }
  },

  async sendTestNotification(): Promise<{ success: boolean; text: string }> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return { success: false, text: 'Notification permission is denied. Please enable it in settings.' };
      }

      if (Platform.OS !== 'web') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'MindTrace Test Alert 🔔',
            body: 'Great news! Your reminders and alerts system is configured correctly.',
            sound: true,
            android: {
              channelId: 'default',
            },
          },
          trigger: null, // immediately
        });
      } else {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          try {
            new Notification('MindTrace Test Alert 🔔', {
              body: 'Great news! Your reminders and alerts system is configured correctly.',
            });
          } catch (e) {
            console.warn('Failed to construct Web Notification:', e);
          }
        }
      }
      return { success: true, text: 'Test notification sent!' };
    } catch (e) {
      console.warn('Error sending test notification:', e);
      return { success: false, text: 'Failed to send test notification.' };
    }
  }
};
