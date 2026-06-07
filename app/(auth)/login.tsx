import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useAuthStore } from '@/src/stores/authStore';
import { useTheme } from '@/src/hooks/useTheme';
import { fonts } from '@/src/theme/typography';
import { trackKeyPress } from '@/src/services/realAnalytics';

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const user = useAuthStore((state) => state.user);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Focus states
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleLogin = async () => {
    clearError();
    try {
      await signIn(email.trim(), password);
      const current = useAuthStore.getState().user ?? user;
      if (!current?.privacyConsentAt) {
        router.replace('/(onboarding)/privacy');
      } else {
        router.replace('/(tabs)/dashboard');
      }
    } catch {
      // error handled in store
    }
  };

  const handleDemo = async () => {
    clearError();
    try {
      await signIn('demo@mindtrace.ai', 'demo1234');
      router.replace('/(tabs)/dashboard');
    } catch {
      try {
        const signUp = useAuthStore.getState().signUp;
        await signUp('demo@mindtrace.ai', 'demo1234', 'Demo User');
        const acceptPrivacy = useAuthStore.getState().acceptPrivacy;
        const completeOnboarding = useAuthStore.getState().completeOnboarding;
        await acceptPrivacy();
        await completeOnboarding();
        router.replace('/(tabs)/dashboard');
      } catch {
        // noop
      }
    }
  };

  // Theme-specific styles mapping
  const bgColors = isDark
    ? (['#0a0813', '#0e0b1f'] as const)
    : (['#ede8ff', '#f8f7ff'] as const);

  const cardBg = isDark ? '#151126' : '#ffffff';
  const cardBorder = isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(124, 58, 237, 0.12)';
  const textColor = isDark ? '#f5f5f7' : '#1a1a2e';
  const textMuted = isDark ? '#8f8f9e' : '#6b6b7f';
  const inputBg = isDark ? '#1b1733' : '#f6f4ff';
  const inputBorder = isDark ? 'rgba(168, 85, 247, 0.18)' : 'rgba(124, 58, 237, 0.15)';
  const inputBorderFocused = isDark ? '#a855f7' : '#7c3aed';
  
  const dividerLineColor = isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(124, 58, 237, 0.12)';
  const primaryBtnColor = isDark ? '#8b5cf6' : '#7c3aed';
  const policyLinkColor = isDark ? '#a78bfa' : '#6d28d9';
  
  const outlineBtnBorder = isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(124, 58, 237, 0.25)';
  const outlineBtnTextColor = isDark ? '#c084fc' : '#7c3aed';

  return (
    <LinearGradient colors={bgColors} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            {/* Mini Logo Squircle */}
            <View style={styles.miniLogoCard}>
              <View style={styles.miniSpheresContainer}>
                <LinearGradient
                  colors={['#9f62ff', '#491b9a']}
                  start={{ x: 0.1, y: 0.1 }}
                  end={{ x: 0.9, y: 0.9 }}
                  style={[styles.miniSphere, styles.miniSpherePurple]}
                />
                <LinearGradient
                  colors={['#3de2b5', '#0c6e54']}
                  start={{ x: 0.1, y: 0.1 }}
                  end={{ x: 0.9, y: 0.9 }}
                  style={[styles.miniSphere, styles.miniSphereTeal]}
                />
                <Svg height="8" width="24" viewBox="0 0 24 8" style={styles.miniWaveSvg}>
                  <Path
                    d="M 1 4 C 5 0, 7 8, 12 4 C 17 0, 19 8, 23 4"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </Svg>
              </View>
            </View>
            <Text style={[styles.title, { color: textColor }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: textMuted }]}>
              Sign in to your MindTrace account
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {/* Email field */}
            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: textMuted }]}>Email</Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: inputBg,
                    borderColor: emailFocused ? inputBorderFocused : inputBorder,
                  },
                ]}
              >
                <TextInput
                  placeholder="demo@mindtrace.ai"
                  placeholderTextColor={isDark ? '#6b6b7f' : '#a8a8b8'}
                  style={[styles.textInput, { color: textColor }]}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  onKeyPress={(e) => trackKeyPress(e.nativeEvent.key)}
                />
              </View>
            </View>

            {/* Password field */}
            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: textMuted }]}>Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: inputBg,
                    borderColor: passwordFocused ? inputBorderFocused : inputBorder,
                  },
                ]}
              >
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor={isDark ? '#6b6b7f' : '#a8a8b8'}
                  style={[styles.textInput, { color: textColor }]}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onKeyPress={(e) => trackKeyPress(e.nativeEvent.key)}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color={isDark ? '#8f8f9e' : '#6b6b7f'}
                  />
                </Pressable>
              </View>
            </View>

            {/* Forgot password link */}
            <View style={styles.forgotPasswordWrapper}>
              <Link href="/(auth)/forgot-password" asChild>
                <Pressable>
                  <Text style={[styles.forgotPasswordText, { color: policyLinkColor }]}>
                    Forgot password?
                  </Text>
                </Pressable>
              </Link>
            </View>

            {/* Error display */}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Sign in button */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: primaryBtnColor,
                  opacity: pressed ? 0.9 : 1,
                  shadowColor: primaryBtnColor,
                },
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: dividerLineColor }]} />
              <Text style={[styles.dividerText, { color: textMuted }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: dividerLineColor }]} />
            </View>

            {/* Try Demo Account */}
            <Pressable
              style={({ pressed }) => [
                styles.outlineButton,
                {
                  borderColor: outlineBtnBorder,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={handleDemo}
            >
              <Feather name="zap" size={16} color={outlineBtnTextColor} />
              <Text style={[styles.outlineButtonText, { color: outlineBtnTextColor }]}>
                Try Demo Account
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: textMuted }]}>Don't have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable>
                <Text style={[styles.footerLinkText, { color: policyLinkColor }]}>
                  Create one →
                </Text>
              </Pressable>
            </Link>
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
    paddingTop: 30,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  miniLogoCard: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#161129',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  miniSpheresContainer: {
    width: 26,
    height: 26,
    position: 'relative',
  },
  miniSphere: {
    width: 14,
    height: 14,
    borderRadius: 7,
    position: 'absolute',
  },
  miniSpherePurple: {
    top: 3,
    left: 2,
  },
  miniSphereTeal: {
    bottom: 3,
    right: 2,
  },
  miniWaveSvg: {
    position: 'absolute',
    top: 9,
    left: 1,
    zIndex: 10,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 20,
    width: '100%',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 16,
    gap: 6,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.regular,
    fontSize: 15,
    padding: 0, // Reset default padding
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPasswordWrapper: {
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
    marginTop: -8,
  },
  forgotPasswordLink: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontSize: 13,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryButtonText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#ffffff',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    paddingHorizontal: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  outlineButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  outlineButtonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  footerLinkText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
});
