import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { useTheme } from '@/src/hooks/useTheme';
import { typography } from '@/src/theme/typography';
import { radius, spacing } from '@/src/theme/spacing';

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

export function MetricWidget({
  title,
  value,
  unit,
  trend,
  accent = 'primary',
  icon,
  onPress,
}: MetricWidgetProps) {
  const { colors, isDark } = useTheme();

  const circleBgs = {
    primary: isDark ? 'rgba(162, 203, 253, 0.18)' : 'rgba(162, 203, 253, 0.35)',
    secondary: isDark ? 'rgba(247, 190, 233, 0.18)' : 'rgba(247, 190, 233, 0.35)',
    tertiary: isDark ? 'rgba(255, 220, 98, 0.18)' : 'rgba(255, 220, 98, 0.35)',
  };

  const iconColors = {
    primary: isDark ? '#a2cbfd' : '#3b82f6',
    secondary: isDark ? '#f7bee9' : '#ec4899',
    tertiary: isDark ? '#ffdc62' : '#eab308',
  };

  const trendLabel =
    trend === undefined ? null : `${trend > 0 ? '↑' : '↓'} ${Math.abs(trend)}% vs last week`;
  const trendColor =
    trend === undefined ? colors.onSurfaceVariant : trend >= 0 ? colors.riskLow : colors.error;

  const card = (
    <GlassCard accent={accent} style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: circleBgs[accent] }]}>
          <Feather name={(icon || 'activity') as any} size={20} color={iconColors[accent]} />
        </View>
        <View style={styles.titleCol}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.onSurfaceVariant }]}>
            {title}
          </Text>
          {trendLabel ? (
            <Text style={[styles.trend, { color: trendColor }]}>{trendLabel}</Text>
          ) : (
            <Text style={[styles.trend, { color: colors.onSurfaceVariant }]}>Steady state</Text>
          )}
        </View>
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: colors.onSurface }]}>
          {value}
          {unit ? <Text style={[styles.unit, { color: colors.onSurfaceVariant }]}> {unit}</Text> : null}
        </Text>
      </View>
    </GlassCard>
  );

  if (!onPress) return card;
  return <Pressable onPress={onPress} style={styles.pressable}>{card}</Pressable>;
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  card: {
    borderRadius: radius.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  titleCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.labelCaps,
    letterSpacing: 0.2,
    fontSize: 13,
  },
  trend: {
    fontFamily: typography.dataMono.fontFamily,
    fontSize: 11,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  value: {
    ...typography.headlineLgMobile,
    fontSize: 26,
    fontWeight: '700',
  },
  unit: {
    ...typography.bodyMd,
    fontSize: 14,
    fontWeight: '400',
  },
});
