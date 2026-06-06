import { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Vibration, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { useTheme } from '@/src/hooks/useTheme';
import { typography } from '@/src/theme/typography';
import { radius, spacing } from '@/src/theme/spacing';

export function BreathworkTimer() {
  const { colors, isDark } = useTheme();
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [cycle, setCycle] = useState(0);
  
  // Animated scale value
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase === 'idle') {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      return;
    }

    let nextPhase: 'idle' | 'inhale' | 'hold' | 'exhale' = 'idle';
    let duration = 0;
    let targetScale = 1.0;

    if (phase === 'inhale') {
      duration = 4000;
      targetScale = 1.8;
      setSecondsLeft(4);
      nextPhase = 'hold';
    } else if (phase === 'hold') {
      duration = 7000;
      targetScale = 1.8;
      setSecondsLeft(7);
      nextPhase = 'exhale';
    } else if (phase === 'exhale') {
      duration = 8000;
      targetScale = 1.0;
      setSecondsLeft(8);
      nextPhase = 'inhale';
    }

    // Physical haptic trigger on transition (safe fallback for all platforms)
    try {
      Vibration.vibrate(100);
    } catch (e) {
      // ignore web/simulator vibration limits
    }

    // Scale animation
    Animated.timing(scaleAnim, {
      toValue: targetScale,
      duration: duration,
      useNativeDriver: true,
    }).start();

    // Decrement seconds left every 1s
    const secondTimer = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    // Set transition timeout
    const transitionTimeout = setTimeout(() => {
      clearInterval(secondTimer);
      if (phase === 'exhale') {
        setCycle((c) => c + 1);
      }
      setPhase(nextPhase);
    }, duration);

    return () => {
      clearInterval(secondTimer);
      clearTimeout(transitionTimeout);
    };
  }, [phase, scaleAnim]);

  const handleStartStop = () => {
    if (phase !== 'idle') {
      setPhase('idle');
      setCycle(0);
      setSecondsLeft(0);
    } else {
      setPhase('inhale');
    }
  };

  const getPhaseText = () => {
    if (phase === 'idle') return '4-7-8 Breathing';
    if (phase === 'inhale') return 'Inhale Deeply...';
    if (phase === 'hold') return 'Hold Breath...';
    if (phase === 'exhale') return 'Exhale Slowly...';
    return '';
  };

  const getPhaseColor = () => {
    if (phase === 'inhale') return '#a2cbfd'; // Soft Blue
    if (phase === 'hold') return '#ffdc62'; // Warm Yellow
    if (phase === 'exhale') return '#f7bee9'; // Soft Pink
    return isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  };

  return (
    <GlassCard accent="primary" style={styles.breathCard}>
      <View style={styles.breathHeader}>
        <View style={[styles.breathIconCircle, { backgroundColor: isDark ? 'rgba(162,203,253,0.18)' : 'rgba(162,203,253,0.35)' }]}>
          <Feather name="wind" size={18} color={isDark ? '#a2cbfd' : '#3b82f6'} />
        </View>
        <Text style={[styles.breathTitle, { color: colors.onSurface }]}>Deep Breathwork Coach</Text>
      </View>
      <Text style={[styles.breathSubtitle, { color: colors.onSurfaceVariant }]}>
        Follow the animated guide to calm your nervous system and regulate typing-related tension.
      </Text>

      <View style={styles.breathingContainer}>
        {/* Animated circle track */}
        <View style={[styles.circleTrack, { borderColor: colors.outline }]}>
          <Animated.View
            style={[
              styles.breathingCircle,
              {
                backgroundColor: getPhaseColor(),
                transform: [{ scale: scaleAnim }],
              },
            ]}
          />
        </View>

        {/* Numeric overlay text */}
        <View style={styles.breathingTextOverlay}>
          <Text style={[styles.breathingPhaseText, { color: colors.onSurface }]}>{getPhaseText()}</Text>
          {phase !== 'idle' && (
            <Text style={[styles.breathingSecondsText, { color: colors.onSurface }]}>
              {secondsLeft}s
            </Text>
          )}
          {cycle > 0 && (
            <Text style={[styles.cycleCountText, { color: colors.primary }]}>
              {cycle} {cycle === 1 ? 'cycle' : 'cycles'} complete
            </Text>
          )}
        </View>
      </View>

      <Pressable
        style={[styles.breathStartBtn, { backgroundColor: phase === 'idle' ? '#0f172a' : colors.error }]}
        onPress={handleStartStop}
      >
        <Text style={styles.breathStartBtnText}>{phase === 'idle' ? 'Start Breathwork' : 'Stop'}</Text>
      </Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  breathCard: {
    padding: spacing.md,
    gap: 12,
  },
  breathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  breathIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  breathSubtitle: {
    ...typography.bodyMd,
    fontSize: 13,
    lineHeight: 18,
  },
  breathingContainer: {
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  circleTrack: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.85,
  },
  breathingTextOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  breathingPhaseText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  breathingSecondsText: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  cycleCountText: {
    fontSize: 11,
    fontFamily: typography.dataMono.fontFamily,
    textAlign: 'center',
    marginTop: 4,
  },
  breathStartBtn: {
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  breathStartBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
