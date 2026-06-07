import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Alert, ActivityIndicator, Image, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { StatusChip } from '@/src/components/ui/StatusChip';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { useWellnessSummary } from '@/src/hooks/useWellnessSummary';
import { useRecommendations } from '@/src/hooks/useRecommendations';
import { useTheme } from '@/src/hooks/useTheme';
import { fonts } from '@/src/theme/typography';

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
    <View style={styles.timerWrapper}>
      <View style={styles.timerControlsRow}>
        <Pressable
          disabled={isActive}
          onPress={() => adjustTime(-30)}
          style={[
            styles.adjustButton,
            { borderColor: colors.outline, opacity: isActive ? 0.4 : 1 }
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
            { borderColor: colors.outline, opacity: isActive ? 0.4 : 1 }
          ]}
        >
          <Text style={[styles.adjustButtonText, { color: colors.onSurface }]}>+30s</Text>
        </Pressable>
      </View>
      <Pressable
        onPress={() => setIsActive(!isActive)}
        style={[styles.timerButton, { backgroundColor: colors.primaryAccent }]}
      >
        <Text style={styles.timerButtonText}>{isActive ? 'Pause' : 'Start'}</Text>
      </Pressable>
    </View>
  );
}

const LIFESTYLE_ICONS = {
  books: 'book' as const,
  movies: 'video' as const,
  songs: 'music' as const,
  podcasts: 'mic' as const,
  meditation: 'anchor' as const,
  productivity: 'zap' as const,
  'stress-relief': 'sun' as const,
};

const LIFESTYLE_THEMES = {
  books: {
    primary: '#d97706',
    border: '#fef08a',
    bg: '#fffbeb',
    iconBg: '#fef9c3',
    darkBg: 'rgba(217, 119, 6, 0.08)',
    darkBorder: 'rgba(217, 119, 6, 0.3)',
    darkIconBg: 'rgba(217, 119, 6, 0.12)',
  },
  movies: {
    primary: '#2563eb',
    border: '#bfdbfe',
    bg: '#eff6ff',
    iconBg: '#dbeafe',
    darkBg: 'rgba(37, 99, 235, 0.08)',
    darkBorder: 'rgba(37, 99, 235, 0.3)',
    darkIconBg: 'rgba(37, 99, 235, 0.12)',
  },
  songs: {
    primary: '#db2777',
    border: '#fbcfe8',
    bg: '#fdf2f8',
    iconBg: '#fce7f3',
    darkBg: 'rgba(219, 39, 119, 0.08)',
    darkBorder: 'rgba(219, 39, 119, 0.3)',
    darkIconBg: 'rgba(219, 39, 119, 0.12)',
  },
  podcasts: {
    primary: '#7c3aed',
    border: '#ddd6fe',
    bg: '#f5f3ff',
    iconBg: '#ede9fe',
    darkBg: 'rgba(124, 58, 237, 0.08)',
    darkBorder: 'rgba(124, 58, 237, 0.3)',
    darkIconBg: 'rgba(124, 58, 237, 0.12)',
  },
  meditation: {
    primary: '#059669',
    border: '#a7f3d0',
    bg: '#ecfdf5',
    iconBg: '#d1fae5',
    darkBg: 'rgba(5, 150, 105, 0.08)',
    darkBorder: 'rgba(5, 150, 105, 0.3)',
    darkIconBg: 'rgba(5, 150, 105, 0.12)',
  },
  productivity: {
    primary: '#8b5cf6',
    border: '#ddd6fe',
    bg: '#f5f3ff',
    iconBg: '#ede9fe',
    darkBg: 'rgba(139, 92, 246, 0.08)',
    darkBorder: 'rgba(139, 92, 246, 0.3)',
    darkIconBg: 'rgba(139, 92, 246, 0.12)',
  },
  'stress-relief': {
    primary: '#dc2626',
    border: '#fecaca',
    bg: '#fef2f2',
    iconBg: '#fee2e2',
    darkBg: 'rgba(220, 38, 38, 0.08)',
    darkBorder: 'rgba(220, 38, 38, 0.3)',
    darkIconBg: 'rgba(220, 38, 38, 0.12)',
  },
};

export default function AIInsightsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const policyLinkColor = isDark ? '#a78bfa' : '#6d28d9';

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/dashboard');
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to open link', 'No app or browser was found to open this URL.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open link.');
    }
  };

  const { data: summaryData, isLoading } = useWellnessSummary();
  const summary = summaryData?.summary;

  const { 
    data: recData, 
    isLoading: isRecsLoading, 
    complete,
    lifestyleRecs,
    isLifestyleLoading
  } = useRecommendations();
  const [checkedSteps, setCheckedSteps] = useState<Record<string, Record<number, boolean>>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lifestyleCategory, setLifestyleCategory] = useState<string>('all');

  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredRecs = (lifestyleRecs || [])
    .filter((item) => lifestyleCategory === 'all' ? true : item.category === lifestyleCategory);
  
  const totalCards = filteredRecs.length;
  const CARD_WIDTH = 240;
  const CARD_GAP = 16;

  // Auto scroll effect
  useEffect(() => {
    if (totalCards <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % totalCards;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * (CARD_WIDTH + CARD_GAP),
          animated: true,
        });
        return nextIndex;
      });
    }, 4000); // Auto scroll every 4 seconds

    return () => clearInterval(interval);
  }, [totalCards, lifestyleCategory]); // Re-run timer if filter changes

  const handleArrowPress = (direction: 'left' | 'right') => {
    if (totalCards <= 1) return;
    
    let nextIndex = activeIndex;
    if (direction === 'left') {
      nextIndex = activeIndex === 0 ? totalCards - 1 : activeIndex - 1;
    } else {
      nextIndex = (activeIndex + 1) % totalCards;
    }

    setActiveIndex(nextIndex);
    scrollViewRef.current?.scrollTo({
      x: nextIndex * (CARD_WIDTH + CARD_GAP),
      animated: true,
    });
  };

  const handleScroll = (event: any) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / (CARD_WIDTH + CARD_GAP));
    if (index >= 0 && index < totalCards) {
      setActiveIndex(index);
    }
  };

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

  // Theme color mappings
  const bgColors = isDark
    ? (['#0a0813', '#0e0b1f'] as const)
    : (['#ede8ff', '#f8f7ff'] as const);

  const cardBg = isDark ? '#151126' : '#ffffff';
  const cardBorder = isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(124, 58, 237, 0.12)';
  const textColor = isDark ? '#f5f5f7' : '#1a1a2e';
  const textMuted = isDark ? '#8f8f9e' : '#6b6b7f';

  // Specific values from mockup or live summary
  const scoreMood = summary?.moodScore ?? 82;
  const scoreSleep = summary?.sleepHours ? Math.round(summary.sleepHours * 10) : 71;
  const scoreActivity = summary?.activityLevel ?? 90;
  const scoreStress = summary?.stressIndex ?? 34;

  const INSIGHTS_LIST = [
    {
      id: 'sleep-mood',
      title: 'Sleep-Mood Correlation',
      badge: 'High Impact',
      badgeColor: '#3b82f6',
      badgeBg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
      icon: 'moon',
      iconColor: '#3b82f6',
      desc: 'On days with 7+ hours, your mood score averages 18% higher. Sleep is your #1 lever.',
    },
    {
      id: 'exercise-stress',
      title: 'Exercise & Stress Relief',
      badge: 'Positive Pattern',
      badgeColor: '#10b981',
      badgeBg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
      icon: 'activity',
      iconColor: '#10b981',
      desc: 'Stress drops avg 22 pts within 2 hours of physical activity. Effect peaks after 25 min.',
    },
    {
      id: 'mood-consistency',
      title: 'Mood Consistency',
      badge: 'Stable',
      badgeColor: '#8b5cf6',
      badgeBg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff',
      icon: 'heart',
      iconColor: '#8b5cf6',
      desc: 'Your mood variance is in the lowest 20% this week. Routine is working well for you.',
    },
    {
      id: 'risk-assessment',
      title: 'Risk Assessment',
      badge: 'Risk: Low',
      badgeColor: '#10b981',
      badgeBg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
      icon: 'shield',
      iconColor: '#10b981',
      desc: 'No anomalies detected across all signals. Consistent patterns for 14 days running.',
    },
  ];

  return (
    <LinearGradient colors={bgColors} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header Navigation */}
        <View style={styles.header}>
          <Pressable 
            onPress={handleBack} 
            style={[styles.backBtn, { borderColor: cardBorder, backgroundColor: cardBg }]}
          >
            <Feather name="chevron-left" size={20} color={textColor} />
          </Pressable>
          <View style={styles.headerTextCol}>
            <Text style={[styles.headerTitle, { color: textColor }]}>AI Insights</Text>
            <Text style={[styles.headerSubtitle, { color: textMuted }]}>Behavioral analysis • June 7</Text>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Top Status Card (Green outline and grid of 4 scores) */}
          <View style={[styles.statusCard, { backgroundColor: cardBg, borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#a7f3d0' }]}>
            <View style={styles.statusHeaderRow}>
              <View style={[styles.statusIconCircle, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#e6fcf5' }]}>
                <Feather name="shield" size={18} color={isDark ? '#3de2b5' : '#059669'} />
              </View>
              <View style={styles.statusTitleCol}>
                <Text style={[styles.statusTitle, { color: textColor }]}>All signals within range</Text>
                <Text style={[styles.statusDesc, { color: textMuted }]}>
                  No anomalies detected. Consistent for 14 days.
                </Text>
              </View>
              <View style={[styles.riskBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#e6fcf5' }]}>
                <Text style={[styles.riskBadgeText, { color: isDark ? '#3de2b5' : '#059669' }]}>Low Risk</Text>
              </View>
            </View>

            {/* Score Grid (4 columns) */}
            <View style={[styles.scoreGrid, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
              <View style={styles.scoreCol}>
                <Text style={[styles.scoreVal, { color: textColor }]}>{scoreMood}</Text>
                <Text style={[styles.scoreLabel, { color: textMuted }]}>Mood</Text>
              </View>
              <View style={styles.scoreCol}>
                <Text style={[styles.scoreVal, { color: textColor }]}>{scoreSleep}</Text>
                <Text style={[styles.scoreLabel, { color: textMuted }]}>Sleep</Text>
              </View>
              <View style={styles.scoreCol}>
                <Text style={[styles.scoreVal, { color: textColor }]}>{scoreActivity}</Text>
                <Text style={[styles.scoreLabel, { color: textMuted }]}>Activity</Text>
              </View>
              <View style={styles.scoreCol}>
                <Text style={[styles.scoreVal, { color: textColor }]}>{scoreStress}</Text>
                <Text style={[styles.scoreLabel, { color: textMuted }]}>Stress</Text>
              </View>
            </View>
          </View>

          {/* Insights List */}
          <View style={styles.insightsList}>
            {INSIGHTS_LIST.map((item) => (
              <GlassCard key={item.id} style={styles.insightListItem}>
                <View style={styles.insightItemHeader}>
                  <View style={styles.insightTitleBlock}>
                    <View style={[styles.itemIconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: cardBorder }]}>
                      <Feather 
                        name={item.icon === 'moon' ? 'moon' : item.icon === 'activity' ? 'activity' : item.icon === 'heart' ? 'heart' : 'shield'} 
                        size={15} 
                        color={item.iconColor} 
                      />
                    </View>
                    <Text style={[styles.insightItemTitle, { color: textColor }]}>{item.title}</Text>
                  </View>
                  <View style={[styles.itemBadge, { backgroundColor: item.badgeBg }]}>
                    <Text style={[styles.itemBadgeText, { color: item.badgeColor }]}>{item.badge}</Text>
                  </View>
                </View>
                <Text style={[styles.insightItemDesc, { color: textMuted }]}>
                  {item.desc}
                </Text>
              </GlassCard>
            ))}
          </View>

          {/* AI Recommended Plans List */}
          <View style={styles.recommendationsListSection}>
            <Text style={[styles.listHeaderTitle, { color: textColor }]}>TODAY'S ACTION PLANS</Text>
            
            {isRecsLoading && <ActivityIndicator color={isDark ? '#a855f7' : '#7c3aed'} size="small" style={{ marginVertical: 20 }} />}
            
            {!isRecsLoading && (recData || []).length === 0 && (
              <GlassCard style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ color: textMuted, fontSize: 13 }}>No active plans for today. All wellness patterns look healthy.</Text>
              </GlassCard>
            )}

            {!isRecsLoading && (recData || []).map((rec) => {
              let details = { description: rec.body, exercise: null as any };
              try {
                details = JSON.parse(rec.body);
              } catch {}

              const isExpanded = expandedId === rec.id;
              const exercise = details.exercise;
              const recSteps = checkedSteps[rec.id] || {};

              return (
                <GlassCard key={rec.id} accent={rec.category === 'mindfulness' || rec.category === 'sleep' ? 'primary' : 'secondary'} style={styles.recCard}>
                  <Pressable onPress={() => setExpandedId(isExpanded ? null : rec.id)} style={styles.cardHeader}>
                    <View style={styles.recTitleBlock}>
                      <StatusChip label={rec.category} tone={rec.category === 'mindfulness' ? 'active' : rec.category === 'sleep' ? 'medium' : rec.category === 'activity' ? 'low' : 'neutral'} />
                      <Text style={[styles.recTitle, { color: textColor }]}>{rec.title}</Text>
                    </View>
                    <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={textMuted} />
                  </Pressable>

                  {isExpanded && (
                    <View style={[styles.expandedContent, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                      <Text style={[styles.explanationText, { color: textMuted }]}>
                        {details.description}
                      </Text>

                      {exercise && (
                        <View style={[styles.exerciseBox, { backgroundColor: isDark ? '#1a1633' : '#f6f4ff', borderColor: cardBorder }]}>
                          <View style={styles.exerciseHeader}>
                            <View style={styles.exerciseHeaderLeft}>
                              <Feather name="activity" size={14} color={isDark ? '#c084fc' : '#7c3aed'} />
                              <Text style={[styles.exerciseTitle, { color: isDark ? '#c084fc' : '#7c3aed' }]}>Suggested Exercise</Text>
                            </View>
                            <View style={styles.exerciseHeaderRight}>
                              <Feather name="clock" size={12} color={policyLinkColor} />
                              <Text style={[styles.exerciseDuration, { color: policyLinkColor }]}> {exercise.duration}</Text>
                            </View>
                          </View>
                          <Text style={[styles.exerciseName, { color: textColor }]}>{exercise.name}</Text>
                          
                          {/* Step Checklist */}
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
                                        ? 'rgba(16, 185, 129, 0.06)'
                                        : 'transparent',
                                    },
                                  ]}
                                >
                                  <Feather
                                    name={isChecked ? 'check-circle' : 'circle'}
                                    size={18}
                                    color={isChecked ? '#10b981' : textMuted}
                                  />
                                  <Text
                                    style={[
                                      styles.stepText,
                                      {
                                        color: isChecked ? textMuted : textColor,
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

                          <Text style={[styles.physiologyText, { color: textMuted }]}>
                            * {exercise.explanation}
                          </Text>

                          <ExerciseTimer duration={exercise.duration} />
                        </View>
                      )}

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
          </View>

          {/* AI Recommended Lifestyle Items */}
          <View style={styles.recommendationsListSection}>
            <Text style={[styles.listHeaderTitle, { color: textColor }]}>AI LIFESTYLE RECOMMENDATIONS</Text>
            
            {/* Category selection pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
              {['all', 'books', 'movies', 'songs', 'podcasts', 'meditation', 'productivity', 'stress-relief'].map((cat) => {
                const active = lifestyleCategory === cat;
                const displayLabel = cat === 'stress-relief' ? 'STRESS RELIEF' : cat.toUpperCase();
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setLifestyleCategory(cat)}
                    style={[
                      styles.pillChip,
                      { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                      active && { backgroundColor: isDark ? '#a855f7' : '#7c3aed', borderColor: isDark ? '#a855f7' : '#7c3aed' }
                    ]}
                  >
                    <Text style={[styles.pillChipText, { color: active ? '#ffffff' : textMuted, fontWeight: active ? 'bold' : 'normal' }]}>
                      {displayLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {isLifestyleLoading && <ActivityIndicator color={isDark ? '#a855f7' : '#7c3aed'} size="small" style={{ marginVertical: 20 }} />}

            {!isLifestyleLoading && totalCards > 0 && (
              <View style={styles.carouselContainer}>
                {/* Left Arrow */}
                {totalCards > 1 && (
                  <Pressable
                    onPress={() => handleArrowPress('left')}
                    style={[
                      styles.arrowOverlay,
                      styles.arrowOverlayLeft,
                      {
                        backgroundColor: isDark ? 'rgba(21, 17, 38, 0.75)' : 'rgba(255, 255, 255, 0.75)',
                        borderColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(124, 58, 237, 0.15)',
                      }
                    ]}
                  >
                    <Feather name="chevron-left" size={18} color={textColor} />
                  </Pressable>
                )}

                {/* Right Arrow */}
                {totalCards > 1 && (
                  <Pressable
                    onPress={() => handleArrowPress('right')}
                    style={[
                      styles.arrowOverlay,
                      styles.arrowOverlayRight,
                      {
                        backgroundColor: isDark ? 'rgba(21, 17, 38, 0.75)' : 'rgba(255, 255, 255, 0.75)',
                        borderColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(124, 58, 237, 0.15)',
                      }
                    ]}
                  >
                    <Feather name="chevron-right" size={18} color={textColor} />
                  </Pressable>
                )}

                <ScrollView 
                  ref={scrollViewRef}
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.lifestyleListHorizontal}
                  onMomentumScrollEnd={handleScroll}
                  snapToInterval={CARD_WIDTH + CARD_GAP}
                  decelerationRate="fast"
                >
                  {filteredRecs.map((item) => {
                    const themeColors = LIFESTYLE_THEMES[item.category as keyof typeof LIFESTYLE_THEMES] || LIFESTYLE_THEMES['books'];
                    const catColor = themeColors.primary;
                    const catIcon = LIFESTYLE_ICONS[item.category as keyof typeof LIFESTYLE_ICONS] || 'compass';
                    
                    const cardBorderColor = isDark ? 'rgba(168, 85, 247, 0.25)' : '#e0d7ff';
                    const iconBg = isDark ? themeColors.darkIconBg : themeColors.iconBg;
                    const btnBg = isDark ? themeColors.darkBg : themeColors.bg;
                    const btnBorder = isDark ? themeColors.darkBorder : themeColors.border;

                    return (
                      <View 
                        key={item.id} 
                        style={[
                          styles.lifestyleCard,
                          { 
                            backgroundColor: cardBg, 
                            borderColor: cardBorderColor,
                            shadowColor: isDark ? '#000000' : 'rgba(124, 58, 237, 0.04)',
                          }
                        ]}
                      >
                        <View style={styles.lifestyleCardHeader}>
                          <View style={[styles.lifestyleIconCircle, { backgroundColor: iconBg }]}>
                            <Feather name={catIcon} size={14} color={catColor} />
                          </View>
                          <View style={styles.lifestyleMeta}>
                            <Text style={[styles.lifestyleCategory, { color: catColor }]}>{item.category.toUpperCase()}</Text>
                            <Text style={[styles.lifestyleCreator, { color: textMuted }]}>by {item.creator}</Text>
                          </View>
                        </View>

                        {item.imageUrl && (
                          <View style={styles.imageContainer}>
                            <Image source={{ uri: item.imageUrl }} style={styles.lifestyleImage} />
                            {item.linkUrl && (
                              <Pressable
                                onPress={() => item.linkUrl && handleOpenLink(item.linkUrl)}
                                style={styles.imageLinkIndicator}
                              >
                                <Feather name="external-link" size={12} color="#ffffff" />
                              </Pressable>
                            )}
                          </View>
                        )}

                        <Text style={[styles.lifestyleTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>{item.title}</Text>
                        <Text style={[styles.lifestyleDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>{item.description}</Text>

                        <View style={[styles.reasonBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9' }]}>
                          <Feather name="cpu" size={12} color={isDark ? '#c084fc' : '#7c3aed'} />
                          <Text style={[styles.reasonText, { color: isDark ? '#94a3b8' : '#64748b' }]}>{item.reason}</Text>
                        </View>

                        {item.linkUrl && (
                          <Pressable
                            onPress={() => handleOpenLink(item.linkUrl!)}
                            style={[styles.linkButton, { backgroundColor: btnBg, borderColor: btnBorder }]}
                          >
                            <Feather name="external-link" size={12} color={catColor} />
                            <Text style={[styles.linkButtonText, { color: catColor }]}>
                              {item.category === 'songs' ? 'Listen on YouTube' :
                               item.category === 'podcasts' ? 'Listen on Spotify' :
                               item.category === 'meditation' ? 'Watch Guide' :
                               item.category === 'books' ? 'Read on Goodreads' :
                               item.category === 'movies' ? 'Watch Trailer' : 'Open Curation'}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Bottom Gradient Call To Action */}
          <Pressable 
            onPress={() => router.push('/perfect-plan')}
            style={({ pressed }) => [
              styles.ctaBtnContainer,
              pressed && styles.ctaBtnPressed
            ]}
          >
            <LinearGradient
              colors={['#8b5cf6', '#06b6d4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <View style={styles.ctaContent}>
                <Feather name="zap" size={16} color="#ffffff" style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.ctaTitle}>Generate My Perfect Plan</Text>
                  <Text style={styles.ctaSub}>AI-personalized to your patterns</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color="#ffffff" />
            </LinearGradient>
          </Pressable>

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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTextCol: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
  },
  headerSubtitle: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  statusCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 18,
    marginBottom: 16,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusTitleCol: {
    flex: 1,
    gap: 2,
  },
  statusTitle: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
  },
  statusDesc: {
    fontSize: 11.5,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  riskBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  scoreGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 14,
  },
  scoreCol: {
    flex: 1,
    alignItems: 'center',
  },
  scoreVal: {
    fontFamily: fonts.bold,
    fontSize: 22,
  },
  scoreLabel: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    marginTop: 2,
  },
  insightsList: {
    gap: 12,
    marginBottom: 20,
  },
  insightListItem: {
    padding: 16,
  },
  insightItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  insightTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightItemTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  itemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  insightItemDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  ctaBtnContainer: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  ctaBtnPressed: {
    opacity: 0.9,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaTitle: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
    color: '#ffffff',
  },
  ctaSub: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  recommendationsListSection: {
    gap: 12,
    marginBottom: 20,
    marginTop: 8,
  },
  listHeaderTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 4,
  },
  recCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  recTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  explanationText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  exerciseBox: {
    borderRadius: 12,
    borderWidth: 1.2,
    padding: 12,
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
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  exerciseDuration: {
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  exerciseName: {
    fontFamily: fonts.bold,
    fontSize: 16,
    marginBottom: 4,
  },
  stepsList: {
    gap: 6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 8,
    borderRadius: 6,
  },
  stepText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  physiologyText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 15,
  },
  actionBlock: {
    marginTop: 4,
  },
  timerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(124, 58, 237, 0.08)',
  },
  timerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adjustButton: {
    borderWidth: 1,
    borderRadius: 6,
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
    fontFamily: fonts.mono,
    fontSize: 20,
    fontWeight: 'bold',
    minWidth: 54,
    textAlign: 'center',
  },
  timerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  timerButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lifestyleListHorizontal: {
    flexDirection: 'row',
    gap: 16,
    paddingRight: 20,
    paddingBottom: 10,
  },
  pillsScroll: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  pillChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
  },
  pillChipText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    letterSpacing: 0.4,
  },
  carouselContainer: {
    position: 'relative',
    width: '100%',
  },
  arrowOverlay: {
    position: 'absolute',
    top: '40%',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  arrowOverlayLeft: {
    left: -8,
  },
  arrowOverlayRight: {
    right: -8,
  },
  lifestyleCard: {
    padding: 18,
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    width: 240,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  lifestyleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lifestyleIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifestyleMeta: {
    gap: 1,
  },
  lifestyleCategory: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  lifestyleCreator: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
  lifestyleTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
  },
  lifestyleDesc: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    marginTop: 4,
  },
  reasonText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    flex: 1,
  },
  imageContainer: {
    marginVertical: 8,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 10,
    height: 150,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  lifestyleImage: {
    width: '100%',
    height: '100%',
  },
  imageLinkIndicator: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 4,
  },
  linkButtonText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
});
