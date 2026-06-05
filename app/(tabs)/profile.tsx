import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { InputField } from '@/src/components/ui/InputField';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SecondaryButton } from '@/src/components/ui/SecondaryButton';
import { getSettings, saveSettings } from '@/src/services/auth';
import { useAuthStore } from '@/src/stores/authStore';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { UserSettings } from '@/src/types/wellness';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const updateDisplayName = useAuthStore((state) => state.updateDisplayName);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [settings, setSettings] = useState<UserSettings>({
    notificationsEnabled: true,
    dataSharingEnabled: false,
    theme: 'dark',
  });

  useEffect(() => {
    if (!user) return;
    getSettings(user.id).then(setSettings);
  }, [user]);

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
      <Text style={styles.eyebrow}>Profile & Settings</Text>
      <Text style={styles.title}>Account</Text>

      <GlassCard>
        <InputField label="Display name" value={displayName} onChangeText={setDisplayName} />
        <Text style={styles.meta}>Email: {user?.email}</Text>
        <Text style={styles.meta}>
          Privacy consent:{' '}
          {user?.privacyConsentAt
            ? new Date(user.privacyConsentAt).toLocaleDateString()
            : 'Not accepted'}
        </Text>
        <PrimaryButton label="Save Profile" onPress={handleSaveProfile} />
      </GlassCard>

      <GlassCard>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Notifications</Text>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(value) =>
              persistSettings({ ...settings, notificationsEnabled: value })
            }
            trackColor={{ true: colors.primaryAccent, false: colors.outline }}
          />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Anonymous data sharing</Text>
          <Switch
            value={settings.dataSharingEnabled}
            onValueChange={(value) =>
              persistSettings({ ...settings, dataSharingEnabled: value })
            }
            trackColor={{ true: colors.primaryAccent, false: colors.outline }}
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
    color: colors.secondary,
    marginTop: 12,
  },
  title: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
  },
  meta: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    ...typography.bodyMd,
    color: colors.onSurface,
    flex: 1,
  },
});
