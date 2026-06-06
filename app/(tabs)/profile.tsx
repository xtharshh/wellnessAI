import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, AppState, Platform, StyleSheet, Switch, Text, View } from 'react-native';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { InputField } from '@/src/components/ui/InputField';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SecondaryButton } from '@/src/components/ui/SecondaryButton';
import { getSettings, saveSettings } from '@/src/services/auth';
import { useAuthStore } from '@/src/stores/authStore';
import { useTheme } from '@/src/hooks/useTheme';
import { typography } from '@/src/theme/typography';
import { UserSettings } from '@/src/types/wellness';
import {
  hasUsageStatsPermission,
  requestUsageStatsPermission,
} from '@/modules/android-wellbeing';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const updateDisplayName = useAuthStore((state) => state.updateDisplayName);
  const { theme, setTheme, colors } = useTheme();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [settings, setSettings] = useState<UserSettings>({
    notificationsEnabled: true,
    dataSharingEnabled: false,
    theme: 'dark',
  });
  const [hasNativePermission, setHasNativePermission] = useState(false);

  const checkPermission = () => {
    if (Platform.OS === 'android') {
      setHasNativePermission(hasUsageStatsPermission());
    }
  };

  useEffect(() => {
    if (!user) return;
    getSettings(user.id).then((s) => {
      setSettings(s);
      if (s.theme && s.theme !== theme) {
        setTheme(s.theme as 'light' | 'dark');
      }
    });
  }, [user]);

  useEffect(() => {
    checkPermission();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkPermission();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const persistSettings = async (next: UserSettings) => {
    setSettings(next);
    if (!user) return;
    await saveSettings(user.id, next);
  };

  const handleSaveProfile = async () => {
    await updateDisplayName(displayName);
    Alert.alert('Saved', 'Profile updated successfully.');
  };

  const handleExport = () => {
    Alert.alert(
      'Data export',
      'Your wellness snapshots and recommendations are stored locally on this device and ready for export in a future cloud sync release.',
    );
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <ScreenContainer>
      <Text style={[styles.eyebrow, { color: colors.secondary }]}>Profile & Settings</Text>
      <Text style={[styles.title, { color: colors.onSurface }]}>Account</Text>

      <GlassCard>
        <InputField label="Display name" value={displayName} onChangeText={setDisplayName} />
        <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>Email: {user?.email}</Text>
        <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
          Privacy consent:{' '}
          {user?.privacyConsentAt
            ? new Date(user.privacyConsentAt).toLocaleDateString()
            : 'Not accepted'}
        </Text>
        <PrimaryButton label="Save Profile" onPress={handleSaveProfile} />
      </GlassCard>

      <GlassCard>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.onSurface }]}>Light Theme</Text>
          <Switch
            value={theme === 'light'}
            onValueChange={(value) => {
              const nextTheme = value ? 'light' : 'dark';
              setTheme(nextTheme);
              persistSettings({ ...settings, theme: nextTheme });
            }}
            trackColor={{ true: colors.primaryAccent, false: colors.outline }}
            thumbColor={theme === 'light' ? colors.primary : '#f4f3f4'}
          />
        </View>
        {Platform.OS === 'android' && (
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.onSurface }]}>System Usage Stats</Text>
            <Switch
              value={hasNativePermission}
              onValueChange={() => {
                if (hasNativePermission) {
                  Alert.alert(
                    'Permission Enabled',
                    'Usage Stats permission can only be revoked manually inside Android System Settings.'
                  );
                } else {
                  requestUsageStatsPermission();
                }
              }}
              trackColor={{ true: colors.primaryAccent, false: colors.outline }}
              thumbColor={hasNativePermission ? colors.primary : '#f4f3f4'}
            />
          </View>
        )}
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.onSurface }]}>Notifications</Text>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(value) =>
              persistSettings({ ...settings, notificationsEnabled: value })
            }
            trackColor={{ true: colors.primaryAccent, false: colors.outline }}
            thumbColor={settings.notificationsEnabled ? colors.primary : '#f4f3f4'}
          />
        </View>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.onSurface }]}>Anonymous data sharing</Text>
          <Switch
            value={settings.dataSharingEnabled}
            onValueChange={(value) =>
              persistSettings({ ...settings, dataSharingEnabled: value })
            }
            trackColor={{ true: colors.primaryAccent, false: colors.outline }}
            thumbColor={settings.dataSharingEnabled ? colors.primary : '#f4f3f4'}
          />
        </View>
      </GlassCard>

      <SecondaryButton label="Export Data" onPress={handleExport} />
      <SecondaryButton label="Sign Out" onPress={handleLogout} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...typography.labelCaps,
    marginTop: 12,
  },
  title: {
    ...typography.headlineLgMobile,
  },
  meta: {
    ...typography.bodyMd,
    marginTop: 4,
    marginBottom: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  settingLabel: {
    ...typography.bodyMd,
    flex: 1,
  },
});
