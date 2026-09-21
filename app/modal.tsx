import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalmCard, CalmHeader, CalmScreen, MoodCurve, Serif, useCalm } from '@/src/components/calm/kit';
import { serif } from '@/src/theme/calm';
import { useWellnessSummary } from '@/src/hooks/useWellnessSummary';
import { fonts } from '@/src/theme/typography';

const META: Record<string, { title: string; description: string; icon: any; key: 'moodScore' | 'sleepHours' | 'activityLevel' | 'stressIndex' }> = {
  mood: {
    title: 'Mood',
    description: 'Passively inferred from typing flow — keystroke cadence and correction ratios — combined with rest.',
    icon: 'heart',
    key: 'moodScore',
  },
  sleep: {
    title: 'Sleep',
    description: 'Estimated from the real overnight gap between your last and first device interaction.',
    icon: 'moon',
    key: 'sleepHours',
  },
  activity: {
    title: 'Activity',
    description: 'Movement and interaction energy measured from motion and device signals.',
    icon: 'activity',
    key: 'activityLevel',
  },
  stress: {
    title: 'Stress',
    description: 'Typing tension, correction rate and checking behavior distilled into one index.',
    icon: 'zap',
    key: 'stressIndex',
  },
  wellness: {
    title: 'Wellness',
    description: 'Composite of mood, sleep, activity and calm. Your single quiet number.',
    icon: 'award',
    key: 'moodScore',
  },
};

export default function ModalScreen() {
  const { metric } = useLocalSearchParams<{ metric?: string }>();
  const router = useRouter();
  const { c } = useCalm();
  const { data } = useWellnessSummary();
  const summary = data?.summary ?? null;
  const series = data?.series ?? null;
  const [range, setRange] = useState<7 | 30 | 90>(7);

  const meta = META[metric ?? 'wellness'] ?? META.wellness;
  const full = meta.key === 'moodScore' && metric === 'wellness'
    ? (series?.mood ?? [])
    : (series?.[meta.key === 'moodScore' ? 'mood' : meta.key === 'sleepHours' ? 'sleep' : meta.key === 'activityLevel' ? 'activity' : 'stress'] ?? []);
  const sliced = full.slice(-range);
  const avg = sliced.length ? sliced.reduce((a, b) => a + b, 0) / sliced.length : null;
  const peak = sliced.length ? Math.max(...sliced) : null;
  const low = sliced.length ? Math.min(...sliced) : null;
  const current =
    meta.key === 'moodScore' && metric === 'wellness'
      ? summary?.wellnessScore ?? null
      : summary
        ? meta.key === 'moodScore' ? summary.moodScore
        : meta.key === 'sleepHours' ? summary.sleepHours
        : meta.key === 'activityLevel' ? summary.activityLevel
        : summary.stressIndex
        : null;

  const fmt = (v: number | null) =>
    v === null ? '—' : meta.key === 'sleepHours' ? `${Number(v).toFixed(1)}h` : `${Math.round(v)}`;

  return (
    <CalmScreen>
      <CalmHeader
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard'))}
      />
      <View style={styles.hero}>
        <View style={[styles.icon, { backgroundColor: c.limeSoft }]}>
          <Feather name={meta.icon} size={22} color={c.limeInk} />
        </View>
        <Serif style={[styles.title, { color: c.ink }]}>{meta.title}</Serif>
        <Text style={[styles.desc, { color: c.muted }]}>{meta.description}</Text>
      </View>

      <CalmCard tint="sage">
        <Text style={[styles.label, { color: c.muted }]}>CURRENT</Text>
        <Text style={[styles.big, { color: c.ink }]}>{fmt(current)}</Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: c.ink }]}>{fmt(avg)}</Text>
            <Text style={[styles.statLabel, { color: c.muted }]}>Avg</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: c.ink }]}>{fmt(peak)}</Text>
            <Text style={[styles.statLabel, { color: c.muted }]}>Peak</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: c.ink }]}>{fmt(low)}</Text>
            <Text style={[styles.statLabel, { color: c.muted }]}>Low</Text>
          </View>
        </View>
      </CalmCard>

      <View style={styles.rangeRow}>
        {([7, 30, 90] as const).map((r) => {
          const active = range === r;
          return (
            <Pressable
              key={r}
              onPress={() => setRange(r)}
              accessibilityRole="button"
              accessibilityLabel={`Show last ${r} days`}
              style={[styles.range, { backgroundColor: active ? c.ink : c.surface, borderColor: c.line }]}
            >
              <Text style={[styles.rangeText, { color: active ? c.bg : c.ink }]}>{r}D</Text>
            </Pressable>
          );
        })}
      </View>

      <CalmCard>
        <MoodCurve data={sliced.map((v) => (meta.key === 'sleepHours' ? Math.min((v / 12) * 100, 100) : v))} width={310} height={110} />
      </CalmCard>

      <Text style={[styles.note, { color: c.muted }]}>
        {sliced.length < 2
          ? 'Not enough real history for this range yet.'
          : `Based on ${sliced.length} real snapshots. Nothing estimated.`}
      </Text>
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 6 },
  icon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, marginTop: 6 },
  desc: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  label: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.5 },
  big: { fontFamily: serif, fontWeight: '700', fontSize: 46, lineHeight: 50 },
  stats: { flexDirection: 'row', gap: 12, marginTop: 10 },
  stat: { flex: 1 },
  statVal: { fontFamily: fonts.bold, fontSize: 17 },
  statLabel: { fontFamily: fonts.medium, fontSize: 11 },
  rangeRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  range: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 18, minHeight: 42, justifyContent: 'center' },
  rangeText: { fontFamily: fonts.bold, fontSize: 13 },
  note: { fontFamily: fonts.regular, fontSize: 12, textAlign: 'center' },
});
