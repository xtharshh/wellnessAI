import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  accent?: 'primary' | 'secondary' | 'tertiary';
  onPress?: () => void;
}

const accentBorders = {
  primary: 'rgba(168, 85, 247, 0.25)',
  secondary: 'rgba(6, 182, 212, 0.25)',
  tertiary: 'rgba(16, 185, 129, 0.25)',
};

export function GlassCard({ children, style, accent = 'primary' }: GlassCardProps) {
  const content = (
    <>
      {Platform.OS !== 'web' ? (
        <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={styles.inner}>{children}</View>
    </>
  );

  return (
    <View style={[styles.card, { borderColor: accentBorders[accent] }, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: colors.glassBackground,
  },
  inner: {
    padding: spacing.md,
    gap: spacing.sm,
  },
});
