import React, { useState, useEffect } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@/src/hooks/useTheme';
import { radius, spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

interface MeditationTimerModalProps {
  visible: boolean;
  onClose: () => void;
}

const DURATION_OPTIONS = [1, 5, 10, 15, 20];
const SOUND_OPTIONS = ['None', 'Rainfall', 'Forest Birds', 'Ocean Waves', 'Deep Space'];
const MEDITATION_GUIDES = [
  "Focus on the rising and falling of your chest.",
  "Observe your thoughts like clouds drifting in the sky.",
  "Inhale peace, exhale tension.",
  "Relax your jaw, your forehead, and your shoulders.",
  "Be fully present in this quiet moment."
];

export function MeditationTimerModal({ visible, onClose }: MeditationTimerModalProps) {
  const { colors, isDark } = useTheme();
  const [duration, setDuration] = useState(5); // mins
  const [sound, setSound] = useState('None');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [guideIndex, setGuideIndex] = useState(0);

  // Initialize timer
  useEffect(() => {
    if (!isActive) {
      setSecondsLeft(duration * 60);
    }
  }, [duration, isActive]);

  // Timer Countdown Logic
  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => s - 1);
        
        // Rotate guide text every 20 seconds
        if (secondsLeft % 20 === 0) {
          setGuideIndex((idx) => (idx + 1) % MEDITATION_GUIDES.length);
        }
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      setIsActive(false);
      Alert.alert('Meditation Complete', '🧘 Your mind is clear. Return to your day with peace.');
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setSecondsLeft(duration * 60);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Feather name="anchor" size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.onSurface }]}>Meditation Timer</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <View style={styles.content}>
            {/* Guide Anchor Text */}
            <Text style={[styles.guideText, { color: colors.primary }]}>
              {isActive ? MEDITATION_GUIDES[guideIndex] : "Select your session duration and begin."}
            </Text>

            {/* Main Timer Display */}
            <Text style={[styles.timerDisplay, { color: colors.onSurface }]}>
              {formatTime(secondsLeft)}
            </Text>

            {/* Controls */}
            <View style={styles.controlsRow}>
              <Pressable
                style={[styles.controlBtn, { backgroundColor: isActive ? colors.error : colors.primaryAccent }]}
                onPress={handleToggle}
              >
                <Feather name={isActive ? "pause" : "play"} size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.controlBtnText}>{isActive ? "Pause" : "Start"}</Text>
              </Pressable>
              
              <Pressable
                style={[styles.resetBtn, { borderColor: colors.outline }]}
                onPress={handleReset}
              >
                <Feather name="refresh-cw" size={14} color={colors.onSurface} style={{ marginRight: 6 }} />
                <Text style={[styles.resetBtnText, { color: colors.onSurface }]}>Reset</Text>
              </Pressable>
            </View>

            {/* Session Settings - Only visible when timer is stopped */}
            {!isActive && (
              <View style={styles.settingsContainer}>
                {/* Duration Picker */}
                <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>Session Length</Text>
                <View style={styles.durationRow}>
                  {DURATION_OPTIONS.map((min) => (
                    <Pressable
                      key={min}
                      onPress={() => setDuration(min)}
                      style={[
                        styles.durationBtn,
                        { borderColor: colors.outline },
                        duration === min && { backgroundColor: colors.primaryAccent, borderColor: colors.primaryAccent },
                      ]}
                    >
                      <Text style={[styles.durationText, { color: duration === min ? '#fff' : colors.onSurface }]}>
                        {min}m
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Sound Ambient Selector */}
                <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant, marginTop: 12 }]}>Ambient Audio</Text>
                <View style={styles.soundRow}>
                  {SOUND_OPTIONS.map((snd) => (
                    <Pressable
                      key={snd}
                      onPress={() => setSound(snd)}
                      style={[
                        styles.soundBtn,
                        { borderColor: colors.outline },
                        sound === snd && { backgroundColor: colors.primary + '22', borderColor: colors.primary },
                      ]}
                    >
                      <Text style={[styles.soundText, { color: colors.onSurface, fontWeight: sound === snd ? 'bold' : 'normal' }]}>
                        {snd}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Instructions */}
            <View style={[styles.tipBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: colors.outline }]}>
              <Feather name="info" size={14} color={colors.primary} />
              <Text style={[styles.tipText, { color: colors.onSurfaceVariant }]}>
                Meditation stabilizes autonomic stress, decreasing the bio-typing tension signals monitored by MindTrace.
              </Text>
            </View>
          </View>
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
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: 16,
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
  content: {
    alignItems: 'center',
    gap: 20,
    paddingVertical: 10,
  },
  guideText: {
    fontSize: 14.5,
    fontWeight: '600',
    textAlign: 'center',
    height: 44,
    paddingHorizontal: 16,
  },
  timerDisplay: {
    ...typography.dataMono,
    fontSize: 64,
    fontWeight: '800',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  controlBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  settingsContainer: {
    width: '100%',
    gap: 8,
    paddingTop: 10,
  },
  sectionTitle: {
    ...typography.labelCaps,
    fontSize: 11,
    letterSpacing: 0.5,
    textAlign: 'left',
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  durationBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 8,
    alignItems: 'center',
  },
  durationText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  soundRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  soundBtn: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  soundText: {
    fontSize: 11.5,
  },
  tipBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 10,
    width: '100%',
  },
  tipText: {
    fontSize: 11.5,
    lineHeight: 16,
    flex: 1,
  },
});
