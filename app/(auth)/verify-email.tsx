import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { CalmCard, CalmScreen, InkButton, Serif, useCalm } from '@/src/components/calm/kit';
import { AppLogo } from '@/src/components/ui/AppLogo';
import { resetPassword } from '@/src/services/auth';
import { fonts } from '@/src/theme/typography';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { c } = useCalm();
  const [countdown, setCountdown] = useState(42);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const resend = async () => {
    if (countdown > 0 || !email) return;
    setError(null);
    try {
      await resetPassword(String(email));
      setCountdown(60);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not resend. Email delivery may not be configured yet.');
    }
  };

  const mm = Math.floor(countdown / 60);
  const ss = String(countdown % 60).padStart(2, '0');

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
        <View style={[styles.check, { backgroundColor: c.limeSoft }]}>
          <Feather name="check" size={22} color={c.limeInk} />
        </View>
        <Serif style={[styles.title, { color: c.ink }]}>Check your inbox</Serif>
        <Text style={[styles.sub, { color: c.muted }]}>
          We sent a verification link to{'\n'}
          <Text style={{ color: c.ink, fontFamily: fonts.semiBold }}>{email ?? 'your email'}</Text>
        </Text>
      </View>
      <CalmCard>
        <Text style={[styles.body, { color: c.muted }]}>
          Tap the link to verify, then sign in. Didn't get it? Open your mail app or resend below.
        </Text>
        {error ? <Text style={[styles.error, { color: c.danger }]}>{error}</Text> : null}
        <View style={styles.row}>
          <Pressable
            onPress={() => Linking.openURL('mailto:')}
            accessibilityRole="button"
            accessibilityLabel="Open email app"
            style={[styles.mailBtn, { borderColor: c.line, backgroundColor: c.surface }]}
          >
            <Text style={[styles.mailText, { color: c.ink }]}>Open mail app</Text>
          </Pressable>
          <Pressable
            onPress={resend}
            disabled={countdown > 0}
            accessibilityRole="button"
            accessibilityLabel="Resend verification email"
            style={{ opacity: countdown > 0 ? 0.5 : 1 }}
          >
            <Text style={[styles.resend, { color: c.ink }]}>
              Resend {countdown > 0 ? `${mm}:${ss}` : ''}
            </Text>
          </Pressable>
        </View>
      </CalmCard>
      <InkButton label="Continue to sign in" onPress={() => router.replace('/(auth)/login')} icon="arrow-right" />
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, alignSelf: 'flex-start' },
  backText: { fontFamily: fonts.semiBold, fontSize: 14 },
  hero: { alignItems: 'center', gap: 6 },
  check: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  title: { fontSize: 28, marginTop: 8 },
  sub: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  body: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  error: { fontFamily: fonts.medium, fontSize: 13, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  mailBtn: { borderWidth: 1.2, borderRadius: 999, paddingHorizontal: 18, minHeight: 46, justifyContent: 'center' },
  mailText: { fontFamily: fonts.bold, fontSize: 13 },
  resend: { fontFamily: fonts.semiBold, fontSize: 13, minHeight: 44, textAlignVertical: 'center' },
});
