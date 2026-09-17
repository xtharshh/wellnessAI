import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { CalmCard, CalmScreen, InkButton, Serif, useCalm } from '@/src/components/calm/kit';
import { AppLogo } from '@/src/components/ui/AppLogo';
import { resetPassword } from '@/src/services/auth';
import { trackKeyPress } from '@/src/services/realAnalytics';
import { fonts } from '@/src/theme/typography';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { c } = useCalm();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [focused, setFocused] = useState(false);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CalmScreen>
      <Pressable
        onPress={() => router.replace('/(auth)/login')}
        accessibilityRole="button"
        accessibilityLabel="Back to sign in"
        style={styles.back}
      >
        <Feather name="chevron-left" size={16} color={c.ink} />
        <Text style={[styles.backText, { color: c.ink }]}>Back to sign in</Text>
      </Pressable>
      <View style={styles.hero}>
        <AppLogo size={64} />
        <Serif style={[styles.title, { color: c.ink }]}>Reset password</Serif>
        <Text style={[styles.sub, { color: c.muted }]}>
          Enter your account email and we'll send a reset code.
        </Text>
      </View>

      {success ? (
        <CalmCard tint="sage">
          <Text style={[styles.body, { color: c.muted }]}>
            If an account exists for {email.trim()}, a reset code is on its way. It expires in 30 minutes.
          </Text>
        </CalmCard>
      ) : (
        <CalmCard>
          <Text style={[styles.label, { color: c.muted }]}>EMAIL</Text>
          <View
            style={[
              styles.input,
              { backgroundColor: c.bg, borderColor: focused ? c.ink : c.line },
            ]}
          >
            <TextInput
              placeholder="you@example.com"
              placeholderTextColor={c.faint}
              style={[styles.textInput, { color: c.ink }]}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyPress={(e) => trackKeyPress(e.nativeEvent.key)}
              accessibilityLabel="Email address"
            />
          </View>
          {error ? <Text style={[styles.error, { color: c.danger }]}>{error}</Text> : null}
          <View style={{ marginTop: 12 }}>
            {loading ? (
              <View style={[styles.loadingBtn, { backgroundColor: c.btnBg }]}>
                <ActivityIndicator color={c.btnInk} />
              </View>
            ) : (
              <InkButton label="Send reset code" onPress={handleReset} icon="arrow-right" />
            )}
          </View>
        </CalmCard>
      )}
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, alignSelf: 'flex-start' },
  backText: { fontFamily: fonts.semiBold, fontSize: 14 },
  hero: { alignItems: 'center', gap: 6, marginTop: 8 },
  title: { fontSize: 28, marginTop: 10 },
  sub: { fontFamily: fonts.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  label: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.5 },
  input: {
    borderWidth: 1.2, borderRadius: 16, minHeight: 52, paddingHorizontal: 14,
    justifyContent: 'center', marginTop: 6,
  },
  textInput: { fontFamily: fonts.regular, fontSize: 15, minHeight: 48 },
  error: { fontFamily: fonts.medium, fontSize: 13, marginTop: 8 },
  loadingBtn: { minHeight: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  body: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
});
