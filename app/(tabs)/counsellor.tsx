import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CalmCard,
  CalmScreen,
  InkButton,
  Serif,
  useCalm,
} from '@/src/components/calm/kit';
import { useWellnessSummary } from '@/src/hooks/useWellnessSummary';
import { useAuthStore } from '@/src/stores/authStore';
import { CRISIS_RESOURCES, getAppointments, getDoctors, type Appointment, type Doctor } from '@/src/services/doctor';
import { useExercises } from '@/src/hooks/useExercises';
import { fonts } from '@/src/theme/typography';

export default function CounsellorScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { c } = useCalm();
  const { data } = useWellnessSummary();
  const summary = data?.summary ?? null;
  const { data: exercises } = useExercises();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tab, setTab] = useState<'talk' | 'remote'>('talk');

  useEffect(() => {
    getDoctors().then(setDoctors).catch(() => setDoctors([]));
    if (user) getAppointments(user.id).then(setAppointments).catch(() => setAppointments([]));
  }, [user?.id]);

  const openUrl = async (url: string) => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
    } catch {}
  };

  return (
    <CalmScreen>
      <View style={styles.header}>
        <Serif style={[styles.title, { color: c.ink }]}>Counsellor</Serif>
        <Pressable
          onPress={() =>
            Alert.alert(
              'SOS — Crisis support',
              'Free & confidential help is available now.',
              CRISIS_RESOURCES.map((r) => ({ text: r.label, onPress: () => openUrl(r.url) }))
            )
          }
          accessibilityRole="button"
          accessibilityLabel="Emergency crisis support"
          style={styles.sosBtn}
        >
          <Text style={styles.sosText}>SOS</Text>
        </Pressable>
      </View>

      <View style={styles.topRow}>
        <Pressable
          onPress={() => router.push('/(tabs)/exercises')}
          accessibilityRole="button"
          accessibilityLabel="Open self care practices"
          style={{ flex: 1 }}
        >
          <CalmCard tint="sage">
            <Feather name="heart" size={18} color={c.ink} />
            <Text style={[styles.topTitle, { color: c.ink }]}>Self-care</Text>
            <Text style={[styles.topSub, { color: c.muted }]}>
              {(exercises || []).length} real practices
            </Text>
          </CalmCard>
        </Pressable>
        <Pressable
          onPress={() => setTab('remote')}
          accessibilityRole="button"
          accessibilityLabel="Open guided support"
          style={{ flex: 1 }}
        >
          <CalmCard tint="lavender">
            <Feather name="users" size={18} color={c.ink} />
            <Text style={[styles.topTitle, { color: c.ink }]}>Guided support</Text>
            <Text style={[styles.topSub, { color: c.muted }]}>
              {doctors.length ? `${doctors.length} live` : 'AI Doctor + SOS'}
            </Text>
          </CalmCard>
        </Pressable>
      </View>

      <View style={styles.pills}>
        {(['talk', 'remote'] as const).map((t) => {
          const active = tab === t;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              accessibilityRole="button"
              accessibilityLabel={t === 'talk' ? 'Talk to AI Doctor' : 'Remote wellness'}
              style={[
                styles.pill,
                { backgroundColor: active ? c.ink : c.surface, borderColor: c.line },
              ]}
            >
              <Text style={[styles.pillText, { color: active ? c.bg : c.ink }]}>
                {t === 'talk' ? 'Talk' : 'Remote wellness'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'talk' ? (
        <CalmCard tint="mint">
          <Text style={[styles.aiEyebrow, { color: c.muted }]}>AI DOCTOR • REAL CONTEXT</Text>
          <Serif style={[styles.aiTitle, { color: c.ink }]}>Hi, I am your AI Doctor.</Serif>
          <Text style={[styles.aiSub, { color: c.muted }]}>
            {summary
              ? `I see mood ${summary.moodScore}, sleep ${summary.sleepHours}h, stress ${summary.stressIndex} (${summary.riskLevel}). Triage, not diagnosis.`
              : 'No real history yet — general guidance until telemetry syncs. Nothing is guessed.'}
          </Text>
          <View style={{ marginTop: 10 }}>
            <InkButton label="Start AI consult" onPress={() => router.push('/(tabs)/chat?mode=doctor')} icon="arrow-right" />
          </View>
          <Text style={[styles.disclaimer, { color: c.muted }]}>
            AI triage only — not a diagnosis. High risk? Use SOS or book live.
          </Text>
        </CalmCard>
      ) : (
        <View style={{ gap: 12 }}>
          {doctors.length === 0 ? (
            <CalmCard tint="peach">
              <Serif style={[styles.aiTitle, { color: c.ink }]}>No live doctors yet</Serif>
              <Text style={[styles.aiSub, { color: c.muted }]}>
                The live directory is empty. Add clinicians to your Neon `doctors` table to publish them here — nothing is hardcoded.
              </Text>
              <View style={{ marginTop: 10 }}>
                <InkButton label="Talk to AI Doctor" onPress={() => router.push('/(tabs)/chat?mode=doctor')} />
              </View>
            </CalmCard>
          ) : null}
          {doctors.map((d) => (
            <CalmCard key={d.id}>
              <Text style={[styles.aiTitle, { color: c.ink, fontFamily: fonts.bold, fontSize: 16 }]}>{d.displayName}</Text>
              <Text style={[styles.aiSub, { color: c.muted }]}>
                {d.specialty}{d.bio ? ` • ${d.bio}` : ''}
              </Text>
              <View style={{ marginTop: 10 }}>
                <InkButton
                  label="Book session"
                  onPress={() => router.push({ pathname: '/doctor-book' as any, params: { doctorId: d.id } })}
                />
              </View>
            </CalmCard>
          ))}
          {appointments.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={[styles.topTitle, { color: c.ink }]}>Your sessions</Text>
              {appointments.map((a) => (
                <CalmCard key={a.id}>
                  <Text style={[styles.topSub, { color: c.muted }]}>
                    {new Date(a.scheduledAt).toLocaleString()} • {a.mode} • {a.status}
                  </Text>
                </CalmCard>
              ))}
            </View>
          ) : null}
        </View>
      )}
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28 },
  sosBtn: {
    backgroundColor: '#B4432B',
    paddingHorizontal: 16,
    minHeight: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  topRow: { flexDirection: 'row', gap: 12 },
  topTitle: { fontFamily: fonts.bold, fontSize: 15, marginTop: 8 },
  topSub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  pills: { flexDirection: 'row', gap: 8 },
  pill: {
    paddingHorizontal: 18,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { fontFamily: fonts.bold, fontSize: 13 },
  aiEyebrow: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.2 },
  aiTitle: { fontSize: 20, marginTop: 4 },
  aiSub: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 6 },
  disclaimer: { fontFamily: fonts.regular, fontSize: 11, marginTop: 8 },
});
