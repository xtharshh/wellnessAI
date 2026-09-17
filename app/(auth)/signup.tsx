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

import { CalmCard, CalmScreen, GhostButton, InkButton, Serif, useCalm } from '@/src/components/calm/kit';
import { AppLogo } from '@/src/components/ui/AppLogo';
import { useAuthStore } from '@/src/stores/authStore';
import { trackKeyPress } from '@/src/services/realAnalytics';
import { fonts } from '@/src/theme/typography';

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
  const [agreeConsent, setAgreeConsent] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const { c } = useCalm();

  const handleSignup = async () => {
    clearError();
    setLocalError(null);
    if (!displayName.trim()) {
      setLocalError('Please tell us your name.');
      return;
    }
    if (!agreeConsent) {
      setLocalError('You must agree to the Privacy Policy to proceed.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }
    try {
      await signUp(email.trim(), password, displayName.trim());
      router.replace({ pathname: '/(auth)/verify-email', params: { email } });
    } catch {
      // handled in store
    }
  };

  const field = (key: string, label: string, props: React.ComponentProps<typeof TextInput>) => (
    <View>
      <Text style={[styles.label, { color: c.muted }]}>{label}</Text>
      <View
        style={[
          styles.input,
          { backgroundColor: c.bg, borderColor: focused === key ? c.ink : c.line },
        ]}
      >
        <TextInput
          {...props}
          placeholderTextColor={c.faint}
          style={[styles.textInput, { color: c.ink }]}
          onFocus={() => setFocused(key)}
          onBlur={() => setFocused(null)}
          onKeyPress={(e) => trackKeyPress(e.nativeEvent.key)}
        />
      </View>
    </View>
  );

  return (
    <CalmScreen>
      <View style={styles.hero}>
        <AppLogo size={64} />
        <Serif style={[styles.title, { color: c.ink }]}>Create account</Serif>
        <Text style={[styles.sub, { color: c.muted }]}>
          Begin your quiet wellness journey
        </Text>
      </View>

      <CalmCard>
        {field('name', 'FULL NAME', {
          placeholder: 'Alex Chen',
          value: displayName,
          onChangeText: setDisplayName,
          accessibilityLabel: 'Full name',
        })}
        {field('email', 'EMAIL', {
          placeholder: 'you@example.com',
          value: email,
          onChangeText: setEmail,
          autoCapitalize: 'none',
          keyboardType: 'email-address',
          accessibilityLabel: 'Email address',
        })}
        {field('password', 'PASSWORD', {
          placeholder: 'Minimum 8 characters',
          value: password,
          onChangeText: setPassword,
          secureTextEntry: !showPassword,
          accessibilityLabel: 'Password',
        })}
        {field('confirm', 'CONFIRM PASSWORD', {
          placeholder: 'Repeat your password',
          value: confirmPassword,
          onChangeText: setConfirmPassword,
          secureTextEntry: !showPassword,
          accessibilityLabel: 'Confirm password',
        })}

        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide passwords' : 'Show passwords'}
          style={styles.showRow}
        >
          <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color={c.muted} />
          <Text style={[styles.showText, { color: c.muted }]}>
            {showPassword ? 'Hide passwords' : 'Show passwords'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setAgreeConsent(!agreeConsent)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreeConsent }}
          accessibilityLabel="Agree to privacy policy"
          style={styles.consentRow}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: agreeConsent ? c.ink : 'transparent',
                borderColor: agreeConsent ? c.ink : c.faint,
              },
            ]}
          >
            {agreeConsent ? <Feather name="check" size={13} color={c.bg} /> : null}
          </View>
          <Text style={[styles.consentText, { color: c.muted }]}>
            I agree to the Privacy Policy and consent to behavioral monitoring for wellness insights.
          </Text>
        </Pressable>

        {error || localError ? (
          <Text style={[styles.error, { color: c.danger }]}>{localError ?? error}</Text>
        ) : null}

        {loading ? (
          <View style={[styles.loadingBtn, { backgroundColor: c.btnBg }]}>
            <ActivityIndicator color={c.btnInk} />
          </View>
        ) : (
          <InkButton label="Create Account" onPress={handleSignup} icon="arrow-right" />
        )}
      </CalmCard>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: c.muted }]}>Already have an account? </Text>
        <Link href="/(auth)/login" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Sign in">
            <Text style={[styles.footerLink, { color: c.ink }]}>Sign in →</Text>
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
  label: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.5, marginTop: 10 },
  input: {
    borderWidth: 1.2,
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginTop: 6,
  },
  textInput: { fontFamily: fonts.regular, fontSize: 15, minHeight: 48 },
  showRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    marginTop: 4,
  },
  showText: { fontFamily: fonts.semiBold, fontSize: 13 },
  consentRow: { flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'flex-start' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  consentText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  error: { fontFamily: fonts.medium, fontSize: 13, textAlign: 'center', marginTop: 10 },
  loadingBtn: {
    minHeight: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  footerText: { fontFamily: fonts.regular, fontSize: 14 },
  footerLink: { fontFamily: fonts.semiBold, fontSize: 14 },
});
