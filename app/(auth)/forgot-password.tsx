import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resetPassword } from '@/src/services/auth';
import { useTheme } from '@/src/hooks/useTheme';
import { fonts } from '@/src/theme/typography';
import { trackKeyPress } from '@/src/services/realAnalytics';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(42); // Match screenshot "0:42"

  // Focus state
  const [emailFocused, setEmailFocused] = useState(false);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Timer effect for resend link
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (success && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [success, countdown]);

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSuccess(true);
      setCountdown(42); // reset countdown
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setCountdown(60); // set to 60s for subsequent resends
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEmailApp = () => {
    // Attempt to open generic mail app
    Linking.openURL('mailto:');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Theme mapping
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

  // Checkmark Badge Styles
  const checkBadgeBg = isDark ? 'rgba(16, 185, 129, 0.15)' : '#e6fcf5';
  const checkBadgeBorder = isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.12)';
  const checkColor = isDark ? '#3de2b5' : '#10b981';

  return (
    <LinearGradient colors={bgColors} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header Back Button */}
        <View style={styles.headerNav}>
          <Pressable 
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            onPress={() => router.replace('/(auth)/login')}
          >
            <View style={[styles.backIconCircle, { borderColor: cardBorder }]}>
              <Feather name="chevron-left" size={16} color={policyLinkColor} />
            </View>
            <Text style={[styles.backText, { color: textColor }]}>Back to sign in</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!success ? (
            /* Reset password form */
            <View style={styles.contentBody}>
              <View style={styles.titleSection}>
                <Text style={[styles.title, { color: textColor }]}>Reset password</Text>
                <Text style={[styles.subtitle, { color: textMuted }]}>
                  Enter your email and we'll send a secure reset link.
                </Text>
              </View>

              {/* Form Card */}
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={styles.inputWrapper}>
                  <Text style={[styles.label, { color: textMuted }]}>Email Address</Text>
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

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    {
                      backgroundColor: primaryBtnColor,
                      opacity: pressed ? 0.9 : 1,
                      shadowColor: primaryBtnColor,
                    },
                  ]}
                  onPress={handleReset}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send Reset Link</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            /* Check your email screen */
            <View style={styles.contentBody}>
              <View style={styles.successBadgeContainer}>
                <View style={[styles.checkBadge, { backgroundColor: checkBadgeBg, borderColor: checkBadgeBorder }]}>
                  <Feather name="check" size={32} color={checkColor} />
                </View>
              </View>

              <View style={styles.titleSection}>
                <Text style={[styles.title, { color: textColor }]}>Check your email</Text>
                <Text style={[styles.subtitle, { color: textMuted }]}>
                  We sent a reset link to{' '}
                  <Text style={[styles.emailHighlight, { color: policyLinkColor }]}>{email.trim()}</Text>
                </Text>
              </View>

              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    {
                      backgroundColor: primaryBtnColor,
                      opacity: pressed ? 0.9 : 1,
                      shadowColor: primaryBtnColor,
                    },
                  ]}
                  onPress={handleOpenEmailApp}
                  disabled={loading}
                >
                  <Text style={styles.primaryButtonText}>Open Email App</Text>
                </Pressable>
              </View>

              {/* Resend countdown footer */}
              <View style={styles.footerSection}>
                {countdown > 0 ? (
                  <Text style={[styles.footerText, { color: textMuted }]}>
                    Didn't receive it?{' '}
                    <Text style={[styles.highlightText, { color: policyLinkColor }]}>
                      Resend in {formatTime(countdown)}
                    </Text>
                  </Text>
                ) : (
                  <Pressable onPress={handleResend} disabled={loading}>
                    <Text style={[styles.resendLinkText, { color: policyLinkColor }]}>
                      Resend link
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
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
  headerNav: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  backIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
    flexGrow: 1,
  },
  contentBody: {
    flex: 1,
    justifyContent: 'center',
  },
  successBadgeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  checkBadge: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  titleSection: {
    alignItems: 'center',
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
    paddingHorizontal: 12,
  },
  emailHighlight: {
    fontFamily: fonts.bold,
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
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 20,
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
    padding: 0,
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
  footerSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  highlightText: {
    fontFamily: fonts.bold,
  },
  resendLinkText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
