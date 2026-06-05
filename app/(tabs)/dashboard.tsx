import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { MetricWidget } from '@/src/components/dashboard/MetricWidget';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { StatusChip } from '@/src/components/ui/StatusChip';
import { useWellnessSummary } from '@/src/hooks/useWellnessSummary';
import { refreshLatestSnapshot } from '@/src/services/wellness';
import { useAuthStore } from '@/src/stores/authStore';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { data, isLoading, isRefetching, refetch } = useWellnessSummary();

  const handleRefresh = async () => {
    if (!user) return;
    await refreshLatestSnapshot(user.id);
    await queryClient.invalidateQueries({ queryKey: ['wellness-summary', user.id] });
    await queryClient.invalidateQueries({ queryKey: ['wellness-trends', user.id] });
    await queryClient.invalidateQueries({ queryKey: ['recommendations', user.id] });
    await refetch();
  };

  const summary = data?.summary;
  const series = data?.series;

  return (
    <ScreenContainer
      contentStyle={styles.content}
      refreshing={isRefetching}
      onRefresh={handleRefresh}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Behavioral Dashboard</Text>
          <Text style={styles.title}>Hello, {user?.displayName ?? 'Observer'}</Text>
        </View>
        <StatusChip label={summary?.riskLevel ?? 'analyzing'} tone={summary?.riskLevel ?? 'active'} />
      </View>

      <GlassCard accent="primary">
        <Text style={styles.cardLabel}>Overall Wellness Score</Text>
        <Text style={styles.heroValue}>{isLoading ? '—' : summary?.wellnessScore ?? 0}</Text>
        <Text style={styles.timestamp}>
          Last trace:{' '}
          {summary?.lastUpdated
            ? new Date(summary.lastUpdated).toLocaleString()
            : 'Awaiting first snapshot'}
        </Text>
      </GlassCard>

      <View style={styles.grid}>
        <MetricWidget
          title="Mood"
          value={String(summary?.moodScore ?? '—')}
          unit="/100"
          trend={summary?.moodTrend}
          series={series?.mood}
          accent="primary"
          icon="🧠"
          onPress={() => router.push({ pathname: '/modal', params: { metric: 'mood' } })}
        />
        <MetricWidget
          title="Sleep"
          value={String(summary?.sleepHours ?? '—')}
          unit="hrs"
          trend={summary?.sleepTrend}
          series={series?.sleep}
          accent="secondary"
          icon="🌙"
          onPress={() => router.push({ pathname: '/modal', params: { metric: 'sleep' } })}
        />
        <MetricWidget
          title="Activity"
          value={String(summary?.activityLevel ?? '—')}
          unit="/100"
          trend={summary?.activityTrend}
          series={series?.activity}
          accent="secondary"
          icon="⚡"
          onPress={() => router.push({ pathname: '/modal', params: { metric: 'activity' } })}
        />
        <MetricWidget
          title="Stress Index"
          value={String(summary?.stressIndex ?? '—')}
          unit="/100"
          trend={summary?.stressTrend}
          series={series?.stress}
          accent="primary"
          icon="📉"
          onPress={() => router.push({ pathname: '/modal', params: { metric: 'stress' } })}
        />
      </View>

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  eyebrow: {
    ...typography.labelCaps,
    color: colors.secondary,
  },
  title: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
  },
  cardLabel: {
    ...typography.labelCaps,
    color: colors.onSurfaceVariant,
  },
  heroValue: {
    ...typography.displayLg,
    color: colors.primary,
    fontSize: 56,
  },
  timestamp: {
    ...typography.dataMono,
    color: colors.onSurfaceVariant,
  },
  grid: {
    gap: 16,
  },
});
