import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Switch,
  Text,
  View,
  Image,
  Pressable,
  ActivityIndicator,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { useAuthStore } from '@/src/stores/authStore';
import { useTheme } from '@/src/hooks/useTheme';
import { useWellnessSummary } from '@/src/hooks/useWellnessSummary';
import { typography } from '@/src/theme/typography';
import { radius, spacing } from '@/src/theme/spacing';
import { UserSettings, UserProfile } from '@/src/types/wellness';
import { getSettings, saveSettings } from '@/src/services/auth';

// Helper: Convert CM to Feet and Inches
function cmToFeetInches(cm: number): string {
  const inches = cm / 2.54;
  const feet = Math.floor(inches / 12);
  const remainingInches = Math.round(inches % 12);
  return `${feet}'${remainingInches}"`;
}

// Helper: Convert KG to LBS
function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462);
}

// Helper: Parse date to find age
function calculateAge(dobStr?: string): number {
  if (!dobStr) return 32; // Default fallback from mockup
  try {
    const birthDate = new Date(dobStr);
    if (isNaN(birthDate.getTime())) return 32;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch {
    return 32;
  }
}

// Helper: Format date for display (e.g. "April 12, 1993")
function formatDateDisplay(dobStr?: string): string {
  if (!dobStr) return 'April 12, 1993';
  try {
    const date = new Date(dobStr);
    if (isNaN(date.getTime())) return dobStr;
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dobStr;
  }
}

// Helper: Get Resting HR Description
function getHeartRateZone(hr?: number): string {
  if (!hr) return 'Normal range';
  if (hr < 60) return 'Athletic range';
  if (hr < 75) return 'Optimal range';
  return 'Normal range';
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const updateAvatar = useAuthStore((state) => state.updateAvatar);
  const updateHealthProfile = useAuthStore((state) => state.updateHealthProfile);
  const { theme, setTheme, colors, isDark } = useTheme();

  // Fetch stats from hook
  const { data: summaryData } = useWellnessSummary();
  const summary = summaryData?.summary;

  // Edit / Navigation Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Form Fields (initialized with user values or mockup defaults)
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [restingHr, setRestingHr] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  
  // Goals State
  const [dailyStepsGoal, setDailyStepsGoal] = useState('');
  const [sleepDurationGoal, setSleepDurationGoal] = useState('');
  const [waterIntakeGoal, setWaterIntakeGoal] = useState('');

  // Preference Settings State
  const [settings, setSettings] = useState<UserSettings>({
    notificationsEnabled: true,
    dataSharingEnabled: false,
    theme: 'dark',
  });

  // Sync state with user profile
  useEffect(() => {
    if (!user) return;
    setFullName(user.displayName ?? '');
    setDob(user.dob ?? '1993-04-12');
    setGender(user.gender ?? 'Male');
    setHeight(user.height ? String(user.height) : '178');
    setWeight(user.weight ? String(user.weight) : '76.2');
    setBodyFat(user.bodyFat ? String(user.bodyFat) : '18');
    setBloodType(user.bloodType ?? 'A+');
    setRestingHr(user.restingHr ? String(user.restingHr) : '62');
    setActivityLevel(user.activityLevel ?? 'Moderate');
    
    // Goals
    setDailyStepsGoal(user.dailyStepsGoal ? String(user.dailyStepsGoal) : '10000');
    setSleepDurationGoal(user.sleepDurationGoal ? String(user.sleepDurationGoal) : '7.5');
    setWaterIntakeGoal(user.waterIntakeGoal ? String(user.waterIntakeGoal) : '2.5');

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
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full name cannot be empty.');
      return;
    }

    try {
      setIsUpdating(true);
      
      const updatedProfile: Partial<UserProfile> = {
        displayName: fullName.trim(),
        dob: dob.trim(),
        gender: gender.trim(),
        height: parseFloat(height) || 178,
        weight: parseFloat(weight) || 76.2,
        bodyFat: parseFloat(bodyFat) || 18,
        bloodType: bloodType.trim(),
        restingHr: parseInt(restingHr) || 62,
        activityLevel: activityLevel,
        dailyStepsGoal: parseInt(dailyStepsGoal) || 10000,
        sleepDurationGoal: parseFloat(sleepDurationGoal) || 7.5,
        waterIntakeGoal: parseFloat(waterIntakeGoal) || 2.5,
      };

      await updateHealthProfile(updatedProfile);
      Alert.alert('Success', 'Health Profile updated successfully.');
      setIsEditing(false);
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
    if (fullName) {
      return fullName.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
    }
    return 'AC';
  };

  // Calculations for BMI and Progress Metrics
  const calculatedHeightCm = parseFloat(height) || 178;
  const calculatedWeightKg = parseFloat(weight) || 76.2;
  const bmiValue = Number((calculatedWeightKg / Math.pow(calculatedHeightCm / 100, 2)).toFixed(1));
  
  let bmiCategory = 'Normal';
  if (bmiValue < 18.5) bmiCategory = 'Underweight';
  else if (bmiValue < 25) bmiCategory = 'Normal';
  else if (bmiValue < 30) bmiCategory = 'Overweight';
  else bmiCategory = 'Obese';

  // Dynamic calculations for Mock steps, sleep, water goals values
  const currentStepsMock = 7240;
  const currentSleepMock = 7.2;
  const currentWaterMock = 1.8;

  const stepsGoalNum = parseInt(dailyStepsGoal) || 10000;
  const sleepGoalNum = parseFloat(sleepDurationGoal) || 7.5;
  const waterGoalNum = parseFloat(waterIntakeGoal) || 2.5;

  const stepsProgress = Math.min(1, currentStepsMock / stepsGoalNum);
  const sleepProgress = Math.min(1, currentSleepMock / sleepGoalNum);
  const waterProgress = Math.min(1, currentWaterMock / waterGoalNum);

  // Styling helpers
  const bgThemeColor = isDark ? '#0c0b16' : '#f6f5fb';
  const cardBgColor = isDark ? 'rgba(27, 24, 54, 0.5)' : '#ffffff';
  const cardBorderColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(124, 58, 237, 0.08)';
  const textColor = isDark ? '#ffffff' : '#0f0d1e';
  const textMutedColor = isDark ? '#9ca3af' : '#6b7280';
  const accentPurple = '#8b5cf6';
  const accentGreen = '#10b981';
  const accentPink = '#ec4899';
  const accentBlue = '#3b82f6';

  // EDIT HEALTH PROFILE SUB-SCREEN
  if (isEditing) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScreenContainer scrollable contentStyle={[styles.container, { backgroundColor: bgThemeColor }]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => setIsEditing(false)} style={[styles.circleBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0,0,0,0.03)' }]}>
              <Feather name="chevron-left" size={20} color={textColor} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: textColor }]}>Health Profile</Text>
            <Pressable onPress={handleSaveProfile} disabled={isUpdating} style={[styles.saveButton, { backgroundColor: accentPurple }]}>
              {isUpdating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </Pressable>
          </View>

          {/* PERSONAL & BODY */}
          <Text style={[styles.sectionHeading, { color: textMutedColor }]}>PERSONAL & BODY</Text>
          <GlassCard style={[styles.card, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
            {/* Full Name */}
            <View style={styles.formFieldContainer}>
              <Text style={[styles.formFieldTitle, { color: textMutedColor }]}>FULL NAME</Text>
              <View style={[
                styles.inputBox,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)',
                  borderColor: focusedField === 'fullName' ? accentPurple : cardBorderColor,
                }
              ]}>
                <Feather name="user" size={16} color={focusedField === 'fullName' ? accentPurple : textMutedColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.premiumInput, { color: textColor }]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g. Alex Chen"
                  placeholderTextColor={textMutedColor}
                  onFocus={() => setFocusedField('fullName')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.formFieldContainer}>
              <Text style={[styles.formFieldTitle, { color: textMutedColor }]}>DATE OF BIRTH</Text>
              <View style={[
                styles.inputBox,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)',
                  borderColor: focusedField === 'dob' ? accentPurple : cardBorderColor,
                }
              ]}>
                <Feather name="calendar" size={16} color={focusedField === 'dob' ? accentPurple : textMutedColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.premiumInput, { color: textColor }]}
                  value={dob}
                  onChangeText={setDob}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={textMutedColor}
                  onFocus={() => setFocusedField('dob')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Gender */}
            <View style={styles.formFieldContainer}>
              <Text style={[styles.formFieldTitle, { color: textMutedColor }]}>GENDER</Text>
              <View style={[
                styles.inputBox,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)',
                  borderColor: focusedField === 'gender' ? accentPurple : cardBorderColor,
                }
              ]}>
                <Feather name="award" size={16} color={focusedField === 'gender' ? accentPurple : textMutedColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.premiumInput, { color: textColor }]}
                  value={gender}
                  onChangeText={setGender}
                  placeholder="Male / Female"
                  placeholderTextColor={textMutedColor}
                  onFocus={() => setFocusedField('gender')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Height */}
            <View style={styles.formFieldContainer}>
              <Text style={[styles.formFieldTitle, { color: textMutedColor }]}>HEIGHT (CM)</Text>
              <View style={[
                styles.inputBox,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)',
                  borderColor: focusedField === 'height' ? accentPurple : cardBorderColor,
                }
              ]}>
                <Feather name="bar-chart-2" size={16} color={focusedField === 'height' ? accentPurple : textMutedColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.premiumInput, { color: textColor }]}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  placeholder="e.g. 178"
                  placeholderTextColor={textMutedColor}
                  onFocus={() => setFocusedField('height')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Weight */}
            <View style={styles.formFieldContainer}>
              <Text style={[styles.formFieldTitle, { color: textMutedColor }]}>WEIGHT (KG)</Text>
              <View style={[
                styles.inputBox,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)',
                  borderColor: focusedField === 'weight' ? accentPurple : cardBorderColor,
                }
              ]}>
                <Feather name="activity" size={16} color={focusedField === 'weight' ? accentPurple : textMutedColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.premiumInput, { color: textColor }]}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholder="e.g. 76.2"
                  placeholderTextColor={textMutedColor}
                  onFocus={() => setFocusedField('weight')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Body Fat */}
            <View style={styles.formFieldContainer}>
              <Text style={[styles.formFieldTitle, { color: textMutedColor }]}>BODY FAT (%)</Text>
              <View style={[
                styles.inputBox,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)',
                  borderColor: focusedField === 'bodyFat' ? accentPurple : cardBorderColor,
                }
              ]}>
                <Feather name="pie-chart" size={16} color={focusedField === 'bodyFat' ? accentPurple : textMutedColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.premiumInput, { color: textColor }]}
                  value={bodyFat}
                  onChangeText={setBodyFat}
                  keyboardType="numeric"
                  placeholder="e.g. 18"
                  placeholderTextColor={textMutedColor}
                  onFocus={() => setFocusedField('bodyFat')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Blood Type */}
            <View style={styles.formFieldContainer}>
              <Text style={[styles.formFieldTitle, { color: textMutedColor }]}>BLOOD TYPE</Text>
              <View style={[
                styles.inputBox,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)',
                  borderColor: focusedField === 'bloodType' ? accentPurple : cardBorderColor,
                }
              ]}>
                <Feather name="droplet" size={16} color={focusedField === 'bloodType' ? accentPurple : textMutedColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.premiumInput, { color: textColor }]}
                  value={bloodType}
                  onChangeText={setBloodType}
                  placeholder="e.g. A+"
                  placeholderTextColor={textMutedColor}
                  onFocus={() => setFocusedField('bloodType')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Resting HR */}
            <View style={styles.formFieldContainer}>
              <Text style={[styles.formFieldTitle, { color: textMutedColor }]}>RESTING HR (BPM)</Text>
              <View style={[
                styles.inputBox,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)',
                  borderColor: focusedField === 'restingHr' ? accentPurple : cardBorderColor,
                }
              ]}>
                <Feather name="heart" size={16} color={focusedField === 'restingHr' ? accentPurple : textMutedColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.premiumInput, { color: textColor }]}
                  value={restingHr}
                  onChangeText={setRestingHr}
                  keyboardType="numeric"
                  placeholder="e.g. 62"
                  placeholderTextColor={textMutedColor}
                  onFocus={() => setFocusedField('restingHr')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>
          </GlassCard>

          {/* ACTIVITY LEVEL */}
          <Text style={[styles.sectionHeading, { color: textMutedColor }]}>ACTIVITY LEVEL</Text>
          <View style={styles.activityContainer}>
            {[
              { level: 'Sedentary', icon: 'coffee' as const },
              { level: 'Light', icon: 'sun' as const },
              { level: 'Moderate', icon: 'activity' as const },
              { level: 'Active', icon: 'zap' as const }
            ].map(({ level, icon }) => {
              const isSelected = activityLevel === level;
              return (
                <Pressable
                  key={level}
                  onPress={() => setActivityLevel(level)}
                  style={[
                    styles.activityPill,
                    {
                      backgroundColor: isSelected
                        ? 'rgba(139, 92, 246, 0.12)'
                        : isDark
                        ? 'rgba(255,255,255,0.04)'
                        : '#ffffff',
                      borderColor: isSelected ? accentPurple : cardBorderColor,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                >
                  <View style={styles.activityHeaderRow}>
                    <Feather name={icon} size={14} color={isSelected ? accentPurple : textMutedColor} style={{ marginRight: 6 }} />
                    <Text
                      style={[
                        styles.activityPillText,
                        {
                          color: isSelected ? accentPurple : textColor,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {level}
                    </Text>
                  </View>
                  {isSelected && (
                    <Feather name="check-circle" size={10} color={accentPurple} style={styles.activityCheck} />
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* DAILY GOALS */}
          <Text style={[styles.sectionHeading, { color: textMutedColor }]}>DAILY GOALS CONFIGURATION</Text>
          <GlassCard style={[styles.card, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
            {/* Daily Steps */}
            <View style={styles.formFieldContainer}>
              <Text style={[styles.formFieldTitle, { color: textMutedColor }]}>DAILY STEPS TARGET</Text>
              <View style={[
                styles.inputBox,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)',
                  borderColor: focusedField === 'dailyStepsGoal' ? accentPurple : cardBorderColor,
                }
              ]}>
                <Feather name="zap" size={16} color={focusedField === 'dailyStepsGoal' ? accentPurple : textMutedColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.premiumInput, { color: textColor }]}
                  value={dailyStepsGoal}
                  onChangeText={setDailyStepsGoal}
                  keyboardType="numeric"
                  placeholder="10000"
                  placeholderTextColor={textMutedColor}
                  onFocus={() => setFocusedField('dailyStepsGoal')}
                  onBlur={() => setFocusedField(null)}
                />
                <Text style={[styles.unitText, { color: textMutedColor }]}>steps</Text>
              </View>

              {/* Steps Progress Preview */}
              <View style={styles.goalProgressContainer}>
                <View style={styles.goalProgressRow}>
                  <Text style={[styles.goalProgressLabel, { color: textMutedColor }]}>
                    Current pace: {currentStepsMock} steps
                  </Text>
                  <Text style={[styles.goalProgressPercent, { color: accentPurple }]}>
                    {Math.round(stepsProgress * 100)}%
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                  <View style={[styles.progressBarFill, { backgroundColor: accentPurple, width: `${stepsProgress * 100}%` }]} />
                </View>
              </View>
            </View>

            {/* Sleep Duration */}
            <View style={styles.formFieldContainer}>
              <Text style={[styles.formFieldTitle, { color: textMutedColor }]}>SLEEP DURATION GOAL</Text>
              <View style={[
                styles.inputBox,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)',
                  borderColor: focusedField === 'sleepDurationGoal' ? accentPurple : cardBorderColor,
                }
              ]}>
                <Feather name="moon" size={16} color={focusedField === 'sleepDurationGoal' ? accentPurple : textMutedColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.premiumInput, { color: textColor }]}
                  value={sleepDurationGoal}
                  onChangeText={setSleepDurationGoal}
                  keyboardType="numeric"
                  placeholder="7.5"
                  placeholderTextColor={textMutedColor}
                  onFocus={() => setFocusedField('sleepDurationGoal')}
                  onBlur={() => setFocusedField(null)}
                />
                <Text style={[styles.unitText, { color: textMutedColor }]}>hours</Text>
              </View>

              {/* Sleep Progress Preview */}
              <View style={styles.goalProgressContainer}>
                <View style={styles.goalProgressRow}>
                  <Text style={[styles.goalProgressLabel, { color: textMutedColor }]}>
                    Current sleep: {currentSleepMock} hrs
                  </Text>
                  <Text style={[styles.goalProgressPercent, { color: accentPurple }]}>
                    {Math.round(sleepProgress * 100)}%
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                  <View style={[styles.progressBarFill, { backgroundColor: accentPurple, width: `${sleepProgress * 100}%` }]} />
                </View>
              </View>
            </View>

            {/* Water Intake */}
            <View style={styles.formFieldContainer}>
              <Text style={[styles.formFieldTitle, { color: textMutedColor }]}>WATER INTAKE TARGET</Text>
              <View style={[
                styles.inputBox,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)',
                  borderColor: focusedField === 'waterIntakeGoal' ? accentPurple : cardBorderColor,
                }
              ]}>
                <Feather name="droplet" size={16} color={focusedField === 'waterIntakeGoal' ? accentPurple : textMutedColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.premiumInput, { color: textColor }]}
                  value={waterIntakeGoal}
                  onChangeText={setWaterIntakeGoal}
                  keyboardType="numeric"
                  placeholder="2.5"
                  placeholderTextColor={textMutedColor}
                  onFocus={() => setFocusedField('waterIntakeGoal')}
                  onBlur={() => setFocusedField(null)}
                />
                <Text style={[styles.unitText, { color: textMutedColor }]}>L/day</Text>
              </View>

              {/* Water Progress Preview */}
              <View style={styles.goalProgressContainer}>
                <View style={styles.goalProgressRow}>
                  <Text style={[styles.goalProgressLabel, { color: textMutedColor }]}>
                    Current intake: {currentWaterMock} L
                  </Text>
                  <Text style={[styles.goalProgressPercent, { color: accentPurple }]}>
                    {Math.round(waterProgress * 100)}%
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                  <View style={[styles.progressBarFill, { backgroundColor: accentPurple, width: `${waterProgress * 100}%` }]} />
                </View>
              </View>
            </View>
          </GlassCard>

          {/* SPACER */}
          <View style={{ height: 120 }} />
        </ScreenContainer>
      </KeyboardAvoidingView>
    );
  }

  // OVERVIEW MY PROFILE SCREEN
  return (
    <ScreenContainer scrollable contentStyle={[styles.container, { backgroundColor: bgThemeColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>My Profile</Text>
        <Pressable onPress={() => setIsEditing(true)} style={[styles.editButton, { backgroundColor: accentPurple }]}>
          <Text style={styles.editButtonText}>Edit</Text>
        </Pressable>
      </View>

      {/* Avatar block */}
      <View style={[styles.profileCard, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
        <Pressable onPress={handleSelectAvatar} style={styles.avatarWrapper}>
          {isUpdating ? (
            <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : '#ebe6f6' }]}>
              <ActivityIndicator size="small" color={accentPurple} />
            </View>
          ) : user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#ebe6f6' }]}>
              <Text style={[styles.avatarInitials, { color: accentPurple }]}>{getProfileInitials()}</Text>
            </View>
          )}
          <View style={[styles.avatarCameraBadge, { backgroundColor: accentGreen }]} />
        </Pressable>
        
        <View style={styles.profileDetails}>
          <Text style={[styles.profileName, { color: textColor }]}>{fullName || 'Alex Chen'}</Text>
          <Text style={[styles.profileEmail, { color: textMutedColor }]}>{user?.email || 'alex@mindtrace.ai'}</Text>
          
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
              <Text style={[styles.badgeText, { color: accentGreen }]}>
                • {summary?.riskLevel ? `${summary.riskLevel.charAt(0).toUpperCase() + summary.riskLevel.slice(1)} Risk` : 'Low Risk'}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(139, 92, 246, 0.08)' }]}>
              <Text style={[styles.badgeText, { color: accentPurple }]}>Pro Member</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(59, 130, 246, 0.08)' }]}>
              <Text style={[styles.badgeText, { color: accentBlue }]}>{gender} • {calculateAge(dob)}</Text>
            </View>
          </View>
        </View>

        <Feather name="chevron-right" size={20} color={textMutedColor} style={styles.chevron} />
      </View>

      {/* Core Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statItemCard, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.08)' }]}>
            <Feather name="zap" size={14} color={accentPurple} />
          </View>
          <Text style={[styles.statValueText, { color: textColor }]}>14</Text>
          <Text style={[styles.statLabelText, { color: textMutedColor }]}>DAY STREAK</Text>
        </View>

        <View style={[styles.statItemCard, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
            <Feather name="activity" size={14} color={accentGreen} />
          </View>
          <Text style={[styles.statValueText, { color: textColor }]}>38</Text>
          <Text style={[styles.statLabelText, { color: textMutedColor }]}>SESSIONS</Text>
        </View>

        <View style={[styles.statItemCard, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(236, 72, 153, 0.08)' }]}>
            <Feather name="sparkles" size={14} color={accentPink} />
          </View>
          <Text style={[styles.statValueText, { color: textColor }]}>12</Text>
          <Text style={[styles.statLabelText, { color: textMutedColor }]}>INSIGHTS</Text>
        </View>

        <View style={[styles.statItemCard, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}>
            <Feather name="heart" size={14} color={accentPink} />
          </View>
          <Text style={[styles.statValueText, { color: textColor }]}>{bloodType}</Text>
          <Text style={[styles.statLabelText, { color: textMutedColor }]}>BLOOD TYPE</Text>
        </View>
      </View>

      {/* BODY METRICS Grid */}
      <Text style={[styles.sectionHeading, { color: textMutedColor }]}>BODY METRICS</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
            <View style={styles.metricHeader}>
              <Text style={[styles.metricLabel, { color: textMutedColor }]}>HEIGHT</Text>
              <Feather name="bar-chart-2" size={16} color={accentBlue} />
            </View>
            <Text style={[styles.metricValue, { color: textColor }]}>{calculatedHeightCm} cm</Text>
            <Text style={[styles.metricSubtext, { color: textMutedColor }]}>{cmToFeetInches(calculatedHeightCm)}</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
            <View style={styles.metricHeader}>
              <Text style={[styles.metricLabel, { color: textMutedColor }]}>WEIGHT</Text>
              <Feather name="activity" size={16} color={accentGreen} />
            </View>
            <Text style={[styles.metricValue, { color: textColor }]}>{calculatedWeightKg} kg</Text>
            <Text style={[styles.metricSubtext, { color: textMutedColor }]}>{kgToLbs(calculatedWeightKg)} lbs</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
            <View style={styles.metricHeader}>
              <Text style={[styles.metricLabel, { color: textMutedColor }]}>AGE</Text>
              <Feather name="clock" size={16} color={accentPurple} />
            </View>
            <Text style={[styles.metricValue, { color: textColor }]}>{calculateAge(dob)} yrs</Text>
            <Text style={[styles.metricSubtext, { color: textMutedColor }]}>{formatDateDisplay(dob)}</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
            <View style={styles.metricHeader}>
              <Text style={[styles.metricLabel, { color: textMutedColor }]}>RESTING HR</Text>
              <Feather name="heart" size={16} color={accentPink} />
            </View>
            <Text style={[styles.metricValue, { color: textColor }]}>{restingHr} bpm</Text>
            <Text style={[styles.metricSubtext, { color: textMutedColor }]}>{getHeartRateZone(parseInt(restingHr))}</Text>
          </View>
        </View>
      </View>

      {/* BMI & Preferences Row */}
      <View style={styles.bottomRow}>
        {/* BMI Circular progress gauge */}
        <View style={[styles.bmiCard, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
          <Text style={[styles.bmiTitle, { color: textMutedColor }]}>BMI</Text>
          
          <View style={styles.bmiGaugeContainer}>
            <Svg width={100} height={100} viewBox="0 0 100 100">
              <Circle
                cx="50"
                cy="50"
                r="40"
                stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}
                strokeWidth="8"
                fill="none"
              />
              <Circle
                cx="50"
                cy="50"
                r="40"
                stroke={accentGreen}
                strokeWidth="8"
                fill="none"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * Math.min(bmiValue, 40)) / 40}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </Svg>
            <View style={styles.bmiTextOverlay}>
              <Text style={[styles.bmiScoreText, { color: textColor }]}>{bmiValue}</Text>
              <Text style={[styles.bmiStatusText, { color: accentGreen }]}>{bmiCategory}</Text>
            </View>
          </View>
        </View>

        {/* Preferences & Sign Out */}
        <View style={[styles.preferencesCard, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
          <View style={styles.prefRow}>
            <View style={styles.prefLeft}>
              <Feather name="moon" size={14} color={textColor} />
              <Text style={[styles.prefText, { color: textColor }]}>Dark Mode</Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={(value) => {
                const nextTheme = value ? 'dark' : 'light';
                setTheme(nextTheme);
                persistSettings({ ...settings, theme: nextTheme });
              }}
              trackColor={{ true: accentPurple, false: isDark ? '#374151' : '#d1d5db' }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View style={styles.prefRow}>
            <View style={styles.prefLeft}>
              <Feather name="bell" size={14} color={textColor} />
              <Text style={[styles.prefText, { color: textColor }]}>Notifications</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(value) =>
                persistSettings({ ...settings, notificationsEnabled: value })
              }
              trackColor={{ true: accentPurple, false: isDark ? '#374151' : '#d1d5db' }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View style={styles.prefRow}>
            <View style={styles.prefLeft}>
              <Feather name="eye-off" size={14} color={textColor} />
              <Text style={[styles.prefText, { color: textColor }]}>Privacy Mode</Text>
            </View>
            <Switch
              value={settings.dataSharingEnabled}
              onValueChange={(value) =>
                persistSettings({ ...settings, dataSharingEnabled: value })
              }
              trackColor={{ true: accentPurple, false: isDark ? '#374151' : '#d1d5db' }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View style={styles.divider} />

          <Pressable onPress={handleLogout} style={styles.signOutItem}>
            <Feather name="log-out" size={14} color="#f43f5e" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 15,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  saveButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 15,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  profileDetails: {
    flex: 1,
    marginLeft: 14,
    gap: 2,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileEmail: {
    fontSize: 13,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  chevron: {
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statItemCard: {
    flex: 1,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValueText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  statLabelText: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 8,
  },
  metricsGrid: {
    gap: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  metricSubtext: {
    fontSize: 11,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bmiCard: {
    flex: 1.1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bmiTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    alignSelf: 'flex-start',
  },
  bmiGaugeContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bmiTextOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bmiScoreText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bmiStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  preferencesCard: {
    flex: 1.5,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    gap: 12,
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prefText: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    marginVertical: 2,
  },
  signOutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  signOutText: {
    color: '#f43f5e',
    fontSize: 12,
    fontWeight: 'bold',
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 14,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  fieldInput: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    paddingVertical: 2,
  },
  activityContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  activityPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityPillText: {
    fontSize: 12,
  },
  formFieldContainer: {
    gap: 6,
    width: '100%',
  },
  formFieldTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 10,
  },
  premiumInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    height: '100%',
    padding: 0,
  },
  unitText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  activityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  goalProgressContainer: {
    marginTop: 4,
    gap: 4,
  },
  goalProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalProgressLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  goalProgressPercent: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
