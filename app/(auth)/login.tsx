import { Feather } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CalmCard, CalmScreen, GhostButton, GoogleButton, InkButton, Serif, useCalm } from '@/src/components/calm/kit';
import { AppLogo } from '@/src/components/ui/AppLogo';
import { useAuthStore } from '@/src/stores/authStore';
import { useGoogleSignIn } from '@/src/services/oauth';
import { trackKeyPress } from '@/src/services/realAnalytics';
import { fonts } from '@/src/theme/typography';

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
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const { c } = useCalm();

  const routeAfterLogin = () => {
    const current = useAuthStore.getState().user ?? user;
    if (!current?.privacyConsentAt) {
      router.replace('/(onboarding)/privacy');
    } else {
      router.replace('/(tabs)/dashboard');
    }
  };

  const handleLogin = async () => {
    clearError();
    try {
      await signIn(email.trim(), password);
      routeAfterLogin();
    } catch {
      // error handled in store
    }
  };

  const completeOAuthLogin = useAuthStore((state) => state.completeOAuthLogin);
  const google = useGoogleSignIn(async (u) => {
    await completeOAuthLogin(u);
    routeAfterLogin();
  });

  const fieldBorder = (focused: boolean) => (focused ? c.ink : c.line);

  return (
    <CalmScreen>
      <View style={styles.hero}>
        <AppLogo size={64} />
        <Serif style={[styles.title, { color: c.ink }]}>Welcome back</Serif>
        <Text style={[styles.sub, { color: c.muted }]}>
          Sign in to continue your quiet journey
        </Text>
      </View>

      <CalmCard>
        <Text style={[styles.label, { color: c.muted }]}>EMAIL</Text>
        <View style={[styles.input, { backgroundColor: c.bg, borderColor: fieldBorder(emailFocused) }]}>
          <TextInput
            placeholder="you@example.com"
            placeholderTextColor={c.faint}
            style={[styles.textInput, { color: c.ink }]}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            onKeyPress={(e) => trackKeyPress(e.nativeEvent.key)}
            accessibilityLabel="Email address"
          />
        </View>

        <Text style={[styles.label, { color: c.muted }]}>PASSWORD</Text>
        <View style={[styles.input, { backgroundColor: c.bg, borderColor: fieldBorder(passwordFocused) }]}>
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor={c.faint}
            style={[styles.textInput, { color: c.ink }]}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            onKeyPress={(e) => trackKeyPress(e.nativeEvent.key)}
            accessibilityLabel="Password"
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            style={styles.eye}
          >
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={c.muted} />
          </Pressable>
        </View>

        <Link href="/(auth)/forgot-password" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Forgot password">
            <Text style={[styles.forgot, { color: c.ink }]}>Forgot password?</Text>
          </Pressable>
        </Link>

        {error ? <Text style={[styles.error, { color: c.danger }]}>{error}</Text> : null}

        {loading ? (
          <View style={[styles.loadingBtn, { backgroundColor: c.btnBg }]}>
            <ActivityIndicator color={c.btnInk} />
          </View>
        ) : (
          <InkButton label="Sign In" onPress={handleLogin} icon="arrow-right" />
        )}

        <View style={styles.orRow}>
          <View style={[styles.orLine, { backgroundColor: c.line }]} />
          <Text style={[styles.orText, { color: c.muted }]}>or</Text>
          <View style={[styles.orLine, { backgroundColor: c.line }]} />
        </View>

        <GoogleButton label="Continue with Google" onPress={google.signIn} loading={google.loading} />
        {google.error ? <Text style={[styles.error, { color: c.danger }]}>{google.error}</Text> : null}
      </CalmCard>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: c.muted }]}>New here? </Text>
        <Link href="/(auth)/signup" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Create an account">
            <Text style={[styles.footerLink, { color: c.ink }]}>Create an account →</Text>
          </Pressable>
        </Link>
      </View>

      <GhostButton label="← Back to welcome" onPress={() => router.replace('/landing')} />
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 6, marginTop: 16 },
  title: { fontSize: 30, marginTop: 10 },
  sub: { fontFamily: fonts.regular, fontSize: 14, textAlign: 'center' },
  label: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.5, marginTop: 6 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  textInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15, minHeight: 48 },
  eye: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  forgot: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    textAlign: 'right',
    marginTop: 10,
    minHeight: 44,
    textAlignVertical: 'center',
  },
  error: { fontFamily: fonts.medium, fontSize: 13, textAlign: 'center', marginTop: 8 },
  loadingBtn: {
    minHeight: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  orLine: { flex: 1, height: 1 },
  orText: { fontFamily: fonts.medium, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  footerText: { fontFamily: fonts.regular, fontSize: 14 },
  footerLink: { fontFamily: fonts.semiBold, fontSize: 14 },
});
