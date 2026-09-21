import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { AppLogo } from '@/src/components/ui/AppLogo';
import { useAuthStore } from '@/src/stores/authStore';
import { fonts } from '@/src/theme/typography';
import { serif } from '@/src/theme/calm';

export default function SplashScreenRoute() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);
  const textOpacity = useSharedValue(0);
  const glow = useSharedValue(0.35);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
    logoScale.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.4)) });
    textOpacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) });
    glow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 1600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [glow, logoOpacity, logoScale, textOpacity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        router.replace('/landing');
        return;
      }
      if (!user.privacyConsentAt || !user.onboardingComplete) {
        router.replace('/(onboarding)/privacy');
        return;
      }
      router.replace('/(tabs)/dashboard');
    }, 2200);

    return () => clearTimeout(timer);
  }, [router, user]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <LinearGradient colors={['#101915', '#0A100C', '#060906']} style={styles.container}>
      {/* Breathing sage glow */}
      <View style={styles.glowWrap} pointerEvents="none">
        <Animated.View style={[styles.glow, glowStyle]} />
        <View style={styles.ringLarge} />
        <View style={styles.ringSmall} />
      </View>

      {/* Centered brand column */}
      <View style={styles.center}>
        <Animated.View style={logoStyle}>
          <AppLogo size={96} />
        </Animated.View>
        <Animated.View style={[styles.wordmark, textStyle]}>
          <Text style={styles.name}>
            Wellness <Text style={styles.nameAccent}>AI</Text>
          </Text>
          <Text style={styles.tagline}>A KINDER YOU, EVERY DAY</Text>
          <Text style={styles.sub}>Your personal wellness intelligence</Text>
        </Animated.View>
      </View>

      {/* Progress dots */}
      <Animated.View style={[styles.dots, textStyle]}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(120, 160, 110, 0.16)',
  },
  ringLarge: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    borderWidth: 1,
    borderColor: 'rgba(243, 234, 219, 0.07)',
  },
  ringSmall: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    borderWidth: 1,
    borderColor: 'rgba(243, 234, 219, 0.10)',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  wordmark: {
    alignItems: 'center',
    marginTop: 26,
  },
  name: {
    fontFamily: serif,
    fontWeight: '700',
    fontSize: 38,
    color: '#F3EADB',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  nameAccent: {
    color: '#9DBE8B',
  },
  tagline: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#8FA38B',
    letterSpacing: 3,
    marginTop: 10,
    textAlign: 'center',
  },
  sub: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#5E6E5C',
    fontStyle: 'italic',
    marginTop: 6,
    textAlign: 'center',
  },
  dots: {
    position: 'absolute',
    bottom: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A362C',
  },
  dotActive: {
    backgroundColor: '#9DBE8B',
    width: 22,
  },
});
