import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalmCard, CalmScreen, InkButton, Serif, useCalm } from '@/src/components/calm/kit';
import { AppLogo } from '@/src/components/ui/AppLogo';
import { fonts } from '@/src/theme/typography';

const FEATURES = [
  {
    icon: 'activity' as const,
    tint: 'sage' as const,
    title: 'Passive monitoring',
    body: 'Typing rhythm, motion and rest patterns become live mood, sleep, activity and stress signals. Nothing to log.',
  },
  {
    icon: 'cpu' as const,
    tint: 'lavender' as const,
    title: 'Explainable AI insights',
    body: 'Sleep–mood links, focus and burnout indicators — always computed from your real history, never mocked.',
  },
  {
    icon: 'zap' as const,
    tint: 'peach' as const,
    title: 'Plans that adapt',
    body: 'Your Perfect Plan calibrates to your patterns, with breathwork, meditation and exercises built in.',
  },
  {
    icon: 'users' as const,
    tint: 'mint' as const,
    title: 'AI Doctor + counsellors',
    body: 'Triage with real context any time, book a human clinician, and journal your journey day by day.',
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const { c } = useCalm();

  return (
    <CalmScreen>
      <View style={styles.hero}>
        <AppLogo size={84} />
        <Serif style={[styles.brand, { color: c.ink }]}>MindTrace</Serif>
        <Text style={[styles.tagline, { color: c.muted }]}>THE QUIET OBSERVER</Text>
        <Serif style={[styles.headline, { color: c.ink }]}>
          Wellness that watches over you — quietly.
        </Serif>
        <Text style={[styles.sub, { color: c.muted }]}>
          Everyday behavioral signals become calm, clinical-grade guidance for
          sleep, mood, focus and stress.
        </Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((f) => (
          <CalmCard key={f.title} tint={f.tint}>
            <View style={styles.featureRow}>
              <Feather name={f.icon} size={20} color={c.ink} />
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: c.ink }]}>{f.title}</Text>
                <Text style={[styles.featureBody, { color: c.muted }]}>{f.body}</Text>
              </View>
            </View>
          </CalmCard>
        ))}
      </View>

      <CalmCard>
        <View style={styles.privacyRow}>
          <Feather name="shield" size={16} color={c.ink} />
          <Text style={[styles.privacyText, { color: c.muted }]}>
            Privacy-first: explicit consent, on-device telemetry, nothing
            simulated. Your data, your control.
          </Text>
        </View>
      </CalmCard>

      <View style={styles.cta}>
        <InkButton label="Get Started" onPress={() => router.push('/(auth)/signup')} icon="arrow-right" />
        <Pressable
          onPress={() => router.push('/(auth)/login')}
          accessibilityRole="button"
          accessibilityLabel="Sign in to existing account"
          style={styles.signin}
        >
          <Text style={[styles.signinText, { color: c.ink }]}>I already have an account</Text>
        </Pressable>
      </View>
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 6, marginTop: 20 },
  brand: { fontSize: 34, marginTop: 12 },
  tagline: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 3 },
  headline: { fontSize: 21, lineHeight: 27, textAlign: 'center', marginTop: 10 },
  sub: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  features: { gap: 12 },
  featureRow: { flexDirection: 'row', gap: 12 },
  featureText: { flex: 1, gap: 4 },
  featureTitle: { fontFamily: fonts.bold, fontSize: 15 },
  featureBody: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  privacyRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  privacyText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  cta: { gap: 4, marginTop: 4 },
  signin: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  signinText: { fontFamily: fonts.semiBold, fontSize: 14 },
});
