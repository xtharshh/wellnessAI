import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { useExercises } from '@/src/hooks/useExercises';
import { setupPerfectPlanExercises } from '@/src/services/exercises';
import { useAuthStore } from '@/src/stores/authStore';
import { useTheme } from '@/src/hooks/useTheme';
import { radius, spacing } from '@/src/theme/spacing';

export default function PerfectPlanScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { colors, isDark } = useTheme();

  const { data: exercises, refetch: refetchExercises } = useExercises();
  
  const [activating, setActivating] = useState(false);

  // Check if perfect plan is already active
  const isPlanActive = (exercises || []).some(
    (e) => e.name.toLowerCase().trim() === 'mindful posture check'
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/dashboard');
    }
  };

  const handleActivate = async () => {
    if (!user) return;
    setActivating(true);
    try {
      await setupPerfectPlanExercises(user.id);
      await refetchExercises();
      Alert.alert(
        'Perfect Plan Activated!',
        'Your custom routine guides have been added to your Exercises library.',
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

  // Color helpers
  const bgThemeColor = isDark ? '#0c0b16' : '#f6f5fb';
  const cardBgColor = isDark ? 'rgba(27, 24, 54, 0.5)' : '#ffffff';
  const cardBorderColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(124, 58, 237, 0.08)';
  const textColor = isDark ? '#ffffff' : '#0f0d1e';
  const textMutedColor = isDark ? '#9ca3af' : '#6b7280';
  const accentPurple = '#8b5cf6';
  const accentGreen = '#10b981';
  const accentPink = '#ec4899';
  const accentBlue = '#3b82f6';

  return (
    <ScreenContainer scrollable contentStyle={[styles.container, { backgroundColor: bgThemeColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0,0,0,0.03)' }]}>
          <Feather name="chevron-left" size={22} color={textColor} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: textColor }]}>Your Perfect Plan</Text>
          <Text style={[styles.subtitle, { color: textMutedColor }]}>AI-calibrated to your behavioral patterns</Text>
        </View>
      </View>

      {/* Projected Improvement Card */}
      <GlassCard style={[styles.improvementCard, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
        <View style={styles.improvementHeader}>
          <View style={[styles.sparkleIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.08)' }]}>
            <Feather name="sparkles" size={16} color={accentPurple} />
          </View>
          <View>
            <Text style={[styles.improvementTitle, { color: textColor }]}>Projected improvement</Text>
            <Text style={[styles.improvementSub, { color: textMutedColor }]}>Following this plan for 7 days</Text>
          </View>
        </View>
        
        <View style={styles.badgeRow}>
          <View style={[styles.impBadge, { backgroundColor: 'rgba(139, 92, 246, 0.08)' }]}>
            <Text style={[styles.impBadgeText, { color: accentPurple }]}>Mood +14%</Text>
          </View>
          <View style={[styles.impBadge, { backgroundColor: 'rgba(59, 130, 246, 0.08)' }]}>
            <Text style={[styles.impBadgeText, { color: accentBlue }]}>Sleep +22%</Text>
          </View>
          <View style={[styles.impBadge, { backgroundColor: 'rgba(236, 72, 153, 0.08)' }]}>
            <Text style={[styles.impBadgeText, { color: accentPink }]}>Stress -31%</Text>
          </View>
        </View>
      </GlassCard>

      {/* Daily Routine Blocks */}
      <View style={styles.scheduleContainer}>
        {/* Morning block */}
        <View style={[styles.scheduleBlock, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
          <View style={styles.blockHeader}>
            <View style={styles.blockHeaderLeft}>
              <Feather name="sun" size={16} color={accentBlue} style={{ marginRight: 6 }} />
              <Text style={[styles.blockTitle, { color: textColor }]}>Morning</Text>
              <Text style={[styles.blockTime, { color: textMutedColor }]}>6:30 AM</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: accentBlue }]} />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.routineRow}>
            <Text style={[styles.routineItemName, { color: textColor }]}>Wake without alarm</Text>
            <Text style={[styles.routineDuration, { color: textMutedColor }]}>—</Text>
            <View style={[styles.routineTag, { backgroundColor: 'rgba(59, 130, 246, 0.06)' }]}>
              <Text style={[styles.routineTagText, { color: accentBlue }]}>+Mood 8%</Text>
            </View>
          </View>
          
          <View style={styles.routineRow}>
            <Text style={[styles.routineItemName, { color: textColor }]}>5-min gratitude log</Text>
            <Text style={[styles.routineDuration, { color: textMutedColor }]}>5 min</Text>
            <View style={[styles.routineTag, { backgroundColor: 'rgba(59, 130, 246, 0.06)' }]}>
              <Text style={[styles.routineTagText, { color: accentBlue }]}>+Mood 12%</Text>
            </View>
          </View>

          <View style={styles.routineRow}>
            <Text style={[styles.routineItemName, { color: textColor }]}>10-min stretch</Text>
            <Text style={[styles.routineDuration, { color: textMutedColor }]}>10 min</Text>
            <View style={[styles.routineTag, { backgroundColor: 'rgba(59, 130, 246, 0.06)' }]}>
              <Text style={[styles.routineTagText, { color: accentBlue }]}>+Activity</Text>
            </View>
          </View>
        </View>

        {/* Midday block */}
        <View style={[styles.scheduleBlock, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
          <View style={styles.blockHeader}>
            <View style={styles.blockHeaderLeft}>
              <Feather name="activity" size={16} color={accentGreen} style={{ marginRight: 6 }} />
              <Text style={[styles.blockTitle, { color: textColor }]}>Midday</Text>
              <Text style={[styles.blockTime, { color: textMutedColor }]}>12:30 PM</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: accentGreen }]} />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.routineRow}>
            <Text style={[styles.routineItemName, { color: textColor }]}>20-min mindful walk</Text>
            <Text style={[styles.routineDuration, { color: textMutedColor }]}>20 min</Text>
            <View style={[styles.routineTag, { backgroundColor: 'rgba(16, 185, 129, 0.06)' }]}>
              <Text style={[styles.routineTagText, { color: accentGreen }]}>-Stress 18%</Text>
            </View>
          </View>
          
          <View style={styles.routineRow}>
            <Text style={[styles.routineItemName, { color: textColor }]}>Screen-free lunch</Text>
            <Text style={[styles.routineDuration, { color: textMutedColor }]}>30 min</Text>
            <View style={[styles.routineTag, { backgroundColor: 'rgba(16, 185, 129, 0.06)' }]}>
              <Text style={[styles.routineTagText, { color: accentGreen }]}>+Focus</Text>
            </View>
          </View>
        </View>

        {/* Evening block */}
        <View style={[styles.scheduleBlock, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
          <View style={styles.blockHeader}>
            <View style={styles.blockHeaderLeft}>
              <Feather name="moon" size={16} color={accentPurple} style={{ marginRight: 6 }} />
              <Text style={[styles.blockTitle, { color: textColor }]}>Evening</Text>
              <Text style={[styles.blockTime, { color: textMutedColor }]}>9:00 PM</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: accentPurple }]} />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.routineRow}>
            <Text style={[styles.routineItemName, { color: textColor }]}>Digital sunset — screens off</Text>
            <Text style={[styles.routineDuration, { color: textMutedColor }]}>—</Text>
            <View style={[styles.routineTag, { backgroundColor: 'rgba(139, 92, 246, 0.06)' }]}>
              <Text style={[styles.routineTagText, { color: accentPurple }]}>+Sleep 22%</Text>
            </View>
          </View>
          
          <View style={styles.routineRow}>
            <Text style={[styles.routineItemName, { color: textColor }]}>4-7-8 breathing</Text>
            <Text style={[styles.routineDuration, { color: textMutedColor }]}>8 min</Text>
            <View style={[styles.routineTag, { backgroundColor: 'rgba(139, 92, 246, 0.06)' }]}>
              <Text style={[styles.routineTagText, { color: accentPurple }]}>-Stress 30%</Text>
            </View>
          </View>

          <View style={styles.routineRow}>
            <Text style={[styles.routineItemName, { color: textColor }]}>Journal entry</Text>
            <Text style={[styles.routineDuration, { color: textMutedColor }]}>5 min</Text>
            <View style={[styles.routineTag, { backgroundColor: 'rgba(139, 92, 246, 0.06)' }]}>
              <Text style={[styles.routineTagText, { color: accentPurple }]}>+Mood 10%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Activate button */}
      <View style={styles.bottomContainer}>
        {isPlanActive ? (
          <Pressable
            onPress={() => router.push('/(tabs)/exercises')}
            style={[styles.activateBtn, { backgroundColor: accentPurple }]}
          >
            <Feather name="check-circle" size={16} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.activateBtnText}>Plan Active (Go to Exercises)</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleActivate}
            disabled={activating}
            style={[styles.activateBtn, { backgroundColor: accentPurple }]}
          >
            {activating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Feather name="sparkles" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.activateBtnText}>Activate My Plan</Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* visual spacer */}
      <View style={{ height: 40 }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  improvementCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 14,
  },
  improvementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sparkleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  improvementTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  improvementSub: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  impBadge: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  impBadgeText: {
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  scheduleContainer: {
    gap: 12,
  },
  scheduleBlock: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: 10,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 8,
  },
  blockTime: {
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  routineItemName: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  routineDuration: {
    fontSize: 11,
    fontWeight: '500',
    marginRight: 10,
    width: 50,
    textAlign: 'right',
  },
  routineTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  routineTagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  bottomContainer: {
    marginTop: 10,
  },
  activateBtn: {
    height: 48,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activateBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
