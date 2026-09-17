import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

import { AppLogo } from '@/src/components/ui/AppLogo';
import { useAuthStore } from '@/src/stores/authStore';
import { fonts } from '@/src/theme/typography';

export default function SplashScreenRoute() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // Animations
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const textOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    // Entrance animations
    logoOpacity.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.ease) });
    logoScale.value = withTiming(1, { duration: 950, easing: Easing.out(Easing.back(1.5)) });
    
    textOpacity.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.ease) });

    // Pulse animation for the orbit background glow
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        router.replace('/landing');
        return;
      }
      if (!user.privacyConsentAt) {
        router.replace('/(onboarding)/privacy');
        return;
      }
      if (!user.onboardingComplete) {
        router.replace('/(onboarding)/privacy');
        return;
      }
      router.replace('/(tabs)/dashboard');
    }, 2400);

    return () => clearTimeout(timer);
  }, [router, user]);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <LinearGradient colors={['#160c2b', '#0f0a1c', '#07050d']} style={styles.container}>
      {/* Concentric Orbit Circles */}
      <View style={styles.orbitContainer} pointerEvents="none">
        <Animated.View style={[styles.orbitCircle, styles.orbitOuter, animatedGlowStyle]} />
        <View style={[styles.orbitCircle, styles.orbitMiddle]} />
        <View style={[styles.orbitCircle, styles.orbitInner]} />
      </View>

      {/* Central Content */}
      <View style={styles.mainContent}>
        {/* Animated Brand Logo */}
        <Animated.View style={[animatedLogoStyle, styles.logoWrap]}>
          <AppLogo size={90} />
        </Animated.View>

        {/* Brand Text */}
        <Animated.View style={[styles.textContainer, animatedTextStyle]}>
          {/* MindTrace Logo Text with Gradient */}
          <View style={styles.brandTitleContainer}>
            <Svg height="42" width="220" viewBox="0 0 220 42">
              <Defs>
                <SvgLinearGradient id="traceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#7a9efc" />
                  <Stop offset="100%" stopColor="#3de2b5" />
                </SvgLinearGradient>
              </Defs>
              <SvgText
                fill="#ffffff"
                fontSize="32"
                fontWeight="700"
                fontFamily={fonts.semiBold}
                x="0"
                y="32"
              >
                Mind
              </SvgText>
              <SvgText
                fill="url(#traceGrad)"
                fontSize="32"
                fontWeight="700"
                fontFamily={fonts.semiBold}
                x="84"
                y="32"
              >
                Trace
              </SvgText>
            </Svg>
          </View>

          <Text style={styles.systemTagline}>AI WELLNESS SYSTEM</Text>
          <Text style={styles.italicSubtitle}>Your quiet observer</Text>
        </Animated.View>
      </View>

      {/* Pagination Dots at Bottom */}
      <View style={styles.paginationContainer}>
        <View style={[styles.dot, styles.activeDot]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitCircle: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1.2,
  },
  orbitOuter: {
    width: 380,
    height: 380,
    borderColor: 'rgba(168, 85, 247, 0.05)',
  },
  orbitMiddle: {
    width: 280,
    height: 280,
    borderColor: 'rgba(168, 85, 247, 0.09)',
  },
  orbitInner: {
    width: 180,
    height: 180,
    borderColor: 'rgba(168, 85, 247, 0.15)',
  },
  mainContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoWrap: {
    marginBottom: 24,
  },
  textContainer: {
    alignItems: 'center',
    gap: 8,
  },
  brandTitleContainer: {
    height: 42,
    width: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemTagline: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    color: '#8b8ba3',
    letterSpacing: 3,
    marginTop: 6,
  },
  italicSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 18,
    color: '#5e5e7a',
    fontStyle: 'italic',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'absolute',
    bottom: 50,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#231e3d',
  },
  activeDot: {
    backgroundColor: '#8b5cf6',
  },
});
