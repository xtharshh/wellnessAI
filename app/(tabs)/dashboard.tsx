import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, TextInput, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { MetricWidget } from '@/src/components/dashboard/MetricWidget';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { StatusChip } from '@/src/components/ui/StatusChip';
import { BreathworkTimer } from '@/src/components/ui/BreathworkTimer';
import { useWellnessSummary } from '@/src/hooks/useWellnessSummary';
import { refreshLatestSnapshot } from '@/src/services/wellness';
import { setupPerfectPlanExercises } from '@/src/services/exercises';
import { useAuthStore } from '@/src/stores/authStore';
import { useTheme } from '@/src/hooks/useTheme';
import { typography } from '@/src/theme/typography';
import { radius, spacing } from '@/src/theme/spacing';

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { data, isLoading, isRefetching, refetch } = useWellnessSummary();
  const { colors, isDark } = useTheme();

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
            <View style={[styles.avatarCircle, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
              <Text style={[styles.avatarText, { color: isDark ? colors.primary : '#0f172a' }]}>{initials}</Text>
            </View>
            <View>
              <Text style={[styles.greetingEyebrow, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)' }]}>Welcome Back</Text>
              <Text style={[styles.greetingTitle, { color: isDark ? colors.onSurface : '#0f172a' }]}>Hi, {user?.displayName ?? 'Observer'}</Text>
            </View>
          </View>
          <Pressable style={[styles.bellCircle, { backgroundColor: colors.surface }]}>
            <Feather name="bell" size={18} color={isDark ? colors.onSurface : '#0f172a'} />
          </Pressable>
        </View>

        {/* Search Input */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Feather name="search" size={16} color={colors.onSurfaceVariant} />
          <TextInput
            placeholder="Search wellness metrics..."
            placeholderTextColor={colors.onSurfaceVariant}
            style={[styles.searchInput, { color: colors.onSurface }]}
            editable={false}
          />
        </View>
      </LinearGradient>

      {/* Main Body Content */}
      <View style={styles.bodyContent}>
        
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

        {/* Condition Grid Title */}
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Your Condition</Text>

        {/* 2x2 Metric Widget Grid */}
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
      </View>
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
    fontSize: 15,
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
});
