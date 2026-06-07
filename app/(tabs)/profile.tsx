import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, AppState, Platform, StyleSheet, Switch, Text, View, Image, Pressable, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { InputField } from '@/src/components/ui/InputField';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SecondaryButton } from '@/src/components/ui/SecondaryButton';
import { getSettings, saveSettings } from '@/src/services/auth';
import { useAuthStore } from '@/src/stores/authStore';
import { useTheme } from '@/src/hooks/useTheme';
import { useWellnessSummary } from '@/src/hooks/useWellnessSummary';
import { typography } from '@/src/theme/typography';
import { radius, spacing } from '@/src/theme/spacing';
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
  const updateAvatar = useAuthStore((state) => state.updateAvatar);
  const updateEmail = useAuthStore((state) => state.updateEmail);
  const { theme, setTheme, colors, isDark } = useTheme();
  
  // Fetch stats from hook
  const { data: summaryData } = useWellnessSummary();
  const summary = summaryData?.summary;

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [isUpdating, setIsUpdating] = useState(false);
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

    // Check for cached profile avatar
    async function loadCachedAvatar() {
      if (user && !user.avatarUrl) {
        const cached = await AsyncStorage.getItem(`mindtrace_cached_avatar_${user.id}`);
        if (cached) {
          await updateAvatar(cached);
        }
      }
    }
    loadCachedAvatar();
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

  const handleSelectAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Gallery access is required to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        const base64Str = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setIsUpdating(true);
        await updateAvatar(base64Str);
        if (user) {
          await AsyncStorage.setItem(`mindtrace_cached_avatar_${user.id}`, base64Str);
        }
        Alert.alert('Success', 'Profile picture updated.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update photo: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsUpdating(false);
    }
  };

  const persistSettings = async (next: UserSettings) => {
    setSettings(next);
    if (!user) return;
    await saveSettings(user.id, next);
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Validation Error', 'Display name cannot be empty.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Email cannot be empty.');
      return;
    }

    try {
      setIsUpdating(true);
      await updateDisplayName(displayName.trim());
      
      if (email.trim().toLowerCase() !== user?.email.toLowerCase()) {
        await updateEmail(email.trim());
        Alert.alert('Profile Saved', 'Name updated. A verification link has been sent to your new email.');
      } else {
        Alert.alert('Saved', 'Profile details updated successfully.');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const getProfileInitials = () => {
    if (user?.displayName) {
      return user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
    }
    return 'MT';
  };

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      <Text style={[styles.eyebrow, { color: colors.secondary }]}>Profile & Settings</Text>
      <Text style={[styles.title, { color: colors.onSurface }]}>Account</Text>

      {/* Profile Picture Header Widget */}
      <View style={styles.avatarSection}>
        {isUpdating ? (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.outline, borderColor: colors.outline }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={[styles.avatarImage, { borderColor: colors.outline }]} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? 'rgba(183, 109, 255, 0.15)' : '#ebdfff', borderColor: colors.outline }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{getProfileInitials()}</Text>
          </View>
        )}
        <Pressable
          onPress={handleSelectAvatar}
          style={[styles.changePhotoBtn, { borderColor: colors.outline, backgroundColor: colors.surface }]}
          disabled={isUpdating}
        >
          <Feather name="camera" size={12} color={colors.onSurface} style={{ marginRight: 4 }} />
          <Text style={[styles.changePhotoText, { color: colors.onSurface }]}>Change Photo</Text>
        </Pressable>
      </View>

      {/* Edit Form */}
      <GlassCard accent="primary" style={styles.card}>
        <InputField label="Display name" value={displayName} onChangeText={setDisplayName} />
        <InputField label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        
        <View style={styles.saveBtnWrapper}>
          <PrimaryButton label={isUpdating ? 'Saving...' : 'Save Profile'} onPress={handleSaveProfile} loading={isUpdating} />
        </View>
      </GlassCard>

      {/* Wellness Stats Mini-Dashboard */}
      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Wellness Statistics</Text>
      <GlassCard accent="secondary" style={styles.statsCard}>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Feather name="smile" size={16} color="#ffb3d9" />
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Mood Score</Text>
            <Text style={[styles.statValue, { color: colors.onSurface }]}>{summary?.moodScore ?? '—'}%</Text>
          </View>
          <View style={styles.statBox}>
            <Feather name="moon" size={16} color="#a2cbfd" />
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Sleep</Text>
            <Text style={[styles.statValue, { color: colors.onSurface }]}>{summary?.sleepHours ?? '—'} hrs</Text>
          </View>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Feather name="activity" size={16} color="#6ee7b7" />
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Activity</Text>
            <Text style={[styles.statValue, { color: colors.onSurface }]}>{summary?.activityLevel ?? '—'}%</Text>
          </View>
          <View style={styles.statBox}>
            <Feather name="trending-down" size={16} color="#b59cff" />
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Stress Index</Text>
            <Text style={[styles.statValue, { color: colors.onSurface }]}>{summary?.stressIndex ?? '—'}%</Text>
          </View>
        </View>
      </GlassCard>

      {/* Account Details */}
      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Account Details</Text>
      <GlassCard style={styles.card}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>User ID</Text>
          <Text style={[styles.detailVal, { color: colors.onSurface }]} numberOfLines={1} ellipsizeMode="middle">{user?.id}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>Joined Date</Text>
          <Text style={[styles.detailVal, { color: colors.onSurface }]}>
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>Privacy Consent</Text>
          <Text style={[styles.detailVal, { color: colors.onSurface }]}>
            {user?.privacyConsentAt ? `Accepted on ${new Date(user.privacyConsentAt).toLocaleDateString()}` : 'Not accepted'}
          </Text>
        </View>
      </GlassCard>

      {/* Preferences Toggles */}
      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Preferences</Text>
      <GlassCard style={styles.card}>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.onSurface }]}>Light Theme Mode</Text>
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
          <Text style={[styles.settingLabel, { color: colors.onSurface }]}>Clinical Notifications</Text>
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

      <View style={styles.logoutBtnWrapper}>
        <SecondaryButton label="Sign Out & Exit" onPress={handleLogout} />
      </View>
      
      {/* spacer for bottom bar */}
      <View style={{ height: 100 }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 12 : 24,
    paddingBottom: 24,
    gap: 16,
  },
  eyebrow: {
    ...typography.labelCaps,
    marginTop: 12,
  },
  title: {
    ...typography.headlineLgMobile,
    fontWeight: 'bold',
  },
  avatarSection: {
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: 4,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  card: {
    padding: spacing.md,
    gap: 12,
  },
  saveBtnWrapper: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 6,
  },
  statsCard: {
    padding: spacing.md,
    gap: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  statLabel: {
    ...typography.labelCaps,
    fontSize: 11,
    textTransform: 'none',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  detailLabel: {
    fontSize: 12.5,
  },
  detailVal: {
    fontSize: 12.5,
    fontWeight: '600',
    maxWidth: '60%',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  settingLabel: {
    fontSize: 13.5,
    flex: 1,
  },
  logoutBtnWrapper: {
    marginTop: 10,
  },
});
