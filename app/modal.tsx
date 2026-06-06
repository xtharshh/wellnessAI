import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';

import { GlowLineChart } from '@/src/components/charts/GlowLineChart';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { useWellnessSummary } from '@/src/hooks/useWellnessSummary';
import { getLiveMetrics } from '@/src/services/realAnalytics';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing, radius } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

export default function ModalScreen() {
  const { metric } = useLocalSearchParams<{ metric?: string }>();
  const { data, isLoading: isSummaryLoading } = useWellnessSummary();
  const [telemetry, setTelemetry] = useState<any>(null);
  const { colors, isDark } = useTheme();

  const METRIC_COPY: Record<
    string,
    { title: string; description: string; color: string; formula: string; icon: string }
  > = {
    mood: {
      title: 'Mood Trace',
      description: 'Calculated passively from typing flow (keystroke interval and backspace correction ratios) combined with sleep quality.',
      formula: 'Mood = 75 - (Backspace% * 2) + TypingSpeedBonus(280ms-450ms)',
      color: colors.primaryAccent,
      icon: '🧠',
    },
    sleep: {
      title: 'Sleep Trace',
      description: 'Estimated from device inactivity window (the gap between last interaction at night and first interaction in the morning).',
      formula: 'Sleep = Hours elapsed between Last Interaction of yesterday and First Interaction of today',
      color: colors.secondaryAccent,
      icon: '🌙',
    },
    activity: {
      title: 'Activity Trace',
      description: 'Physical movement level combined with on-screen browser interaction cadence.',
      formula: 'Activity = 45 + (Clicks/Scrolls / 10) + (AccelerometerG-Force * 30)',
      color: colors.secondaryAccent,
      icon: '⚡',
    },
    stress: {
      title: 'Stress Index',
      description: 'Composite stress level. Lower values are better; elevated index triggers mindfulness suggestions.',
      formula: 'Stress = 30 + (Backspace% * 2.5) + SpeedStress(Interval < 250ms or > 600ms)',
      color: isDark ? colors.riskHigh : '#dc2626',
      icon: '📉',
    },
    default: {
      title: 'MindTrace Privacy',
      description: 'MindTrace collects wellness snapshots locally on your device and syncs them securely to your Supabase backend.',
      formula: 'No metrics active.',
      color: colors.primaryAccent,
      icon: '🔒',
    },
  };

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

  // Poll live telemetry every 500ms for dynamic ticking on screen
  useEffect(() => {
    let active = true;
    const fetchTelemetry = async () => {
      const metrics = await getLiveMetrics();
      if (active) {
        setTelemetry(metrics);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <ScreenContainer contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.icon, { color: copy.color }]}>{copy.icon}</Text>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.onSurface }]}>{copy.title}</Text>
          <Text style={[styles.caption, { color: colors.secondary }]}>Live Device Analytics</Text>
        </View>
      </View>

      <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>{copy.description}</Text>

      {series && series.length > 0 ? (
        <GlassCard accent={metric === 'mood' || metric === 'stress' ? 'primary' : 'secondary'}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>14-Day Historical Trace</Text>
          {isSummaryLoading ? (
            <ActivityIndicator size="small" color={copy.color} style={{ marginVertical: 40 }} />
          ) : (
            <GlowLineChart data={series} color={copy.color} width={320} height={160} label="Score history" />
          )}
        </GlassCard>
      ) : null}

      <GlassCard accent="primary">
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Mathematical Formula</Text>
        <Text style={[styles.formulaText, { color: colors.primary }]}>{copy.formula}</Text>
      </GlassCard>

      {telemetry ? (
        <GlassCard>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Live Telemetry Feed</Text>
          <Text style={[styles.subCaption, { color: colors.onSurfaceVariant }]}>Press keys or tap/scroll to watch variables update in real time.</Text>
          
          <View style={styles.telemetryGrid}>
            <View style={[styles.telemetryRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
              <Text style={[styles.telemetryLabel, { color: colors.onSurfaceVariant }]}>Keystrokes</Text>
              <Text style={[styles.telemetryValue, { color: colors.onSurface }]}>{telemetry.rawSignals.totalKeypresses}</Text>
            </View>
            <View style={[styles.telemetryRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
              <Text style={[styles.telemetryLabel, { color: colors.onSurfaceVariant }]}>Backspace Corrections</Text>
              <Text style={[styles.telemetryValue, { color: colors.onSurface }]}>{telemetry.rawSignals.backspaces} ({telemetry.rawSignals.backspaceRatio}%)</Text>
            </View>
            <View style={[styles.telemetryRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
              <Text style={[styles.telemetryLabel, { color: colors.onSurfaceVariant }]}>Avg Key Interval</Text>
              <Text style={[styles.telemetryValue, { color: colors.onSurface }]}>{telemetry.rawSignals.avgKeyInterval} ms</Text>
            </View>
            <View style={[styles.telemetryRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
              <Text style={[styles.telemetryLabel, { color: colors.onSurfaceVariant }]}>Tap Interactions</Text>
              <Text style={[styles.telemetryValue, { color: colors.onSurface }]}>{telemetry.rawSignals.totalClicks} clicks</Text>
            </View>
            {telemetry.rawSignals.totalScrolls > 0 ? (
              <View style={[styles.telemetryRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
                <Text style={[styles.telemetryLabel, { color: colors.onSurfaceVariant }]}>Scroll Events</Text>
                <Text style={[styles.telemetryValue, { color: colors.onSurface }]}>{telemetry.rawSignals.totalScrolls}</Text>
              </View>
            ) : null}
            <View style={[styles.telemetryRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
              <Text style={[styles.telemetryLabel, { color: colors.onSurfaceVariant }]}>Accelerometer Force</Text>
              <Text style={[styles.telemetryValue, { color: colors.onSurface }]}>{telemetry.rawSignals.motionMagnitude} G</Text>
            </View>
            <View style={[styles.telemetryRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
              <Text style={[styles.telemetryLabel, { color: colors.onSurfaceVariant }]}>Derived Sleep Gap</Text>
              <Text style={[styles.telemetryValue, { color: colors.onSurface }]}>{telemetry.sleepHours} hrs</Text>
            </View>
            <View style={[styles.telemetryRow, styles.totalRow]}>
              <Text style={[styles.telemetryLabel, styles.totalLabel, { color: colors.onSurface }]}>Derived KPI Score</Text>
              <Text style={[styles.telemetryValue, styles.totalValue, { color: copy.color }]}>
                {metric === 'mood'
                  ? telemetry.moodScore
                  : metric === 'sleep'
                    ? telemetry.sleepHours
                    : metric === 'activity'
                      ? telemetry.activityLevel
                      : metric === 'stress'
                        ? telemetry.stressIndex
                        : '—'}
              </Text>
            </View>
          </View>
        </GlassCard>
      ) : (
        <ActivityIndicator size="small" color={colors.primaryAccent} />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  icon: {
    fontSize: 40,
  },
  headerText: {
    flexDirection: 'column',
  },
  title: {
    ...typography.headlineLgMobile,
  },
  caption: {
    ...typography.labelCaps,
    letterSpacing: 1,
  },
  description: {
    ...typography.bodyMd,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.titleMd,
    marginBottom: spacing.xs,
  },
  subCaption: {
    ...typography.bodyMd,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  formulaText: {
    ...typography.dataMono,
    fontSize: 13,
    padding: spacing.xs,
  },
  telemetryGrid: {
    gap: spacing.sm,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
  },
  telemetryLabel: {
    ...typography.bodyMd,
  },
  telemetryValue: {
    ...typography.dataMono,
  },
  totalRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderBottomWidth: 0,
  },
  totalLabel: {
    ...typography.titleMd,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
});
