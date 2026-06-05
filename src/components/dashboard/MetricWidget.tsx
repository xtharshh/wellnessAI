import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sparkline } from '@/src/components/charts/Sparkline';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

interface MetricWidgetProps {
  title: string;
  value: string;
  unit?: string;
  trend?: number;
  series?: number[];
  accent?: 'primary' | 'secondary' | 'tertiary';
  icon?: string;
  onPress?: () => void;
}

const accentColors = {
  primary: colors.primaryAccent,
  secondary: colors.secondaryAccent,
  tertiary: colors.tertiaryAccent,
};

export function MetricWidget({
  title,
  value,
  unit,
  trend,
  series = [],
  accent = 'primary',
  icon,
  onPress,
}: MetricWidgetProps) {
  const trendLabel =
    trend === undefined ? null : `${trend > 0 ? '+' : ''}${trend}% vs last week`;
  const trendColor =
    trend === undefined ? colors.onSurfaceVariant : trend >= 0 ? colors.tertiary : colors.error;

  const card = (
    <GlassCard accent={accent}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {icon ? `${icon} ` : ''}
          {title}
        </Text>
        {trendLabel ? <Text style={[styles.trend, { color: trendColor }]}>{trendLabel}</Text> : null}
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {series.length ? <Sparkline data={series} color={accentColors[accent]} /> : null}
    </GlassCard>
  );

  if (!onPress) return card;
  return <Pressable onPress={onPress}>{card}</Pressable>;
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    ...typography.labelCaps,
    color: colors.onSurfaceVariant,
  },
  trend: {
    ...typography.dataMono,
    fontSize: 12,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  value: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
  },
  unit: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
});
