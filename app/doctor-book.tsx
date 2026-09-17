import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { CalmHeader, CalmScreen, InkButton, Serif, useCalm } from '@/src/components/calm/kit';
import { useAuthStore } from '@/src/stores/authStore';
import { bookAppointment } from '@/src/services/doctor';
import { fonts } from '@/src/theme/typography';

const MODES = ['video', 'chat', 'in_person'] as const;

export default function DoctorBookScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ doctorId?: string }>();
  const user = useAuthStore((s) => s.user);
  const { c } = useCalm();
  const [mode, setMode] = useState<(typeof MODES)[number]>('video');
  const [daysAhead, setDaysAhead] = useState(1);
  const [saving, setSaving] = useState(false);

  const handleBook = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const scheduledAt = new Date(Date.now() + daysAhead * 86400000);
      scheduledAt.setHours(10, 0, 0, 0);
      const appt = await bookAppointment(user.id, {
        doctorId: params.doctorId ?? null,
        scheduledAt: scheduledAt.toISOString(),
        mode,
        note: 'Booked from Counsellor tab',
      });
      if (!appt) throw new Error('Booking table missing. Run NEON_SCHEMA.sql against your database.');
      Alert.alert('Requested', `Session requested for ${scheduledAt.toLocaleString()} (${mode.replace('_', ' ')}).`, [
        { text: 'Back to Counsellor', onPress: () => router.replace('/(tabs)/counsellor' as any) },
      ]);
    } catch (e) {
      Alert.alert('Booking failed', e instanceof Error ? e.message : 'Could not book.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <CalmScreen>
      <CalmHeader onBack={() => router.back()} />
      <Serif style={[styles.title, { color: c.ink }]}>Book a live session</Serif>
      <Text style={[styles.sub, { color: c.muted }]}>
        A real booking in your Neon database.{' '}
        {params.doctorId ? 'Clinician selected.' : 'General request — first available clinician.'}
      </Text>

      <Text style={[styles.label, { color: c.muted }]}>SESSION MODE</Text>
      <View style={styles.row}>
        {MODES.map((m) => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              accessibilityRole="button"
              style={[styles.chip, { backgroundColor: active ? c.ink : c.surface, borderColor: c.line }]}
            >
              <Text style={[styles.chipText, { color: active ? c.bg : c.ink }]}>
                {m.replace('_', ' ')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: c.muted }]}>WHEN</Text>
      <View style={styles.row}>
        {[1, 2, 3, 7].map((d) => {
          const active = daysAhead === d;
          return (
            <Pressable
              key={d}
              onPress={() => setDaysAhead(d)}
              accessibilityRole="button"
              style={[styles.chip, { backgroundColor: active ? c.ink : c.surface, borderColor: c.line }]}
            >
              <Text style={[styles.chipText, { color: active ? c.bg : c.ink }]}>+{d}d</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: 12 }}>
        <InkButton
          label={saving ? 'Requesting…' : 'Request session'}
          onPress={handleBook}
        />
      </View>
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, textAlign: 'center' },
  sub: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  label: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.4, marginTop: 8 },
  row: { flexDirection: 'row', gap: 8, marginTop: 6 },
  chip: {
    borderWidth: 1.2, borderRadius: 999, paddingHorizontal: 16, minHeight: 46,
    alignItems: 'center', justifyContent: 'center',
  },
  chipText: { fontFamily: fonts.bold, fontSize: 13, textTransform: 'capitalize' },
});
