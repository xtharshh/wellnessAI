import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { InputField } from '@/src/components/ui/InputField';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SecondaryButton } from '@/src/components/ui/SecondaryButton';
import { useAuthStore } from '@/src/stores/authStore';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const user = useAuthStore((state) => state.user);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    clearError();
    try {
      await signIn(email, password);
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

  return (
    <ScreenContainer>
      <Text style={styles.eyebrow}>Welcome back</Text>
      <Text style={styles.title}>Sign in to MindTrace</Text>
      <Text style={styles.subtitle}>Continue your wellness trace analysis.</Text>

      <InputField
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@email.com"
      />
      <InputField
        label="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
      />

      <View style={styles.forgotPasswordContainer}>
        <Link href="/(auth)/forgot-password" style={styles.forgotPasswordLink}>
          Forgot Password?
        </Link>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton label="Sign In" onPress={handleLogin} loading={loading} />
      <SecondaryButton label="Try Demo Account" onPress={handleDemo} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>No account yet?</Text>
        <Link href="/(auth)/signup" style={styles.link}>
          Create one
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
    ...typography.bodyMd,
    color: colors.error,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
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
