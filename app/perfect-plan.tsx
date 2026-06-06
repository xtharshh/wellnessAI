import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { StatusChip } from '@/src/components/ui/StatusChip';
import { useRecommendations } from '@/src/hooks/useRecommendations';
import { useExercises } from '@/src/hooks/useExercises';
import { setupPerfectPlanExercises } from '@/src/services/exercises';
import { useAuthStore } from '@/src/stores/authStore';
import { useTheme } from '@/src/hooks/useTheme';
import { typography } from '@/src/theme/typography';
import { radius, spacing } from '@/src/theme/spacing';

export default function PerfectPlanScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { colors, isDark } = useTheme();
  
  const { data: recs, isLoading: isRecsLoading } = useRecommendations();
  const { data: exercises, isLoading: isExercisesLoading, refetch: refetchExercises } = useExercises();
  
  const [activating, setActivating] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, Record<number, boolean>>>({});

  // Determine if the perfect plan is already configured in the user's library
  const isPlanActive = (exercises || []).some(
    (e) => e.name.toLowerCase().trim() === 'mindful posture check'
  );

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

  const handleActivate = async () => {
    if (!user) return;
    setActivating(true);
    try {
      await setupPerfectPlanExercises(user.id);
      await refetchExercises();
      Alert.alert(
        'Perfect Plan Configured!',
        'Your custom exercise guides have been auto-configured and added to your Exercises library.',
        [
          {
            text: 'Go to Exercises',
            onPress: () => router.push('/(tabs)/exercises'),
          },
          { text: 'Dismiss', style: 'cancel' },
        ]
      );
    } catch (err) {
      Alert.alert('Activation Error', err instanceof Error ? err.message : 'Failed to configure exercises.');
    } finally {
      setActivating(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
          <Feather name="chevron-left" size={24} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.onSurface }]}>AI Perfect Plan</Text>
          <Text style={[styles.caption, { color: colors.primary }]}>Tailored Behavioral Routine</Text>
        </View>
      </View>

      {/* Intro Overview Card */}
      <GlassCard accent="primary" style={styles.introCard}>
        <View style={styles.introIconRow}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(162,203,253,0.18)' : 'rgba(162,203,253,0.35)' }]}>
            <Feather name="trending-up" size={20} color={isDark ? '#a2cbfd' : '#3b82f6'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Telemetry Correlation Plan</Text>
            <Text style={[styles.cardSub, { color: colors.onSurfaceVariant }]}>
              MindTrace calculated this custom schedule by identifying links between device screen-on intervals and typing stress spikes.
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Plan Status / CTA Section */}
      <GlassCard accent="secondary" style={styles.statusCard}>
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Plan Status</Text>
        
        {isPlanActive ? (
          <View style={styles.activePlanContainer}>
            <View style={[styles.activeBadge, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <Feather name="check-circle" size={16} color="#10b981" />
              <Text style={[styles.activeBadgeText, { color: '#10b981' }]}>Perfect Plan Active</Text>
            </View>
            <Text style={[styles.statusText, { color: colors.onSurfaceVariant }]}>
              Your custom posture checks and dynamic rolls are configured in your Exercises tab.
            </Text>
            <PrimaryButton 
              label="Go to Exercises Library" 
              onPress={() => router.push('/(tabs)/exercises')} 
            />
          </View>
        ) : (
          <View style={styles.inactivePlanContainer}>
            <Text style={[styles.statusText, { color: colors.onSurfaceVariant, marginBottom: 8 }]}>
              Unlock custom physical breaks automatically synced to your wellness logs. Activating this plan installs customized routines in your library.
            </Text>
            <PrimaryButton
              label={activating ? 'Configuring...' : 'Auto-Configure Perfect Plan'}
              onPress={handleActivate}
              loading={activating}
            />
          </View>
        )}
      </GlassCard>

      {/* Deep-Dive Insights Bullet List */}
      <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>Habit Findings</Text>
      <GlassCard style={styles.findingsCard}>
        <View style={styles.findingsBullet}>
          <View style={[styles.bulletCircle, { backgroundColor: isDark ? 'rgba(247,190,233,0.18)' : 'rgba(247,190,233,0.35)' }]}>
            <Feather name="moon" size={14} color={isDark ? '#f7bee9' : '#ec4899'} />
          </View>
          <Text style={[styles.findingText, { color: colors.onSurfaceVariant }]}>
            We've noticed your typing errors drop by <Text style={{ fontWeight: '700', color: colors.onSurface }}>22%</Text> when you get more than 7.5 hours of sleep.
          </Text>
        </View>

        <View style={styles.findingsBullet}>
          <View style={[styles.bulletCircle, { backgroundColor: isDark ? 'rgba(162,203,253,0.18)' : 'rgba(162,203,253,0.35)' }]}>
            <Feather name="alert-circle" size={14} color={isDark ? '#a2cbfd' : '#3b82f6'} />
          </View>
          <Text style={[styles.findingText, { color: colors.onSurfaceVariant }]}>
            Your stress spikes by <Text style={{ fontWeight: '700', color: colors.onSurface }}>18%</Text> on days when screen-on time exceeds 4.5 hours.
          </Text>
        </View>
      </GlassCard>

      {/* Recommendations Checklist */}
      <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>Recommended Action Items</Text>

      {isRecsLoading && <ActivityIndicator color={colors.primary} size="small" style={{ marginVertical: 24 }} />}

      {!isRecsLoading && (recs || []).map((rec) => {
        let details = { description: rec.body, exercise: null as any };
        try {
          details = JSON.parse(rec.body);
        } catch {}

        const exercise = details.exercise;
        const recSteps = checkedSteps[rec.id] || {};

        return (
          <GlassCard key={rec.id} accent="primary">
            <View style={styles.recHeaderRow}>
              <StatusChip label={rec.category} tone={rec.category === 'mindfulness' ? 'active' : rec.category === 'sleep' ? 'medium' : rec.category === 'activity' ? 'low' : 'neutral'} />
              <Text style={[styles.recTitle, { color: colors.onSurface }]}>{rec.title}</Text>
            </View>
            <Text style={[styles.recDesc, { color: colors.onSurfaceVariant }]}>{details.description}</Text>

            {exercise && (
              <View style={[styles.exerciseBox, { backgroundColor: colors.backgroundDeep, borderColor: colors.outline }]}>
                <Text style={[styles.exerciseName, { color: colors.onSurface }]}>{exercise.name}</Text>
                
                {/* Step checklist */}
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
                          size={16}
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
  introCard: {
    padding: spacing.md,
  },
  introIconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  statusCard: {
    padding: spacing.md,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  activePlanContainer: {
    gap: 12,
    marginTop: 4,
  },
  inactivePlanContainer: {
    gap: 8,
    marginTop: 4,
  },
  activeBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  activeBadgeText: {
    ...typography.labelCaps,
    fontSize: 11,
    textTransform: 'none',
  },
  statusText: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeading: {
    ...typography.headlineLgMobile,
    fontSize: 18,
    marginTop: 8,
  },
  findingsCard: {
    padding: spacing.md,
    gap: 14,
  },
  findingsBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  findingText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  recHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  recDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  exerciseBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm,
    gap: 6,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
  },
  stepsList: {
    gap: 6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 6,
    borderRadius: radius.sm,
  },
  stepText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
});
