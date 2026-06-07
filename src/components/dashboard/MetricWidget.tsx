import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/src/hooks/useTheme';
import { fonts } from '@/src/theme/typography';

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

// Custom SVG Sparkline Generator
function Sparkline({ data, color }: { data: number[]; color: string }) {
  let pointsArray = data;
  if (!pointsArray || pointsArray.length < 2) {
    // Standard mock trend fallback if empty
    pointsArray = [62, 65, 58, 70, 78, 74, 82];
  } else {
    // Take the last 7 items for the preview
    pointsArray = pointsArray.slice(-7);
  }

  const width = 64;
  const height = 20;
  const max = Math.max(...pointsArray);
  const min = Math.min(...pointsArray);
  const range = max - min === 0 ? 1 : max - min;

  const coords = pointsArray.map((val, idx) => {
    const x = (idx / (pointsArray.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2; // 2px padding top/bottom
    return `${x},${y}`;
  });

  const pathD = `M ${coords.join(' L ')}`;

  return (
    <Svg width={width} height={height}>
      <Path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MetricWidget({
  title,
  value,
  trend,
  series,
  accent = 'primary',
  icon,
  onPress,
}: MetricWidgetProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Base theme colors mapping
  const textColor = isDark ? '#f5f5f7' : '#1a1a2e';
  const textMuted = isDark ? '#8f8f9e' : '#6b6b7f';
  const policyLinkColor = isDark ? '#a78bfa' : '#6d28d9';

  // Config mapping based on metric types
  let iconName = icon || 'activity';
  let iconColor = isDark ? '#a2cbfd' : '#3b82f6';
  let iconBg = isDark ? 'rgba(162, 203, 253, 0.25)' : 'rgba(59, 130, 246, 0.12)';

  const normalizedTitle = title.toLowerCase();

  // Dynamic gradients & visual tokens — clean light style with subtle color tints
  let gradientColors = isDark ? ['#1e1435', '#0f081c'] : ['#f8f5ff', '#f1ecfc'];
  let accentGlow = isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(124, 58, 237, 0.06)';
  let cardBorder = isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(124, 58, 237, 0.1)';

  if (normalizedTitle.includes('mood')) {
    iconName = 'heart';
    iconColor = isDark ? '#c084fc' : '#7c3aed';
    iconBg = isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(124, 58, 237, 0.1)';
    gradientColors = isDark ? ['#1e1338', '#0c061a'] : ['#f7f3ff', '#eee6fc'];
    accentGlow = isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(139, 92, 246, 0.08)';
    cardBorder = isDark ? 'rgba(168, 85, 247, 0.18)' : 'rgba(139, 92, 246, 0.12)';
  } else if (normalizedTitle.includes('sleep')) {
    iconName = 'moon';
    iconColor = isDark ? '#60a5fa' : '#2563eb';
    iconBg = isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.1)';
    gradientColors = isDark ? ['#0e1a3d', '#050a1b'] : ['#f3f7ff', '#e8f0fe'];
    accentGlow = isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.07)';
    cardBorder = isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(59, 130, 246, 0.12)';
  } else if (normalizedTitle.includes('activity')) {
    iconName = 'activity';
    iconColor = isDark ? '#3de2b5' : '#059669';
    iconBg = isDark ? 'rgba(61, 226, 181, 0.2)' : 'rgba(5, 150, 105, 0.1)';
    gradientColors = isDark ? ['#06241b', '#020f0b'] : ['#f2fbf6', '#e4f7ec'];
    accentGlow = isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.07)';
    cardBorder = isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)';
  } else if (normalizedTitle.includes('stress')) {
    iconName = 'zap';
    iconColor = isDark ? '#ff6b6b' : '#e11d48';
    iconBg = isDark ? 'rgba(255, 107, 107, 0.2)' : 'rgba(225, 29, 72, 0.1)';
    gradientColors = isDark ? ['#290b0b', '#120303'] : ['#fff5f5', '#fee8e8'];
    accentGlow = isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.07)';
    cardBorder = isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(225, 29, 72, 0.12)';
  }

  // Trend logic
  let trendText = '';
  let trendColor = '#10b981';
  
  if (trend !== undefined && trend !== 0) {
    const isStress = normalizedTitle.includes('stress');
    const isGood = isStress ? trend < 0 : trend > 0;
    trendColor = isGood ? '#10b981' : '#ef4444';
    trendText = `${trend > 0 ? '▲' : '▼'} ${Math.abs(trend)}%`;
  }

  const content = (
    <View style={[styles.card, { borderColor: cardBorder }]}>
      {/* Background Gradient & Subtle Glow */}
      <View style={[StyleSheet.absoluteFillObject, { overflow: 'hidden', borderRadius: 18 }]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.glowingCircle, { backgroundColor: accentGlow }]} />
      </View>

      <View style={{ flex: 1, zIndex: 1 }}>
        {/* Top Row: Icon + Trend percentage */}
        <View style={styles.topRow}>
          <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
            <Feather name={iconName as any} size={18} color={iconColor} />
          </View>
          {trendText ? (
            <Text style={[styles.trendText, { color: trendColor }]}>{trendText}</Text>
          ) : null}
        </View>

        {/* Content Columns: Value & Title (left), Sparkline & Link (right) */}
        <View style={styles.contentRow}>
          <View style={styles.leftCol}>
            <Text style={[styles.valueText, { color: textColor }]}>{value}</Text>
            <Text style={[styles.titleText, { color: textMuted }]}>{title}</Text>
          </View>

          <View style={styles.rightCol}>
            <View style={styles.sparklineBox}>
              <Sparkline data={series || []} color={iconColor} />
            </View>
            <Text style={[styles.viewTrendText, { color: policyLinkColor }]}>
              VIEW TREND ›
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      onPress={onPress}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#6b21a8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    position: 'relative',
  },
  glowingCircle: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  leftCol: {
    gap: 2,
  },
  valueText: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 38,
  },
  titleText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  sparklineBox: {
    paddingBottom: 4,
  },
  viewTrendText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
