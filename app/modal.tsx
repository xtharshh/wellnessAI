import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { GlowLineChart } from '@/src/components/charts/GlowLineChart';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { useWellnessSummary } from '@/src/hooks/useWellnessSummary';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

const METRIC_COPY: Record<string, { title: string; description: string; color: string }> = {
  mood: {
    title: 'Mood Trace',
    description: 'Cognitive and emotional signal strength derived from passive metadata patterns.',
    color: colors.primaryAccent,
  },
  sleep: {
    title: 'Sleep Trace',
    description: 'Rest window quality and duration estimates from your behavioral rhythm.',
    color: colors.secondaryAccent,
  },
  activity: {
    title: 'Activity Trace',
    description: 'Movement and engagement levels inferred from daily interaction cadence.',
    color: colors.secondaryAccent,
  },
  stress: {
    title: 'Stress Index',
    description: 'Composite stress signal. Lower is better; elevated values trigger mindfulness recs.',
    color: colors.error,
  },
  default: {
    title: 'MindTrace Privacy',
    description:
      'MindTrace stores wellness snapshots locally on your device. Cloud sync and Supabase backend can be enabled in a future release per the implementation plan.',
    color: colors.primaryAccent,
  },
};

export default function ModalScreen() {
  const { metric } = useLocalSearchParams<{ metric?: string }>();
  const { data } = useWellnessSummary();
  const copy = METRIC_COPY[metric ?? 'default'] ?? METRIC_COPY.default;
  const series =
    metric === 'mood'
      ? data?.series.mood
      : metric === 'sleep'
        ? data?.series.sleep
        : metric === 'activity'
          ? data?.series.activity
          : metric === 'stress'
            ? data?.series.stress
            : [];

  return (
    <ScreenContainer>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.body}>{copy.description}</Text>
      {series?.length ? (
        <GlassCard>
          <GlowLineChart data={series} color={copy.color} width={320} height={160} label="14-day detail" />
        </GlassCard>
      ) : null}
      <GlassCard>
        <Text style={styles.body}>
          This interactive drill-down mirrors the Stitch Behavioral Dashboard (Interactive) screen from
          your design system.
        </Text>
      </GlassCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
    marginTop: 8,
  },
  body: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
});
