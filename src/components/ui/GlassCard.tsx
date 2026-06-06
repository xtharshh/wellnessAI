import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '@/src/hooks/useTheme';
import { radius, spacing } from '@/src/theme/spacing';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  accent?: 'primary' | 'secondary' | 'tertiary';
  onPress?: () => void;
}

export function GlassCard({ children, style, accent = 'primary' }: GlassCardProps) {
  const { colors, isDark } = useTheme();

  const accentBorders = {
    primary: isDark ? 'rgba(162, 203, 253, 0.2)' : 'rgba(162, 203, 253, 0.35)',
    secondary: isDark ? 'rgba(247, 190, 233, 0.2)' : 'rgba(247, 190, 233, 0.35)',
    tertiary: isDark ? 'rgba(255, 220, 98, 0.2)' : 'rgba(255, 220, 98, 0.35)',
  };

  const content = (
    <>
      {Platform.OS !== 'web' ? (
        <BlurView intensity={12} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={styles.inner}>{children}</View>
    </>
  );

  const cardShadow = {
    shadowColor: isDark ? '#000000' : 'rgba(162, 203, 253, 0.4)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 18,
    elevation: isDark ? 3 : 5,
    ...(Platform.OS === 'web' && {
      boxShadow: isDark
        ? '0 6px 20px rgba(0, 0, 0, 0.4)'
        : '0 6px 20px rgba(162, 203, 253, 0.12)',
    }),
  };

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: accentBorders[accent],
          backgroundColor: colors.glassBackground,
        },
        cardShadow,
        style,
      ]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inner: {
    padding: spacing.md,
    gap: spacing.sm,
  },
});
