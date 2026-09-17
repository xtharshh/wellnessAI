import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CalmCard, CalmScreen, InkButton, Serif, useCalm } from '@/src/components/calm/kit';
import { AppLogo } from '@/src/components/ui/AppLogo';
import { useAuthStore } from '@/src/stores/authStore';
import { fonts } from '@/src/theme/typography';

const ITEMS = [
  { icon: 'lock', text: 'Encrypted. Your data is never sold or shared.' },
  { icon: 'eye', text: 'You choose exactly which signals the app monitors.' },
  { icon: 'shield', text: 'Behavioral patterns stay on-device by default.' },
  { icon: 'upload', text: 'All exports and sharing are always explicit opt-in.' },
] as const;

export default function PrivacyOnboardingScreen() {
  const router = useRouter();
  const acceptPrivacy = useAuthStore((state) => state.acceptPrivacy);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const { c } = useCalm();

  const handleAccept = async () => {
    await acceptPrivacy();
    await completeOnboarding();
    router.replace('/(tabs)/dashboard');
  };

  return (
    <CalmScreen>
      <View style={styles.hero}>
        <AppLogo size={64} />
        <Serif style={[styles.title, { color: c.ink }]}>Your privacy, first</Serif>
        <Text style={[styles.sub, { color: c.muted }]}>
          MindTrace observes quietly — and only with your permission.
        </Text>
      </View>
      {ITEMS.map((it) => (
        <CalmCard key={it.icon}>
          <View style={styles.row}>
            <View style={[styles.icon, { backgroundColor: c.limeSoft }]}>
              <Feather name={it.icon} size={17} color={c.limeInk} />
            </View>
            <Text style={[styles.text, { color: c.ink }]}>{it.text}</Text>
          </View>
        </CalmCard>
      ))}
      <InkButton label="I understand — continue" onPress={handleAccept} icon="arrow-right" />
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 6, marginTop: 20 },
  title: { fontSize: 29, marginTop: 10, textAlign: 'center' },
  sub: { fontFamily: fonts.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
});
