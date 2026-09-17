import { GlassCard } from '@/src/components/ui/GlassCard';
import { useTheme } from '@/src/hooks/useTheme';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { fonts } from '@/src/theme/typography';

export function AIBiomarkersCard({ behaviorAnalysis, rawSignals }: { behaviorAnalysis: any; rawSignals?: any }) {
  const { isDark } = useTheme();
  const router = useRouter();

  const textColor = isDark ? '#f5f5f7' : '#1a1a2e';
  const textMuted = isDark ? '#8f8f9e' : '#6b6b7f';

  const subtitle = rawSignals
    ? [
        rawSignals.avgKeyInterval !== null && rawSignals.avgKeyInterval !== undefined ? `${rawSignals.avgKeyInterval}ms cadence` : null,
        rawSignals.backspaceRatio !== null && rawSignals.backspaceRatio !== undefined ? `${rawSignals.backspaceRatio}% corrections` : null,
        rawSignals.motionMagnitude !== null && rawSignals.motionMagnitude !== undefined ? `${rawSignals.motionMagnitude}g` : null,
      ]
        .filter(Boolean)
        .join(' • ') || 'No live signal yet — interact to generate'
    : behaviorAnalysis
      ? 'Live biomarkers available — tap for raw feed'
      : 'No live signal yet — interact to generate';

  return (
    <Pressable 
      onPress={() => router.push('/telemetry')}
      style={({ pressed }) => [
        styles.pressable,
        pressed && styles.pressed
      ]}
    >
      <GlassCard accent="primary" style={styles.card}>
        <View style={styles.cardContent}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(124, 58, 237, 0.08)' }]}>
            <Feather name="cpu" size={16} color={isDark ? '#c084fc' : '#7c3aed'} />
          </View>
          
          <View style={styles.textCol}>
            <Text style={[styles.title, { color: textColor }]}>AI Biomarkers</Text>
            <Text style={[styles.subtitle, { color: textMuted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>

          <Feather name="chevron-right" size={18} color={textMuted} />
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    marginBottom: 16,
  },
  pressed: {
    opacity: 0.9,
  },
  card: {
    padding: 14,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textCol: {
    flex: 1,
    gap: 2,
    marginRight: 8,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  subtitle: {
    fontSize: 11.5,
  },
});
