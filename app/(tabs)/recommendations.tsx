import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SecondaryButton } from '@/src/components/ui/SecondaryButton';
import { StatusChip } from '@/src/components/ui/StatusChip';
import { useRecommendations } from '@/src/hooks/useRecommendations';
import { useTheme } from '@/src/hooks/useTheme';
import { typography } from '@/src/theme/typography';
import { radius, spacing } from '@/src/theme/spacing';

const categoryTone = {
  sleep: 'medium' as const,
  mindfulness: 'active' as const,
  activity: 'low' as const,
  general: 'neutral' as const,
};

const categoryIcon = {
  sleep: 'moon' as const,
  mindfulness: 'wind' as const,
  activity: 'activity' as const,
  general: 'compass' as const,
};

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
    setSeconds((s) => Math.max(10, s + amount));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={[styles.timerWrapper, { borderTopColor: colors.outline }]}>
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

export default function RecommendationsScreen() {
  const router = useRouter();
  const { data, isLoading, regenerate, dismiss, complete } = useRecommendations();
  const { colors, isDark } = useTheme();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, Record<number, boolean>>>({});

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
    <ScreenContainer scrollable>
      <View style={styles.headerSection}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>AI Recommendations</Text>
        <Text style={[styles.title, { color: colors.onSurface }]}>Personalized guidance</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Generated from your latest wellness trace patterns.
        </Text>
      </View>

      <View style={styles.actionContainer}>
        <PrimaryButton
          label={regenerate.isPending ? 'Generating...' : 'Regenerate Recommendations'}
          onPress={() =>
            regenerate.mutate(undefined, {
              onSuccess: () => router.push('/ai-insights'),
            })
          }
          loading={regenerate.isPending}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={[styles.loading, { color: colors.onSurfaceVariant }]}>Loading recommendations...</Text>
        </View>
      ) : null}

      <View style={styles.recsList}>
        {(data ?? []).map((rec) => {
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
                  <View style={styles.badgeRow}>
                    <StatusChip label={rec.category} tone={categoryTone[rec.category]} />
                    {rec.completed ? <StatusChip label="Done" tone="low" /> : null}
                  </View>
                  <Text style={[styles.recTitle, { color: colors.onSurface }]}>{rec.title}</Text>
                </View>
                <View style={styles.headerRight}>
                  <Feather name={categoryIcon[rec.category]} size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.onSurfaceVariant} />
                </View>
              </Pressable>

              {/* Collapsible content */}
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
                      
                      {/* Steps List */}
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

                      {/* Explanation */}
                      {exercise.explanation && (
                        <Text style={[styles.physiologyText, { color: colors.onSurfaceVariant }]}>
                          * {exercise.explanation}
                        </Text>
                      )}

                      {/* Timer */}
                      <ExerciseTimer duration={exercise.duration} />
                    </View>
                  )}

                  <View style={styles.actions}>
                    {!rec.completed ? (
                      <SecondaryButton
                        label="Mark Done"
                        onPress={() => {
                          complete.mutate(rec.id);
                          Alert.alert('Action Logged', 'This recommendation has been marked as successfully complete.');
                        }}
                      />
                    ) : null}
                    <SecondaryButton label="Dismiss" onPress={() => dismiss.mutate(rec.id)} />
                  </View>
                </View>
              )}
            </GlassCard>
          );
        })}
      </View>

      {!isLoading && !(data ?? []).length ? (
        <Text style={[styles.empty, { color: colors.onSurfaceVariant }]}>No active recommendations. Tap regenerate to create new ones.</Text>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    marginBottom: spacing.sm,
  },
  eyebrow: {
    ...typography.labelCaps,
    marginTop: 12,
  },
  title: {
    ...typography.headlineLgMobile,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    ...typography.bodyMd,
    lineHeight: 20,
  },
  actionContainer: {
    marginVertical: spacing.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 16,
  },
  loading: {
    ...typography.bodyMd,
  },
  recsList: {
    gap: 16,
    paddingBottom: 24,
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
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  recTitle: {
    ...typography.titleMd,
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandedContent: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    gap: 12,
  },
  explanationText: {
    ...typography.bodyMd,
    fontSize: 14,
    lineHeight: 20,
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
  actions: {
    gap: 8,
    marginTop: 8,
  },
  empty: {
    ...typography.bodyMd,
    textAlign: 'center',
    marginTop: 24,
  },
});
