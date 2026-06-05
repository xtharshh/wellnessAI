import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '@/src/stores/authStore';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

export default function SplashScreenRoute() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }
      if (!user.privacyConsentAt) {
        router.replace('/(onboarding)/privacy');
        return;
      }
      router.replace('/(tabs)/dashboard');
    }, 1800);

    return () => clearTimeout(timer);
  }, [router, user]);

  return (
    <LinearGradient colors={[colors.backgroundDeep, colors.background, '#1a1030']} style={styles.container}>
      <View style={styles.glow} />
      <View style={styles.logoCircle}>
        <Text style={styles.logoMark}>MT</Text>
      </View>
      <Text style={styles.title}>MindTrace AI</Text>
      <Text style={styles.subtitle}>The Quiet Observer</Text>
      <Text style={styles.caption}>Analyzing wellness metadata...</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    top: '34%',
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(183, 109, 255, 0.2)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  logoMark: {
    ...typography.headlineLgMobile,
    color: colors.primary,
  },
  title: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
    fontSize: 28,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  caption: {
    ...typography.dataMono,
    color: colors.secondary,
    marginTop: 24,
  },
});
