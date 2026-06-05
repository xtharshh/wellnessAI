import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SecondaryButton } from '@/src/components/ui/SecondaryButton';
import { StatusChip } from '@/src/components/ui/StatusChip';
import { useRecommendations } from '@/src/hooks/useRecommendations';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

const categoryTone = {
  sleep: 'medium' as const,
  mindfulness: 'active' as const,
  activity: 'low' as const,
  general: 'neutral' as const,
};

export default function RecommendationsScreen() {
  const { data, isLoading, regenerate, dismiss, complete } = useRecommendations();

  return (
    <ScreenContainer>
      <Text style={styles.eyebrow}>AI Recommendations</Text>
      <Text style={styles.title}>Personalized guidance</Text>
      <Text style={styles.subtitle}>
        Generated from your latest wellness trace patterns.
      </Text>

      <PrimaryButton
        label={regenerate.isPending ? 'Generating...' : 'Regenerate Recommendations'}
        onPress={() => regenerate.mutate()}
        loading={regenerate.isPending}
      />

      {isLoading ? <Text style={styles.loading}>Loading recommendations...</Text> : null}

      {(data ?? []).map((rec) => (
        <GlassCard key={rec.id}>
          <View style={styles.cardHeader}>
            <StatusChip label={rec.category} tone={categoryTone[rec.category]} />
            {rec.completed ? <StatusChip label="Done" tone="low" /> : null}
          </View>
          <Text style={styles.recTitle}>{rec.title}</Text>
          <Text style={styles.recBody}>{rec.body}</Text>
          <View style={styles.actions}>
            {!rec.completed ? (
              <SecondaryButton label="Mark Done" onPress={() => complete.mutate(rec.id)} />
            ) : null}
            <SecondaryButton label="Dismiss" onPress={() => dismiss.mutate(rec.id)} />
          </View>
        </GlassCard>
      ))}

      {!isLoading && !(data ?? []).length ? (
        <Text style={styles.empty}>No active recommendations. Tap regenerate to create new ones.</Text>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...typography.labelCaps,
    color: colors.primary,
    marginTop: 12,
  },
  title: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  loading: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  recTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  recBody: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  actions: {
    gap: 8,
  },
  empty: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 24,
  },
});
