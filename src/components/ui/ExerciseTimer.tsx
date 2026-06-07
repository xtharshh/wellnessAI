import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import { useTheme } from '@/src/hooks/useTheme';
import { radius, spacing } from '@/src/theme/spacing';
import { fonts } from '@/src/theme/typography';

interface ExerciseTimerProps {
  duration: string;
  onComplete?: () => void;
  hideStartButton?: boolean;
  onChangeDuration?: (seconds: number) => void;
}

export function ExerciseTimer({
  duration,
  onComplete,
  hideStartButton = false,
  onChangeDuration,
}: ExerciseTimerProps) {
  const { colors } = useTheme();
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const num = parseInt(duration, 10);
    setSeconds(isNaN(num) ? 180 : num * 60);
  }, [duration]);

  useEffect(() => {
    onChangeDuration?.(seconds);
  }, [seconds, onChangeDuration]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (seconds === 0 && isActive) {
      setIsActive(false);
      Alert.alert('Session Complete!', 'Great job completing your exercise!');
      onComplete?.();
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, onComplete]);

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
    <View style={[styles.timerWrapper, { borderTopColor: colors.outline }]}>
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

      {!hideStartButton && (
        <Pressable
          style={[
            styles.timerButton,
            { backgroundColor: isActive ? colors.error : colors.primaryAccent }
          ]}
          onPress={() => setIsActive(!isActive)}
        >
          <Text style={styles.timerButtonText}>{isActive ? 'Pause' : 'Start'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  timerWrapper: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  timerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  adjustButton: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timerText: {
    fontSize: 22,
    fontWeight: 'bold',
    minWidth: 64,
    textAlign: 'center',
    fontFamily: fonts.mono,
  },
  timerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
