import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { trackKeyPress } from '@/src/services/realAnalytics';
import { useTheme } from '@/src/hooks/useTheme';
import { radius, spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function InputField({ label, error, style, ...props }: InputFieldProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.onSurfaceVariant}
        style={[
          styles.input,
          {
            color: colors.onSurface,
            backgroundColor: colors.backgroundDeep,
            borderColor: colors.outline,
          },
          style,
        ]}
        onKeyPress={(e) => trackKeyPress(e.nativeEvent.key)}
        {...props}
      />
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    ...typography.labelCaps,
  },
  input: {
    ...typography.bodyMd,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  error: {
    ...typography.bodyMd,
    fontSize: 13,
  },
});
