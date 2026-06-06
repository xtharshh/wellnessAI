import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, AppState, Platform, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { StatusChip } from '@/src/components/ui/StatusChip';
import { BreathworkTimer } from '@/src/components/ui/BreathworkTimer';
import { useRecommendations } from '@/src/hooks/useRecommendations';
import { useWellnessSummary } from '@/src/hooks/useWellnessSummary';
import { useTheme } from '@/src/hooks/useTheme';
import { typography } from '@/src/theme/typography';
import { radius, spacing } from '@/src/theme/spacing';

function ExerciseTimer({ duration }: { duration: string }) {
  const { colors } = useTheme();
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const num = parseInt(duration, 10);
    setSeconds(isNaN(num) ? 180 : num * 60);
  }, [duration]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (seconds === 0 && isActive) {
      setIsActive(false);
      Alert.alert('Session Complete!', 'Great job completing your real-time wellness exercise.');
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const adjustTime = (amount: number) => {
    if (isActive) return;
    setSeconds((s) => Math.max(10, s + amount)); // minimum 10 seconds
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.timerWrapper}>
      <View style={styles.timerControlsRow}>
        <Pressable
          disabled={isActive}
          onPress={() => adjustTime(-30)}
          style={[
            styles.adjustButton,
            { borderColor: colors.outline, opacity: isActive ? 0.3 : 1 }
          ]}
        >
          <Text style={[styles.adjustButtonText, { color: colors.onSurface }]}>-30s</Text>
        </Pressable>

        <Text style={[styles.timerText, { color: colors.onSurface }]}>{formatTime(seconds)}</Text>

        <Pressable
          disabled={isActive}
          onPress={() => adjustTime(30)}
          style={[
            styles.adjustButton,
            { borderColor: colors.outline, opacity: isActive ? 0.3 : 1 }
          ]}
        >
          <Text style={[styles.adjustButtonText, { color: colors.onSurface }]}>+30s</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.timerButton, { backgroundColor: isActive ? colors.error : '#0f172a' }]}
        onPress={() => setIsActive(!isActive)}
      >
        <Text style={styles.timerButtonText}>{isActive ? 'Pause' : 'Start'}</Text>
      </Pressable>
    </View>
  );
}

export default function AIInsightsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { data: summaryData, isLoading: isSummaryLoading } = useWellnessSummary();
  const { data: recData, isLoading: isRecsLoading, complete } = useRecommendations();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, Record<number, boolean>>>({});

  const summary = summaryData?.summary;

  const toggleStep = (recId: string, stepIndex: number) => {
    setCheckedSteps((prev) => {
      const recSteps = prev[recId] || {};
      return {
        ...prev,
        [recId]: {
          ...recSteps,
          [stepIndex]: !recSteps[stepIndex],
        },
      };
    });
  };

  return (
    <ScreenContainer contentStyle={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
          <Feather name="chevron-left" size={24} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.onSurface }]}>AI Personalized Insights</Text>
          <Text style={[styles.caption, { color: colors.primary }]}>Real-time Guidance Plan</Text>
        </View>
      </View>

      {/* Deep Guided Breathing Section */}
      <BreathworkTimer />

      {/* Modern Explanatory Intro */}
      <View style={[styles.introCard, { backgroundColor: colors.backgroundDeep, borderColor: colors.outline }]}>
        <Text style={[styles.introText, { color: colors.onSurfaceVariant }]}>
          This dynamic workspace integrates your latest device telemetry—specifically keyboard velocity, screen lock cadence, and ambient movement markers—to pinpoint wellness anomalies and compile actionable recovery exercises.
        </Text>
      </View>

      {/* Critical Metrics Scorecard */}
      <GlassCard accent="primary">
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Telemetry Scorecard</Text>
        <Text style={[styles.subText, { color: colors.onSurfaceVariant }]}>
          Metrics checked in the last trace window:
        </Text>

        <View style={styles.scoreGrid}>
          {/* Sleep */}
          <View style={[styles.scoreRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <View style={styles.metricNameBlock}>
              <Feather name="moon" size={18} color={isDark ? '#f7bee9' : '#ec4899'} />
              <Text style={[styles.metricLabel, { color: colors.onSurface }]}>Sleep Gap</Text>
            </View>
            <View style={styles.metricStatusBlock}>
              <Text style={[styles.metricVal, { color: colors.onSurface }]}>
                {isSummaryLoading ? '—' : `${summary?.sleepHours} hrs`}
              </Text>
              {summary && summary.sleepHours < 7 ? (
                <View style={[styles.statusIndicatorBadge, { backgroundColor: 'rgba(244,63,94,0.12)' }]}>
                  <Text style={[styles.badgeText, { color: '#f43f5e' }]}>Needs Attention</Text>
                </View>
              ) : (
                <View style={[styles.statusIndicatorBadge, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                  <Text style={[styles.badgeText, { color: '#10b981' }]}>Optimal</Text>
                </View>
              )}
            </View>
          </View>

          {/* Stress */}
          <View style={[styles.scoreRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <View style={styles.metricNameBlock}>
              <Feather name="trending-down" size={18} color={isDark ? '#a2cbfd' : '#3b82f6'} />
              <Text style={[styles.metricLabel, { color: colors.onSurface }]}>Stress Index</Text>
            </View>
            <View style={styles.metricStatusBlock}>
              <Text style={[styles.metricVal, { color: colors.onSurface }]}>
                {isSummaryLoading ? '—' : `${summary?.stressIndex}/100`}
              </Text>
              {summary && summary.stressIndex > 55 ? (
                <View style={[styles.statusIndicatorBadge, { backgroundColor: 'rgba(244,63,94,0.12)' }]}>
                  <Text style={[styles.badgeText, { color: '#f43f5e' }]}>High Tension</Text>
                </View>
              ) : (
                <View style={[styles.statusIndicatorBadge, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                  <Text style={[styles.badgeText, { color: '#10b981' }]}>Optimal</Text>
                </View>
              )}
            </View>
          </View>

          {/* Activity */}
          <View style={[styles.scoreRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <View style={styles.metricNameBlock}>
              <Feather name="zap" size={18} color={isDark ? '#ffdc62' : '#eab308'} />
              <Text style={[styles.metricLabel, { color: colors.onSurface }]}>Activity Level</Text>
            </View>
            <View style={styles.metricStatusBlock}>
              <Text style={[styles.metricVal, { color: colors.onSurface }]}>
                {isSummaryLoading ? '—' : `${summary?.activityLevel}/100`}
              </Text>
              {summary && summary.activityLevel < 50 ? (
                <View style={[styles.statusIndicatorBadge, { backgroundColor: 'rgba(244,63,94,0.12)' }]}>
                  <Text style={[styles.badgeText, { color: '#f43f5e' }]}>Sedentary</Text>
                </View>
              ) : (
                <View style={[styles.statusIndicatorBadge, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                  <Text style={[styles.badgeText, { color: '#10b981' }]}>Active</Text>
                </View>
              )}
            </View>
          </View>

          {/* Mood */}
          <View style={[styles.scoreRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <View style={styles.metricNameBlock}>
              <Feather name="smile" size={18} color={isDark ? '#a2cbfd' : '#3b82f6'} />
              <Text style={[styles.metricLabel, { color: colors.onSurface }]}>Mood Score</Text>
            </View>
            <View style={styles.metricStatusBlock}>
              <Text style={[styles.metricVal, { color: colors.onSurface }]}>
                {isSummaryLoading ? '—' : `${summary?.moodScore}/100`}
              </Text>
              {summary && summary.moodScore < 60 ? (
                <View style={[styles.statusIndicatorBadge, { backgroundColor: 'rgba(244,63,94,0.12)' }]}>
                  <Text style={[styles.badgeText, { color: '#f43f5e' }]}>Needs Lift</Text>
                </View>
              ) : (
                <View style={[styles.statusIndicatorBadge, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                  <Text style={[styles.badgeText, { color: '#10b981' }]}>Stable</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </GlassCard>

      {/* AI Recommendations Panel */}
      <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>Personalized Action Plans</Text>
      <Text style={[styles.subCaption, { color: colors.onSurfaceVariant }]}>
        Tap on any card to view its clinical explanation and launch the step-by-step exercise.
      </Text>

      {isRecsLoading && <ActivityIndicator color={colors.primary} size="small" style={{ marginVertical: 32 }} />}

      {!isRecsLoading && (recData || []).map((rec) => {
        let details = { description: rec.body, exercise: null as any };
        try {
          details = JSON.parse(rec.body);
        } catch {}

        const isExpanded = expandedId === rec.id;
        const exercise = details.exercise;
        const recSteps = checkedSteps[rec.id] || {};

        return (
          <GlassCard key={rec.id} accent={rec.category === 'mindfulness' || rec.category === 'sleep' ? 'primary' : 'secondary'}>
            <Pressable onPress={() => setExpandedId(isExpanded ? null : rec.id)} style={styles.cardHeader}>
              <View style={styles.recTitleBlock}>
                <StatusChip label={rec.category} tone={rec.category === 'mindfulness' ? 'active' : rec.category === 'sleep' ? 'medium' : rec.category === 'activity' ? 'low' : 'neutral'} />
                <Text style={[styles.recTitle, { color: colors.onSurface }]}>{rec.title}</Text>
              </View>
              <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.onSurfaceVariant} />
            </Pressable>

            {/* Expanded Interactive Content */}
            {isExpanded && (
              <View style={[styles.expandedContent, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                <Text style={[styles.explanationText, { color: colors.onSurfaceVariant }]}>
                  {details.description}
                </Text>

                {exercise && (
                  <View style={[styles.exerciseBox, { backgroundColor: colors.backgroundDeep, borderColor: colors.outline }]}>
                    <View style={styles.exerciseHeader}>
                      <View style={styles.exerciseHeaderLeft}>
                        <Feather name="activity" size={14} color={colors.primary} />
                        <Text style={[styles.exerciseTitle, { color: colors.primary }]}>Suggested Exercise</Text>
                      </View>
                      <View style={styles.exerciseHeaderRight}>
                        <Feather name="clock" size={12} color={colors.secondary} />
                        <Text style={[styles.exerciseDuration, { color: colors.secondary }]}> {exercise.duration}</Text>
                      </View>
                    </View>
                    <Text style={[styles.exerciseName, { color: colors.onSurface }]}>{exercise.name}</Text>
                    
                    {/* Step-by-Step Interactive Checklist */}
                    <View style={styles.stepsList}>
                      {exercise.steps.map((step: string, index: number) => {
                        const isChecked = !!recSteps[index];
                        return (
                          <Pressable
                            key={index}
                            onPress={() => toggleStep(rec.id, index)}
                            style={[
                              styles.stepRow,
                              {
                                backgroundColor: isChecked
                                  ? (isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)')
                                  : 'transparent',
                              },
                            ]}
                          >
                            <Feather
                              name={isChecked ? 'check-circle' : 'circle'}
                              size={18}
                              color={isChecked ? colors.riskLow : colors.onSurfaceVariant}
                            />
                            <Text
                              style={[
                                styles.stepText,
                                {
                                  color: isChecked ? colors.onSurfaceVariant : colors.onSurface,
                                  textDecorationLine: isChecked ? 'line-through' : 'none',
                                },
                              ]}
                            >
                              {step}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Physiology Explanation */}
                    <Text style={[styles.physiologyText, { color: colors.onSurfaceVariant }]}>
                      * {exercise.explanation}
                    </Text>

                    {/* Integrated Interactive Session Timer */}
                    <ExerciseTimer duration={exercise.duration} />
                  </View>
                )}

                {/* Mark as Completed Button */}
                <View style={styles.actionBlock}>
                  {!rec.completed ? (
                    <PrimaryButton
                      label="Mark Exercise Done"
                      onPress={() => {
                        complete.mutate(rec.id);
                        Alert.alert('Action Logged', 'This recommendation has been marked as successfully complete.');
                      }}
                    />
                  ) : (
                    <StatusChip label="Completed" tone="low" />
                  )}
                </View>
              </View>
            )}
          </GlassCard>
        );
      })}

      <PrimaryButton label="Back to Dashboard" onPress={() => router.back()} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.md,
    gap: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flexDirection: 'column',
  },
  title: {
    ...typography.headlineLgMobile,
    fontSize: 22,
  },
  caption: {
    ...typography.labelCaps,
  },
  breathCard: {
    padding: spacing.md,
    gap: 12,
  },
  breathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  breathIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  breathSubtitle: {
    ...typography.bodyMd,
    fontSize: 13,
    lineHeight: 18,
  },
  breathingContainer: {
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  circleTrack: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.85,
  },
  breathingTextOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  breathingPhaseText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  breathingSecondsText: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  cycleCountText: {
    fontSize: 11,
    fontFamily: typography.dataMono.fontFamily,
    textAlign: 'center',
    marginTop: 4,
  },
  breathStartBtn: {
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  breathStartBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  introCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    lineHeight: 20,
  },
  introText: {
    ...typography.bodyMd,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    ...typography.titleMd,
    fontSize: 16,
    fontWeight: 'bold',
  },
  subText: {
    ...typography.bodyMd,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  scoreGrid: {
    gap: 12,
    marginTop: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  metricNameBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricLabel: {
    ...typography.bodyMd,
    fontWeight: '500',
  },
  metricStatusBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricVal: {
    ...typography.dataMono,
    fontSize: 13,
    fontWeight: '600',
  },
  statusIndicatorBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sectionHeading: {
    ...typography.headlineLgMobile,
    fontSize: 18,
    marginTop: 8,
  },
  subCaption: {
    ...typography.bodyMd,
    fontSize: 13,
    marginTop: -8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recTitleBlock: {
    gap: 6,
    flex: 1,
  },
  recTitle: {
    ...typography.titleMd,
    fontSize: 15,
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    gap: 12,
  },
  explanationText: {
    ...typography.bodyMd,
    fontSize: 13,
    lineHeight: 18,
  },
  exerciseBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: 8,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exerciseHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exerciseTitle: {
    ...typography.labelCaps,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'none',
  },
  exerciseDuration: {
    ...typography.dataMono,
    fontSize: 11,
  },
  exerciseName: {
    ...typography.titleMd,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepsList: {
    gap: 8,
    marginVertical: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 8,
    borderRadius: radius.sm,
  },
  stepText: {
    ...typography.bodyMd,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  physiologyText: {
    ...typography.bodyMd,
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 15,
  },
  timerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  timerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adjustButton: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 44,
    alignItems: 'center',
  },
  adjustButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  timerText: {
    ...typography.dataMono,
    fontSize: 22,
    fontWeight: 'bold',
    minWidth: 64,
    textAlign: 'center',
  },
  timerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 96,
  },
  timerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionBlock: {
    marginTop: 4,
  },
});
