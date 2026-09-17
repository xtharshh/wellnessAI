import { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { trackInteraction } from '@/src/services/realAnalytics';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/theme/spacing';

interface ScreenContainerProps {
  children: ReactNode;
  scrollable?: boolean;
  contentStyle?: ViewStyle;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function ScreenContainer({
  children,
  scrollable = true,
  contentStyle,
  refreshing,
  onRefresh,
}: ScreenContainerProps) {
  const { colors } = useTheme();

  if (!scrollable) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} onTouchStart={trackInteraction}>
        <View style={[styles.content, { backgroundColor: colors.background }, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} onTouchStart={trackInteraction}>
      <ScrollView
        contentContainerStyle={[styles.content, contentStyle, { backgroundColor: colors.background }]}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.background }}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primaryAccent} />
          ) : undefined
        }>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.marginMobile,
    paddingBottom: 110,
    gap: spacing.md,
  },
});
