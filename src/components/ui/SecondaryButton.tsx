import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/src/hooks/useTheme';
import { radius, spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
}

export function SecondaryButton({ label, onPress }: SecondaryButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable style={[styles.button, { borderColor: colors.secondaryAccent }]} onPress={onPress}>
      <Text style={[styles.label, { color: colors.secondary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  label: {
    ...typography.bodyMd,
    fontFamily: typography.titleMd.fontFamily,
  },
});
