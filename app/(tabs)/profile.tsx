import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { CalmCard, CalmScreen, InkButton, Serif, useCalm } from '@/src/components/calm/kit';
import { useTheme } from '@/src/hooks/useTheme';
import { useWellnessSummary } from '@/src/hooks/useWellnessSummary';
import { useAuthStore } from '@/src/stores/authStore';
import { getSettings, saveSettings } from '@/src/services/auth';
import { NotificationService, STORAGE_KEYS } from '@/src/services/notificationService';
import { getStepStatus, requestStepPermission, type StepStatus } from '@/src/services/steps';
import {
  connectWatch,
  disconnectWatch,
  getWatchState,
  openWatchSettings,
  openWatchStore,
  syncWatchData,
  type WatchData,
  type WatchState,
} from '@/src/services/healthconnect';
import type { UserProfile, UserSettings } from '@/src/types/wellness';
import { fonts } from '@/src/theme/typography';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const updateHealthProfile = useAuthStore((s) => s.updateHealthProfile);
  const updateAvatar = useAuthStore((s) => s.updateAvatar);
  const { theme, setTheme } = useTheme();
  const { c, isDark } = useCalm();
  const { data: summaryData } = useWellnessSummary();
  const summary = summaryData?.summary ?? null;

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [restingHr, setRestingHr] = useState('');
  const [dailyStepsGoal, setDailyStepsGoal] = useState('');
  const [sleepDurationGoal, setSleepDurationGoal] = useState('');
  const [waterIntakeGoal, setWaterIntakeGoal] = useState('');

  const [settings, setSettings] = useState<UserSettings>({
    notificationsEnabled: true,
    dataSharingEnabled: false,
    theme: 'light',
  });

  // Reminders (same engine as the dashboard modal — lives here on Settings too)
  const [breaksEnabled, setBreaksEnabled] = useState(true);
  const [hydrationEnabled, setHydrationEnabled] = useState(true);
  const [breakInterval, setBreakInterval] = useState(45);
  const [hydrationTarget, setHydrationTarget] = useState(2500);
  const [reminderBusy, setReminderBusy] = useState(false);

  // Wearables / connected devices
  const [stepStatus, setStepStatus] = useState<StepStatus | null>(null);
  const [watchState, setWatchState] = useState<WatchState | null>(null);
  const [watchData, setWatchData] = useState<WatchData | null>(null);
  const [watchBusy, setWatchBusy] = useState(false);

  const refreshSteps = async () => {
    try {
      setStepStatus(await getStepStatus());
    } catch {
      setStepStatus(null);
    }
  };

  const refreshWatch = async () => {
    try {
      const state = await getWatchState();
      setWatchState(state);
      if (state === 'connected') {
        setWatchData(await syncWatchData());
      } else {
        setWatchData(null);
      }
    } catch {
      setWatchState(null);
    }
  };

  useEffect(() => {
    if (!user) return;
    // Real values only — no mockup defaults.
    setFullName(user.displayName ?? '');
    setDob(user.dob ?? '');
    setGender(user.gender ?? '');
    setHeight(user.height ? String(user.height) : '');
    setWeight(user.weight ? String(user.weight) : '');
    setBloodType(user.bloodType ?? '');
    setRestingHr(user.restingHr ? String(user.restingHr) : '');
    setDailyStepsGoal(user.dailyStepsGoal ? String(user.dailyStepsGoal) : '');
    setSleepDurationGoal(user.sleepDurationGoal ? String(user.sleepDurationGoal) : '');
    setWaterIntakeGoal(user.waterIntakeGoal ? String(user.waterIntakeGoal) : '');
    getSettings(user.id).then((s) => {
      setSettings(s);
      if (s.theme && s.theme !== theme) setTheme(s.theme);
    });
    refreshSteps();
    refreshWatch();
    (async () => {
      try {
        const be = await AsyncStorage.getItem(STORAGE_KEYS.BREAKS_ENABLED);
        const he = await AsyncStorage.getItem(STORAGE_KEYS.HYDRATION_ENABLED);
        const bi = await AsyncStorage.getItem(STORAGE_KEYS.BREAK_INTERVAL);
        const ht = await AsyncStorage.getItem(STORAGE_KEYS.HYDRATION_TARGET);
        if (be !== null) setBreaksEnabled(be === 'true');
        if (he !== null) setHydrationEnabled(he === 'true');
        if (bi !== null) setBreakInterval(parseInt(bi, 10) || 45);
        if (ht !== null) setHydrationTarget(parseInt(ht, 10) || 2500);
      } catch {}
    })();
    (async () => {
      if (!user.avatarUrl) {
        const cached = await AsyncStorage.getItem(`mindtrace_cached_avatar_${user.id}`);
        if (cached) await updateAvatar(cached);
      }
    })();
  }, [user]);

  const handleSelectAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Denied', 'Gallery access is required to change your photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]?.base64) {
        const b64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setIsUpdating(true);
        await updateAvatar(b64);
        if (user) await AsyncStorage.setItem(`mindtrace_cached_avatar_${user.id}`, b64);
        Alert.alert('Success', 'Profile picture updated.');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update photo.');
    } finally {
      setIsUpdating(false);
    }
  };

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
    if (user) await saveSettings(user.id, next);
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation', 'Full name cannot be empty.');
      return;
    }
    try {
      setIsUpdating(true);
      const patch: Partial<UserProfile> = {
        displayName: fullName.trim(),
        dob: dob.trim() || undefined,
        gender: gender.trim() || undefined,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        bloodType: bloodType.trim() || undefined,
        restingHr: restingHr ? parseInt(restingHr) : undefined,
        dailyStepsGoal: dailyStepsGoal ? parseInt(dailyStepsGoal) : undefined,
        sleepDurationGoal: sleepDurationGoal ? parseFloat(sleepDurationGoal) : undefined,
        waterIntakeGoal: waterIntakeGoal ? parseFloat(waterIntakeGoal) : undefined,
      };
      await updateHealthProfile(patch);
      Alert.alert('Saved', 'Health profile updated.');
      setIsEditing(false);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveReminders = async () => {
    setReminderBusy(true);
    try {
      const res = await NotificationService.saveAndSchedule(
        breaksEnabled,
        hydrationEnabled,
        breakInterval,
        hydrationTarget
      );
      Alert.alert(res.success ? 'Reminders saved' : 'Notice', res.text);
    } finally {
      setReminderBusy(false);
    }
  };

  const handleTestNotification = async () => {
    const res = await NotificationService.sendTestNotification();
    Alert.alert(res.success ? 'Test sent' : 'Notice', res.text);
  };

  const handleConnectWatch = async () => {
    setWatchBusy(true);
    try {
      const res = await connectWatch();
      Alert.alert(res.ok ? 'Watch connected' : 'Could not connect', res.message);
      await refreshWatch();
      await refreshSteps();
    } finally {
      setWatchBusy(false);
    }
  };

  const handleDisconnectWatch = async () => {
    await disconnectWatch();
    await refreshWatch();
  };

  const field = (label: string, value: string, set: (v: string) => void, extra?: object) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: c.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={set}
        editable={isEditing}
        placeholder="—"
        placeholderTextColor={c.faint}
        style={[
          styles.input,
          { color: c.ink, backgroundColor: c.bg, borderColor: c.line, opacity: isEditing ? 1 : 0.75 },
        ]}
        accessibilityLabel={label}
        {...extra}
      />
    </View>
  );

  const toggleRow = (
    icon: React.ComponentProps<typeof Feather>['name'],
    label: string,
    value: boolean,
    onChange: (v: boolean) => void
  ) => (
    <View style={styles.toggleRow}>
      <Feather name={icon} size={16} color={c.ink} />
      <Text style={[styles.toggleLabel, { color: c.ink }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: c.ink, false: c.line }}
        thumbColor={c.bg}
        accessibilityLabel={label}
      />
    </View>
  );

  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <CalmScreen>
      <Serif style={[styles.title, { color: c.ink }]}>Profile</Serif>

      <CalmCard>
        <View style={styles.idRow}>
          <Pressable
            onPress={handleSelectAvatar}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
          >
            {user?.avatarUrl ? (
              <ExpoImage
                source={{ uri: user.avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
                transition={300}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: c.limeSoft }]}>
                <Text style={[styles.avatarText, { color: c.ink }]}>{initials}</Text>
              </View>
            )}
            <View style={[styles.camBadge, { backgroundColor: c.ink }]}>
              <Feather name="camera" size={12} color={c.bg} />
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: c.ink }]}>{fullName || 'Your name'}</Text>
            <Text style={[styles.email, { color: c.muted }]}>{user?.email ?? ''}</Text>
            {summary ? (
              <Text style={[styles.score, { color: c.muted }]}>
                Wellness {summary.wellnessScore}% • {summary.riskLevel} risk
              </Text>
            ) : (
              <Text style={[styles.score, { color: c.muted }]}>No history yet</Text>
            )}
          </View>
        </View>
        <Pressable
          onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
          accessibilityRole="button"
          accessibilityLabel={isEditing ? 'Save profile' : 'Edit profile'}
          style={[styles.editBtn, { backgroundColor: c.ink, opacity: isUpdating ? 0.6 : 1 }]}
          disabled={isUpdating}
        >
          <Text style={[styles.editText, { color: c.bg }]}>
            {isUpdating ? 'Saving…' : isEditing ? 'Save changes' : 'Edit profile'}
          </Text>
        </Pressable>
      </CalmCard>

      <Serif style={[styles.section, { color: c.ink }]}>Health</Serif>
      <CalmCard>
        {field('FULL NAME', fullName, setFullName)}
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>{field('BIRTH DATE', dob, setDob, { placeholder: 'YYYY-MM-DD' })}</View>
          <View style={{ flex: 1 }}>{field('GENDER', gender, setGender)}</View>
        </View>
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>{field('HEIGHT (CM)', height, setHeight, { keyboardType: 'numeric' })}</View>
          <View style={{ flex: 1 }}>{field('WEIGHT (KG)', weight, setWeight, { keyboardType: 'numeric' })}</View>
        </View>
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>{field('BLOOD TYPE', bloodType, setBloodType)}</View>
          <View style={{ flex: 1 }}>{field('RESTING HR', restingHr, setRestingHr, { keyboardType: 'numeric' })}</View>
        </View>
      </CalmCard>

      <Serif style={[styles.section, { color: c.ink }]}>Daily goals</Serif>
      <CalmCard>
        {field('STEPS GOAL', dailyStepsGoal, setDailyStepsGoal, { keyboardType: 'numeric' })}
        {field('SLEEP GOAL (HRS)', sleepDurationGoal, setSleepDurationGoal, { keyboardType: 'numeric' })}
        {field('WATER GOAL (L)', waterIntakeGoal, setWaterIntakeGoal, { keyboardType: 'numeric' })}
      </CalmCard>

      <Serif style={[styles.section, { color: c.ink }]}>Preferences</Serif>
      <CalmCard>
        {toggleRow('moon', isDark ? 'Dark mode (on)' : 'Dark mode', theme === 'dark', (v) => {
          const next = v ? 'dark' : 'light';
          setTheme(next);
          persistSettings({ ...settings, theme: next });
        })}
        {toggleRow('bell', 'Notifications', settings.notificationsEnabled, (v) =>
          persistSettings({ ...settings, notificationsEnabled: v })
        )}
        {toggleRow('eye-off', 'Share anonymous analytics', settings.dataSharingEnabled, (v) =>
          persistSettings({ ...settings, dataSharingEnabled: v })
        )}
      </CalmCard>

      <Serif style={[styles.section, { color: c.ink }]}>Connected devices</Serif>
      <CalmCard>
        <View style={styles.deviceRow}>
          <Feather name="watch" size={20} color={c.ink} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.deviceTitle, { color: c.ink }]}>
              {watchState === 'connected' && watchData
                ? `${watchData.steps.toLocaleString()} steps • ${watchData.sleepHours != null ? `${watchData.sleepHours}h sleep` : 'no sleep yet'}${watchData.avgHr != null ? ` • ${watchData.avgHr} bpm` : ''}`
                : stepStatus && stepStatus.todaySteps > 0
                  ? `${stepStatus.todaySteps.toLocaleString()} steps today`
                  : 'Phone + watch steps'}
            </Text>
            <Text style={[styles.deviceSub, { color: c.muted }]}>
              {watchState === null || watchState === undefined
                ? 'Checking watch bridge…'
                : watchState === 'connected'
                  ? `Synced ${watchData ? new Date(watchData.syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'} from Health Connect. Galaxy / Pixel watches sync automatically.`
                  : watchState === 'needs-install'
                    ? 'Health Connect is missing or outdated — install it to link your watch.'
                    : watchState === 'missing-native'
                      ? 'Watch sync needs a dev build (Expo Go excludes the bridge). Phone steps still work below.'
                      : watchState === 'unavailable'
                        ? 'This device cannot run Health Connect. Phone steps still work below.'
                        : watchState === 'unsupported'
                          ? 'On iPhone your Apple Watch syncs through the phone automatically — step counting below covers it.'
                          : 'Link your Galaxy / Pixel watch through Health Connect for sleep, heart rate and workouts.'}
            </Text>
            {!watchState || watchState === 'not-connected' ? (
              <Text style={[styles.deviceSub, { color: c.muted, marginTop: 6 }]}>
                {stepStatus && stepStatus.todaySteps > 0
                  ? `Phone pedometer: ${stepStatus.todaySteps.toLocaleString()} steps today.`
                  : 'Phone pedometer covers basic step counting meanwhile.'}
              </Text>
            ) : null}
          </View>
        </View>

        {watchState === 'connected' ? (
          <View style={styles.watchActions}>
            <Pressable
              onPress={() => syncWatchData(true).then(setWatchData)}
              accessibilityRole="button"
              accessibilityLabel="Sync watch now"
              style={[styles.connectBtn, { backgroundColor: c.ink }]}
            >
              <Text style={[styles.connectText, { color: c.bg }]}>Sync now</Text>
            </Pressable>
            <Pressable
              onPress={openWatchSettings}
              accessibilityRole="button"
              accessibilityLabel="Open Health Connect settings"
              style={[styles.testBtn, { borderColor: c.line }]}
            >
              <Text style={[styles.testText, { color: c.ink }]}>Manage</Text>
            </Pressable>
            <Pressable
              onPress={handleDisconnectWatch}
              accessibilityRole="button"
              accessibilityLabel="Disconnect watch"
              style={styles.testBtn}
            >
              <Feather name="x" size={15} color={c.muted} />
            </Pressable>
          </View>
        ) : watchState === 'needs-install' ? (
          <Pressable
            onPress={openWatchStore}
            accessibilityRole="button"
            accessibilityLabel="Install Health Connect"
            style={[styles.connectBtn, { backgroundColor: c.ink }]}
          >
            <Text style={[styles.connectText, { color: c.bg }]}>Install Health Connect</Text>
          </Pressable>
        ) : watchState === 'not-connected' ? (
          <Pressable
            onPress={handleConnectWatch}
            disabled={watchBusy}
            accessibilityRole="button"
            accessibilityLabel="Connect your watch"
            style={[styles.connectBtn, { backgroundColor: c.ink, opacity: watchBusy ? 0.6 : 1 }]}
          >
            <Feather name="watch" size={15} color={c.bg} />
            <Text style={[styles.connectText, { color: c.bg }]}>
              {watchBusy ? 'Connecting…' : 'Connect watch'}
            </Text>
          </Pressable>
        ) : watchState === 'unsupported' ||
          watchState === 'missing-native' ||
          watchState === 'unavailable' ? (
          <Pressable
            onPress={async () => {
              const ok = await requestStepPermission();
              if (!ok) {
                Alert.alert(
                  'Motion permission needed',
                  'Allow physical activity access so Wellness AI can count steps from your phone and paired watch.'
                );
              }
              await refreshSteps();
            }}
            accessibilityRole="button"
            accessibilityLabel="Enable step counting"
            style={[styles.connectBtn, { backgroundColor: c.ink }]}
          >
            <Text style={[styles.connectText, { color: c.bg }]}>Enable step counting</Text>
          </Pressable>
        ) : null}
      </CalmCard>

      <Serif style={[styles.section, { color: c.ink }]}>Reminders</Serif>
      <CalmCard>
        {toggleRow('clock', 'Screen break reminders', breaksEnabled, setBreaksEnabled)}
        {breaksEnabled && (
          <View style={styles.chipRow}>
            {[30, 45, 60, 90].map((m) => {
              const active = breakInterval === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setBreakInterval(m)}
                  accessibilityRole="button"
                  accessibilityLabel={`Break every ${m} minutes`}
                  style={[
                    styles.chip,
                    { backgroundColor: active ? c.ink : c.surface, borderColor: c.line },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? c.bg : c.ink }]}>{m}m</Text>
                </Pressable>
              );
            })}
          </View>
        )}
        {toggleRow('droplet', 'Hydration reminders', hydrationEnabled, setHydrationEnabled)}
        {hydrationEnabled && (
          <View style={styles.chipRow}>
            {[1500, 2000, 2500, 3000].map((ml) => {
              const active = hydrationTarget === ml;
              return (
                <Pressable
                  key={ml}
                  onPress={() => setHydrationTarget(ml)}
                  accessibilityRole="button"
                  accessibilityLabel={`Hydration target ${(ml / 1000).toFixed(1)} liters`}
                  style={[
                    styles.chip,
                    { backgroundColor: active ? c.ink : c.surface, borderColor: c.line },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? c.bg : c.ink }]}>
                    {(ml / 1000).toFixed(1)}L
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
        <View style={styles.reminderActions}>
          <Pressable
            onPress={handleSaveReminders}
            disabled={reminderBusy}
            accessibilityRole="button"
            accessibilityLabel="Save reminder settings"
            style={[styles.saveBtn, { backgroundColor: c.ink, opacity: reminderBusy ? 0.6 : 1 }]}
          >
            <Text style={[styles.saveText, { color: c.bg }]}>
              {reminderBusy ? 'Saving…' : 'Save reminders'}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleTestNotification}
            accessibilityRole="button"
            accessibilityLabel="Send test notification"
            style={[styles.testBtn, { borderColor: c.line }]}
          >
            <Feather name="bell" size={15} color={c.ink} />
            <Text style={[styles.testText, { color: c.ink }]}>Test</Text>
          </Pressable>
        </View>
        <Text style={[styles.reminderNote, { color: c.muted }]}>
          Reminders pop up as system notifications, even with the app closed. Needs a dev build (not Expo Go) plus system permission.
        </Text>
      </CalmCard>

      <InkButton
        label="Sign out"
        onPress={async () => {
          await signOut();
          router.replace('/landing');
        }}
      />
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28 },
  section: { fontSize: 21, marginTop: 4 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '800' },
  camBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontFamily: fonts.bold, fontSize: 18 },
  email: { fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
  score: { fontFamily: fonts.medium, fontSize: 12, marginTop: 4 },
  editBtn: { borderRadius: 999, minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  editText: { fontFamily: fonts.bold, fontSize: 14 },
  field: { marginBottom: 10 },
  label: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.2, marginBottom: 4 },
  input: { borderWidth: 1.2, borderRadius: 14, minHeight: 48, paddingHorizontal: 12, fontFamily: fonts.regular, fontSize: 14 },
  twoCol: { flexDirection: 'row', gap: 10 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52 },
  toggleLabel: { flex: 1, fontFamily: fonts.semiBold, fontSize: 14 },
  deviceRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  deviceTitle: { fontFamily: fonts.bold, fontSize: 15 },
  deviceSub: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 4 },
  connectBtn: {
    flexDirection: 'row', gap: 8,
    borderRadius: 999, minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 12,
  },
  connectText: { fontFamily: fonts.bold, fontSize: 14 },
  watchActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  chipRow: { flexDirection: 'row', gap: 8, marginVertical: 6, flexWrap: 'wrap' },
  chip: {
    borderWidth: 1.2, borderRadius: 999, paddingHorizontal: 16, minHeight: 42,
    alignItems: 'center', justifyContent: 'center',
  },
  chipText: { fontFamily: fonts.bold, fontSize: 13 },
  reminderActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  saveBtn: { flex: 1, borderRadius: 999, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontFamily: fonts.bold, fontSize: 14 },
  testBtn: {
    flexDirection: 'row', gap: 6, borderWidth: 1.2, borderRadius: 999,
    paddingHorizontal: 18, minHeight: 48, alignItems: 'center', justifyContent: 'center',
  },
  testText: { fontFamily: fonts.bold, fontSize: 14 },
  reminderNote: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16, marginTop: 10 },
});
