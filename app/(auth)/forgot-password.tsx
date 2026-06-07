import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';

import { InputField } from '@/src/components/ui/InputField';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SecondaryButton } from '@/src/components/ui/SecondaryButton';
import { resetPassword } from '@/src/services/auth';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      Alert.alert(
        'Reset Link Sent',
        'Check your email inbox for password reset instructions.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.eyebrow}>Account Recovery</Text>
      <Text style={styles.title}>Forgot Password?</Text>
      <Text style={styles.subtitle}>
        Enter your registered email and we'll send you a recovery link.
      </Text>

      {success ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>
            Reset instructions have been sent to {email}. Please check your spam folder if you do not receive it shortly.
          </Text>
        </View>
      ) : (
        <InputField
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!success && (
        <PrimaryButton label="Send Reset Link" onPress={handleReset} loading={loading} />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Back to</Text>
        <Link href="/(auth)/login" style={styles.link}>
          Sign In
        </Link>
      </View>
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
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: 16,
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
    marginVertical: 8,
  },
  successBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
    borderColor: 'rgba(76, 175, 80, 0.3)',
    borderWidth: 1,
    marginVertical: 16,
  },
  successText: {
    ...typography.bodyMd,
    color: '#4caf50',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  footerText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  link: {
    ...typography.bodyMd,
    color: colors.primary,
    fontFamily: typography.titleMd.fontFamily,
  },
});
