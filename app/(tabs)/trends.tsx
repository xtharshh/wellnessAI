import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator, Dimensions, Platform } from 'react-native';
import Svg, { Circle, Defs, Path, Rect } from 'react-native-svg';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { useTheme } from '@/src/hooks/useTheme';
import { TrendRange, useTrends } from '@/src/hooks/useTrends';
import { useAuthStore } from '@/src/stores/authStore';
import { radius, spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

const RANGE_OPTIONS = [
  { value: 7 as TrendRange, label: 'Past week' },
  { value: 15 as TrendRange, label: 'Past 2 weeks' },
  { value: 30 as TrendRange, label: 'Past month' },
  { value: 90 as TrendRange, label: 'Quarterly' },
];

type MetricType = 'stress' | 'sleep' | 'activity' | 'mood';

interface MetricConfig {
  key: MetricType;
  label: string;
  icon: string;
  iconType: 'feather' | 'material' | 'ionicons';
  color: string;
  accentGradient: string[];
  unit: string;
  maxVal: number;
}

export default function TrendsScreen() {
  const { colors, isDark } = useTheme();
  const user = useAuthStore((state) => state.user);

  const [range, setRange] = useState<TrendRange>(7);
  const [activeMetric, setActiveMetric] = useState<MetricType>('stress');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);

  const { data, isLoading } = useTrends(range);

  const metricConfigs: Record<MetricType, MetricConfig> = {
    stress: {
      key: 'stress',
      label: 'Stress Index',
      icon: 'brain',
      iconType: 'material',
      color: '#b59cff',
      accentGradient: ['#b59cff', '#8e6cff'],
      unit: '%',
      maxVal: 100,
    },
    sleep: {
      key: 'sleep',
      label: 'Sleep Duration',
      icon: 'sleep',
      iconType: 'material',
      color: '#a2cbfd',
      accentGradient: ['#a2cbfd', '#6ca6f0'],
      unit: 'hrs',
      maxVal: 12,
    },
    activity: {
      key: 'activity',
      label: 'Activity level',
      icon: 'fire',
      iconType: 'material',
      color: '#fdb5a2',
      accentGradient: ['#fdb5a2', '#f07e6c'],
      unit: '%',
      maxVal: 100,
    },
    mood: {
      key: 'mood',
      label: 'Mood score',
      icon: 'smile',
      iconType: 'feather',
      color: '#ffb3d9',
      accentGradient: ['#ffb3d9', '#e86ca8'],
      unit: '%',
      maxVal: 100,
    },
  };

  const currentConfig = metricConfigs[activeMetric];

  const labels = data?.labels ?? [];
  const chartValues = data?.[activeMetric] ?? [];
  const hasData = labels.length > 0 && chartValues.length > 0 && !isLoading;

  // Sync selected day to last day when data loads
  useEffect(() => {
    if (hasData) {
      setSelectedDayIndex(labels.length - 1);
    } else {
      setSelectedDayIndex(null);
    }
  }, [hasData, range, activeMetric]);

  // Compute average and peak values
  const statistics = useMemo(() => {
    if (!hasData) return { average: 0, peak: 0 };
    const validValues = chartValues.filter((v) => typeof v === 'number');
    if (validValues.length === 0) return { average: 0, peak: 0 };

    const avg = validValues.reduce((s, c) => s + c, 0) / validValues.length;
    const peakVal = Math.max(...validValues);
    return {
      average: Number(avg.toFixed(activeMetric === 'sleep' ? 1 : 0)),
      peak: Number(peakVal.toFixed(activeMetric === 'sleep' ? 1 : 0)),
    };
  }, [chartValues, hasData, activeMetric]);

  const selectedRangeLabel = RANGE_OPTIONS.find((o) => o.value === range)?.label ?? 'Past week';

  // Customized recommendations based on selected metric and current average
  const recommendations = useMemo(() => {
    if (activeMetric === 'stress') {
      return [
        {
          id: 'rec-1',
          title: '4-7-8 Breathing Technique',
          description: 'Typing patterns indicate elevated fatigue. A short 3-min session can reset cortisol levels.',
          icon: 'wind',
          iconType: 'feather' as const,
          color: '#b59cff',
          bg: 'rgba(181, 156, 255, 0.12)',
        },
        {
          id: 'rec-2',
          title: 'Take a micro-break',
          description: 'A 5-minute break from screen activity helps quiet an overactive mind and reduce keystroke speed.',
          icon: 'coffee',
          iconType: 'feather' as const,
          color: '#a2cbfd',
          bg: 'rgba(162, 203, 253, 0.12)',
        },
      ];
    } else if (activeMetric === 'sleep') {
      return [
        {
          id: 'rec-3',
          title: 'Wind-down Schedule',
          description: 'Maintain a consistent sleeping window. Avoid screen exposure for 45 minutes prior to sleep.',
          icon: 'moon',
          iconType: 'feather' as const,
          color: '#a2cbfd',
          bg: 'rgba(162, 203, 253, 0.12)',
        },
        {
          id: 'rec-4',
          title: 'Breathe before bed',
          description: 'Use the Box Breathing technique to quiet physical tension and prepare your body for deep rest.',
          icon: 'wind',
          iconType: 'feather' as const,
          color: '#b59cff',
          bg: 'rgba(181, 156, 255, 0.12)',
        },
      ];
    } else if (activeMetric === 'activity') {
      return [
        {
          id: 'rec-5',
          title: 'Desk Stretching',
          description: 'Perform rolling shoulder circles and wrist stretches to counteract muscle fatigue from typing sessions.',
          icon: 'zap',
          iconType: 'feather' as const,
          color: '#fdb5a2',
          bg: 'rgba(253, 181, 162, 0.12)',
        },
        {
          id: 'rec-6',
          title: 'Hydration reminder',
          description: 'Take 2-3 sips of water every 30 minutes to maintain optimal cognitive efficiency during work.',
          icon: 'droplet',
          iconType: 'feather' as const,
          color: '#a2cbfd',
          bg: 'rgba(162, 203, 253, 0.12)',
        },
      ];
    } else {
      return [
        {
          id: 'rec-7',
          title: 'Track mood triggers',
          description: 'Note your focus changes in the wellness log to identify recurring midday productivity slumps.',
          icon: 'edit-3',
          iconType: 'feather' as const,
          color: '#ffb3d9',
          bg: 'rgba(255, 179, 217, 0.12)',
        },
        {
          id: 'rec-8',
          title: 'Social connection',
          description: 'A brief non-work chat or a short walk in green space helps boost endorphins and reset mood levels.',
          icon: 'users',
          iconType: 'feather' as const,
          color: '#b59cff',
          bg: 'rgba(181, 156, 255, 0.12)',
        },
      ];
    }
  }, [activeMetric]);

  const renderIcon = (config: MetricConfig, size = 18, color?: string) => {
    const iconColor = color || config.color;
    if (config.iconType === 'material') {
      return <MaterialCommunityIcons name={config.icon as any} size={size} color={iconColor} />;
    } else if (config.iconType === 'ionicons') {
      return <Ionicons name={config.icon as any} size={size} color={iconColor} />;
    }
    return <Feather name={config.icon as any} size={size} color={iconColor} />;
  };

  const getProfileInitials = () => {
    if (user?.displayName) {
      return user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
    }
    return 'OL';
  };

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      {/* 1. Header Profile Section */}
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <View style={[styles.avatarContainer, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <Text style={[styles.avatarText, { color: isDark ? '#ffffff' : '#4a4365' }]}>
              {getProfileInitials()}
            </Text>
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.greeting, { color: colors.onSurfaceVariant }]}>Have a good day!</Text>
            <Text style={[styles.username, { color: colors.onSurface }]}>
              {user?.displayName || 'Olivia'}
            </Text>
          </View>
        </View>
        <Pressable
          style={[
            styles.menuButton,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
              borderColor: colors.outline,
            },
          ]}>
          <Feather name="menu" size={20} color={colors.onSurface} />
        </Pressable>
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={[styles.title, { color: colors.onSurface }]}>Wellness Trace</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Your biometrics and productivity patterns
        </Text>
      </View>

      {/* 2. Responsive Selector for active metric (Pills) */}
      <View style={styles.metricSelectorWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricSelectorScroll}>
          {(Object.keys(metricConfigs) as MetricType[]).map((key) => {
            const config = metricConfigs[key];
            const isActive = activeMetric === key;
            return (
              <Pressable
                key={key}
                onPress={() => setActiveMetric(key)}
                style={[
                  styles.metricChip,
                  {
                    backgroundColor: isActive
                      ? config.color
                      : isDark
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(255,255,255,0.7)',
                    borderColor: isActive ? 'transparent' : colors.outline,
                  },
                ]}>
                {renderIcon(config, 16, isActive ? '#1b1b22' : colors.onSurfaceVariant)}
                <Text
                  style={[
                    styles.metricChipText,
                    {
                      color: isActive ? '#1b1b22' : colors.onSurfaceVariant,
                      fontWeight: isActive ? 'bold' : 'normal',
                    },
                  ]}>
                  {config.label.split(' ')[0]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Primary Trend Card with custom Bar Chart */}
      <GlassCard style={styles.chartCard} accent="primary">
        <View style={styles.chartHeader}>
          <View>
            <Text style={[styles.chartTitle, { color: colors.onSurface }]}>
              {currentConfig.label}
            </Text>
            <Text style={[styles.chartSubtitle, { color: colors.onSurfaceVariant }]}>
              See your {activeMetric} statistics
            </Text>
          </View>

          {/* Time range selector dropdown button */}
          <View style={styles.dropdownContainer}>
            <Pressable
              onPress={() => setShowRangeDropdown(!showRangeDropdown)}
              style={[
                styles.dropdownButton,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.95)',
                  borderColor: colors.outline,
                },
              ]}>
              <Text style={[styles.dropdownButtonText, { color: colors.onSurface }]}>
                {selectedRangeLabel}
              </Text>
              <Feather name="chevron-down" size={14} color={colors.onSurface} style={{ marginLeft: 4 }} />
            </Pressable>

            {showRangeDropdown && (
              <View
                style={[
                  styles.dropdownMenu,
                  {
                    backgroundColor: isDark ? '#1c1b22' : '#ffffff',
                    borderColor: colors.outline,
                  },
                ]}>
                {RANGE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      setRange(opt.value);
                      setShowRangeDropdown(false);
                    }}
                    style={[
                      styles.dropdownItem,
                      range === opt.value && {
                        backgroundColor: isDark ? 'rgba(181, 156, 255, 0.15)' : 'rgba(181, 156, 255, 0.1)',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.dropdownItemText,
                        {
                          color: range === opt.value ? currentConfig.color : colors.onSurface,
                          fontWeight: range === opt.value ? 'bold' : 'normal',
                        },
                      ]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Custom rounded bar chart container */}
        <View style={styles.chartBody}>
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={currentConfig.color} />
              <Text style={[styles.loaderText, { color: colors.onSurfaceVariant }]}>Analyzing metrics...</Text>
            </View>
          ) : !hasData ? (
            <View style={styles.loaderContainer}>
              <Feather name="bar-chart-2" size={36} color={colors.onSurfaceVariant} />
              <Text style={[styles.loaderText, { color: colors.onSurfaceVariant }]}>No snapshot history recorded.</Text>
            </View>
          ) : (
            <View style={styles.chartWrapper}>
              {/* Backgrid Lines */}
              <View style={styles.chartGrid}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.gridLine,
                      {
                        borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                        top: `${i * 25}%`,
                      },
                    ]}
                  />
                ))}
              </View>

              {/* Bars Row */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barsContainer}>
                {chartValues.map((val, idx) => {
                  const dayVal = val ?? 0;
                  const percent = Math.min((dayVal / currentConfig.maxVal) * 100, 100);
                  const isSelected = selectedDayIndex === idx;

                  return (
                    <Pressable
                      key={idx}
                      onPress={() => setSelectedDayIndex(idx)}
                      style={styles.barColumn}>
                      {/* Interactive Tooltip above active bar */}
                      {isSelected && (
                        <View style={[styles.tooltip, { backgroundColor: isDark ? '#221e36' : '#ffffff', borderColor: currentConfig.color }]}>
                          <Text style={[styles.tooltipText, { color: colors.onSurface }]}>
                            {dayVal.toFixed(activeMetric === 'sleep' ? 1 : 0)}
                            <Text style={styles.tooltipUnit}>{currentConfig.unit}</Text>
                          </Text>
                          <Text style={[styles.tooltipDate, { color: colors.onSurfaceVariant }]}>
                            {labels[idx]}
                          </Text>
                          <View style={[styles.tooltipArrow, { borderTopColor: isDark ? '#221e36' : '#ffffff' }]} />
                        </View>
                      )}

                      {/* Bar Track and Fill */}
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${Math.max(percent, 5)}%`,
                              backgroundColor: isSelected ? currentConfig.color : `${currentConfig.color}80`,
                              shadowColor: currentConfig.color,
                              shadowOpacity: isSelected ? 0.6 : 0.1,
                              shadowRadius: isSelected ? 8 : 2,
                              elevation: isSelected ? 6 : 1,
                            },
                          ]}
                        />
                      </View>

                      {/* Bottom Label (date) */}
                      <Text
                        style={[
                          styles.barLabel,
                          {
                            color: isSelected ? colors.onSurface : colors.onSurfaceVariant,
                            fontWeight: isSelected ? 'bold' : 'normal',
                          },
                        ]}>
                        {labels[idx]?.split(' ')[1] ?? idx}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </GlassCard>

      {/* 4. Summary Cards (2 Column Layout) */}
      <View style={styles.summaryGrid}>
        <GlassCard style={styles.summaryCard} accent="secondary">
          <View style={styles.summaryContent}>
            <View style={styles.summaryTextGroup}>
              <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                Avg {currentConfig.label.split(' ')[0]}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.onSurface }]}>
                {statistics.average}
                <Text style={styles.summaryUnit}> {currentConfig.unit}</Text>
              </Text>
            </View>
            <View style={[styles.summaryIconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
              {renderIcon(currentConfig, 22)}
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.summaryCard} accent="secondary">
          <View style={styles.summaryContent}>
            <View style={styles.summaryTextGroup}>
              <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
                Peak Value
              </Text>
              <Text style={[styles.summaryValue, { color: colors.onSurface }]}>
                {statistics.peak}
                <Text style={styles.summaryUnit}> {currentConfig.unit}</Text>
              </Text>
            </View>
            <View style={[styles.summaryIconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
              <Feather name="trending-up" size={22} color={currentConfig.color} />
            </View>
          </View>
        </GlassCard>
      </View>

      {/* 5. Biometric Pulse & Weight Card (Wavy bottom style) */}
      <View style={styles.wavyCardWrapper}>
        <View style={[styles.wavyCard, { shadowColor: '#8e6cff' }]}>
          {/* Card Content Row */}
          <View style={styles.wavyCardRow}>
            <View style={styles.wavyCardStat}>
              <View style={styles.wavyStatHeader}>
                <Ionicons name="heart-half-outline" size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.wavyStatLabel}>Pulse</Text>
              </View>
              <Text style={styles.wavyStatValue}>
                78 <Text style={styles.wavyStatUnit}>BPM</Text>
              </Text>
            </View>

            <View style={styles.wavyCardStat}>
              <View style={styles.wavyStatHeader}>
                <MaterialCommunityIcons name="scale-bathroom" size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.wavyStatLabel}>Weight</Text>
              </View>
              <Text style={styles.wavyStatValue}>
                64 <Text style={styles.wavyStatUnit}>kg</Text>
              </Text>
            </View>

            {/* Floating details menu icon */}
            <Pressable style={styles.wavyIconBox}>
              <Feather name="more-horizontal" size={20} color="#ffffff" />
            </Pressable>
          </View>

          {/* SVG Wavy Path overlay for visual elegance */}
          <Svg style={styles.wavySvg} height="60" width="100%" viewBox="0 0 375 60">
            <Path
              d="M0,30 C90,45 150,15 240,40 C300,50 330,45 375,35 L375,60 L0,60 Z"
              fill="rgba(255, 255, 255, 0.08)"
            />
            <Path
              d="M0,40 C110,60 180,25 260,50 C310,60 340,55 375,45 L375,60 L0,60 Z"
              fill="rgba(255, 255, 255, 0.05)"
            />
          </Svg>
        </View>
      </View>

      {/* 6. AI Recommendations Carousel Section */}
      <View style={styles.recommendationsHeader}>
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Your Health Tips</Text>
        <Pressable>
          <Text style={[styles.showAllText, { color: currentConfig.color }]}>Show all</Text>
        </Pressable>
      </View>

      <View style={styles.recommendationsList}>
        {recommendations.map((rec) => (
          <GlassCard key={rec.id} style={styles.recommendationItem} accent="secondary">
            <View style={styles.recIconWrap}>
              <View style={[styles.recIconCircle, { backgroundColor: rec.bg }]}>
                <Feather name={rec.icon as any} size={18} color={rec.color} />
              </View>
            </View>
            <View style={styles.recContent}>
              <Text style={[styles.recTitle, { color: colors.onSurface }]}>{rec.title}</Text>
              <Text style={[styles.recDesc, { color: colors.onSurfaceVariant }]}>{rec.description}</Text>
            </View>
          </GlassCard>
        ))}
      </View>
      
      {/* Visual buffer space for floating tabs */}
      <View style={{ height: 100 }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 12 : 24,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    backgroundColor: '#ebdfff', // beautiful soft lavender background for avatar
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4caf50',
    borderWidth: 2,
    borderColor: '#f8f7ff',
    position: 'absolute',
    bottom: -1,
    right: -1,
  },
  profileInfo: {
    justifyContent: 'center',
  },
  greeting: {
    fontFamily: typography.bodyMd.fontFamily,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  titleSection: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headlineLgMobile,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  metricSelectorWrapper: {
    marginBottom: spacing.md,
  },
  metricSelectorScroll: {
    paddingVertical: 4,
    gap: spacing.sm,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  metricChipText: {
    fontSize: 13,
  },
  chartCard: {
    padding: 16,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    zIndex: 10, // ensure dropdown displays above chart components
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  dropdownButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 36,
    right: 0,
    width: 110,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
    zIndex: 100,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownItemText: {
    fontSize: 12,
  },
  chartBody: {
    minHeight: 180,
    justifyContent: 'center',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loaderText: {
    fontSize: 13,
  },
  chartWrapper: {
    height: 180,
    width: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  chartGrid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 24, // aligned with bars
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  barsContainer: {
    alignItems: 'flex-end',
    paddingBottom: 24, // spacing for labels
    gap: 16,
    paddingHorizontal: spacing.xs,
  },
  barColumn: {
    alignItems: 'center',
    width: 24,
    height: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  barTrack: {
    width: 14,
    height: '80%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 999,
  },
  barLabel: {
    fontSize: 10,
    position: 'absolute',
    bottom: -18,
    textAlign: 'center',
  },
  tooltip: {
    position: 'absolute',
    top: -50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 99,
    minWidth: 44,
  },
  tooltipText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  tooltipUnit: {
    fontSize: 9,
    fontWeight: 'normal',
  },
  tooltipDate: {
    fontSize: 8,
    marginTop: 1,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderLeftColor: 'transparent',
    borderRightWidth: 6,
    borderRightColor: 'transparent',
    borderTopWidth: 6,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: radius.lg,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTextGroup: {
    gap: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryUnit: {
    fontSize: 11,
    fontWeight: 'normal',
  },
  summaryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wavyCardWrapper: {
    marginBottom: spacing.md,
  },
  wavyCard: {
    width: '100%',
    height: 104,
    borderRadius: radius.xl,
    backgroundColor: '#b59cff', // main vibrant lilac purple color
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  wavyCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  wavyCardStat: {
    gap: 4,
  },
  wavyStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wavyStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  wavyStatValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  wavyStatUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  wavyIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wavySvg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  showAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recommendationsList: {
    gap: spacing.sm,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  recIconWrap: {
    justifyContent: 'center',
  },
  recIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recContent: {
    flex: 1,
    gap: 2,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  recDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});
