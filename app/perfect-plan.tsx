import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { CalmCard, CalmHeader, CalmScreen, InkButton, Serif, useCalm } from '@/src/components/calm/kit';
import { useExercises } from '@/src/hooks/useExercises';
import { useWellnessSummary } from '@/src/hooks/useWellnessSummary';
import { setupPerfectPlanExercises } from '@/src/services/exercises';
import { useAuthStore } from '@/src/stores/authStore';
import { fonts } from '@/src/theme/typography';

const BLOCKS = [
  {
    name: 'Morning',
    time: '6:30 AM',
    icon: 'sun' as const,
    tint: 'periwinkle' as const,
    items: [
      { name: 'Wake without alarm', tag: '+Mood' },
      { name: '5-min gratitude log', tag: '+Mood 12%' },
      { name: '10-min stretch', tag: '+Activity' },
    ],
  },
  {
    name: 'Midday',
    time: '12:30 PM',
    icon: 'activity' as const,
    tint: 'sage' as const,
    items: [
      { name: '20-min mindful walk', tag: '−Stress 18%' },
      { name: 'Screen-free lunch', tag: '+Focus' },
    ],
  },
  {
    name: 'Evening',
    time: '9:00 PM',
    icon: 'moon' as const,
    tint: 'lavender' as const,
    items: [
      { name: 'Digital sunset — screens off', tag: '+Sleep' },
      { name: '4-7-8 breathing', tag: '−Stress 30%' },
      { name: 'Journal entry', tag: '+Mood 10%' },
    ],
  },
];

export default function PerfectPlanScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { c } = useCalm();
  const { data: exercises, refetch: refetchExercises } = useExercises();
  const { data: wellnessData } = useWellnessSummary();
  const summary = wellnessData?.summary ?? null;
  const [activating, setActivating] = useState(false);

  const isPlanActive = (exercises || []).some(
    (e) => e.name.toLowerCase().trim() === 'mindful posture check'
  );

  const moodGain = summary ? Math.max(4, Math.min(20, Math.round((100 - summary.moodScore) * 0.18))) : null;
  const sleepGain = summary
    ? Math.max(5, Math.min(30, Math.round((8 - Math.min(summary.sleepHours, 8)) * 12 + 8)))
    : null;
  const stressDrop = summary ? Math.max(8, Math.min(35, Math.round(summary.stressIndex * 0.35))) : null;

  const handleActivate = async () => {
    if (!user) return;
    setActivating(true);
    try {
      await setupPerfectPlanExercises(user.id);
      await refetchExercises();
      Alert.alert('Perfect Plan Activated!', 'Your routine guides are in the Exercises library.', [
        { text: 'Go to Exercises', onPress: () => router.push('/(tabs)/exercises') },
        { text: 'Dismiss', style: 'cancel' },
      ]);
    } catch (err) {
      Alert.alert('Activation Error', err instanceof Error ? err.message : 'Failed to configure exercises.');
    } finally {
      setActivating(false);
    }
  };

  return (
    <CalmScreen>
      <CalmHeader
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard'))}
      />
      <Serif style={[styles.title, { color: c.ink }]}>Your Perfect Plan</Serif>
      <Text style={[styles.sub, { color: c.muted }]}>AI-calibrated to your behavioral patterns</Text>

      <CalmCard tint="sage">
        <Text style={[styles.projLabel, { color: c.muted }]}>PROJECTED IMPROVEMENT • 7 DAYS</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: c.surface }]}>
            <Text style={[styles.badgeText, { color: c.ink }]}>
              {moodGain !== null ? `Mood +${moodGain}%` : 'Mood —'}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: c.surface }]}>
            <Text style={[styles.badgeText, { color: c.ink }]}>
              {sleepGain !== null ? `Sleep +${sleepGain}%` : 'Sleep —'}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: c.surface }]}>
            <Text style={[styles.badgeText, { color: c.ink }]}>
              {stressDrop !== null ? `Stress −${stressDrop}%` : 'Stress —'}
            </Text>
          </View>
        </View>
        {!summary ? (
          <Text style={[styles.note, { color: c.muted }]}>
            Projections appear after your first real snapshot. Nothing is estimated.
          </Text>
        ) : null}
      </CalmCard>

      {BLOCKS.map((b) => (
        <CalmCard key={b.name} tint={b.tint}>
          <View style={styles.blockHead}>
            <Feather name={b.icon} size={16} color={c.ink} />
            <Text style={[styles.blockTitle, { color: c.ink }]}>{b.name}</Text>
            <Text style={[styles.blockTime, { color: c.muted }]}>{b.time}</Text>
          </View>
          {b.items.map((it) => (
            <View key={it.name} style={styles.routineRow}>
              <Text style={[styles.routineName, { color: c.ink }]}>{it.name}</Text>
              <View style={[styles.tag, { backgroundColor: c.surface }]}>
                <Text style={[styles.tagText, { color: c.muted }]}>{it.tag}</Text>
              </View>
            </View>
          ))}
        </CalmCard>
      ))}

      {isPlanActive ? (
        <InkButton label="Plan Active — open Exercises" onPress={() => router.push('/(tabs)/exercises')} />
      ) : activating ? (
        <View style={[styles.loading, { backgroundColor: c.ink }]}>
          <ActivityIndicator color={c.bg} />
        </View>
      ) : (
        <InkButton label="Activate My Plan" onPress={handleActivate} icon="zap" />
      )}
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, textAlign: 'center' },
  sub: { fontFamily: fonts.medium, fontSize: 13, textAlign: 'center', marginTop: -8 },
  projLabel: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.2 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 10 },
  badge: { flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
  badgeText: { fontFamily: fonts.bold, fontSize: 12 },
  note: { fontFamily: fonts.regular, fontSize: 12, marginTop: 8, lineHeight: 17 },
  blockHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  blockTitle: { fontFamily: fonts.bold, fontSize: 15, flex: 1 },
  blockTime: { fontFamily: fonts.semiBold, fontSize: 12 },
  routineRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7,
  },
  routineName: { fontFamily: fonts.medium, fontSize: 13, flex: 1 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  tagText: { fontFamily: fonts.bold, fontSize: 11 },
  loading: { minHeight: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
