import React, { useState } from 'react';
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
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useJournals } from '@/src/hooks/useJournals';
import { useTheme } from '@/src/hooks/useTheme';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { SecondaryButton } from '@/src/components/ui/SecondaryButton';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { radius, spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

interface JournalModalProps {
  visible: boolean;
  onClose: () => void;
}

const MOOD_OPTIONS = [
  { tag: 'Calm', score: 80, emoji: '😌', color: '#a2cbfd' },
  { tag: 'Happy', score: 95, emoji: '😊', color: '#ffb3d9' },
  { tag: 'Focused', score: 85, emoji: '🎯', color: '#6ee7b7' },
  { tag: 'Stressed', score: 40, emoji: '😰', color: '#b59cff' },
  { tag: 'Exhausted', score: 25, emoji: '🥱', color: '#fdb5a2' },
  { tag: 'Anxious', score: 35, emoji: '🥺', color: '#fca5a5' },
];

export function JournalModal({ visible, onClose }: JournalModalProps) {
  const { colors, isDark } = useTheme();
  const { data: entries, createEntry, deleteEntry, isLoading } = useJournals();

  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState(MOOD_OPTIONS[0]);

  const handleSave = () => {
    if (!content.trim()) {
      Alert.alert('Empty Content', 'Please write something in your journal before saving.');
      return;
    }

    createEntry.mutate(
      {
        content: content.trim(),
        moodScore: selectedMood.score,
        moodTag: selectedMood.tag,
      },
      {
        onSuccess: () => {
          setContent('');
          Alert.alert('Journal Saved', 'Your mindful entry has been recorded.');
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this journal entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteEntry.mutate(id),
      },
    ]);
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Feather name="book-open" size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.onSurface }]}>Mindful Journal</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Input field */}
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>How are you feeling right now?</Text>
            
            <View style={styles.moodRow}>
              {MOOD_OPTIONS.map((mood) => {
                const isActive = selectedMood.tag === mood.tag;
                return (
                  <Pressable
                    key={mood.tag}
                    onPress={() => setSelectedMood(mood)}
                    style={[
                      styles.moodPill,
                      { borderColor: colors.outline },
                      isActive && { backgroundColor: mood.color + '22', borderColor: mood.color },
                    ]}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text style={[styles.moodLabel, { color: colors.onSurface }, isActive && { fontWeight: 'bold' }]}>
                      {mood.tag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Jot down your thoughts, reflections, or how your screen time is making you feel..."
              placeholderTextColor={colors.onSurfaceVariant}
              multiline
              numberOfLines={6}
              style={[
                styles.input,
                {
                  color: colors.onSurface,
                  backgroundColor: colors.backgroundDeep,
                  borderColor: colors.outline,
                },
              ]}
            />

            <PrimaryButton
              label={createEntry.isPending ? 'Saving Entry...' : 'Save Journal Entry'}
              onPress={handleSave}
              loading={createEntry.isPending}
            />

            {/* List of Previous Entries */}
            <Text style={[styles.historyTitle, { color: colors.onSurface, borderTopColor: colors.outline }]}>
              Journal History
            </Text>

            {isLoading && <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />}

            {!isLoading && entries?.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                No journal entries logged yet. Write your first entry above!
              </Text>
            ) : null}

            {!isLoading &&
              entries?.map((entry) => (
                <GlassCard key={entry.id} accent="secondary" style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryMeta}>
                      <Text style={styles.entryEmoji}>
                        {MOOD_OPTIONS.find((m) => m.tag === entry.moodTag)?.emoji || '📝'}
                      </Text>
                      <View>
                        <Text style={[styles.entryMood, { color: colors.onSurface }]}>{entry.moodTag}</Text>
                        <Text style={[styles.entryDate, { color: colors.onSurfaceVariant }]}>
                          {formatDate(entry.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <Pressable onPress={() => handleDelete(entry.id)} style={styles.trashBtn}>
                      <Feather name="trash-2" size={14} color={colors.error} />
                    </Pressable>
                  </View>
                  <Text style={[styles.entryContent, { color: colors.onSurface }]}>{entry.content}</Text>
                </GlassCard>
              ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalContainer: {
    width: '100%',
    height: '85%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    gap: 16,
    paddingVertical: 14,
  },
  sectionTitle: {
    ...typography.labelCaps,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  moodEmoji: {
    fontSize: 14,
  },
  moodLabel: {
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyText: {
    ...typography.bodyMd,
    textAlign: 'center',
    marginVertical: 16,
  },
  entryCard: {
    padding: 12,
    gap: 8,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  entryEmoji: {
    fontSize: 22,
  },
  entryMood: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  entryDate: {
    fontSize: 10,
    fontFamily: typography.dataMono.fontFamily,
  },
  trashBtn: {
    padding: 6,
  },
  entryContent: {
    ...typography.bodyMd,
    fontSize: 13,
    lineHeight: 18,
  },
});
