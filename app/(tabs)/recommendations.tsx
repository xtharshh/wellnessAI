import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ActivityIndicator, ScrollView, Platform, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { ExerciseTimer } from '@/src/components/ui/ExerciseTimer';
import { useRecommendations } from '@/src/hooks/useRecommendations';
import { useTheme } from '@/src/hooks/useTheme';
import { radius, spacing } from '@/src/theme/spacing';

const categoryStyles = {
  sleep: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)', icon: 'moon' as const },
  mindfulness: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)', icon: 'wind' as const },
  activity: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', icon: 'activity' as const },
  general: { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.08)', icon: 'compass' as const },
};

const lifestyleCategoryStyles = {
  books: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)', icon: 'book' as const, label: 'Books' },
  movies: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', icon: 'video' as const, label: 'Movies' },
  podcasts: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)', icon: 'mic' as const, label: 'Podcasts' },
  songs: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)', icon: 'music' as const, label: 'Music' },
  meditation: { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.08)', icon: 'wind' as const, label: 'Meditations' },
  productivity: { color: '#eab308', bg: 'rgba(234, 179, 8, 0.08)', icon: 'zap' as const, label: 'Productivity' },
  'stress-relief': { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.08)', icon: 'sun' as const, label: 'Stress Relief' },
};

export default function RecommendationsScreen() {
  const router = useRouter();
  const { data, isLoading, dismiss, complete, regenerate, lifestyleRecs, isLifestyleLoading } = useRecommendations();
  const { colors, isDark } = useTheme();

  // Screen Tab Controls
  const [activeTab, setActiveTab] = useState<'practices' | 'lifestyle'>('practices');

  // Filter category states
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Sleep' | 'Activity' | 'Mind' | 'Stress'>('All');
  const [lifestyleCategory, setLifestyleCategory] = useState<'All' | 'Books' | 'Movies' | 'Podcasts' | 'Music' | 'Meditations' | 'Others'>('All');
  
  // Expanded card ID
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Steps completion state
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

  const handleOpenLink = async (url?: string) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to open link', 'No app or browser was found to open this URL.');
      }
    } catch {
      Alert.alert('Error', 'Failed to open link.');
    }
  };

  // Map pill selection to API categories
  const filterRecommendations = (recs: typeof data) => {
    if (!recs) return [];
    return recs.filter((rec) => {
      if (selectedCategory === 'All') return true;
      if (selectedCategory === 'Sleep') return rec.category === 'sleep';
      if (selectedCategory === 'Activity') return rec.category === 'activity';
      if (selectedCategory === 'Mind') return rec.category === 'mindfulness';
      if (selectedCategory === 'Stress') return rec.category === 'general';
      return true;
    });
  };

  const filterLifestyle = (items: typeof lifestyleRecs) => {
    if (!items) return [];
    return items.filter((item) => {
      if (lifestyleCategory === 'All') return true;
      if (lifestyleCategory === 'Books') return item.category === 'books';
      if (lifestyleCategory === 'Movies') return item.category === 'movies';
      if (lifestyleCategory === 'Podcasts') return item.category === 'podcasts';
      if (lifestyleCategory === 'Music') return item.category === 'songs';
      if (lifestyleCategory === 'Meditations') return item.category === 'meditation';
      if (lifestyleCategory === 'Others') return item.category === 'productivity' || item.category === 'stress-relief';
      return true;
    });
  };

  const filteredRecs = filterRecommendations(data || []);
  const topHighlight = filteredRecs[0];
  const remainingRecs = filteredRecs.slice(1);

  const filteredLifestyle = filterLifestyle(lifestyleRecs || []);

  // Styling helpers
  const bgThemeColor = isDark ? '#0c0b16' : '#f6f5fb';
  const cardBgColor = isDark ? 'rgba(27, 24, 54, 0.5)' : '#ffffff';
  const cardBorderColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(124, 58, 237, 0.08)';
  const textColor = isDark ? '#ffffff' : '#0f0d1e';
  const textMutedColor = isDark ? '#9ca3af' : '#6b7280';
  const accentPurple = '#8b5cf6';
  const accentGreen = '#10b981';

  return (
    <ScreenContainer scrollable contentStyle={[styles.container, { backgroundColor: bgThemeColor }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.headerTitle, { color: textColor }]}>For You</Text>
          <Text style={[styles.headerSubtitle, { color: textMutedColor }]} numberOfLines={1}>
            {activeTab === 'practices' 
              ? `${filteredRecs.length} personalized recommendation${filteredRecs.length !== 1 ? 's' : ''}`
              : `${filteredLifestyle.length} aesthetic curation${filteredLifestyle.length !== 1 ? 's' : ''}`
            }
          </Text>
        </View>
        <View style={styles.headerRightActions}>
          <View style={[styles.updatedBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 58, 237, 0.06)' }]}>
            <Text style={[styles.updatedBadgeText, { color: isDark ? '#ffffff' : '#7c3aed' }]}>Updated today</Text>
          </View>
          <Pressable
            onPress={() => {
              regenerate.mutate(undefined, {
                onSuccess: () => {
                  Alert.alert('Success', 'Recommendations regenerated successfully!');
                }
              });
            }}
            disabled={regenerate.isPending}
            style={[styles.regenerateBtn, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(124, 58, 237, 0.08)' }]}
          >
            {regenerate.isPending ? (
              <ActivityIndicator size="small" color={accentPurple} />
            ) : (
              <>
                <Feather name="refresh-cw" size={11} color={isDark ? '#c4b5fd' : '#7c3aed'} style={{ marginRight: 4 }} />
                <Text style={[styles.regenerateBtnText, { color: isDark ? '#c4b5fd' : '#7c3aed' }]}>Regenerate</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* Centered Tab Controls */}
      <View style={[styles.tabContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(124, 58, 237, 0.04)', borderColor: cardBorderColor }]}>
        <Pressable
          onPress={() => setActiveTab('practices')}
          style={[styles.tabButton, activeTab === 'practices' && { backgroundColor: accentPurple }]}
        >
          <Text style={[styles.tabButtonText, { color: activeTab === 'practices' ? '#ffffff' : textColor, fontWeight: activeTab === 'practices' ? 'bold' : '600' }]}>
            Active Practices
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('lifestyle')}
          style={[styles.tabButton, activeTab === 'lifestyle' && { backgroundColor: accentPurple }]}
        >
          <Text style={[styles.tabButtonText, { color: activeTab === 'lifestyle' ? '#ffffff' : textColor, fontWeight: activeTab === 'lifestyle' ? 'bold' : '600' }]}>
            Aesthetic Lifestyle
          </Text>
        </Pressable>
      </View>

      {/* Conditionally Render Content */}
      {activeTab === 'practices' ? (
        <View style={styles.tabContentContainer}>
          {/* Category Filter Pills Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {(['All', 'Sleep', 'Activity', 'Mind', 'Stress'] as const).map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setExpandedId(null);
                  }}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isSelected ? accentPurple : isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                      borderColor: isSelected ? accentPurple : cardBorderColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      {
                        color: isSelected ? '#ffffff' : textColor,
                        fontWeight: isSelected ? 'bold' : 'normal',
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* List content */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator color={accentPurple} size="small" />
              <Text style={[styles.loadingText, { color: textMutedColor }]}>Analyzing wellness telemetry...</Text>
            </View>
          ) : filteredRecs.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={[styles.emptyText, { color: textMutedColor }]}>No recommendations found in this category.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {/* Top Highlight Card (High Priority) */}
              {topHighlight && (() => {
                let details = { description: topHighlight.body, exercise: null as any };
                try {
                  details = JSON.parse(topHighlight.body);
                } catch {}

                const isExpanded = expandedId === topHighlight.id;
                const exercise = details.exercise;
                const recSteps = checkedSteps[topHighlight.id] || {};

                return (
                  <View style={[styles.highlightCard, { borderColor: cardBorderColor }]}>
                    <View style={[StyleSheet.absoluteFillObject, { overflow: 'hidden', borderRadius: radius.lg }]}>
                      <LinearGradient
                        colors={
                          topHighlight.category === 'sleep'
                            ? (isDark ? ['#16224f', '#090e22'] : ['#e0f2fe', '#e0e7ff'])
                            : topHighlight.category === 'mindfulness' || topHighlight.category === 'mind'
                            ? (isDark ? ['#2c154f', '#100720'] : ['#f3e8ff', '#e8e8ff'])
                            : topHighlight.category === 'activity'
                            ? (isDark ? ['#063024', '#02120e'] : ['#e6fcf5', '#d1fae5'])
                            : (isDark ? ['#3b0b2d', '#150310'] : ['#fdf2f8', '#fce7f3'])
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                      {/* Premium glowing circles inside card */}
                      <View style={[
                        styles.glowingCircle,
                        {
                          backgroundColor: topHighlight.category === 'sleep'
                            ? (isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)')
                            : topHighlight.category === 'mindfulness' || topHighlight.category === 'mind'
                            ? (isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.15)')
                            : topHighlight.category === 'activity'
                            ? (isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.15)')
                            : (isDark ? 'rgba(236, 72, 153, 0.25)' : 'rgba(236, 72, 153, 0.15)'),
                          top: -45,
                          right: -35,
                          width: 140,
                          height: 140,
                          borderRadius: 70,
                        }
                      ]} />
                      <View style={[
                        styles.glowingCircle,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.4)',
                          bottom: -30,
                          left: -20,
                          width: 100,
                          height: 100,
                          borderRadius: 50,
                        }
                      ]} />
                    </View>
                    
                    <View style={styles.highlightContent}>
                      <View style={[styles.priorityBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)' }]}>
                        <Text style={[styles.priorityBadgeText, { color: accentGreen }]}>• HIGH PRIORITY</Text>
                      </View>
                      
                      <Text style={[styles.highlightTitle, { color: textColor }]}>{topHighlight.title}</Text>
                      <Text style={[styles.highlightDesc, { color: isDark ? '#c4b5fd' : '#312e81' }]}>
                        {details.description}
                      </Text>

                      {/* Expandable Exercise Details */}
                      {isExpanded && exercise && (
                        <View style={[styles.exerciseBox, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)', borderColor: cardBorderColor }]}>
                          <View style={styles.exerciseHeader}>
                            <View style={styles.exerciseHeaderLeft}>
                              <Feather name="activity" size={14} color={accentPurple} />
                              <Text style={[styles.exerciseTitle, { color: accentPurple }]}>Suggested Exercise</Text>
                            </View>
                            <View style={styles.exerciseHeaderRight}>
                              <Feather name="clock" size={12} color={textColor} />
                              <Text style={[styles.exerciseDuration, { color: textColor }]}> {exercise.duration}</Text>
                            </View>
                          </View>
                          <Text style={[styles.exerciseName, { color: textColor }]}>{exercise.name}</Text>
                          
                          <View style={styles.stepsList}>
                            {exercise.steps.map((step: string, index: number) => {
                              const isChecked = !!recSteps[index];
                              return (
                                <Pressable
                                  key={index}
                                  onPress={() => toggleStep(topHighlight.id, index)}
                                  style={[
                                    styles.stepRow,
                                    {
                                      backgroundColor: isChecked
                                        ? 'rgba(16, 185, 129, 0.08)'
                                        : 'transparent',
                                    },
                                  ]}
                                >
                                  <Feather
                                    name={isChecked ? 'check-circle' : 'circle'}
                                    size={18}
                                    color={isChecked ? accentGreen : textMutedColor}
                                  />
                                  <Text
                                    style={[
                                      styles.stepText,
                                      {
                                        color: isChecked ? textMutedColor : textColor,
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

                          {exercise.explanation && (
                            <Text style={[styles.physiologyText, { color: textMutedColor }]}>
                              * {exercise.explanation}
                            </Text>
                          )}

                          <ExerciseTimer duration={exercise.duration} />
                        </View>
                      )}

                      <View style={styles.highlightActions}>
                        <Pressable
                          onPress={() => dismiss.mutate(topHighlight.id)}
                          style={[styles.dismissBtn, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(124, 58, 237, 0.2)' }]}
                        >
                          <Text style={[styles.dismissBtnText, { color: textColor }]}>Dismiss</Text>
                        </Pressable>

                        <Pressable
                          onPress={() => {
                            if (exercise) {
                              setExpandedId(isExpanded ? null : topHighlight.id);
                            } else {
                              complete.mutate(topHighlight.id);
                              Alert.alert('Success', 'Recommendation completed!');
                            }
                          }}
                          style={[styles.startBtn, { backgroundColor: accentGreen }]}
                        >
                          <Feather name="wind" size={14} color="#ffffff" style={{ marginRight: 6 }} />
                          <Text style={styles.startBtnText}>
                            {isExpanded ? 'Collapse' : exercise ? 'Start Exercise' : 'Mark Done'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })()}

              {/* Smaller Recommendation Rows */}
              {remainingRecs.map((rec) => {
                let details = { description: rec.body, exercise: null as any };
                try {
                  details = JSON.parse(rec.body);
                } catch {}

                const isExpanded = expandedId === rec.id;
                const exercise = details.exercise;
                const recSteps = checkedSteps[rec.id] || {};
                const stylesObj = categoryStyles[rec.category as keyof typeof categoryStyles] || categoryStyles.general;

                return (
                  <GlassCard
                    key={rec.id}
                    style={[styles.rowCard, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}
                  >
                    <Pressable
                      onPress={() => setExpandedId(isExpanded ? null : rec.id)}
                      style={styles.rowHeader}
                    >
                      <View style={[styles.rowIconContainer, { backgroundColor: stylesObj.bg }]}>
                        <Feather name={stylesObj.icon} size={16} color={stylesObj.color} />
                      </View>
                      <View style={styles.rowTextContainer}>
                        <Text style={[styles.rowTitle, { color: textColor }]} numberOfLines={1}>
                          {rec.title}
                        </Text>
                        <Text style={[styles.rowDesc, { color: textMutedColor }]} numberOfLines={1}>
                          {details.description}
                        </Text>
                      </View>
                      <Feather
                        name={isExpanded ? 'chevron-up' : 'chevron-right'}
                        size={18}
                        color={textMutedColor}
                      />
                    </Pressable>

                    {isExpanded && (
                      <View style={[styles.rowExpandedContent, { borderTopColor: cardBorderColor }]}>
                        <Text style={[styles.expandedDescText, { color: textColor }]}>
                          {details.description}
                        </Text>

                        {exercise && (
                          <View style={[styles.exerciseBox, { backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)', borderColor: cardBorderColor }]}>
                            <View style={styles.exerciseHeader}>
                              <View style={styles.exerciseHeaderLeft}>
                                <Feather name="activity" size={14} color={accentPurple} />
                                <Text style={[styles.exerciseTitle, { color: accentPurple }]}>Suggested Exercise</Text>
                              </View>
                              <View style={styles.exerciseHeaderRight}>
                                <Feather name="clock" size={12} color={textColor} />
                                <Text style={[styles.exerciseDuration, { color: textColor }]}> {exercise.duration}</Text>
                              </View>
                            </View>
                            <Text style={[styles.exerciseName, { color: textColor }]}>{exercise.name}</Text>
                            
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
                                          ? 'rgba(16, 185, 129, 0.08)'
                                          : 'transparent',
                                      },
                                    ]}
                                  >
                                    <Feather
                                      name={isChecked ? 'check-circle' : 'circle'}
                                      size={18}
                                      color={isChecked ? accentGreen : textMutedColor}
                                    />
                                    <Text
                                      style={[
                                        styles.stepText,
                                        {
                                          color: isChecked ? textMutedColor : textColor,
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

                            {exercise.explanation && (
                              <Text style={[styles.physiologyText, { color: textMutedColor }]}>
                                * {exercise.explanation}
                              </Text>
                            )}

                            <ExerciseTimer duration={exercise.duration} />
                          </View>
                        )}

                        <View style={styles.rowActions}>
                          <Pressable
                            onPress={() => dismiss.mutate(rec.id)}
                            style={[styles.dismissBtn, { borderColor: cardBorderColor }]}
                          >
                            <Text style={[styles.dismissBtnText, { color: textColor }]}>Dismiss</Text>
                          </Pressable>
                          
                          {!rec.completed && (
                            <Pressable
                              onPress={() => {
                                complete.mutate(rec.id);
                                Alert.alert('Success', 'Recommendation completed!');
                              }}
                              style={[styles.startBtn, { backgroundColor: accentPurple }]}
                            >
                              <Text style={styles.startBtnText}>Mark Done</Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    )}
                  </GlassCard>
                );
              })}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.tabContentContainer}>
          {/* Lifestyle Category Filter Pills Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {(['All', 'Books', 'Movies', 'Podcasts', 'Music', 'Meditations', 'Others'] as const).map((cat) => {
              const isSelected = lifestyleCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setLifestyleCategory(cat)}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isSelected ? accentPurple : isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                      borderColor: isSelected ? accentPurple : cardBorderColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      {
                        color: isSelected ? '#ffffff' : textColor,
                        fontWeight: isSelected ? 'bold' : 'normal',
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Lifestyle list content */}
          {isLifestyleLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator color={accentPurple} size="small" />
              <Text style={[styles.loadingText, { color: textMutedColor }]}>Fetching curations...</Text>
            </View>
          ) : filteredLifestyle.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={[styles.emptyText, { color: textMutedColor }]}>No recommendations found in this category.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredLifestyle.map((item) => {
                const stylesObj = lifestyleCategoryStyles[item.category as keyof typeof lifestyleCategoryStyles] || {
                  color: accentPurple,
                  bg: 'rgba(139, 92, 246, 0.08)',
                  icon: 'compass' as const,
                  label: item.category.toUpperCase(),
                };

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleOpenLink(item.linkUrl)}
                    style={({ pressed }) => [
                      styles.lifestyleCard,
                      {
                        backgroundColor: cardBgColor,
                        borderColor: cardBorderColor,
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}
                  >
                    {/* Left Icon Circle */}
                    <View style={[styles.lifestyleIconContainer, { backgroundColor: stylesObj.bg }]}>
                      <Feather name={stylesObj.icon} size={18} color={stylesObj.color} />
                    </View>

                    {/* Content details */}
                    <View style={styles.lifestyleContent}>
                      <Text style={[styles.lifestyleTitle, { color: textColor }]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.lifestyleCreator, { color: textMutedColor }]}>
                        {item.creator}
                      </Text>
                      <Text style={[styles.lifestyleQuote, { color: textMutedColor }]}>
                        "{item.description}"
                      </Text>
                    </View>

                    {/* Top Right Label badge */}
                    <View style={styles.lifestyleBadgeContainer}>
                      <View style={[styles.lifestyleBadge, { backgroundColor: stylesObj.bg }]}>
                        <Text style={[styles.lifestyleBadgeText, { color: stylesObj.color }]}>
                          {stylesObj.label}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* visual spacer */}
      <View style={{ height: 100 }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 12 : 24,
    paddingBottom: 24,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  updatedBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  updatedBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  regenerateBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  regenerateBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
    padding: 4,
    marginVertical: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonText: {
    fontSize: 13,
  },
  tabContentContainer: {
    gap: 12,
  },
  filterScroll: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  filterPill: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 6,
  },
  filterPillText: {
    fontSize: 12,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 13.5,
  },
  emptyText: {
    fontSize: 13.5,
    textAlign: 'center',
  },
  listContainer: {
    gap: 12,
  },
  highlightCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  glowingCircle: {
    position: 'absolute',
  },
  highlightContent: {
    padding: spacing.md,
    gap: 10,
    zIndex: 1,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  priorityBadgeText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  highlightTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  highlightDesc: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  highlightActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  dismissBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  startBtn: {
    flex: 1.5,
    borderRadius: radius.md,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rowCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14.5,
    fontWeight: 'bold',
  },
  rowDesc: {
    fontSize: 12,
  },
  rowExpandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  expandedDescText: {
    fontSize: 13,
    lineHeight: 18,
  },
  exerciseBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: 10,
    marginTop: 4,
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
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  exerciseDuration: {
    fontSize: 11,
    fontWeight: '500',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  stepsList: {
    gap: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 8,
    borderRadius: radius.sm,
  },
  stepText: {
    fontSize: 12.5,
    flex: 1,
    lineHeight: 17,
  },
  physiologyText: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 15,
  },
  rowActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },

  // Lifestyle Layout
  lifestyleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  lifestyleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifestyleContent: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
    gap: 2,
  },
  lifestyleTitle: {
    fontSize: 14.5,
    fontWeight: 'bold',
  },
  lifestyleCreator: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  lifestyleQuote: {
    fontSize: 11.5,
    fontStyle: 'italic',
    marginTop: 2,
  },
  lifestyleBadgeContainer: {
    justifyContent: 'center',
  },
  lifestyleBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  lifestyleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
