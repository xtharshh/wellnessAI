import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SecondaryButton } from '@/src/components/ui/SecondaryButton';
import { useAuthStore } from '@/src/stores/authStore';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

const BULLETS = [
  'MindTrace analyzes behavioral metadata — not raw message content.',
  'Your wellness snapshots stay private and encrypted on your device.',
  'You can export or delete your data at any time from Profile.',
  'AI recommendations are generated from your own trace patterns only.',
];

export default function PrivacyOnboardingScreen() {
  const router = useRouter();
  const acceptPrivacy = useAuthStore((state) => state.acceptPrivacy);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);

  const handleAccept = async () => {
    await acceptPrivacy();
    await completeOnboarding();
    router.replace('/(tabs)/dashboard');
  };

  return (
    <ScreenContainer>
      <Text style={styles.eyebrow}>Privacy First</Text>
      <Text style={styles.title}>Your data. Your control.</Text>
      <Text style={styles.body}>
        MindTrace AI observes wellness signals quietly in the background. Before we begin, here is
        what we collect and why.
      </Text>

      <GlassCard>
        {BULLETS.map((item) => (
          <View key={item} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}
      </GlassCard>

      <PrimaryButton label="Accept & Continue" onPress={handleAccept} />
      <SecondaryButton label="Learn More" onPress={() => router.push('/modal')} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...typography.labelCaps,
    color: colors.secondary,
    marginTop: 12,
  },
  title: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
  },
  body: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bulletDot: {
    color: colors.primary,
    fontSize: 18,
    lineHeight: 22,
  },
  bulletText: {
    ...typography.bodyMd,
    color: colors.onSurface,
    flex: 1,
  },
});
