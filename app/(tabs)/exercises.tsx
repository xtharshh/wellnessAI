import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { InputField } from '@/src/components/ui/InputField';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SecondaryButton } from '@/src/components/ui/SecondaryButton';
import { ExerciseTimer } from '@/src/components/ui/ExerciseTimer';
import { useExercises } from '@/src/hooks/useExercises';
import { useTheme } from '@/src/hooks/useTheme';
import { radius, spacing } from '@/src/theme/spacing';
import { Exercise } from '@/src/types/wellness';

// Mockup Default Exercises for Seeding / Fallback
const MOCKUP_EXERCISES: Exercise[] = [
  {
    id: 'mock-478',
    name: '4-7-8 Breathing',
    duration: '8 min',
    steps: [
      'Exhale completely through your mouth, making a whoosh sound.',
      'Close your mouth and inhale quietly through your nose to a mental count of 4.',
      'Hold your breath for a count of 7.',
      'Exhale completely through your mouth, making a whoosh sound to a count of 8.'
    ],
    explanation: 'Inhale 4s • Hold 7s • Exhale 8s. Activates the parasympathetic nervous system in minutes.',
    category: 'sleep',
    custom: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mock-box',
    name: 'Box Breathing',
    duration: '5 min',
    steps: [
      'Inhale for 4 seconds.',
      'Hold for 4 seconds.',
      'Exhale for 4 seconds.',
      'Hold empty for 4 seconds.'
    ],
    explanation: 'navy SEAL technique used to rapidly calm the nervous system and regain absolute focus.',
    category: 'mindfulness',
    custom: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mock-running',
    name: 'Running Rhythm',
    duration: '6 min',
    steps: [
      'Inhale deeply through your nose for 3 seconds, filling your belly.',
      'Exhale steadily through your mouth for 3 seconds.',
      'Maintain this rhythmic 3-3 cadence synchronized with your footsteps.'
    ],
    explanation: '3s Inhale • 3s Exhale. Optimizes oxygen delivery and balances CO2 levels during aerobic workouts.',
    category: 'activity',
    custom: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mock-stress',
    name: 'Stress Reset Sigh',
    duration: '3 min',
    steps: [
      'Take a quick, deep inhale through your nose.',
      'Take a second micro-sip of air to completely inflate your lungs.',
      'Exhale slowly and fully through your mouth for a long 8 seconds.'
    ],
    explanation: 'Double inhale • Long exhale. The physiological sigh is the fastest scientific way to trigger calming signals in the brain.',
    category: 'sleep',
    custom: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mock-body',
    name: 'Body Scan',
    duration: '15 min',
    steps: [
      'Lie down in a comfortable position.',
      'Close your eyes and focus on your breath.',
      'Slowly move attention through your body, starting from toes to head.',
      'Release any physical tension you encounter.'
    ],
    explanation: 'Develops deep somatic awareness and systematically dissolves localized muscle tension.',
    category: 'mindfulness',
    custom: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mock-muscle',
    name: 'Progressive Muscle',
    duration: '20 min',
    steps: [
      'Tense a muscle group for 5 seconds.',
      'Release suddenly and feel the relaxation for 15 seconds.',
      'Progress systematically from feet to facial muscles.',
      'Breathe deeply between tensing intervals.'
    ],
    explanation: 'Systematic tension and release therapy to alleviate deep bodily stress.',
    category: 'activity',
    custom: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mock-gratitude',
    name: 'Gratitude Journal',
    duration: '10 min',
    steps: [
      'Write down 3 things you are grateful for today.',
      'Visualize each item and hold the feeling of appreciation.',
      'Reflect on how these positive events impacted your mood.'
    ],
    explanation: 'Re-wires neural pathways towards positive scanning patterns and stress-resilience.',
    category: 'general',
    custom: false,
    createdAt: new Date().toISOString()
  }
];

const categoryStyles = {
  sleep: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)', icon: 'moon' as const, label: 'Breath' },
  mindfulness: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)', icon: 'eye' as const, label: 'Mindfulness' },
  activity: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', icon: 'activity' as const, label: 'Body' },
  general: { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.08)', icon: 'book-open' as const, label: 'Mental' },
};

export default function ExercisesScreen() {
  const { colors, isDark } = useTheme();
  const { data: dbExercises, isLoading, add, edit, remove } = useExercises();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'breathe' | 'physical'>('breathe');

  const isBreathingExercise = (ex: Exercise) => {
    const nameLower = ex.name.toLowerCase();
    return (
      nameLower.includes('4-7-8') ||
      nameLower.includes('box') ||
      nameLower.includes('running') ||
      nameLower.includes('rhythm') ||
      nameLower.includes('stress reset') ||
      nameLower.includes('sigh') ||
      nameLower.includes('breath')
    );
  };

  const handleStartBreathing = (ex: Exercise) => {
    const nameLower = ex.name.toLowerCase();
    let techniqueId: string | null = null;
    if (nameLower.includes('4-7-8')) techniqueId = 'relax478';
    else if (nameLower.includes('box')) techniqueId = 'box';
    else if (nameLower.includes('running') || nameLower.includes('rhythm')) techniqueId = 'running';
    else if (nameLower.includes('stress reset') || nameLower.includes('sigh')) techniqueId = 'stress';

    if (techniqueId) {
      router.push({
        pathname: '/(tabs)/breath',
        params: {
          start: 'true',
          technique: techniqueId,
          referrer: '/(tabs)/exercises',
          sessionDuration: String(selectedDuration),
          name: ex.name,
        }
      });
    }
  };

  // Combine database exercises with mockup defaults (prevent duplicate names)
  const getCombinedExercises = () => {
    const list = dbExercises && dbExercises.length > 0 ? [...dbExercises] : [];
    
    // Add mockup items that aren't in the database yet
    MOCKUP_EXERCISES.forEach((mock) => {
      if (!list.some((e) => e.name.toLowerCase().trim() === mock.name.toLowerCase().trim())) {
        list.push(mock);
      }
    });
    return list;
  };

  const exercises = getCombinedExercises();

  const currentExercises = exercises.filter((ex) => {
    const isBreathe = isBreathingExercise(ex);
    return activeTab === 'breathe' ? isBreathe : !isBreathe;
  });

  // Find featured exercise (prefer 4-7-8 Breathing, otherwise first breath/sleep exercise)
  const getFeaturedExercise = () => {
    if (activeTab === 'breathe') {
      const found478 = currentExercises.find((e) => e.name.toLowerCase().includes('4-7-8'));
      if (found478) return found478;
    } else {
      const foundBody = currentExercises.find((e) => e.name.toLowerCase().includes('body scan'));
      if (foundBody) return foundBody;
    }
    return currentExercises[0] || null;
  };

  const featuredExercise = getFeaturedExercise();
  const gridExercises = currentExercises.filter((e) => e.id !== featuredExercise?.id);

  // Edit / Add Form Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('5 mins');
  const [explanation, setExplanation] = useState('');
  const [category, setCategory] = useState('general');
  const [steps, setSteps] = useState<string[]>(['']);

  // Exercise Detail Run Modal State
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(180); // duration in seconds
  const [checkedSteps, setCheckedSteps] = useState<Record<string, Record<number, boolean>>>({});

  const toggleStep = (exId: string, index: number) => {
    setCheckedSteps((prev) => {
      const exSteps = prev[exId] || {};
      return {
        ...prev,
        [exId]: {
          ...exSteps,
          [index]: !exSteps[index],
        },
      };
    });
  };

  const resetForm = () => {
    setExerciseId(null);
    setName('');
    setDuration('5 mins');
    setExplanation('');
    setCategory('general');
    setSteps(['']);
  };

  const handleOpenAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleOpenEdit = (ex: Exercise) => {
    setExerciseId(ex.id);
    setName(ex.name);
    setDuration(ex.duration);
    setExplanation(ex.explanation);
    setCategory(ex.category);
    setSteps(ex.steps.length ? ex.steps : ['']);
    setModalVisible(true);
  };

  const handleAddStep = () => {
    setSteps([...steps, '']);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const handleStepChange = (text: string, index: number) => {
    const next = [...steps];
    next[index] = text;
    setSteps(next);
  };

  const handleSubmit = () => {
    if (!name.trim() || !explanation.trim() || steps.some((s) => !s.trim())) {
      Alert.alert('Validation Error', 'Please fill in all details and step fields.');
      return;
    }

    const payload = {
      name: name.trim(),
      duration: duration.trim(),
      explanation: explanation.trim(),
      category,
      steps: steps.map((s) => s.trim()),
    };

    if (exerciseId) {
      edit.mutate(
        { id: exerciseId, exercise: payload },
        {
          onSuccess: () => {
            setModalVisible(false);
            resetForm();
            // If the edited item was open in details, close details modal
            setDetailModalVisible(false);
          },
        }
      );
    } else {
      add.mutate(
        { ...payload, custom: true },
        {
          onSuccess: () => {
            setModalVisible(false);
            resetForm();
          },
        }
      );
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Exercise', 'Are you sure you want to remove this exercise from your library?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          remove.mutate(id);
          setDetailModalVisible(false);
        },
      },
    ]);
  };

  const openDetails = (ex: Exercise) => {
    setSelectedExercise(ex);
    const parsedMins = parseInt(ex.duration, 10);
    setSelectedDuration(isNaN(parsedMins) ? 180 : parsedMins * 60);
    setDetailModalVisible(true);
  };

  // Styling / Theming helpers
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
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: textColor }]}>Exercises</Text>
          <Text style={[styles.subtitle, { color: textMutedColor }]}>Guided wellness practices</Text>
        </View>
        <Pressable
          onPress={handleOpenAdd}
          style={[styles.addButton, { borderColor: cardBorderColor, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff' }]}
        >
          <Feather name="plus" size={18} color={textColor} />
        </Pressable>
      </View>

      {/* Tab Toggle (Breathe | Physical) */}
      <View style={[styles.toggleContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: cardBorderColor }]}>
        <Pressable
          onPress={() => setActiveTab('breathe')}
          style={[
            styles.toggleButton,
            activeTab === 'breathe' && {
              backgroundColor: accentPurple,
            }
          ]}
        >
          <Feather name="wind" size={14} color={activeTab === 'breathe' ? '#ffffff' : textMutedColor} style={{ marginRight: 6 }} />
          <Text style={[styles.toggleText, { color: activeTab === 'breathe' ? '#ffffff' : textColor }]}>
            Breathe
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('physical')}
          style={[
            styles.toggleButton,
            activeTab === 'physical' && {
              backgroundColor: accentPurple,
            }
          ]}
        >
          <Feather name="activity" size={14} color={activeTab === 'physical' ? '#ffffff' : textMutedColor} style={{ marginRight: 6 }} />
          <Text style={[styles.toggleText, { color: activeTab === 'physical' ? '#ffffff' : textColor }]}>
            Physical
          </Text>
        </Pressable>
      </View>

      {/* Featured Today Card */}
      {featuredExercise && (() => {
        const stylesObj = categoryStyles[featuredExercise.category as keyof typeof categoryStyles] || categoryStyles.general;
        const isBreathe = isBreathingExercise(featuredExercise);
        return (
          <Pressable
            onPress={() => openDetails(featuredExercise)}
            style={({ pressed }) => [
              styles.featuredCard,
              {
                borderColor: isBreathe ? 'transparent' : cardBorderColor,
                opacity: pressed ? 0.95 : 1,
              }
            ]}
          >
            {isBreathe ? (
              <>
                <LinearGradient
                  colors={['#7c3aed', '#4f46e5', '#0f766e']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                {/* Circular decorative overlays to match the background design */}
                <View style={[styles.decorCircle, { width: 200, height: 200, borderRadius: 100, top: -80, left: -80 }]} />
                <View style={[styles.decorCircle, { width: 240, height: 240, borderRadius: 120, top: -40, right: -60 }]} />
                <View style={[styles.decorCircle, { width: 140, height: 140, borderRadius: 70, bottom: -50, left: 30 }]} />
              </>
            ) : (
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: isDark ? '#1d153e' : '#f0ebf8', borderRadius: radius.lg }]} />
            )}
            
            <View style={styles.featuredContent}>
              <View style={[styles.featuredTag, { backgroundColor: isBreathe ? 'rgba(255,255,255,0.12)' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(139,92,246,0.08)') }]}>
                <Text style={[styles.featuredTagText, { color: isBreathe ? '#ffffff' : (isDark ? '#ffffff' : accentPurple) }]}>
                  ✦ FEATURED TODAY
                </Text>
              </View>

              <Text style={[styles.featuredTitle, { color: isBreathe ? '#ffffff' : textColor }]}>{featuredExercise.name}</Text>
              <Text style={[styles.featuredExplanation, { color: isBreathe ? 'rgba(255,255,255,0.8)' : (isDark ? '#c4b5fd' : '#5b4b8f') }]} numberOfLines={2}>
                {featuredExercise.explanation}
              </Text>

              <View style={styles.featuredBottomRow}>
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, { backgroundColor: isBreathe ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.12)' }]}>
                    <Feather name="clock" size={11} color={isBreathe ? '#ffffff' : (isDark ? '#ffffff' : textColor)} style={{ marginRight: 4 }} />
                    <Text style={[styles.badgeText, { color: isBreathe ? '#ffffff' : (isDark ? '#ffffff' : textColor) }]}>{featuredExercise.duration}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: isBreathe ? 'rgba(255,255,255,0.12)' : stylesObj.bg }]}>
                    <Text style={[styles.badgeText, { color: isBreathe ? '#ffffff' : stylesObj.color }]}>{isBreathe ? 'Breath' : stylesObj.label}</Text>
                  </View>
                </View>

                <View
                  style={[styles.featuredArrowBtn, { backgroundColor: isBreathe ? 'rgba(255, 255, 255, 0.15)' : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(124, 58, 237, 0.12)') }]}
                >
                  <Feather name="chevron-right" size={18} color={isBreathe ? '#ffffff' : (isDark ? '#ffffff' : accentPurple)} />
                </View>
              </View>
            </View>
          </Pressable>
        );
      })()}

      {/* ALL EXERCISES Grid Heading */}
      <Text style={[styles.sectionHeading, { color: textMutedColor }]}>ALL EXERCISES</Text>

      {/* 2-Column Grid */}
      {isLoading ? (
        <ActivityIndicator size="small" color={accentPurple} style={{ marginVertical: 40 }} />
      ) : (
        <View style={styles.gridContainer}>
          {gridExercises.map((ex) => {
            const stylesObj = categoryStyles[ex.category as keyof typeof categoryStyles] || categoryStyles.general;
            return (
              <Pressable
                key={ex.id}
                onPress={() => openDetails(ex)}
                style={({ pressed }) => [
                  styles.gridCard,
                  {
                    backgroundColor: cardBgColor,
                    borderColor: cardBorderColor,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                {/* Top Row: Icon + Category Badge */}
                <View style={styles.gridCardHeader}>
                  <View style={[styles.gridIconCircle, { backgroundColor: stylesObj.bg }]}>
                    <Feather name={stylesObj.icon} size={15} color={stylesObj.color} />
                  </View>
                  <View style={[styles.gridCategoryBadge, { backgroundColor: stylesObj.bg }]}>
                    <Text style={[styles.gridCategoryText, { color: stylesObj.color }]}>
                      {stylesObj.label}
                    </Text>
                  </View>
                </View>

                {/* Middle: Title */}
                <Text style={[styles.gridCardTitle, { color: textColor }]} numberOfLines={2}>
                  {ex.name}
                </Text>

                {/* Bottom: Duration */}
                <View style={styles.gridCardFooter}>
                  <Feather name="clock" size={11} color={textMutedColor} style={{ marginRight: 4 }} />
                  <Text style={[styles.gridCardDuration, { color: textMutedColor }]}>
                    {ex.duration}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* EXERCISE DETAIL POPUP MODAL */}
      <Modal visible={detailModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          {selectedExercise && (() => {
            const stylesObj = categoryStyles[selectedExercise.category as keyof typeof categoryStyles] || categoryStyles.general;
            const exSteps = checkedSteps[selectedExercise.id] || {};
            return (
              <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: cardBorderColor }]}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderLeft}>
                    <View style={[styles.gridIconCircle, { backgroundColor: stylesObj.bg }]}>
                      <Feather name={stylesObj.icon} size={16} color={stylesObj.color} />
                    </View>
                    <Text style={[styles.modalTitle, { color: textColor }]} numberOfLines={1}>
                      {selectedExercise.name}
                    </Text>
                  </View>
                  <Pressable onPress={() => setDetailModalVisible(false)} style={styles.closeBtn}>
                    <Feather name="x" size={20} color={textMutedColor} />
                  </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.modalScroll}>
                  {/* Category + Duration Badges */}
                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, { backgroundColor: 'rgba(124, 58, 237, 0.08)' }]}>
                      <Text style={[styles.badgeText, { color: accentPurple }]}>Category: {stylesObj.label}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: 'rgba(162, 203, 253, 0.08)' }]}>
                      <Text style={[styles.badgeText, { color: '#3b82f6' }]}>Time: {selectedExercise.duration}</Text>
                    </View>
                  </View>

                  <Text style={[styles.explanationText, { color: textColor }]}>
                    {selectedExercise.explanation}
                  </Text>

                  {/* Interactive Timer */}
                  <ExerciseTimer
                    duration={selectedExercise.duration}
                    hideStartButton={isBreathingExercise(selectedExercise)}
                    onChangeDuration={setSelectedDuration}
                  />

                  {/* Checklist */}
                  <View style={styles.stepsList}>
                    <Text style={[styles.sectionHeading, { color: textMutedColor, marginTop: 4, marginBottom: 4 }]}>
                      INSTRUCTIONS CHECKLIST
                    </Text>
                    {selectedExercise.steps.map((step, index) => {
                      const isChecked = !!exSteps[index];
                      return (
                        <Pressable
                          key={index}
                          onPress={() => toggleStep(selectedExercise.id, index)}
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
                </ScrollView>

                {/* Card Controls */}
                <View style={styles.modalActionsRow}>
                  {selectedExercise.custom ? (
                    <Pressable
                      onPress={() => handleOpenEdit(selectedExercise)}
                      style={[styles.actionBtn, { borderColor: cardBorderColor }]}
                    >
                      <Feather name="edit-2" size={14} color={accentPurple} />
                      <Text style={[styles.actionBtnText, { color: accentPurple }]}>Edit</Text>
                    </Pressable>
                  ) : null}
                  {selectedExercise.custom ? (
                    <Pressable
                      onPress={() => handleDelete(selectedExercise.id)}
                      style={[styles.actionBtn, { borderColor: cardBorderColor }]}
                    >
                      <Feather name="trash-2" size={14} color="#f43f5e" />
                      <Text style={[styles.actionBtnText, { color: '#f43f5e' }]}>Delete</Text>
                    </Pressable>
                  ) : null}
                  {isBreathingExercise(selectedExercise) ? (
                    <Pressable
                      onPress={() => {
                        setDetailModalVisible(false);
                        handleStartBreathing(selectedExercise);
                      }}
                      style={[styles.actionBtn, { backgroundColor: accentPurple, borderColor: accentPurple, flex: 1.5 }]}
                    >
                      <Feather name="play" size={14} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>Start Session</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => setDetailModalVisible(false)}
                    style={[
                      styles.actionBtn,
                      isBreathingExercise(selectedExercise)
                        ? { borderColor: cardBorderColor }
                        : { backgroundColor: accentPurple, borderColor: accentPurple }
                    ]}
                  >
                    <Text style={[
                      styles.actionBtnText,
                      { color: isBreathingExercise(selectedExercise) ? textColor : '#ffffff' }
                    ]}>
                      Close
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })()}
        </View>
      </Modal>

      {/* ADD / EDIT CUSTOM EXERCISE FORM MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.formModalCard, { backgroundColor: colors.surface, borderColor: cardBorderColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                {exerciseId ? 'Edit Custom Exercise' : 'Add Custom Exercise'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color={textMutedColor} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <InputField label="Exercise Name" value={name} onChangeText={setName} placeholder="e.g. Box Breathing" />
              
              <InputField label="Duration (e.g. 5 mins)" value={duration} onChangeText={setDuration} placeholder="5 mins" />

              <InputField
                label="Clinical Explanation / Purpose"
                value={explanation}
                onChangeText={setExplanation}
                placeholder="Explain why this exercise is helpful"
                multiline
                numberOfLines={3}
                style={{ height: 80 }}
              />

              <View style={styles.pickerWrapper}>
                <Text style={[styles.pickerLabel, { color: textMutedColor }]}>Category</Text>
                <View style={styles.categoryRow}>
                  {['sleep', 'mindfulness', 'activity', 'general'].map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.catBadge,
                        { borderColor: cardBorderColor },
                        category === cat && { backgroundColor: accentPurple, borderColor: accentPurple },
                      ]}
                    >
                      <Text style={[styles.catBadgeText, { color: category === cat ? '#fff' : textColor }]}>
                        {categoryStyles[cat as keyof typeof categoryStyles]?.label || cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Dynamic Steps Block */}
              <View style={styles.stepsFormBlock}>
                <Text style={[styles.stepsLabel, { color: textMutedColor }]}>Steps Guide</Text>
                {steps.map((step, index) => (
                  <View key={index} style={styles.stepInputRow}>
                    <Text style={[styles.stepNum, { color: textColor }]}>{index + 1}.</Text>
                    <TextInput
                      value={step}
                      onChangeText={(text) => handleStepChange(text, index)}
                      placeholder="Enter instruction step"
                      placeholderTextColor={textMutedColor}
                      style={[
                        styles.stepInput,
                        {
                          color: textColor,
                          borderColor: cardBorderColor,
                          backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                        },
                      ]}
                    />
                    <Pressable onPress={() => handleRemoveStep(index)} style={styles.removeStepBtn}>
                      <Feather name="minus-circle" size={18} color="#f43f5e" />
                    </Pressable>
                  </View>
                ))}
                <Pressable onPress={handleAddStep} style={[styles.addStepBtn, { borderColor: cardBorderColor }]}>
                  <Feather name="plus" size={14} color={textColor} />
                  <Text style={[styles.addStepText, { color: textColor }]}>Add Step</Text>
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <SecondaryButton label="Cancel" onPress={() => setModalVisible(false)} />
              <PrimaryButton label={exerciseId ? 'Save Changes' : 'Create Exercise'} onPress={handleSubmit} />
            </View>
          </View>
        </View>
      </Modal>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  featuredContent: {
    padding: spacing.md,
    gap: 10,
  },
  featuredTag: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  featuredTagText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  featuredExplanation: {
    fontSize: 13,
    lineHeight: 18,
  },
  featuredBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  featuredArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: -4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48.2%', // perfect 2-column grid layout
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 10,
  },
  gridCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCategoryBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  gridCategoryText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  gridCardTitle: {
    fontSize: 14.5,
    fontWeight: 'bold',
    lineHeight: 19,
  },
  gridCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridCardDuration: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: 12,
  },
  formModalCard: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    gap: 14,
    paddingVertical: 8,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 19,
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
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  pickerWrapper: {
    gap: 6,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catBadge: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  stepsFormBlock: {
    gap: 8,
  },
  stepsLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  stepInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepNum: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  stepInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    minHeight: 40,
  },
  removeStepBtn: {
    padding: 4,
  },
  addStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 10,
    borderStyle: 'dashed',
  },
  addStepText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
    padding: 4,
    marginVertical: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
