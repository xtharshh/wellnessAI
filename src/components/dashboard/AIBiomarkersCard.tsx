import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { useTheme } from '@/src/hooks/useTheme';
import { radius, spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

interface BiomarkerProps {
  label: string;
  value: number;
  gradient: string[];
  colors: any;
}

function BiomarkerRow({ label, value, gradient, colors }: BiomarkerProps) {
  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text style={[styles.name, { color: colors.onSurface }]}>{label}</Text>
        <Text style={[styles.valText, { color: colors.onSurface }]}>{value}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.outline }]}>
        <LinearGradient
          colors={gradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${Math.max(5, Math.min(100, value))}%` }]}
        />
      </View>
    </View>
  );
}

export function AIBiomarkersCard({ behaviorAnalysis }: { behaviorAnalysis: any }) {
  const { colors, isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  // Fallback defaults
  const focus = behaviorAnalysis?.focusLevel ?? 75;
  const burnout = behaviorAnalysis?.burnoutProbability ?? 35;
  const anxiety = behaviorAnalysis?.anxietyIndication ?? 25;
  const depression = behaviorAnalysis?.depressionTendency ?? 15;
  const sleepHealth = behaviorAnalysis?.sleepHealthScore ?? 70;
  const emotionalWellness = behaviorAnalysis?.emotionalWellnessScore ?? 78;
  const stress = behaviorAnalysis?.stressIndex ?? 30; // stressIndex is calculated directly in live metrics

  // Generate dynamic AI correlation summary
  const getAISummary = () => {
    if (burnout > 60 || stress > 65) {
      return `Your recent late-night screen usage and excessive social media activity may indicate increasing stress and anxiety. We noticed typing friction and high keypress speed indicating a moderate burnout risk of ${burnout}%.`;
    }
    if (focus < 50) {
      return `Your focus level is currently lower than average (${focus}%). Telemetry signals indicate high background activity and quick shifts between apps. A short breathing exercise could help restore alpha-wave brain patterns.`;
    }
    return `Your digital behavior patterns indicate a highly balanced emotional state today. Your emotional wellness score is strong at ${emotionalWellness}%, supported by regular sleep and stable app engagement periods.`;
  };

  return (
    <GlassCard accent="primary" style={styles.card}>
      <Pressable onPress={() => setIsExpanded(!isExpanded)} style={styles.cardHeader}>
        <View style={styles.headerTitleCol}>
          <View style={styles.titleRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(183, 109, 255, 0.15)' }]}>
              <Feather name="activity" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>AI Mental Health Insights</Text>
          </View>
          <Text style={[styles.cardSub, { color: colors.onSurfaceVariant }]}>
            Passive emotional indicators & digital biomarkers
          </Text>
        </View>
        <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.onSurfaceVariant} />
      </Pressable>

      {/* Dynamic Summary Block - Always visible */}
      <View style={[styles.summaryBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: colors.outline }]}>
        <Feather name="cpu" size={14} color={colors.primary} style={{ marginTop: 2 }} />
        <Text style={[styles.summaryText, { color: colors.onSurface }]}>{getAISummary()}</Text>
      </View>

      {/* Collapsible Biomarkers Progress Bars */}
      {isExpanded && (
        <View style={styles.progressContainer}>
          <BiomarkerRow
            label="Emotional Wellness Score"
            value={emotionalWellness}
            gradient={['#a2cbfd', '#c4b5fd']}
            colors={colors}
          />
          <BiomarkerRow
            label="Stress Level"
            value={stress}
            gradient={['#b59cff', '#e86ca8']}
            colors={colors}
          />
          <BiomarkerRow
            label="Anxiety Indication"
            value={anxiety}
            gradient={['#fdb5a2', '#f07e6c']}
            colors={colors}
          />
          <BiomarkerRow
            label="Burnout Probability"
            value={burnout}
            gradient={['#ffb3d9', '#db2777']}
            colors={colors}
          />
          <BiomarkerRow
            label="Depression Tendency"
            value={depression}
            gradient={['#fca5a5', '#ef4444']}
            colors={colors}
          />
          <BiomarkerRow
            label="Focus Level"
            value={focus}
            gradient={['#6ee7b7', '#10b981']}
            colors={colors}
          />
          <BiomarkerRow
            label="Sleep Health Score"
            value={sleepHealth}
            gradient={['#a2cbfd', '#3b82f6']}
            colors={colors}
          />
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleCol: {
    gap: 2,
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardSub: {
    fontSize: 12,
    paddingLeft: 36,
  },
  summaryBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
  },
  summaryText: {
    ...typography.bodyMd,
    fontSize: 12.5,
    lineHeight: 18,
    flex: 1,
  },
  progressContainer: {
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  row: {
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  valText: {
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
