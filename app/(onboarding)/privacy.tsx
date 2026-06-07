import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/src/stores/authStore';
import { useTheme } from '@/src/hooks/useTheme';
import { fonts } from '@/src/theme/typography';

const PRIVACY_ITEMS = [
  {
    id: 'encrypted',
    icon: 'lock',
    text: 'End-to-end encrypted. Your data is never sold or shared.',
  },
  {
    id: 'choice',
    icon: 'eye',
    text: 'You choose exactly which signals the app monitors.',
  },
  {
    id: 'on-device',
    icon: 'shield',
    text: 'Behavioral patterns stay on-device by default.',
  },
  {
    id: 'opt-in',
    icon: 'upload',
    text: 'All exports and sharing are always explicit opt-in.',
  },
];

export default function PrivacyOnboardingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const acceptPrivacy = useAuthStore((state) => state.acceptPrivacy);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);

  const isDark = theme === 'dark';

  const handleAccept = async () => {
    await acceptPrivacy();
    await completeOnboarding();
    router.replace('/(tabs)/dashboard');
  };

  // Theme-specific styles mapping
  const bgColors = isDark
    ? (['#0a0813', '#0e0b1f'] as const)
    : (['#ede8ff', '#f8f7ff'] as const);

  const cardBg = isDark ? '#151126' : '#ffffff';
  const cardBorder = isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(124, 58, 237, 0.12)';
  const textColor = isDark ? '#f5f5f7' : '#1a1a2e';
  const textMuted = isDark ? '#8f8f9e' : '#6b6b7f';
  const badgeBg = isDark ? 'rgba(168, 85, 247, 0.16)' : 'rgba(124, 58, 237, 0.08)';
  const badgeIconColor = isDark ? '#b881ff' : '#7c3aed';

  const checkColor = isDark ? '#3de2b5' : '#10b981'; // Green checkmark
  const shieldIconColor = isDark ? '#9f62ff' : '#7c3aed';
  const shieldBg = isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(124, 58, 237, 0.08)';
  const shieldBorder = isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(124, 58, 237, 0.15)';

  const primaryBtnColor = isDark ? '#8b5cf6' : '#7c3aed';
  const policyLinkColor = isDark ? '#a78bfa' : '#6d28d9';

  return (
    <LinearGradient colors={bgColors} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.shieldBadge,
                {
                  backgroundColor: shieldBg,
                  borderColor: shieldBorder,
                  shadowColor: isDark ? '#a855f7' : 'rgba(124, 58, 237, 0.2)',
                  shadowOpacity: isDark ? 0.35 : 0.1,
                },
              ]}
            >
              <Feather name="shield" size={32} color={shieldIconColor} />
            </View>
            <Text style={[styles.title, { color: textColor }]}>Your data stays yours</Text>
            <Text style={[styles.subtitle, { color: textMuted }]}>
              MindTrace monitors behavioral signals only to personalize your wellness. Nothing more.
            </Text>
          </View>

          {/* Bullet Disclosure Cards */}
          <View style={styles.cardsContainer}>
            {PRIVACY_ITEMS.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                    shadowColor: isDark ? '#000000' : 'rgba(124, 58, 237, 0.15)',
                  },
                ]}
              >
                <View style={[styles.iconBadge, { backgroundColor: badgeBg }]}>
                  <Feather name={item.icon as any} size={18} color={badgeIconColor} />
                </View>
                <Text style={[styles.cardText, { color: textColor }]}>{item.text}</Text>
                <Feather name="check" size={18} color={checkColor} style={styles.checkmark} />
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: primaryBtnColor,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
              onPress={handleAccept}
            >
              <Text style={styles.primaryButtonText}>Accept & Continue</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.policyButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => router.push('/modal')}
            >
              <Text style={[styles.policyButtonText, { color: policyLinkColor }]}>
                View full Privacy Policy →
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  shieldBadge: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  cardsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.2,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 18,
  },
  checkmark: {
    marginLeft: 4,
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#ffffff',
  },
  policyButton: {
    paddingVertical: 8,
  },
  policyButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
});
