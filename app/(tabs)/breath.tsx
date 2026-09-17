import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  BreathHalo,
  CalmHeader,
  CalmScreen,
  MeditateArt,
  PoweredByAI,
  Serif,
  useCalm,
  Waveform,
} from '@/src/components/calm/kit';
import { fonts } from '@/src/theme/typography';

const SESSIONS = [
  { title: 'Meditation Stress Relaxation', seconds: 162, hint: 'Box breathing 4-4-4-4' },
  { title: 'Deep Sleep Wind Down', seconds: 180, hint: '4-7-8 breathing cadence' },
  { title: 'Morning Energy Reset', seconds: 120, hint: 'Energizing breath cycle' },
];

function fmt(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function BreathScreen() {
  const router = useRouter();
  const { c } = useCalm();
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(SESSIONS[0].seconds);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const session = SESSIONS[index];
  const progress = 1 - remaining / session.seconds;

  useEffect(() => {
    if (playing) {
      timer.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            setPlaying(false);
            Alert.alert('Session complete', 'Beautifully done. Notice how your body feels right now.');
            return session.seconds;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, session.seconds]);

  const pick = (i: number) => {
    const n = (i + SESSIONS.length) % SESSIONS.length;
    setIndex(n);
    setRemaining(SESSIONS[n].seconds);
    setPlaying(false);
  };

  return (
    <CalmScreen contentStyle={styles.scroll}>
      <CalmHeader
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard'))}
        onSearch={() => router.push('/(tabs)/exercises')}
        onBell={() => router.push('/(tabs)/dashboard')}
      />

      <PoweredByAI />

      <Serif style={[styles.title, { color: c.ink }]}>{session.title}</Serif>
      <Text style={[styles.hint, { color: c.muted }]}>{session.hint}</Text>
      <Text style={[styles.timer, { color: c.ink }]}>{fmt(remaining)}</Text>

      <Waveform progress={progress} playing={playing} width={320} />

      <View style={styles.artWrap}>
        <BreathHalo active={playing} size={260} />
        <View style={styles.artOverlay}>
          <MeditateArt size={230} />
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={() => setRemaining((r) => Math.max(0, r - 10))}
          accessibilityRole="button"
          accessibilityLabel="Back 10 seconds"
          style={[styles.stepBtn, { borderColor: c.line, backgroundColor: c.surface }]}
        >
          <Feather name="rotate-ccw" size={15} color={c.ink} />
          <Text style={[styles.stepText, { color: c.ink }]}>10</Text>
        </Pressable>

        <Pressable
          onPress={() => setPlaying(!playing)}
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause session' : 'Start session'}
          style={styles.playWrap}
        >
          <LinearGradient
            colors={['#B9D46A', '#7BAF7B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.playBtn}
          >
            <Feather name={playing ? 'pause' : 'square'} size={26} color="#fff" />
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => pick(index + 1)}
          accessibilityRole="button"
          accessibilityLabel="Next session"
          style={[styles.stepBtn, { borderColor: c.line, backgroundColor: c.surface }]}
        >
          <Feather name="chevron-right" size={18} color={c.ink} />
        </Pressable>
      </View>

      <View style={styles.sessionRow}>
        {SESSIONS.map((s, i) => (
          <Pressable
            key={s.title}
            onPress={() => pick(i)}
            accessibilityRole="button"
            accessibilityLabel={`Play ${s.title}`}
            style={[
              styles.sessionChip,
              {
                backgroundColor: i === index ? c.ink : c.surface,
                borderColor: i === index ? c.ink : c.line,
              },
            ]}
          >
            <Text style={[styles.sessionText, { color: i === index ? c.bg : c.ink }]}>
              {fmt(s.seconds)}
            </Text>
          </Pressable>
        ))}
      </View>
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { alignItems: 'center' },
  title: { fontSize: 29, lineHeight: 36, textAlign: 'center', marginTop: 8 },
  hint: { fontFamily: fonts.medium, fontSize: 13, textAlign: 'center' },
  timer: { fontFamily: fonts.bold, fontSize: 17, letterSpacing: 1, marginTop: 6 },
  artWrap: { marginVertical: 6, alignItems: 'center', justifyContent: 'center' },
  artOverlay: { position: 'absolute' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 26,
    marginTop: 4,
  },
  stepBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 1,
  },
  stepText: { fontFamily: fonts.bold, fontSize: 13 },
  playWrap: { padding: 4 },
  playBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  sessionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  sessionChip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionText: { fontFamily: fonts.bold, fontSize: 13 },
});
