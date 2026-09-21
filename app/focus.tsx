import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { CalmHeader, CalmScreen, InkButton, Serif, useCalm } from '@/src/components/calm/kit';
import { ArtTile } from '@/src/components/calm/art';
import { useAuthStore } from '@/src/stores/authStore';
import { createJournalEntry } from '@/src/services/journals';
import { fonts } from '@/src/theme/typography';

const DURATIONS = [15, 25, 50];

function GroveTree({ progress }: { progress: number }) {
  // progress 0..1 → seed, sprout, sapling, tree, canopy
  const h = 12 + progress * 78;
  const top = 190 - h;
  const canopy = progress >= 0.75;
  const sapling = progress >= 0.4;
  const sprout = progress >= 0.12;
  return (
    <Svg width={220} height={210} viewBox="0 0 220 210">
      <Ellipse cx={110} cy={198} rx={70} ry={12} fill="#CBD8B4" opacity={0.7} />
      <Path d="M78 200 L96 200 L92 178 L82 178 Z" fill="#B0714E" />
      {sprout ? (
        <Path d={`M110 196 C 108 ${196 - h * 0.5}, 110 ${196 - h * 0.7}, 110 ${top}`} stroke="#4E7A4E" strokeWidth={5} fill="none" strokeLinecap="round" />
      ) : (
        <Ellipse cx={110} cy={192} rx={9} ry={6} fill="#8A6B45" />
      )}
      {sprout && !sapling ? (
        <Path d={`M110 ${196 - h * 0.5} C 98 ${196 - h * 0.55}, 90 ${196 - h * 0.5}, 86 ${196 - h * 0.42} C 94 ${196 - h * 0.34}, 104 ${196 - h * 0.36}, 110 ${196 - h * 0.5} Z`} fill="#6FA06F" />
      ) : null}
      {sapling && !canopy ? (
        <>
          <Path d={`M110 ${196 - h * 0.4} C 96 ${196 - h * 0.5}, 88 ${196 - h * 0.48}, 82 ${196 - h * 0.38} C 92 ${196 - h * 0.28}, 104 ${196 - h * 0.3}, 110 ${196 - h * 0.4} Z`} fill="#6FA06F" />
          <Path d={`M110 ${196 - h * 0.62} C 124 ${196 - h * 0.72}, 132 ${196 - h * 0.7}, 138 ${196 - h * 0.6} C 128 ${196 - h * 0.5}, 116 ${196 - h * 0.52}, 110 ${196 - h * 0.62} Z`} fill="#7BAF7B" />
        </>
      ) : null}
      {canopy ? (
        <>
          <Circle cx={110} cy={top - 18} r={34} fill="#5E915E" />
          <Circle cx={88} cy={top - 6} r={22} fill="#6FA06F" />
          <Circle cx={132} cy={top - 6} r={22} fill="#6FA06F" />
          <Circle cx={98} cy={top - 26} r={10} fill="#7BAF7B" />
          <Circle cx={124} cy={top - 28} r={8} fill="#7BAF7B" />
        </>
      ) : null}
    </Svg>
  );
}

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function FocusScreen() {
  const router = useRouter();
  const { c } = useCalm();
  const user = useAuthStore((s) => s.user);
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [glances, setGlances] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = minutes * 60;
  const progress = 1 - remaining / total;

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (running && (s === 'background' || s === 'inactive')) {
        setGlances((g) => g + 1);
      }
    });
    return () => sub.remove();
  }, [running]);

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          setDone(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  const reset = (m?: number) => {
    const mm = m ?? minutes;
    setMinutes(mm);
    setRemaining(mm * 60);
    setRunning(false);
    setGlances(0);
    setDone(false);
  };

  const logSession = async () => {
    if (!user) return;
    try {
      await createJournalEntry(
        user.id,
        `Focused for ${minutes} minutes with ${glances} glance${glances === 1 ? '' : 's'}. Felt steady.`,
        72,
        'Focus'
      );
      Alert.alert('Logged ✦', 'Session saved to your journal.');
    } catch {
      Alert.alert('Could not log', 'Check your connection and try again.');
    }
  };

  return (
    <CalmScreen>
      <CalmHeader
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard'))}
      />
      <Serif style={[styles.title, { color: c.ink }]}>Focus Grove</Serif>
      <Text style={[styles.sub, { color: c.muted }]}>
        Stay a while — your tree grows only while you do.
      </Text>

      <View style={styles.stage}>
        <GroveTree progress={done ? 1 : progress} />
        <Text style={[styles.timer, { color: c.ink }]}>{fmt(remaining)}</Text>
        <Text style={[styles.glance, { color: c.muted }]}>
          {done ? 'Grove complete — beautiful focus.' : glances === 0 ? 'Undistracted so far' : `${glances} glance${glances === 1 ? '' : 's'} — no judgment`}
        </Text>
      </View>

      <View style={styles.durations}>
        {DURATIONS.map((m) => {
          const active = minutes === m && !running;
          return (
            <Pressable
              key={m}
              onPress={() => reset(m)}
              accessibilityRole="button"
              accessibilityLabel={`Focus for ${m} minutes`}
              style={[
                styles.chip,
                { backgroundColor: minutes === m ? c.ink : c.surface, borderColor: c.line },
              ]}
            >
              <Text style={[styles.chipText, { color: minutes === m ? c.bg : c.ink }]}>{m}m</Text>
            </Pressable>
          );
        })}
      </View>

      {!done ? (
        <InkButton
          label={running ? 'Pause grove' : remaining < total ? 'Resume grove' : 'Start focusing'}
          onPress={() => setRunning(!running)}
          icon={running ? 'pause' : 'play'}
        />
      ) : (
        <>
          <InkButton label="Log session to journal" onPress={logSession} icon="book-open" />
          <Pressable onPress={() => reset()} accessibilityRole="button" accessibilityLabel="Grow another tree" style={styles.again}>
            <Text style={[styles.againText, { color: c.ink }]}>Grow another tree →</Text>
          </Pressable>
        </>
      )}

      <View style={styles.tipRow}>
        <ArtTile kind="leaf" size={40} />
        <Text style={[styles.tip, { color: c.muted }]}>
          Silence notifications, sip water, and let the canopy do the rest.
        </Text>
      </View>
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, textAlign: 'center' },
  sub: { fontFamily: fonts.regular, fontSize: 13, textAlign: 'center', marginTop: -8 },
  stage: { alignItems: 'center', gap: 4 },
  timer: { fontFamily: fonts.bold, fontSize: 30, letterSpacing: 2 },
  glance: { fontFamily: fonts.medium, fontSize: 12 },
  durations: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  chip: {
    borderWidth: 1.2, borderRadius: 999, paddingHorizontal: 22, minHeight: 46,
    alignItems: 'center', justifyContent: 'center',
  },
  chipText: { fontFamily: fonts.bold, fontSize: 14 },
  again: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  againText: { fontFamily: fonts.semiBold, fontSize: 14 },
  tipRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  tip: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
});
