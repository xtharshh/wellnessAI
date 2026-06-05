import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GlowLineChart } from '@/src/components/charts/GlowLineChart';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { TrendRange, useTrends } from '@/src/hooks/useTrends';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

const RANGES: TrendRange[] = [7, 30, 90];

const METRICS = [
  { key: 'mood' as const, label: 'Mood', color: colors.primaryAccent },
  { key: 'sleep' as const, label: 'Sleep (hrs)', color: colors.secondaryAccent },
  { key: 'activity' as const, label: 'Activity', color: colors.secondaryAccent },
  { key: 'stress' as const, label: 'Stress', color: colors.error },
];

export default function TrendsScreen() {
  const [range, setRange] = useState<TrendRange>(30);
  const { data, isLoading } = useTrends(range);

  return (
    <ScreenContainer>
      <Text style={styles.eyebrow}>Trends Analytics</Text>
      <Text style={styles.title}>Your wellness trace</Text>
      <Text style={styles.subtitle}>Spot patterns across mood, sleep, activity, and stress.</Text>

      <View style={styles.rangeRow}>
        {RANGES.map((value) => (
          <Pressable
            key={value}
            style={[styles.rangeChip, range === value && styles.rangeChipActive]}
            onPress={() => setRange(value)}>
            <Text style={[styles.rangeText, range === value && styles.rangeTextActive]}>{value}d</Text>
          </Pressable>
        ))}
      </View>

      {METRICS.map((metric) => (
        <GlassCard key={metric.key} accent={metric.key === 'mood' || metric.key === 'stress' ? 'primary' : 'secondary'}>
          <Text style={styles.metricLabel}>{metric.label}</Text>
          <GlowLineChart
            data={isLoading ? [] : data?.[metric.key] ?? []}
            color={metric.color}
            width={320}
            height={150}
            label={`${range}-day trend`}
          />
        </GlassCard>
      ))}
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
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rangeChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.outline,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rangeChipActive: {
    borderColor: colors.primaryAccent,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  rangeText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  rangeTextActive: {
    color: colors.primary,
    fontFamily: typography.titleMd.fontFamily,
  },
  metricLabel: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
});
