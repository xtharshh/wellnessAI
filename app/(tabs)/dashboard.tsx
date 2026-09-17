import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CalmCard,
  CalmScreen,
  InkButton,
  Serif,
  StatTile,
  useCalm,
} from '@/src/components/calm/kit';
import { JournalModal } from '@/src/components/dashboard/JournalModal';
import { MeditationTimerModal } from '@/src/components/dashboard/MeditationTimerModal';
import { RemindersModal } from '@/src/components/dashboard/RemindersModal';
import { WeeklyReportModal } from '@/src/components/dashboard/WeeklyReportModal';
import { useTheme } from '@/src/hooks/useTheme';
import { useWellnessSummary } from '@/src/hooks/useWellnessSummary';
import { refreshLatestSnapshot } from '@/src/services/wellness';
import { useAuthStore } from '@/src/stores/authStore';
import { hasUsageStatsPermission, requestUsageStatsPermission } from '@/modules/android-wellbeing';
import { serif } from '@/src/theme/calm';
import { fonts } from '@/src/theme/typography';

const TIPS = [
  'Take a 20-second screen break every 20 minutes to prevent digital fatigue.',
  'Deep breathing resets heart rate variability and clears typing tension.',
  'Limit social media after 10 PM to protect your circadian rhythm.',
  'Consistent sleep windows keep focus above 80%.',
  'Cold water on your face activates the vagus nerve and lowers anxiety fast.',
];

const AFFIRMATIONS = [
  'My mind is calm, and my thoughts are clear.',
  'I focus on what I can control and release the rest.',
  'I am doing my best, and my best is enough.',
  'Every breath brings me closer to balance.',
  'I give myself permission to unplug and recharge.',
];

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { data, isRefetching, refetch } = useWellnessSummary();
  const { colors } = useTheme();
  const { c } = useCalm();
  void colors;

  const [journalVisible, setJournalVisible] = useState(false);
  const [meditationVisible, setMeditationVisible] = useState(false);
  const [weeklyReportVisible, setWeeklyReportVisible] = useState(false);
  const [remindersVisible, setRemindersVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);

  const dayIdx = new Date().getDate() % TIPS.length;
  const summary = data?.summary;
  const series = data?.series;
  const liveMetrics = data?.liveMetrics;

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'MT';

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  useEffect(() => {
    const check = () => {
      setHasPermission(Platform.OS === 'android' ? hasUsageStatsPermission() : true);
    };
    check();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check();
    });
    return () => sub.remove();
  }, []);

  const handleRefresh = async () => {
    if (!user) return;
    await refreshLatestSnapshot(user.id);
    await queryClient.invalidateQueries({ queryKey: ['wellness-summary', user.id] });
    await queryClient.invalidateQueries({ queryKey: ['wellness-trends', user.id] });
    await queryClient.invalidateQueries({ queryKey: ['recommendations', user.id] });
    await refetch();
  };

  const trendIcon = (t?: number) =>
    t === undefined || t === null ? null : t >= 0 ? 'trending-up' : 'trending-down';

  const tiles = [
    { title: 'Mood', value: summary ? String(summary.moodScore) : '—', trend: summary?.moodTrend, tint: 'lavender' as const, icon: 'heart' as const },
    { title: 'Sleep', value: summary ? `${summary.sleepHours}h` : '—', trend: summary?.sleepTrend, tint: 'mint' as const, icon: 'moon' as const },
    { title: 'Activity', value: summary ? String(summary.activityLevel) : '—', trend: summary?.activityTrend, tint: 'peach' as const, icon: 'activity' as const },
    { title: 'Stress', value: summary ? String(summary.stressIndex) : '—', trend: summary?.stressTrend ? -summary.stressTrend : summary?.stressTrend, tint: 'sage' as const, icon: 'zap' as const },
  ];

  const actions = [
    { label: 'Journal', icon: 'book-open' as const, onPress: () => setJournalVisible(true) },
    { label: 'Meditate', icon: 'anchor' as const, onPress: () => setMeditationVisible(true) },
    { label: 'Report', icon: 'bar-chart-2' as const, onPress: () => setWeeklyReportVisible(true) },
    { label: 'Reminders', icon: 'bell' as const, onPress: () => setRemindersVisible(true) },
  ];

  const moodBars = series?.mood?.slice(-7) ?? [];

  return (
    <CalmScreen>
      <View style={styles.topRow}>
        <View style={styles.profileCol}>
          <View style={[styles.avatar, { backgroundColor: c.limeSoft }]}>
            <Text style={[styles.avatarText, { color: c.ink }]}>{initials}</Text>
          </View>
          <View>
            <Text style={[styles.eyebrow, { color: c.muted }]}>{greeting.toUpperCase()}</Text>
            <Serif style={[styles.hello, { color: c.ink }]}>Hi, {user?.displayName ?? 'Observer'}</Serif>
          </View>
        </View>
        <Pressable
          onPress={() => setRemindersVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Open reminders"
          style={[styles.bell, { backgroundColor: c.surface, borderColor: c.line }]}
        >
          <Feather name="bell" size={17} color={c.ink} />
        </Pressable>
      </View>

      {!hasPermission && Platform.OS === 'android' ? (
        <CalmCard tint="peach">
          <Text style={[styles.permTitle, { color: c.ink }]}>Enable Screen Time Insights</Text>
          <Text style={[styles.permBody, { color: c.muted }]}>
            MindTrace needs Usage Statistics access to passively read screen duration and rest windows.
          </Text>
          <Pressable
            onPress={() => requestUsageStatsPermission()}
            accessibilityRole="button"
            accessibilityLabel="Grant usage access"
            style={[styles.permBtn, { backgroundColor: c.ink }]}
          >
            <Text style={[styles.permBtnText, { color: c.bg }]}>Grant Access</Text>
          </Pressable>
        </CalmCard>
      ) : null}

      <Serif style={[styles.section, { color: c.ink }]}>Your Condition</Serif>
      <View style={styles.tileGrid}>
        <View style={styles.tileRow}>
          {tiles.slice(0, 2).map((t) => (
            <View key={t.title} style={{ flex: 1 }}>
              <StatTile value={t.value} label={t.title} icon={t.icon} tint={t.tint} />
              {trendIcon(t.trend) ? (
                <View style={styles.trendRow}>
                  <Feather
                    name={trendIcon(t.trend)!}
                    size={12}
                    color={t.trend! >= 0 ? '#4E7A4E' : '#B4432B'}
                  />
                  <Text style={[styles.trendText, { color: c.muted }]}>
                    {Math.abs(t.trend!).toFixed(1)}%
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
        <View style={styles.tileRow}>
          {tiles.slice(2).map((t) => (
            <View key={t.title} style={{ flex: 1 }}>
              <StatTile value={t.value} label={t.title} icon={t.icon} tint={t.tint} />
              {trendIcon(t.trend) ? (
                <View style={styles.trendRow}>
                  <Feather
                    name={trendIcon(t.trend)!}
                    size={12}
                    color={t.trend! >= 0 ? '#4E7A4E' : '#B4432B'}
                  />
                  <Text style={[styles.trendText, { color: c.muted }]}>
                    {Math.abs(t.trend!).toFixed(1)}%
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </View>

      <CalmCard tint="sage">
        <Text style={[styles.todayEyebrow, { color: c.muted }]}>TODAY'S NOTE</Text>
        <Serif style={[styles.todayText, { color: c.ink }]}>“{AFFIRMATIONS[dayIdx]}”</Serif>
        <Text style={[styles.todayTip, { color: c.muted }]}>{TIPS[dayIdx]}</Text>
      </CalmCard>

      <View style={styles.actionRow}>
        {actions.map((a) => (
          <Pressable
            key={a.label}
            onPress={a.onPress}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            style={[styles.actionBtn, { backgroundColor: c.surface, borderColor: c.line }]}
          >
            <Feather name={a.icon} size={18} color={c.ink} />
            <Text style={[styles.actionLabel, { color: c.ink }]}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => router.push({ pathname: '/modal', params: { metric: 'wellness' } })}
        accessibilityRole="button"
        accessibilityLabel="Open wellness overview"
      >
        <CalmCard>
          <View style={styles.overviewRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.overviewLabel, { color: c.muted }]}>OVERALL WELLNESS</Text>
              <Text style={[styles.overviewValue, { color: c.ink }]}>
                {summary ? `${summary.wellnessScore}%` : '—'}
              </Text>
              <Text style={[styles.overviewSub, { color: c.muted }]}>
                {summary?.lastUpdated
                  ? `Updated ${new Date(summary.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Interact to generate your first real snapshot'}
              </Text>
            </View>
            <View style={styles.bars}>
              {moodBars.length === 0 ? (
                <Text style={[styles.overviewSub, { color: c.muted }]}>No data</Text>
              ) : (
                moodBars.map((v, i) => (
                  <View
                    key={i}
                    style={[
                      styles.bar,
                      {
                        height: Math.max(6, Math.min(52, (v / 100) * 52)),
                        backgroundColor: i === moodBars.length - 1 ? c.ink : c.line,
                      },
                    ]}
                  />
                ))
              )}
            </View>
          </View>
        </CalmCard>
      </Pressable>

      <Pressable
        onPress={() => router.push('/telemetry')}
        accessibilityRole="button"
        accessibilityLabel="Open live telemetry"
      >
        <CalmCard>
          <View style={styles.teleRow}>
            <Feather name="cpu" size={16} color={c.ink} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.teleTitle, { color: c.ink }]}>Live Telemetry</Text>
              <Text style={[styles.teleSub, { color: c.muted }]} numberOfLines={1}>
                {liveMetrics?.hasSufficientData
                  ? `Keys ${liveMetrics.rawSignals.totalKeypresses} • Clicks ${liveMetrics.rawSignals.totalClicks} • Scrolls ${liveMetrics.rawSignals.totalScrolls}`
                  : 'Waiting for real signal — type, scroll or move'}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={c.muted} />
          </View>
        </CalmCard>
      </Pressable>

      <CalmCard tint="lavender">
        <Text style={[styles.planTitle, { color: c.ink }]}>Your Perfect Plan awaits</Text>
        <Text style={[styles.planSub, { color: c.muted }]}>
          {summary
            ? `Stress ${summary.stressIndex} • Mood ${summary.moodScore} • Sleep ${summary.sleepHours}h`
            : 'Correlations appear after real history accumulates'}
        </Text>
        <View style={{ marginTop: 10 }}>
          <InkButton label="View My Plan" onPress={() => router.push('/perfect-plan')} icon="arrow-right" />
        </View>
      </CalmCard>

      <Pressable onPress={handleRefresh} accessibilityRole="button" accessibilityLabel="Refresh data">
        <Text style={[styles.refresh, { color: c.muted }]}>
          {isRefetching ? 'Refreshing…' : 'Tap to refresh from live telemetry'}
        </Text>
      </Pressable>

      <JournalModal visible={journalVisible} onClose={() => setJournalVisible(false)} />
      <MeditationTimerModal visible={meditationVisible} onClose={() => setMeditationVisible(false)} />
      <WeeklyReportModal
        visible={weeklyReportVisible}
        onClose={() => setWeeklyReportVisible(false)}
        seriesData={series}
        summaryData={summary}
      />
      <RemindersModal visible={remindersVisible} onClose={() => setRemindersVisible(false)} />
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profileCol: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '800' },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, fontFamily: fonts.bold },
  hello: { fontSize: 21 },
  bell: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  permTitle: { fontFamily: fonts.bold, fontSize: 15, marginBottom: 4 },
  permBody: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  permBtn: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 18, minHeight: 44, borderRadius: 999, justifyContent: 'center' },
  permBtnText: { fontFamily: fonts.bold, fontSize: 13 },
  section: { fontSize: 22, marginTop: 4 },
  tileGrid: { gap: 12 },
  tileRow: { flexDirection: 'row', gap: 12 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingLeft: 4 },
  trendText: { fontFamily: fonts.semiBold, fontSize: 11 },
  todayEyebrow: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.5 },
  todayText: { fontSize: 18, lineHeight: 24, marginTop: 4 },
  todayTip: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 6 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, borderWidth: 1, borderRadius: 18, minHeight: 76, alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  actionLabel: { fontFamily: fonts.semiBold, fontSize: 12 },
  overviewRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  overviewLabel: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.2 },
  overviewValue: { fontFamily: serif, fontWeight: '700', fontSize: 38, lineHeight: 42 },
  overviewSub: { fontFamily: fonts.regular, fontSize: 11, marginTop: 2 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 64 },
  bar: { width: 9, borderRadius: 4 },
  teleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  teleTitle: { fontFamily: fonts.bold, fontSize: 14 },
  teleSub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  planTitle: { fontFamily: fonts.bold, fontSize: 16 },
  planSub: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4, lineHeight: 19 },
  refresh: { fontFamily: fonts.medium, fontSize: 12, textAlign: 'center', minHeight: 44, textAlignVertical: 'center' },
});
