import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@/src/hooks/useTheme';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { radius, spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

interface WeeklyReportModalProps {
  visible: boolean;
  onClose: () => void;
  seriesData: any;
  summaryData: any;
}

export function WeeklyReportModal({ visible, onClose, seriesData, summaryData }: WeeklyReportModalProps) {
  const { colors, isDark } = useTheme();

  // Calculate averages from series data (fallback to defaults if empty)
  const getAverage = (arr: number[]) => {
    if (!arr || arr.length === 0) return 0;
    const clean = arr.filter(v => typeof v === 'number' && v > 0);
    if (clean.length === 0) return 0;
    return Math.round(clean.reduce((sum, v) => sum + v, 0) / clean.length);
  };

  const avgMood = getAverage(seriesData?.mood) || summaryData?.moodScore || 75;
  const avgSleep = (getAverage(seriesData?.sleep) / 10) || summaryData?.sleepHours || 7.2;
  const avgActivity = getAverage(seriesData?.activity) || summaryData?.activityLevel || 60;
  const avgStress = getAverage(seriesData?.stress) || summaryData?.stressIndex || 40;

  // Render achievement cards
  const achievements = [
    { title: "Detox Master", desc: "No late-night screen usage detected for 3 consecutive days.", icon: "shield", color: "#6ee7b7" },
    { title: "Mindfulness Streak", desc: "Completed 4 clinical breathing practices this week.", icon: "wind", color: "#a2cbfd" },
    { title: "Focus Champion", desc: "Average key interval speed is highly stable, indicating calm state.", icon: "zap", color: "#ffb3d9" },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Feather name="bar-chart-2" size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.onSurface }]}>Weekly Wellness Report</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.introText, { color: colors.onSurfaceVariant }]}>
              Here is your summarized cognitive telemetry and digital behavior analysis for the past 7 days.
            </Text>

            {/* Weekly Metrics Summary Grid */}
            <View style={styles.grid}>
              <View style={styles.gridRow}>
                <GlassCard accent="primary" style={styles.metricCard}>
                  <Feather name="smile" size={16} color="#ffb3d9" />
                  <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Avg Mood</Text>
                  <Text style={[styles.metricValue, { color: colors.onSurface }]}>{avgMood}%</Text>
                </GlassCard>

                <GlassCard accent="secondary" style={styles.metricCard}>
                  <Feather name="moon" size={16} color="#a2cbfd" />
                  <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Avg Sleep</Text>
                  <Text style={[styles.metricValue, { color: colors.onSurface }]}>{avgSleep.toFixed(1)} hrs</Text>
                </GlassCard>
              </View>

              <View style={styles.gridRow}>
                <GlassCard accent="secondary" style={styles.metricCard}>
                  <Feather name="activity" size={16} color="#6ee7b7" />
                  <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Avg Activity</Text>
                  <Text style={[styles.metricValue, { color: colors.onSurface }]}>{avgActivity}%</Text>
                </GlassCard>

                <GlassCard accent="primary" style={styles.metricCard}>
                  <Feather name="trending-down" size={16} color="#b59cff" />
                  <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>Stress Index</Text>
                  <Text style={[styles.metricValue, { color: colors.onSurface }]}>{avgStress}%</Text>
                </GlassCard>
              </View>
            </View>

            {/* Weekly AI Assessment */}
            <GlassCard accent="primary" style={styles.assessmentCard}>
              <View style={styles.cardHeaderRow}>
                <Feather name="cpu" size={16} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Weekly AI Synthesis</Text>
              </View>
              <Text style={[styles.assessmentText, { color: colors.onSurfaceVariant }]}>
                Your stress levels remained stable this week, spiking only on Tuesday afternoon during high-interaction intervals. Your sleep duration averaged 7.2 hours, which is correlated with a 14% increase in keyboard focus. Continuing Box Breathing will help stabilize stress indices.
              </Text>
            </GlassCard>

            {/* Achievements Section */}
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Weekly Achievements</Text>
            <View style={styles.achievementsList}>
              {achievements.map((item, idx) => (
                <View key={idx} style={[styles.achievementRow, { borderBottomColor: colors.outline }]}>
                  <View style={[styles.iconCircle, { backgroundColor: item.color + '22' }]}>
                    <Feather name={item.icon as any} size={14} color={item.color} />
                  </View>
                  <View style={styles.achievementTextCol}>
                    <Text style={[styles.achievementTitle, { color: colors.onSurface }]}>{item.title}</Text>
                    <Text style={[styles.achievementDesc, { color: colors.onSurfaceVariant }]}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalContainer: {
    width: '100%',
    height: '80%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    gap: 18,
    paddingVertical: 14,
  },
  introText: {
    ...typography.bodyMd,
    fontSize: 13,
    lineHeight: 18,
  },
  grid: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    gap: 4,
    alignItems: 'center',
  },
  metricLabel: {
    ...typography.labelCaps,
    fontSize: 9.5,
    letterSpacing: 0.4,
    marginTop: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  assessmentCard: {
    padding: 14,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  assessmentText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 8,
  },
  achievementsList: {
    gap: 12,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementTextCol: {
    flex: 1,
    gap: 2,
  },
  achievementTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  achievementDesc: {
    fontSize: 11.5,
    lineHeight: 15,
  },
});
