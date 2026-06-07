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

export default function SignupScreen() {
  const router = useRouter();
  const signUp = useAuthStore((state) => state.signUp);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [agreeConsent, setAgreeConsent] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  // Focus states
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleSignup = async () => {
    clearError();
    setLocalError(null);
    if (!agreeConsent) {
      setLocalError('You must agree to the Privacy Policy to proceed.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    try {
      await signUp(email.trim(), password, displayName.trim());
      router.replace({
        pathname: '/(auth)/verify-email',
        params: { email },
      });
    } catch {
      // handled in store
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
  
  const primaryBtnColor = isDark ? '#8b5cf6' : '#7c3aed';
  const policyLinkColor = isDark ? '#a78bfa' : '#6d28d9';
  
  const checkboxBorderColor = agreeConsent 
    ? primaryBtnColor 
    : (isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(124, 58, 237, 0.3)');

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
            <Text style={[styles.title, { color: textColor }]}>Create account</Text>
            <Text style={[styles.subtitle, { color: textMuted }]}>
              Start your wellness journey today
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {/* Full Name field */}
            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: textMuted }]}>Full Name</Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: inputBg,
                    borderColor: nameFocused ? inputBorderFocused : inputBorder,
                  },
                ]}
              >
                <TextInput
                  placeholder="Alex Chen"
                  placeholderTextColor={isDark ? '#6b6b7f' : '#a8a8b8'}
                  style={[styles.textInput, { color: textColor }]}
                  value={displayName}
                  onChangeText={setDisplayName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  onKeyPress={(e) => trackKeyPress(e.nativeEvent.key)}
                />
              </View>
            </View>

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
                  placeholder="alex@mindtrace.ai"
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

            {/* Confirm Password field */}
            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: textMuted }]}>Confirm Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: inputBg,
                    borderColor: confirmPasswordFocused ? inputBorderFocused : inputBorder,
                  },
                ]}
              >
                <TextInput
                  placeholder="Confirm your password"
                  placeholderTextColor={isDark ? '#6b6b7f' : '#a8a8b8'}
                  style={[styles.textInput, { color: textColor }]}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                  onKeyPress={(e) => trackKeyPress(e.nativeEvent.key)}
                />
                <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  <Feather
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color={isDark ? '#8f8f9e' : '#6b6b7f'}
                  />
                </Pressable>
              </View>
            </View>

            {/* Consent Checkbox */}
            <View style={styles.consentWrapper}>
              <Pressable 
                onPress={() => setAgreeConsent(!agreeConsent)} 
                style={[
                  styles.checkbox,
                  { 
                    backgroundColor: agreeConsent ? primaryBtnColor : 'transparent',
                    borderColor: checkboxBorderColor 
                  }
                ]}
              >
                {agreeConsent ? <Feather name="check" size={12} color="#ffffff" /> : null}
              </Pressable>
              <Text style={[styles.consentText, { color: textMuted }]}>
                I agree to MindTrace's{' '}
                <Link href="/modal" asChild>
                  <Text style={StyleSheet.flatten([styles.consentHighlight, { color: policyLinkColor }])}>Privacy Policy</Text>
                </Link>{' '}
                and consent to behavioral monitoring for wellness insights.
              </Text>
            </View>

            {/* Error display */}
            {error || localError ? (
              <Text style={styles.error}>{localError ?? error}</Text>
            ) : null}

            {/* Create Account button */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: primaryBtnColor,
                  opacity: pressed ? 0.9 : 1,
                  shadowColor: primaryBtnColor,
                },
              ]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: textMuted }]}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text style={[styles.footerLinkText, { color: policyLinkColor }]}>
                  Sign in →
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
    paddingTop: 24,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
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
    marginBottom: 14,
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
  consentWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 6,
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  consentText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  consentHighlight: {
    fontFamily: fonts.bold,
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
