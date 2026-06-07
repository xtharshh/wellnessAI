import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/src/hooks/useTheme';
import { radius, spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  tone?: 'default' | 'error';
}

export function SecondaryButton({ label, onPress, tone = 'default' }: SecondaryButtonProps) {
  const { colors } = useTheme();

  const borderColor = tone === 'error' ? colors.error : colors.outline;
  const textColor = tone === 'error' ? colors.error : colors.onSurface;

  return (
    <Pressable style={[styles.button, { borderColor }]} onPress={onPress}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  label: {
    ...typography.bodyMd,
    fontFamily: typography.titleMd.fontFamily,
  },
});
