import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CalmCard, Serif, useCalm } from '@/src/components/calm/kit';
import { Art, ArtKind } from '@/src/components/calm/art';
import { useAuthStore } from '@/src/stores/authStore';
import { useRecommendations } from '@/src/hooks/useRecommendations';
import { useWellnessSummary } from '@/src/hooks/useWellnessSummary';
import { createJournalEntry } from '@/src/services/journals';
import { useQueryClient } from '@tanstack/react-query';
import { fonts } from '@/src/theme/typography';

// ─── One Thing for Today ───────────────────────────────────────────

export function OneThing() {
  const { c } = useCalm();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { data: recs, complete, dismiss } = useRecommendations();
  const [snoozed, setSnoozed] = useState<string | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);

  const open = (recs ?? []).find((r) => !r.completed && r.id !== snoozed) ?? null;
  useEffect(() => {
    (async () => {
      if (!open) return;
      try {
        const s = await AsyncStorage.getItem(`mindtrace_onething_snooze_${open.id}`);
        if (s === new Date().toISOString().slice(0, 10)) setSnoozed(open.id);
      } catch {}
    })();
  }, [open?.id]);

  if (!open || snoozed === open.id) return null;

  const whyText =
    open.category === 'sleep'
      ? 'Picked because rest shapes tomorrow more than anything else you do today.'
      : open.category === 'mindfulness'
        ? 'Picked because your tension signals are asking for one pause.'
        : open.category === 'activity'
          ? 'Picked because movement is the fastest lever on mood and sleep.'
          : 'Picked as the smallest useful step for today.';

  const later = async () => {
    try {
      await AsyncStorage.setItem(
        `mindtrace_onething_snooze_${open.id}`,
        new Date().toISOString().slice(0, 10)
      );
    } catch {}
    setSnoozed(open.id);
  };

  return (
    <CalmCard tint="peach">
      <Text style={[styles.eyebrow, { color: c.muted }]}>ONE THING FOR TODAY</Text>
      <Serif style={[styles.oneTitle, { color: c.ink }]}>{open.title}</Serif>
      {whyOpen ? <Text style={[styles.why, { color: c.muted }]}>{whyText}</Text> : null}
      <View style={styles.oneRow}>
        <Pressable
          onPress={() => {
            complete.mutate(open.id);
            queryClient.invalidateQueries({ queryKey: ['garden', user?.id] });
          }}
          accessibilityRole="button"
          accessibilityLabel="Mark today's thing done"
          style={[styles.oneBtn, { backgroundColor: c.ink }]}
        >
          <Text style={[styles.oneBtnText, { color: c.bg }]}>Done</Text>
        </Pressable>
        <Pressable
          onPress={later}
          accessibilityRole="button"
          accessibilityLabel="Do it later"
          style={[styles.oneBtn, { backgroundColor: c.surface }]}
        >
          <Text style={[styles.oneBtnText, { color: c.ink }]}>Later</Text>
        </Pressable>
        <Pressable
          onPress={() => dismiss.mutate(open.id)}
          accessibilityRole="button"
          accessibilityLabel="Not useful"
          style={styles.oneGhost}
        >
          <Text style={[styles.oneGhostText, { color: c.muted }]}>Not useful</Text>
        </Pressable>
        <Pressable
          onPress={() => setWhyOpen(!whyOpen)}
          accessibilityRole="button"
          accessibilityLabel="Why this recommendation"
          style={styles.oneGhost}
        >
          <Text style={[styles.oneGhostText, { color: c.muted }]}>Why this?</Text>
        </Pressable>
      </View>
    </CalmCard>
  );
}

// ─── Emotion Weather ───────────────────────────────────────────────

function weatherFor(summary: any): { label: string; line: string; art: ArtKind } {
  if (!summary) return { label: 'Gathering skies', line: 'Your forecast appears with history.', art: 'leaf' };
  if (summary.stressIndex >= 65)
    return { label: 'Storm brewing', line: 'High pressure right now — one small shelter first.', art: 'bolt' };
  if (summary.moodScore < 45)
    return { label: 'Overcast', line: 'Grey skies pass. Be extra kind today.', art: 'cloudRain' };
  if (summary.sleepHours < 6)
    return { label: 'Foggy morning', line: 'Low rest — drift gently, no big waves.', art: 'waves' };
  if (summary.moodScore >= 70)
    return { label: 'Sunny spells', line: 'Clear and steady — good day to build.', art: 'sun' };
  return { label: 'Fair skies', line: 'Mild and steady — good soil for small steps.', art: 'leaf' };
}

export function WeatherStrip() {
  const { c } = useCalm();
  const { data } = useWellnessSummary();
  const w = weatherFor(data?.summary ?? null);
  return (
    <CalmCard>
      <View style={styles.wRow}>
        <Art kind={w.art} size={56} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: c.muted }]}>TODAY'S EMOTION WEATHER</Text>
          <Serif style={[styles.wTitle, { color: c.ink }]}>{w.label}</Serif>
          <Text style={[styles.wLine, { color: c.muted }]}>{w.line}</Text>
        </View>
      </View>
    </CalmCard>
  );
}

// ─── Daily flip card ───────────────────────────────────────────────

const AFFIRM = [
  'You are allowed to go slowly today.',
  'Rest is productive too.',
  'Small steps still count.',
  'Your future self is cheering.',
  'Breathe in courage, out doubt.',
];
const MICRO = [
  'Drink a full glass of water, slowly.',
  'Step outside for 60 seconds of sky.',
  'Text one person a kind word.',
  'Stretch your neck side to side, 5 times.',
  'Write down one thing that went right.',
];

export function FlipCard() {
  const { c } = useCalm();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [flipped, setFlipped] = useState(false);
  const [planted, setPlanted] = useState(false);
  const rot = useSharedValue(0);

  const day = new Date().getDate();
  const affirm = AFFIRM[day % AFFIRM.length];
  const micro = MICRO[day % MICRO.length];

  const flip = () => {
    const to = flipped ? 0 : 180;
    rot.value = withTiming(to, { duration: 450 });
    setFlipped(!flipped);
  };
  const front = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rot.value}deg` }],
    opacity: rot.value > 90 ? 0 : 1,
  }));
  const back = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rot.value + 180}deg` }],
    opacity: rot.value > 90 ? 1 : 0,
  }));

  const plant = async () => {
    if (!user || planted) return;
    try {
      await createJournalEntry(user.id, `Grateful moment: ${micro}`, 78, 'Grateful');
      setPlanted(true);
      queryClient.invalidateQueries({ queryKey: ['garden', user.id] });
      Alert.alert('Planted ✦', 'A star blooms in your garden tonight.');
    } catch {
      Alert.alert('Could not plant', 'Check your connection and try again.');
    }
  };

  return (
    <Pressable onPress={flip} accessibilityRole="button" accessibilityLabel="Flip today's card">
      <CalmCard tint="lavender">
        <View style={styles.flipWrap}>
          <Animated.View style={[styles.flipFace, front]}>
            <Text style={[styles.eyebrow, { color: c.muted }]}>TODAY'S CARD • TAP TO FLIP</Text>
            <Serif style={[styles.flipTitle, { color: c.ink }]}>“{affirm}”</Serif>
          </Animated.View>
          <Animated.View style={[styles.flipFace, styles.flipBack, back]}>
            <Text style={[styles.eyebrow, { color: c.muted }]}>YOUR MICRO-MOVE</Text>
            <Serif style={[styles.flipTitle, { color: c.ink }]}>{micro}</Serif>
            <Pressable
              onPress={plant}
              disabled={planted}
              accessibilityRole="button"
              accessibilityLabel="Plant this moment in the garden"
              style={[styles.plantBtn, { backgroundColor: c.ink, opacity: planted ? 0.55 : 1 }]}
            >
              <Feather name="star" size={14} color={c.bg} />
              <Text style={[styles.plantText, { color: c.bg }]}>
                {planted ? 'Planted ✦' : 'Plant it ✦'}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </CalmCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.4 },
  oneTitle: { fontSize: 19, lineHeight: 24, marginTop: 4 },
  why: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 6 },
  oneRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  oneBtn: { borderRadius: 999, paddingHorizontal: 18, minHeight: 44, justifyContent: 'center' },
  oneBtnText: { fontFamily: fonts.bold, fontSize: 13 },
  oneGhost: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 },
  oneGhostText: { fontFamily: fonts.semiBold, fontSize: 12 },
  wRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wTitle: { fontSize: 21, marginTop: 2 },
  wLine: { fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
  flipWrap: { minHeight: 150, justifyContent: 'center' },
  flipFace: { gap: 6 },
  flipBack: { position: 'absolute', left: 0, right: 0, top: 0 },
  flipTitle: { fontSize: 19, lineHeight: 25 },
  plantBtn: {
    flexDirection: 'row', gap: 6, alignSelf: 'flex-start', alignItems: 'center',
    borderRadius: 999, paddingHorizontal: 16, minHeight: 42, marginTop: 8,
  },
  plantText: { fontFamily: fonts.bold, fontSize: 13 },
});
