import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CalmCard,
  CalmHeader,
  CalmScreen,
  DayStrip,
  InkButton,
  MoodCurve,
  PoweredByAI,
  Serif,
  StatTile,
  useCalm,
  type DayItem,
} from '@/src/components/calm/kit';
import { useWellnessSummary } from '@/src/hooks/useWellnessSummary';
import { getLiveMetrics } from '@/src/services/realAnalytics';
import { fonts } from '@/src/theme/typography';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function AIInsightsScreen() {
  const router = useRouter();
  const { c } = useCalm();
  const { data: summaryData } = useWellnessSummary();
  const summary = summaryData?.summary ?? null;
  const series = summaryData?.series ?? null;

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [liveFocus, setLiveFocus] = useState<number | null>(null);

  React.useEffect(() => {
    getLiveMetrics()
      .then((m) => setLiveFocus(m.behaviorAnalysis?.focusLevel ?? null))
      .catch(() => {});
  }, []);

  const moodArr = series?.mood ?? [];
  const stressArr = series?.stress ?? [];
  const sleepArr = series?.sleep ?? [];

  // Day strip from REAL snapshot dates (last 8), falling back to last 8 calendar days.
  const today = new Date();
  const days: DayItem[] = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (7 - i));
    return {
      key: d.toISOString().slice(0, 10),
      dayNum: String(d.getDate()).padStart(2, '0'),
      weekday: WEEKDAYS[d.getDay()],
      selected: false,
    };
  });
  const activeKey = selectedKey ?? days[days.length - 1].key;
  days.forEach((d) => {
    d.selected = d.key === activeKey;
  });

  // Selected-day values: match snapshot by date, else latest summary.
  const [snapState, setSnapState] = useState<any[] | null>(null);
  React.useEffect(() => {
    import('@/src/services/wellness').then((w) =>
      w.getSnapshots('me', 8).then(setSnapState).catch(() => setSnapState([]))
    );
  }, []);
  const selSnap =
    (snapState ?? []).find((s: any) => s.recordedAt.slice(0, 10) === activeKey) ??
    (snapState ?? [])[(snapState ?? []).length - 1] ??
    null;

  const stressVal = selSnap ? Math.round(selSnap.stressIndex) : summary?.stressIndex;
  const sleepVal = selSnap ? Number(selSnap.sleepHours).toFixed(1).replace('.0', '') : summary?.sleepHours;
  const anxietyDays = stressArr.filter((v) => v > 60).length;
  const focusVal = liveFocus ?? (summary ? Math.round(summary.activityLevel * 0.7 + summary.moodScore * 0.3) : null);
  const peakMood = moodArr.length ? Math.max(...moodArr) : null;

  return (
    <CalmScreen>
      <CalmHeader
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard'))}
      />

      <Text style={[styles.date, { color: c.ink }]}>
        {today.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
      </Text>
      <Serif style={[styles.title, { color: c.ink }]}>Emotion Analysis</Serif>

      <DayStrip days={days} onSelect={setSelectedKey} />

      <CalmCard>
        <View style={styles.analyticHead}>
          <Feather name="zap" size={13} color={c.limeInk} />
          <Text style={[styles.analyticTitle, { color: c.ink }]}>AI Analytic</Text>
        </View>
        <MoodCurve
          data={moodArr}
          width={310}
          height={120}
          peakLabel={peakMood !== null ? `Mood ${Math.round(peakMood)}%` : undefined}
        />
        <View style={styles.axisRow}>
          {['20%', '40%', '60%', '80%', '100%'].map((t) => (
            <Text key={t} style={[styles.axis, { color: c.faint }]}>
              {t}
            </Text>
          ))}
        </View>
      </CalmCard>

      <View style={styles.tileGrid}>
        <View style={styles.tileRow}>
          <StatTile
            value={stressVal !== undefined && stressVal !== null ? `${stressVal}%` : '—'}
            label="Stress Level"
            icon="activity"
            tint="mint"
          />
          <StatTile
            value={`${anxietyDays}X`}
            label="Anxiety Frequency"
            icon="heart"
            tint="lavender"
          />
        </View>
        <View style={styles.tileRow}>
          <StatTile
            value={sleepVal !== undefined && sleepVal !== null ? `${sleepVal}h` : '—'}
            label="Sleep Quality"
            icon="moon"
            tint="periwinkle"
          />
          <StatTile
            value={focusVal !== null ? `${focusVal}%` : '—'}
            label="Focus Stability"
            icon="target"
            tint="limeSoft"
          />
        </View>
      </View>

      {!summary ? (
        <CalmCard tint="sage">
          <Text style={[styles.empty, { color: c.muted }]}>
            No history yet — interact, journal, or sync sensors and your analysis appears here. Nothing is mocked.
          </Text>
        </CalmCard>
      ) : null}

      <PoweredByAI />
      <InkButton
        label="Generate My Perfect Plan"
        onPress={() => router.push('/perfect-plan')}
        icon="arrow-right"
      />
      <Pressable
        onPress={() => router.push('/(tabs)/recommendations')}
        accessibilityRole="button"
        accessibilityLabel="View today's action plans"
        style={styles.plansLink}
      >
        <Text style={[styles.plansText, { color: c.ink }]}>View Today's Action Plans →</Text>
      </Pressable>
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  date: { fontFamily: fonts.semiBold, fontSize: 13, textAlign: 'center' },
  title: { fontSize: 30, textAlign: 'center' },
  analyticHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  analyticTitle: { fontFamily: fonts.semiBold, fontSize: 13 },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  axis: { fontFamily: fonts.medium, fontSize: 11 },
  tileGrid: { gap: 12 },
  tileRow: { flexDirection: 'row', gap: 12 },
  empty: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  plansLink: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  plansText: { fontFamily: fonts.semiBold, fontSize: 14 },
});
