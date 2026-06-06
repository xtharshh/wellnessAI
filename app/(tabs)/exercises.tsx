import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { InputField } from '@/src/components/ui/InputField';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SecondaryButton } from '@/src/components/ui/SecondaryButton';
import { StatusChip } from '@/src/components/ui/StatusChip';
import { useExercises } from '@/src/hooks/useExercises';
import { useTheme } from '@/src/hooks/useTheme';
import { typography } from '@/src/theme/typography';
import { radius, spacing } from '@/src/theme/spacing';
import { Exercise } from '@/src/types/wellness';

// Customizable Exercise Timer Component
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
      Alert.alert('Session Complete!', 'Great job completing your exercise!');
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
        style={[styles.timerButton, { backgroundColor: isActive ? colors.error : colors.primaryAccent }]}
        onPress={() => setIsActive(!isActive)}
      >
        <Text style={styles.timerButtonText}>{isActive ? 'Pause' : 'Start'}</Text>
      </Pressable>
    </View>
  );
}

export default function ExercisesScreen() {
  const { colors, isDark } = useTheme();
  const { data: exercises, isLoading, add, edit, remove } = useExercises();

  // Screen UI State
  const [activeTab, setActiveTab] = useState<'ai' | 'custom'>('ai');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, Record<number, boolean>>>({});

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('5 mins');
  const [explanation, setExplanation] = useState('');
  const [category, setCategory] = useState('general');
  const [steps, setSteps] = useState<string[]>(['']);

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
            setActiveTab('custom');
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
        onPress: () => remove.mutate(id),
      },
    ]);
  };

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

  const filteredExercises = (exercises || []).filter((e) =>
    activeTab === 'custom' ? e.custom : !e.custom
  );

  return (
    <ScreenContainer>
      <Text style={[styles.eyebrow, { color: colors.secondary }]}>Wellness Practices</Text>
      <Text style={[styles.title, { color: colors.onSurface }]}>Exercises Library</Text>
      <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
        Repeat suggested exercises or customize your own wellness activities.
      </Text>

      {/* Segmented Controls Toggle */}
      <View style={[styles.tabContainer, { backgroundColor: colors.backgroundDeep, borderColor: colors.outline }]}>
        <Pressable
          onPress={() => setActiveTab('ai')}
          style={[styles.tab, activeTab === 'ai' && [styles.tabActive, { backgroundColor: colors.surface }]]}
        >
          <Text style={[styles.tabText, { color: activeTab === 'ai' ? colors.onSurface : colors.onSurfaceVariant }]}>
            AI Suggested
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('custom')}
          style={[styles.tab, activeTab === 'custom' && [styles.tabActive, { backgroundColor: colors.surface }]]}
        >
          <Text style={[styles.tabText, { color: activeTab === 'custom' ? colors.onSurface : colors.onSurfaceVariant }]}>
            My Custom
          </Text>
        </Pressable>
      </View>

      <PrimaryButton label="Create Custom Exercise" onPress={handleOpenAdd} />

      {isLoading && <ActivityIndicator size="small" color={colors.primaryAccent} style={{ marginVertical: 40 }} />}

      {!isLoading && filteredExercises.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            No exercises found in this section.
          </Text>
        </View>
      ) : null}

      {!isLoading &&
        filteredExercises.map((ex) => {
          const isExpanded = expandedId === ex.id;
          const exSteps = checkedSteps[ex.id] || {};

          return (
            <GlassCard key={ex.id} accent={ex.category === 'mindfulness' || ex.category === 'sleep' ? 'primary' : 'secondary'}>
              <Pressable onPress={() => setExpandedId(isExpanded ? null : ex.id)} style={styles.cardHeader}>
                <View style={styles.titleBlock}>
                  <View style={styles.metaRow}>
                    <StatusChip label={ex.category} tone={ex.category === 'mindfulness' ? 'active' : ex.category === 'sleep' ? 'medium' : ex.category === 'activity' ? 'low' : 'neutral'} />
                    <View style={styles.durationRow}>
                      <Feather name="clock" size={12} color={colors.secondary} />
                      <Text style={[styles.durationText, { color: colors.secondary }]}> {ex.duration}</Text>
                    </View>
                  </View>
                  <Text style={[styles.recTitle, { color: colors.onSurface }]}>{ex.name}</Text>
                </View>
                <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.onSurfaceVariant} />
              </Pressable>

              {isExpanded && (
                <View style={[styles.expandedContent, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                  <Text style={[styles.explanationText, { color: colors.onSurfaceVariant }]}>{ex.explanation}</Text>

                  {/* Checklist */}
                  <View style={styles.stepsList}>
                    {ex.steps.map((step, index) => {
                      const isChecked = !!exSteps[index];
                      return (
                        <Pressable
                          key={index}
                          onPress={() => toggleStep(ex.id, index)}
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

                  {/* Interactive Customizable Timer */}
                  <ExerciseTimer duration={ex.duration} />

                  {/* Card Controls */}
                  <View style={styles.cardActions}>
                    {ex.custom ? (
                      <Pressable onPress={() => handleOpenEdit(ex)} style={[styles.actionBtn, { borderColor: colors.outline }]}>
                        <Feather name="edit-2" size={14} color={colors.primary} />
                        <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
                      </Pressable>
                    ) : null}
                    <Pressable onPress={() => handleDelete(ex.id)} style={[styles.actionBtn, { borderColor: colors.outline }]}>
                      <Feather name="trash-2" size={14} color={colors.error} />
                      <Text style={[styles.actionBtnText, { color: colors.error }]}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </GlassCard>
          );
        })}

      {/* Add / Edit Modal Form */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                {exerciseId ? 'Edit Custom Exercise' : 'Add Custom Exercise'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.onSurfaceVariant} />
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
                <Text style={[styles.pickerLabel, { color: colors.onSurfaceVariant }]}>Category</Text>
                <View style={styles.categoryRow}>
                  {['sleep', 'mindfulness', 'activity', 'general'].map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.catBadge,
                        { borderColor: colors.outline },
                        category === cat && { backgroundColor: colors.primaryAccent, borderColor: colors.primaryAccent },
                      ]}
                    >
                      <Text style={[styles.catBadgeText, { color: category === cat ? '#fff' : colors.onSurface }]}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Dynamic Steps Block */}
              <View style={styles.stepsFormBlock}>
                <Text style={[styles.stepsLabel, { color: colors.onSurfaceVariant }]}>Steps Guide</Text>
                {steps.map((step, index) => (
                  <View key={index} style={styles.stepInputRow}>
                    <Text style={[styles.stepNum, { color: colors.secondary }]}>{index + 1}.</Text>
                    <TextInput
                      value={step}
                      onChangeText={(text) => handleStepChange(text, index)}
                      placeholder="Enter instruction step"
                      placeholderTextColor={colors.onSurfaceVariant}
                      style={[
                        styles.stepInput,
                        {
                          color: colors.onSurface,
                          borderColor: colors.outline,
                          backgroundColor: colors.backgroundDeep,
                        },
                      ]}
                    />
                    <Pressable onPress={() => handleRemoveStep(index)} style={styles.removeStepBtn}>
                      <Feather name="minus-circle" size={18} color={colors.error} />
                    </Pressable>
                  </View>
                ))}
                <Pressable onPress={handleAddStep} style={[styles.addStepBtn, { borderColor: colors.outline }]}>
                  <Feather name="plus" size={14} color={colors.primary} />
                  <Text style={[styles.addStepText, { color: colors.primary }]}>Add Step</Text>
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...typography.labelCaps,
    marginTop: 12,
  },
  title: {
    ...typography.headlineLgMobile,
  },
  subtitle: {
    ...typography.bodyMd,
    marginTop: -8,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 4,
    marginVertical: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.bodyMd,
    fontSize: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleBlock: {
    gap: 4,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    ...typography.dataMono,
    fontSize: 12,
  },
  recTitle: {
    ...typography.titleMd,
    fontSize: 16,
    fontWeight: 'bold',
  },
  expandedContent: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    gap: 12,
  },
  explanationText: {
    ...typography.bodyMd,
    fontSize: 13,
    lineHeight: 18,
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
  timerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
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
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    gap: 16,
    paddingVertical: 8,
  },
  pickerWrapper: {
    gap: 6,
  },
  pickerLabel: {
    ...typography.labelCaps,
    fontSize: 11,
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
    textTransform: 'uppercase',
  },
  stepsFormBlock: {
    gap: 8,
  },
  stepsLabel: {
    ...typography.labelCaps,
    fontSize: 11,
  },
  stepInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepNum: {
    ...typography.dataMono,
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
});
