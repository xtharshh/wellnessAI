import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/src/hooks/useTheme';
import { radius, spacing } from '@/src/theme/spacing';
import { fonts } from '@/src/theme/typography';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function PrimaryButton({ label, onPress, loading, disabled }: PrimaryButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      style={[styles.button, { backgroundColor: colors.primary }, (disabled || loading) && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}>
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#fff',
  },
});
