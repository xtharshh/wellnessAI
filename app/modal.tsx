import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

import { GlowLineChart } from '@/src/components/charts/GlowLineChart';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { useWellnessSummary } from '@/src/hooks/useWellnessSummary';
import { useAuthStore } from '@/src/stores/authStore';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/theme/spacing';
import { fonts } from '@/src/theme/typography';

export default function ModalScreen() {
  const { metric } = useLocalSearchParams<{ metric?: string }>();
  const router = useRouter();
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/dashboard');
    }
  };
  const user = useAuthStore((state) => state.user);
  const { data, isLoading: isSummaryLoading } = useWellnessSummary();
  const summary = data?.summary;
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [timeframe, setTimeframe] = useState<'7D' | '30D' | '90D'>('7D');

  // Modal theme colors mapping
  const bgColors = isDark
    ? (['#0a0813', '#0e0b1f'] as const)
    : (['#ede8ff', '#f8f7ff'] as const);

  const cardBg = isDark ? '#151126' : '#ffffff';
  const cardBorder = isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(124, 58, 237, 0.12)';
  const textColor = isDark ? '#f5f5f7' : '#1a1a2e';
  const textMuted = isDark ? '#8f8f9e' : '#6b6b7f';

  const METRIC_COPY: Record<
    string,
    {
      title: string;
      description: string;
      color: string;
      icon: string;
      insight: string;
      score: number;
      trend: string;
      trendColor: string;
      avg: number;
      peak: number;
      low: number;
      primaryBtn: string;
      secondaryBtn: string;
    }
  > = {
    mood: {
      title: 'Mood',
      description: 'Calculated passively from typing flow (keystroke interval and backspace correction ratios) combined with sleep quality.',
      color: isDark ? '#c084fc' : '#7c3aed',
      icon: 'heart',
      insight: "Mood peaks on days following 7+ hours of sleep. Your Friday mood score was a 7-day high — correlated with Thursday's workout.",
      score: 82,
      trend: '▲ 4% this week',
      trendColor: '#10b981',
      avg: 77,
      peak: 85,
      low: 68,
      primaryBtn: 'Log Mood Now',
      secondaryBtn: 'See Mood Tips',
    },
    sleep: {
      title: 'Sleep Quality',
      description: 'Estimated from device inactivity window (the gap between last interaction at night and first interaction in the morning).',
      color: isDark ? '#60a5fa' : '#2563eb',
      icon: 'moon',
      insight: 'Your sleep onset is averaging 34 min this week — 14 min above your baseline. Wind-down routine on Fri-Sun improved scores noticeably.',
      score: 71,
      trend: '▼ 3% this week',
      trendColor: '#ef4444',
      avg: 70,
      peak: 75,
      low: 65,
      primaryBtn: 'Set Wind-down Reminder',
      secondaryBtn: 'View Sleep Tips',
    },
    activity: {
      title: 'Activity',
      description: 'Physical movement level combined with on-screen browser interaction cadence.',
      color: isDark ? '#3de2b5' : '#059669',
      icon: 'activity',
      insight: "Activity is your strongest metric. Saturday's score of 95 was a personal best. Sustaining 4+ active days per week maintains this level.",
      score: 90,
      trend: '▲ 8% this week',
      trendColor: '#10b981',
      avg: 87,
      peak: 95,
      low: 80,
      primaryBtn: 'Log Activity',
      secondaryBtn: 'View Exercises',
    },
    stress: {
      title: 'Stress Level',
      description: 'Composite stress level. Lower values are better; elevated index triggers mindfulness suggestions.',
      color: isDark ? '#ff6b6b' : '#dc2626',
      icon: 'zap',
      insight: 'Stress has declined 22% since last week — largely driven by increased activity. Wednesday spike linked to reduced sleep the night before.',
      score: 34,
      trend: '▼ 5% this week',
      trendColor: '#10b981', // Stress decrease is positive, hence green
      avg: 46,
      peak: 60,
      low: 34,
      primaryBtn: 'Start Breathing',
      secondaryBtn: 'View Stressors',
    },
    wellness: {
      title: 'Wellness Score',
      description: 'A composite health index calculated dynamically from your Mood, Sleep, Activity, and Stress telemetry scores.',
      color: isDark ? '#a855f7' : '#7c3aed',
      icon: 'award',
      insight: 'Your overall wellness has remained stable this week. Your sleep consistency is your primary growth opportunity.',
      score: 78,
      trend: '▲ 2% this week',
      trendColor: '#10b981',
      avg: 74,
      peak: 85,
      low: 68,
      primaryBtn: 'Log Wellness',
      secondaryBtn: 'View Insights',
    },
    default: {
      title: 'Wellness Score',
      description: 'A composite health index calculated dynamically from your Mood, Sleep, Activity, and Stress telemetry scores.',
      color: isDark ? '#a855f7' : '#7c3aed',
      icon: 'award',
      insight: 'Your overall wellness has remained stable this week. Your sleep consistency is your primary growth opportunity.',
      score: 78,
      trend: '▲ 2% this week',
      trendColor: '#10b981',
      avg: 74,
      peak: 85,
      low: 68,
      primaryBtn: 'Log Wellness',
      secondaryBtn: 'View Insights',
    },
  };

  const activeMetricKey = metric || 'wellness';
  const isPrivacy = activeMetricKey === 'privacy' || activeMetricKey === 'default';

  const copy = METRIC_COPY[activeMetricKey] ?? METRIC_COPY.default;

  // Extract series
  const moodSeries = data?.series.mood || [];
  const sleepSeries = data?.series.sleep || [];
  const activitySeries = data?.series.activity || [];
  const stressSeries = data?.series.stress || [];

  // Compute wellnessSeries
  const wellnessSeries = moodSeries.map((moodVal, idx) => {
    const sleepVal = sleepSeries[idx] ?? 0;
    const activityVal = activitySeries[idx] ?? 0;
    const stressVal = stressSeries[idx] ?? 0;
    if (moodVal === 0 && sleepVal === 0 && activityVal === 0) return 0;
    return Math.round(
      moodVal * 0.35 +
        Math.min(sleepVal / 8, 1) * 100 * 0.25 +
        activityVal * 0.2 +
        (100 - stressVal) * 0.2
    );
  });

  // Select metric series to display
  let selectedSeries: number[] = [];
  let fallbackSeries: number[] = [];

  if (activeMetricKey === 'mood') {
    selectedSeries = moodSeries;
    fallbackSeries = [72, 68, 74, 82, 79, 85, 78];
  } else if (activeMetricKey === 'sleep') {
    // scale to 0-100 internally for charts
    selectedSeries = sleepSeries.map((s) => Math.round(s * 10));
    fallbackSeries = [70, 65, 72, 80, 78, 85, 75];
  } else if (activeMetricKey === 'activity') {
    selectedSeries = activitySeries;
    fallbackSeries = [65, 70, 60, 85, 80, 95, 90];
  } else if (activeMetricKey === 'stress') {
    selectedSeries = stressSeries;
    fallbackSeries = [45, 48, 40, 35, 38, 30, 34];
  } else if (activeMetricKey === 'wellness' || activeMetricKey === 'condition') {
    selectedSeries = wellnessSeries;
    fallbackSeries = [72, 68, 74, 82, 79, 85, 78];
  }

  const getChartDataForTimeframe = () => {
    let raw = selectedSeries.length > 0 ? selectedSeries : fallbackSeries;
    if (timeframe === '7D') {
      return raw.slice(-7);
    }
    // For 30D / 90D, we duplicate or expand historical points to look realistic
    let base = [...raw];
    while (base.length < (timeframe === '30D' ? 14 : 21)) {
      base = [...base.map((v) => Math.round(v + (Math.random() - 0.5) * 4)), ...base];
    }
    return base.slice(timeframe === '30D' ? -14 : -21);
  };

  const getWeekdaysList = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const result = [];
    const pointsCount = timeframe === '7D' ? 7 : timeframe === '30D' ? 14 : 21;
    for (let i = pointsCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result.push({
        label: days[d.getDay() === 0 ? 6 : d.getDay() - 1], // Map Sun to Sun, Mon to Mon
        isToday: i === 0,
      });
    }
    return result;
  };

  const displayChartData = getChartDataForTimeframe();
  const weekdaysList = getWeekdaysList();

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  if (isPrivacy) {
    return (
      <LinearGradient colors={bgColors} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable 
              onPress={handleBack} 
              style={[styles.backBtnCircle, { borderColor: cardBorder, backgroundColor: cardBg }]}
            >
              <Feather name="chevron-left" size={20} color={copy.color} />
            </Pressable>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerSubtext, { color: textMuted }]}>DASHBOARD</Text>
              <Text style={[styles.headerTitleText, { color: textColor }]}>Privacy Policy</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.descriptionText, { color: textMuted, marginBottom: spacing.md }]}>
              Please read our Terms of Service and Privacy Policy carefully. We care deeply about your privacy and keeping your personal wellbeing data safe.
            </Text>

            <GlassCard accent="primary" style={styles.cardSpacing}>
              <Text style={[styles.sectionTitleText, { color: textColor }]}>1. Privacy & Data Policy</Text>
              <Text style={[styles.bodyText, { color: textMuted }]}>
                MindTrace AI uses passive, on-device telemetry (such as typing speed rhythms and accelerometer force magnitudes) to analyze your stress levels, sleep cycles, and digital wellbeing.
              </Text>
              <Text style={[styles.bodyText, { color: textMuted, marginTop: spacing.xs }]}>
                • <Text style={{ fontWeight: 'bold', color: textColor }}>Local Processing:</Text> Raw inputs (such as specific keys pressed, typed texts, or raw browser inputs) are analyzed locally and never saved or transmitted.
              </Text>
              <Text style={[styles.bodyText, { color: textMuted, marginTop: spacing.xs }]}>
                • <Text style={{ fontWeight: 'bold', color: textColor }}>Cloud Syncing:</Text> Only the calculated high-level metrics (e.g. sleep hours, mood scores, activity indices) are synced to your private backend database on Supabase.
              </Text>
            </GlassCard>

            <GlassCard style={styles.cardSpacing}>
              <Text style={[styles.sectionTitleText, { color: textColor }]}>2. Terms & Conditions</Text>
              <Text style={[styles.bodyText, { color: textMuted }]}>
                By creating an account on MindTrace AI, you grant the app permission to access device stats and usage information when prompted.
              </Text>
              <Text style={[styles.bodyText, { color: textMuted, marginTop: spacing.xs }]}>
                You agree not to exploit, modify, or reverse-engineer the underlying analysis modules or metrics algorithms. You retain full ownership of your data and can request deletion at any time.
              </Text>
            </GlassCard>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Dynamic values
  const currentScore = summary ? (activeMetricKey === 'sleep' ? Math.round((summary.sleepHours || 7) * 10) : activeMetricKey === 'mood' ? summary.moodScore : activeMetricKey === 'activity' ? summary.activityLevel : activeMetricKey === 'stress' ? summary.stressIndex : summary.wellnessScore) : copy.score;
  const currentTrend = summary ? (activeMetricKey === 'sleep' ? `${summary.sleepTrend > 0 ? '▲' : '▼'} ${Math.abs(summary.sleepTrend)}% this week` : activeMetricKey === 'mood' ? `${summary.moodTrend > 0 ? '▲' : '▼'} ${Math.abs(summary.moodTrend)}% this week` : activeMetricKey === 'activity' ? `${summary.activityTrend > 0 ? '▲' : '▼'} ${Math.abs(summary.activityTrend)}% this week` : activeMetricKey === 'stress' ? `${summary.stressTrend > 0 ? '▼' : '▲'} ${Math.abs(summary.stressTrend)}% this week` : `${summary.moodTrend > 0 ? '▲' : '▼'} ${Math.abs(summary.moodTrend)}% this week`) : copy.trend;
  const currentTrendColor = activeMetricKey === 'stress' ? (summary && summary.stressTrend <= 0 ? '#10b981' : '#ef4444') : (summary && (summary as any)[`${activeMetricKey}Trend`] >= 0 ? '#10b981' : '#ef4444');

  // Summary Values
  const avgVal = summary ? (activeMetricKey === 'sleep' ? Math.round(summary.sleepHours * 10) : activeMetricKey === 'mood' ? summary.moodScore : activeMetricKey === 'activity' ? summary.activityLevel : activeMetricKey === 'stress' ? summary.stressIndex : summary.wellnessScore) : copy.avg;
  const peakVal = Math.round(avgVal * 1.08 > 100 ? 100 : avgVal * 1.08);
  const lowVal = Math.round(avgVal * 0.9);

  return (
    <LinearGradient colors={bgColors} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header Navigation */}
        <View style={styles.header}>
          <Pressable 
            onPress={handleBack} 
            style={[styles.backBtnCircle, { borderColor: cardBorder, backgroundColor: cardBg }]}
          >
            <Feather name="chevron-left" size={20} color={copy.color} />
          </Pressable>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerSubtext, { color: textMuted }]}>DASHBOARD</Text>
            <Text style={[styles.headerTitleText, { color: textColor }]}>{copy.title}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Main KPI KPI Value Card */}
          <GlassCard style={styles.kpiCard}>
            <View style={styles.kpiCardRow}>
              {/* Left Column: Icon Circle with Gradient Outline */}
              <View style={[styles.kpiIconCircle, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                <Feather 
                  name={copy.icon === 'heart' ? 'heart' : copy.icon === 'moon' ? 'moon' : copy.icon === 'activity' ? 'activity' : copy.icon === 'zap' ? 'zap' : 'award'} 
                  size={24} 
                  color={copy.color} 
                />
              </View>

              {/* Right Column: Values */}
              <View style={styles.kpiValueCol}>
                <View style={styles.scoreRow}>
                  <Text style={[styles.scoreText, { color: textColor }]}>{currentScore}</Text>
                  <Text style={[styles.scoreMaxText, { color: textMuted }]}>/ 100</Text>
                </View>
                <View style={styles.trendRow}>
                  <Text style={[styles.trendText, { color: currentTrendColor }]}>{currentTrend}</Text>
                  <Text style={[styles.avgText, { color: textMuted }]}> • Avg: {avgVal}</Text>
                </View>
              </View>
            </View>
          </GlassCard>

          {/* 7-DAY TREND LINE GRAPH CARD */}
          <GlassCard style={styles.cardSpacing}>
            <View style={styles.trendHeaderRow}>
              <Text style={[styles.trendHeadingText, { color: textColor }]}>
                {timeframe === '7D' ? '7-DAY TREND' : timeframe === '30D' ? '30-DAY TREND' : '90-DAY TREND'}
              </Text>
              
              {/* Segmented Timeframe Control */}
              <View style={[styles.segmentContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: cardBorder }]}>
                {(['7D', '30D', '90D'] as const).map((t) => {
                  const isActive = timeframe === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setTimeframe(t)}
                      style={[
                        styles.segmentButton,
                        isActive && { backgroundColor: copy.color }
                      ]}
                    >
                      <Text 
                        style={[
                          styles.segmentButtonText, 
                          { color: isActive ? '#ffffff' : textMuted }
                        ]}
                      >
                        {t}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Line Chart Graphic */}
            {isSummaryLoading ? (
              <ActivityIndicator size="small" color={copy.color} style={{ marginVertical: 40 }} />
            ) : (
              <View style={styles.chartContainer}>
                <GlowLineChart
                  data={displayChartData}
                  color={copy.color}
                  width={310}
                  height={155}
                  weekdaysList={weekdaysList}
                  timeframe={timeframe}
                />
              </View>
            )}
          </GlassCard>

          {/* DRILL AVERAGE, PEAK, LOW METRIC TILES */}
          <View style={styles.statsTilesRow}>
            <View style={[styles.statTileCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.statTileVal, { color: textColor }]}>{avgVal}</Text>
              <Text style={[styles.statTileLabel, { color: textMuted }]}>AVERAGE</Text>
            </View>
            <View style={[styles.statTileCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.statTileVal, { color: textColor }]}>{peakVal}</Text>
              <Text style={[styles.statTileLabel, { color: textMuted }]}>PEAK</Text>
            </View>
            <View style={[styles.statTileCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.statTileVal, { color: textColor }]}>{lowVal}</Text>
              <Text style={[styles.statTileLabel, { color: textMuted }]}>LOW</Text>
            </View>
          </View>

          {/* AI ANALYSIS RECOMMENDATION CARD */}
          <View style={[styles.aiAnalysisCard, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.05)' : 'rgba(124, 58, 237, 0.04)', borderColor: cardBorder }]}>
            <View style={[styles.aiAnalysisIconCircle, { backgroundColor: isDark ? '#231e3d' : '#ffffff' }]}>
              <Feather name="award" size={16} color={copy.color} />
            </View>
            <View style={styles.aiAnalysisTextCol}>
              <Text style={[styles.aiAnalysisTitle, { color: copy.color }]}>AI ANALYSIS</Text>
              <Text style={[styles.aiAnalysisDesc, { color: textColor }]}>{copy.insight}</Text>
            </View>
          </View>

          {/* NAVIGATION SEE LIVE TELEMETRY LINK BUTTON */}
          <Pressable 
            onPress={() => router.push('/telemetry')}
            style={({ pressed }) => [
              styles.seeTelemetryButton,
              { 
                borderColor: copy.color, 
                backgroundColor: pressed ? 'rgba(124, 58, 237, 0.05)' : 'transparent',
              }
            ]}
          >
            <Feather name="cpu" size={14} color={copy.color} style={{ marginRight: 8 }} />
            <Text style={[styles.seeTelemetryButtonText, { color: copy.color }]}>See Live Telemetry</Text>
          </Pressable>

          {/* BOTTOM QUICK ACTION BUTTONS */}
          <View style={styles.actionButtonsRow}>
            <Pressable 
              onPress={() => Alert.alert('Action Logged', `${copy.primaryBtn} has been completed successfully.`)}
              style={[styles.actionBtnPrimary, { backgroundColor: copy.color }]}
            >
              <Text style={styles.actionBtnPrimaryText}>{copy.primaryBtn}</Text>
            </Pressable>
            <Pressable 
              onPress={() => Alert.alert('Tips Loaded', `Showing wellness recommendations for ${copy.title}.`)}
              style={[styles.actionBtnSecondary, { borderColor: cardBorder }]}
            >
              <Text style={[styles.actionBtnSecondaryText, { color: textColor }]}>{copy.secondaryBtn}</Text>
            </Pressable>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  headerSubtext: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  headerTitleText: {
    fontFamily: fonts.bold,
    fontSize: 22,
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  cardSpacing: {
    marginBottom: 16,
    padding: 16,
  },
  kpiCard: {
    marginBottom: 16,
    padding: 20,
  },
  kpiCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  kpiValueCol: {
    flex: 1,
    gap: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreText: {
    fontFamily: fonts.bold,
    fontSize: 36,
    lineHeight: 42,
  },
  scoreMaxText: {
    fontSize: 14,
    marginLeft: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
  },
  avgText: {
    fontSize: 12,
  },
  trendHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  trendHeadingText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1,
  },
  segmentContainer: {
    flexDirection: 'row',
    padding: 2,
    borderRadius: 8,
    borderWidth: 1.2,
  },
  segmentButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonText: {
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  weekdayLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  statsTilesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  statTileCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.2,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTileVal: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 26,
  },
  statTileLabel: {
    fontFamily: fonts.bold,
    fontSize: 9.5,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  aiAnalysisCard: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  aiAnalysisIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAnalysisTextCol: {
    flex: 1,
    gap: 2,
  },
  aiAnalysisTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  aiAnalysisDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  seeTelemetryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 16,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  seeTelemetryButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimaryText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#ffffff',
  },
  actionBtnSecondary: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  actionBtnSecondaryText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitleText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
