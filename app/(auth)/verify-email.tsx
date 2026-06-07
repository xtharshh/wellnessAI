import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/src/hooks/useTheme';
import { fonts } from '@/src/theme/typography';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [countdown, setCountdown] = useState(42); // Match screenshot "0:42"

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleOpenEmailApp = () => {
    Linking.openURL('mailto:');
  };

  const handleResend = () => {
    setCountdown(60); // Reset countdown on resend
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

        <View style={styles.contentContainer}>
          {/* Centered Success Badge */}
          <View style={styles.successBadgeContainer}>
            <View style={[styles.checkBadge, { backgroundColor: checkBadgeBg, borderColor: checkBadgeBorder }]}>
              <Feather name="check" size={32} color={checkColor} />
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: textColor }]}>Check your email</Text>
            <Text style={[styles.subtitle, { color: textMuted }]}>
              We sent a verification link to{' '}
              <Text style={[styles.emailHighlight, { color: policyLinkColor }]}>
                {email || 'your email'}
              </Text>
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
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
              <Pressable onPress={handleResend}>
                <Text style={[styles.resendLinkText, { color: policyLinkColor }]}>
                  Resend link
                </Text>
              </Pressable>
            )}
          </View>
        </View>
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    marginTop: -40, // Offset to visually center items vertically
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
