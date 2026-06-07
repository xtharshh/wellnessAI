import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
  AppState,
  Image,
} from 'react-native';

import { MetricWidget } from '@/src/components/dashboard/MetricWidget';
import { BreathworkTimer } from '@/src/components/ui/BreathworkTimer';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { StatusChip } from '@/src/components/ui/StatusChip';
import { useTheme } from '@/src/hooks/useTheme';
import { useWellnessSummary } from '@/src/hooks/useWellnessSummary';
import { refreshLatestSnapshot } from '@/src/services/wellness';
import { useAuthStore } from '@/src/stores/authStore';
import { radius, spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

// Native wellbeing module imports
import { hasUsageStatsPermission, requestUsageStatsPermission } from '@/modules/android-wellbeing';

// Mindful widgets & modals
import { AIBiomarkersCard } from '@/src/components/dashboard/AIBiomarkersCard';
import { JournalModal } from '@/src/components/dashboard/JournalModal';
import { MeditationTimerModal } from '@/src/components/dashboard/MeditationTimerModal';
import { WeeklyReportModal } from '@/src/components/dashboard/WeeklyReportModal';
import { RemindersModal } from '@/src/components/dashboard/RemindersModal';

const DAILY_TIPS = [
  "Take a 20-second screen break every 20 minutes to prevent digital cognitive fatigue.",
  "Deep breathing resets heart rate variability and clears bio-typing tension.",
  "Limit social media access after 10 PM to protect your circadian rhythm.",
  "Consistent sleep windows are key to maintaining a high focus level of >80%.",
  "Spills of cold water on your face activate the vagus nerve and lower immediate anxiety."
];

const DAILY_AFFIRMATIONS = [
  "My mind is calm, and my thoughts are clear.",
  "I choose to focus on what I can control and let go of the rest.",
  "I am doing my best, and my best is enough.",
  "I trust the timing of my life and embrace peace.",
  "Every breath I take brings me closer to balance and stability.",
  "I am resilient, capable, and worthy of rest.",
  "I give myself permission to unplug and recharge.",
];

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { data, isLoading, isRefetching, refetch } = useWellnessSummary();
  const { colors, isDark } = useTheme();

  // Modal visibility states
  const [journalVisible, setJournalVisible] = useState(false);
  const [meditationVisible, setMeditationVisible] = useState(false);
  const [weeklyReportVisible, setWeeklyReportVisible] = useState(false);
  const [remindersVisible, setRemindersVisible] = useState(false);

  // Digital Wellbeing Permission State
  const [hasPermission, setHasPermission] = useState(true);

  // Select a consistent daily tip and affirmation
  const dailyTip = DAILY_TIPS[new Date().getDate() % DAILY_TIPS.length];
  const dailyAffirmation = DAILY_AFFIRMATIONS[new Date().getDate() % DAILY_AFFIRMATIONS.length];

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  };

  useEffect(() => {
    const checkPerm = () => {
      if (Platform.OS === 'android') {
        setHasPermission(hasUsageStatsPermission());
      } else {
        setHasPermission(true);
      }
    };
    checkPerm();
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkPerm();
      }
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

  const summary = data?.summary;
  const series = data?.series;
  const liveMetrics = data?.liveMetrics;

  // Determine avatar initials
  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'MT';

  // Extract last 7 values of wellness score series (or fallback to mock series of 7 values)
  const healthSeries = series?.mood?.slice(-7) || [0, 0, 0, 0, 0, 0, 0];

  return (
    <ScreenContainer
      contentStyle={styles.container}
      refreshing={isRefetching}
      onRefresh={handleRefresh}>
      
      {/* Curved Wavy Top Header Banner */}
      <LinearGradient
        colors={isDark ? ['#1a1030', '#0a0b10'] : ['#a2cbfd', '#f7bee9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerBanner, { borderBottomColor: colors.outline }]}>
        
        {/* Profile Row */}
        <View style={styles.profileRow}>
          <View style={styles.avatarCol}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.surface, borderColor: colors.outline, overflow: 'hidden' }]}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarText, { color: isDark ? colors.primary : '#0f172a' }]}>{initials}</Text>
              )}
            </View>
            <View>
              <Text style={[styles.greetingEyebrow, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)' }]}>{getTimeBasedGreeting()}</Text>
              <Text style={[styles.greetingTitle, { color: isDark ? colors.onSurface : '#0f172a' }]}>Hi, {user?.displayName ?? 'Observer'}</Text>
            </View>
          </View>
          <Pressable onPress={() => setRemindersVisible(true)} style={[styles.bellCircle, { backgroundColor: colors.surface }]}>
            <Feather name="bell" size={18} color={isDark ? colors.onSurface : '#0f172a'} />
          </Pressable>
        </View>

        {/* Search Input */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Feather name="search" size={16} color={colors.onSurfaceVariant} />
          <TextInput
            placeholder="Passive cognitive telemetry active..."
            placeholderTextColor={colors.onSurfaceVariant}
            style={[styles.searchInput, { color: colors.onSurface }]}
            editable={false}
          />
        </View>
      </LinearGradient>

      {/* Main Body Content */}
      <View style={styles.bodyContent}>

        {/* Your Condition Section */}
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Your Condition</Text>
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <MetricWidget
              title="Mood"
              value={String(summary?.moodScore ?? '—')}
              unit="/100"
              trend={summary?.moodTrend}
              accent="primary"
              icon="smile"
              onPress={() => router.push({ pathname: '/modal', params: { metric: 'mood' } })}
            />
            <MetricWidget
              title="Sleep"
              value={String(summary?.sleepHours ?? '—')}
              unit="hrs"
              trend={summary?.sleepTrend}
              accent="secondary"
              icon="moon"
              onPress={() => router.push({ pathname: '/modal', params: { metric: 'sleep' } })}
            />
          </View>
          <View style={styles.gridRow}>
            <MetricWidget
              title="Activity"
              value={String(summary?.activityLevel ?? '—')}
              unit="/100"
              trend={summary?.activityTrend}
              accent="tertiary"
              icon="zap"
              onPress={() => router.push({ pathname: '/modal', params: { metric: 'activity' } })}
            />
            <MetricWidget
              title="Stress Index"
              value={String(summary?.stressIndex ?? '—')}
              unit="/100"
              trend={summary?.stressTrend}
              accent="primary"
              icon="trending-down"
              onPress={() => router.push({ pathname: '/modal', params: { metric: 'stress' } })}
            />
          </View>
        </View>

        {/* Daily Affirmation Card */}
        <GlassCard accent="primary" style={styles.affirmationCard}>
          <View style={styles.affirmationHeader}>
            <Feather name="heart" size={14} color={colors.primary} style={{ marginRight: 2 }} />
            <Text style={[styles.affirmationTitle, { color: colors.onSurface }]}>Daily Affirmation</Text>
          </View>
          <Text style={[styles.affirmationText, { color: colors.onSurfaceVariant }]}>
            "{dailyAffirmation}"
          </Text>
        </GlassCard>

        {/* 1. Android Digital Wellbeing Permission Request Banner */}
        {!hasPermission && Platform.OS === 'android' && (
          <GlassCard accent="primary" style={styles.permissionBanner}>
            <View style={[styles.permissionIconCircle, { backgroundColor: colors.outline }]}>
              <Feather name="shield" size={18} color={colors.primary} />
            </View>
            <View style={styles.permissionTextCol}>
              <Text style={[styles.permissionTitle, { color: colors.onSurface }]}>
                Enable Screen Time Insights
              </Text>
              <Text style={[styles.permissionDesc, { color: colors.onSurfaceVariant }]}>
                MindTrace needs Usage Statistics access to passively analyze screen duration and overuse patterns.
              </Text>
              <Pressable
                style={[styles.permissionBtn, { backgroundColor: colors.primaryAccent }]}
                onPress={() => requestUsageStatsPermission()}
              >
                <Text style={styles.permissionBtnText}>Grant Access</Text>
              </Pressable>
            </View>
          </GlassCard>
        )}

        {/* 2. Quick Actions Grid */}
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Mindful Practice Actions</Text>
        <View style={styles.quickActionsGrid}>
          <View style={styles.quickRow}>
            <Pressable onPress={() => setJournalVisible(true)} style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
              <Feather name="book-open" size={18} color="#ffb3d9" />
              <Text style={[styles.actionLabel, { color: colors.onSurface }]}>Daily Journal</Text>
            </Pressable>
            <Pressable onPress={() => setMeditationVisible(true)} style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
              <Feather name="anchor" size={18} color="#a2cbfd" />
              <Text style={[styles.actionLabel, { color: colors.onSurface }]}>Meditation Timer</Text>
            </Pressable>
          </View>
          <View style={styles.quickRow}>
            <Pressable onPress={() => setWeeklyReportVisible(true)} style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
              <Feather name="bar-chart-2" size={18} color="#6ee7b7" />
              <Text style={[styles.actionLabel, { color: colors.onSurface }]}>Weekly Report</Text>
            </Pressable>
            <Pressable onPress={() => setRemindersVisible(true)} style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
              <Feather name="bell" size={18} color="#b59cff" />
              <Text style={[styles.actionLabel, { color: colors.onSurface }]}>Reminders</Text>
            </Pressable>
          </View>
        </View>

        {/* 3. Daily Wellness Tip Card */}
        <GlassCard accent="secondary" style={styles.tipCard}>
          <View style={styles.tipHeaderRow}>
            <Feather name="sun" size={14} color={colors.secondary} />
            <Text style={[styles.tipTitle, { color: colors.onSurface }]}>Daily Wellness Tip</Text>
          </View>
          <Text style={[styles.tipBody, { color: colors.onSurfaceVariant }]}>{dailyTip}</Text>
        </GlassCard>

        {/* 4. AI Mental Health Biomarkers */}
        <AIBiomarkersCard behaviorAnalysis={liveMetrics?.behaviorAnalysis} />

        {/* 5. Digital Wellbeing Telemetry Details Card */}
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Digital Wellbeing Telemetry</Text>
        <GlassCard accent="secondary" style={styles.wellbeingCard}>
          <View style={styles.wellbeingHeader}>
            <View style={styles.wellbeingTimeCol}>
              <Text style={[styles.wellbeingLabel, { color: colors.onSurfaceVariant }]}>Estimated Daily Screen Time</Text>
              <Text style={[styles.wellbeingTimeVal, { color: colors.onSurface }]}>
                {liveMetrics?.behaviorAnalysis?.screenTimeMinutes
                  ? `${Math.floor(liveMetrics.behaviorAnalysis.screenTimeMinutes / 60)}h ${liveMetrics.behaviorAnalysis.screenTimeMinutes % 60}m`
                  : '3h 15m'}
              </Text>
            </View>
            <View style={[styles.wellbeingIconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
              <Feather name="clock" size={20} color={colors.secondary} />
            </View>
          </View>

          {/* Behavioral tags */}
          <View style={styles.alertTagsRow}>
            {liveMetrics?.behaviorAnalysis?.doomScrollingDetected && (
              <View style={[styles.alertTag, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                <View style={[styles.alertDot, { backgroundColor: '#ef4444' }]} />
                <Text style={[styles.alertTagText, { color: '#ef4444' }]}>Doom Scrolling</Text>
              </View>
            )}
            {liveMetrics?.behaviorAnalysis?.lateNightUsageDetected && (
              <View style={[styles.alertTag, { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.2)' }]}>
                <View style={[styles.alertDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={[styles.alertTagText, { color: '#f59e0b' }]}>Late Night Active</Text>
              </View>
            )}
            {liveMetrics?.behaviorAnalysis?.socialMediaOveruseDetected && (
              <View style={[styles.alertTag, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                <View style={[styles.alertDot, { backgroundColor: '#ef4444' }]} />
                <Text style={[styles.alertTagText, { color: '#ef4444' }]}>Social Overuse</Text>
              </View>
            )}
            {liveMetrics?.behaviorAnalysis?.usageSpikesDetected && (
              <View style={[styles.alertTag, { backgroundColor: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <View style={[styles.alertDot, { backgroundColor: '#3b82f6' }]} />
                <Text style={[styles.alertTagText, { color: '#3b82f6' }]}>Usage Spike</Text>
              </View>
            )}
            {!liveMetrics?.behaviorAnalysis?.doomScrollingDetected && 
             !liveMetrics?.behaviorAnalysis?.lateNightUsageDetected && 
             !liveMetrics?.behaviorAnalysis?.socialMediaOveruseDetected && (
              <View style={[styles.alertTag, { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <View style={[styles.alertDot, { backgroundColor: '#10b981' }]} />
                <Text style={[styles.alertTagText, { color: '#10b981' }]}>Stable Pattern</Text>
              </View>
            )}
          </View>

          {/* Most Used Apps */}
          <View style={styles.appsSection}>
            <Text style={[styles.appsTitle, { color: colors.onSurface }]}>App Breakdown</Text>
            {(liveMetrics?.behaviorAnalysis?.mostUsedApps || [
              { name: 'Instagram', durationMinutes: 72, percentage: 40, icon: 'instagram' },
              { name: 'Twitter/X', durationMinutes: 45, percentage: 25, icon: 'twitter' },
              { name: 'WhatsApp', durationMinutes: 27, percentage: 15, icon: 'message-circle' },
            ]).map((app: any, idx: number) => (
              <View key={idx} style={styles.appRow}>
                <View style={styles.appNameCol}>
                  <Feather name={app.icon as any} size={13} color={colors.onSurfaceVariant} />
                  <Text style={[styles.appName, { color: colors.onSurface }]}>{app.name}</Text>
                </View>
                <View style={styles.appProgressCol}>
                  <View style={[styles.appProgressTrack, { backgroundColor: colors.outline }]}>
                    <View style={[styles.appProgressBar, { width: `${app.percentage}%`, backgroundColor: colors.primary }]} />
                  </View>
                  <Text style={[styles.appTime, { color: colors.onSurfaceVariant }]}>
                    {app.durationMinutes}m
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Sleep pattern overview */}
          <View style={[styles.sleepPatternBox, { borderTopColor: colors.outline }]}>
            <Feather name="moon" size={13} color={colors.secondary} />
            <Text style={[styles.sleepPatternText, { color: colors.onSurfaceVariant }]}>
              {liveMetrics?.behaviorAnalysis?.sleepIndication || 'Sleep span: 11:30 PM - 7:00 AM (7.5 hrs)'}
            </Text>
          </View>
        </GlassCard>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Health Overview</Text>
          <StatusChip label={summary?.riskLevel ?? 'analyzing'} tone={summary?.riskLevel ?? 'active'} />
        </View>

        {/* Overview Health Card */}
        <GlassCard accent="primary" style={styles.overviewCard}>
          <View style={styles.overviewLeft}>
            <Text style={[styles.overviewLabel, { color: colors.onSurfaceVariant }]}>Overall Wellness Score</Text>
            <Text style={[styles.overviewValue, { color: colors.onSurface }]}>
              {isLoading ? '—' : `${summary?.wellnessScore ?? 0}%`}
            </Text>
            <Text style={[styles.overviewSub, { color: colors.onSurfaceVariant }]}>
              {summary?.lastUpdated
                ? `Updated: ${new Date(summary.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Awaiting data'}
            </Text>
          </View>

          {/* Vertical Bar Chart (Flexbox representation of last 7 points) */}
          <View style={styles.chartCol}>
            <View style={styles.barChartRow}>
              {healthSeries.map((val, idx) => {
                // Determine heights dynamically, minimum 6px, max 54px
                const barHeight = Math.max(6, Math.min(54, (val / 100) * 54));
                const isLatest = idx === healthSeries.length - 1;
                return (
                  <View key={idx} style={styles.barCol}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: barHeight,
                          backgroundColor: isLatest 
                            ? isDark ? '#a2cbfd' : '#5a9efa' 
                            : isDark ? 'rgba(162,203,253,0.3)' : 'rgba(162,203,253,0.6)',
                        },
                      ]}
                    />
                    <Text style={[styles.barLabel, { color: colors.onSurfaceVariant }]}>
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </GlassCard>

        {/* AI Habit Insights Section */}
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>AI Habit Correlations</Text>
        <Pressable onPress={() => router.push('/perfect-plan')}>
          <GlassCard accent="secondary" style={styles.insightsCard}>
            <View style={styles.insightHeaderRow}>
              <View style={[styles.insightIconCircle, { backgroundColor: isDark ? 'rgba(247,190,233,0.18)' : 'rgba(247,190,233,0.35)' }]}>
                <Feather name="trending-up" size={18} color={isDark ? '#f7bee9' : '#ec4899'} />
              </View>
              <Text style={[styles.insightTitle, { color: colors.onSurface }]}>AI Perfect Plan Insights</Text>
              <Feather name="chevron-right" size={18} color={colors.onSurfaceVariant} style={{ marginLeft: 'auto' }} />
            </View>
            
            <View style={styles.insightsBulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: isDark ? '#f7bee9' : '#ec4899' }]} />
              <Text style={[styles.insightBulletText, { color: colors.onSurfaceVariant }]}>
                We've noticed your typing errors drop by <Text style={{ fontWeight: '700', color: colors.onSurface }}>22%</Text> when you get more than 7.5 hours of sleep.
              </Text>
            </View>
            
            <View style={styles.insightsBulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: isDark ? '#f7bee9' : '#ec4899' }]} />
              <Text style={[styles.insightBulletText, { color: colors.onSurfaceVariant }]}>
                Your stress spikes by <Text style={{ fontWeight: '700', color: colors.onSurface }}>18%</Text> on days when screen-on time exceeds 4.5 hours.
              </Text>
            </View>
            
            <Pressable 
              style={[styles.configureBtn, { backgroundColor: isDark ? colors.surfaceContainerHigh : '#0f172a' }]}
              onPress={() => router.push('/perfect-plan')}
            >
              <Text style={[styles.configureBtnText, { color: '#ffffff' }]}>View & Activate Perfect Plan</Text>
            </Pressable>
          </GlassCard>
        </Pressable>

        {/* Visual Guided Breathwork Coach Section */}
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Guided Breathwork</Text>
        <BreathworkTimer />
      </View>

      {/* Mindful Modals Rendering */}
      <JournalModal visible={journalVisible} onClose={() => setJournalVisible(false)} />
      <MeditationTimerModal visible={meditationVisible} onClose={() => setMeditationVisible(false)} />
      <WeeklyReportModal
        visible={weeklyReportVisible}
        onClose={() => setWeeklyReportVisible(false)}
        seriesData={series}
        summaryData={summary}
      />
      <RemindersModal visible={remindersVisible} onClose={() => setRemindersVisible(false)} />

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 120,
  },
  headerBanner: {
    paddingTop: 54,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    gap: 20,
    borderBottomWidth: 1,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  greetingEyebrow: {
    ...typography.labelCaps,
    textTransform: 'none',
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  bellCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 46,
    borderRadius: 23,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  bodyContent: {
    paddingHorizontal: 20,
    gap: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  permissionBanner: {
    padding: spacing.md,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 4,
  },
  permissionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTextCol: {
    flex: 1,
    gap: 6,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  permissionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  permissionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  permissionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickActionsGrid: {
    gap: 12,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  tipCard: {
    padding: spacing.md,
    gap: 6,
  },
  tipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  tipBody: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  wellbeingCard: {
    padding: spacing.md,
    gap: 14,
  },
  wellbeingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wellbeingTimeCol: {
    gap: 2,
  },
  wellbeingLabel: {
    ...typography.labelCaps,
    fontSize: 11,
  },
  wellbeingTimeVal: {
    fontSize: 28,
    fontWeight: '800',
  },
  wellbeingIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  alertTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  alertTagText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  appsSection: {
    gap: 10,
  },
  appsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appNameCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 110,
  },
  appName: {
    fontSize: 13,
  },
  appProgressCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appProgressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  appProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  appTime: {
    fontSize: 11,
    width: 35,
    textAlign: 'right',
  },
  sleepPatternBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  sleepPatternText: {
    fontSize: 12,
  },
  overviewCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  overviewLeft: {
    flex: 1,
    gap: 2,
  },
  overviewLabel: {
    ...typography.labelCaps,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  overviewValue: {
    fontSize: 36,
    fontWeight: '800',
  },
  overviewSub: {
    fontSize: 11,
    fontFamily: typography.dataMono.fontFamily,
  },
  chartCol: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  barChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 70,
  },
  barCol: {
    alignItems: 'center',
    gap: 4,
  },
  barFill: {
    width: 8,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    fontFamily: typography.dataMono.fontFamily,
  },
  insightsCard: {
    padding: spacing.md,
    gap: 12,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  insightIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  insightsBulletRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  insightBulletText: {
    ...typography.bodyMd,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  configureBtn: {
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  configureBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  grid: {
    gap: 14,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 14,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  affirmationCard: {
    padding: spacing.md,
    gap: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  affirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  affirmationTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  affirmationText: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    fontWeight: '500',
  },
});
