import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/theme/colors';
import { radius } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { RiskLevel } from '@/src/types/wellness';

interface StatusChipProps {
  label: string;
  tone?: RiskLevel | 'neutral' | 'active';
}

const toneStyles = {
  low: { bg: 'rgba(78, 222, 163, 0.15)', text: colors.tertiary },
  medium: { bg: 'rgba(76, 215, 246, 0.15)', text: colors.secondary },
  high: { bg: 'rgba(255, 180, 171, 0.15)', text: colors.error },
  neutral: { bg: 'rgba(207, 194, 214, 0.12)', text: colors.onSurfaceVariant },
  active: { bg: 'rgba(168, 85, 247, 0.15)', text: colors.primary },
};

export function StatusChip({ label, tone = 'neutral' }: StatusChipProps) {
  const palette = toneStyles[tone];
  return (
    <View style={[styles.chip, { backgroundColor: palette.bg }]}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  label: {
    ...typography.labelCaps,
    fontSize: 11,
  },
});
