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
    primary: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(124, 58, 237, 0.2)',
    secondary: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(124, 58, 237, 0.2)',
    tertiary: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(124, 58, 237, 0.2)',
  };

  const accentStrip = {
    primary: colors.primaryAccent,
    secondary: colors.secondaryAccent,
    tertiary: colors.tertiaryAccent,
  };

  const content = (
    <>
      {Platform.OS !== 'web' ? (
        <BlurView intensity={12} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={[styles.accentStrip, { backgroundColor: accentStrip[accent] }]} />
      <View style={styles.inner}>{children}</View>
    </>
  );

  const cardShadow = {
    shadowColor: isDark ? '#000000' : 'rgba(124, 58, 237, 0.3)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 18,
    elevation: isDark ? 3 : 5,
    ...(Platform.OS === 'web' && {
      boxShadow: isDark
        ? '0 6px 20px rgba(0, 0, 0, 0.4)'
        : '0 6px 20px rgba(124, 58, 237, 0.12)',
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
  accentStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  inner: {
    padding: spacing.md,
    gap: spacing.sm,
  },
});
