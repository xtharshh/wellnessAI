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
});
