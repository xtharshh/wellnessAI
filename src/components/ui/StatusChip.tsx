import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/src/hooks/useTheme';
import { radius } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { RiskLevel } from '@/src/types/wellness';

interface StatusChipProps {
  label: string;
  tone?: RiskLevel | 'neutral' | 'active';
}

export function StatusChip({ label, tone = 'neutral' }: StatusChipProps) {
  const { colors, isDark } = useTheme();

  const toneStyles = {
    low: { bg: isDark ? 'rgba(167, 243, 208, 0.15)' : 'rgba(16, 185, 129, 0.12)', text: colors.riskLow },
    medium: { bg: isDark ? 'rgba(162, 203, 253, 0.15)' : 'rgba(14, 165, 233, 0.12)', text: colors.riskMedium },
    high: { bg: isDark ? 'rgba(247, 190, 233, 0.15)' : 'rgba(244, 63, 94, 0.12)', text: colors.riskHigh },
    neutral: { bg: isDark ? 'rgba(207, 194, 214, 0.12)' : 'rgba(100, 116, 139, 0.1)', text: colors.onSurfaceVariant },
    active: { bg: isDark ? 'rgba(162, 203, 253, 0.15)' : 'rgba(90, 158, 250, 0.12)', text: colors.primary },
  };

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
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    ...typography.labelCaps,
    fontSize: 10,
    letterSpacing: 0.4,
  },
});
