import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { InputField } from '@/src/components/ui/InputField';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { useAuthStore } from '@/src/stores/authStore';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

export default function SignupScreen() {
  const router = useRouter();
  const signUp = useAuthStore((state) => state.signUp);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    clearError();
    try {
      await signUp(email, password, displayName);
      router.replace('/(onboarding)/privacy');
    } catch {
      // handled in store
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.eyebrow}>Get started</Text>
      <Text style={styles.title}>Create your MindTrace account</Text>
      <Text style={styles.subtitle}>Start passive wellness monitoring in minutes.</Text>

      <InputField label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Alex" />
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
        placeholder="Minimum 6 characters"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton label="Create Account" onPress={handleSignup} loading={loading} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Link href="/(auth)/login" style={styles.link}>
          Sign in
        </Link>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...typography.labelCaps,
    color: colors.primary,
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
