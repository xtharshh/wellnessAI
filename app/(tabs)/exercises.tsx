import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { CalmCard, CalmScreen, InkButton, Serif, useCalm } from '@/src/components/calm/kit';
import { ArtTile, artForCategory } from '@/src/components/calm/art';
import { useExercises } from '@/src/hooks/useExercises';
import { fonts } from '@/src/theme/typography';

function tintFor(cat: string): 'sage' | 'lavender' | 'mint' | 'peach' {
  if (cat === 'sleep') return 'mint';
  if (cat === 'mindfulness') return 'lavender';
  if (cat === 'activity') return 'peach';
  return 'sage';
}

export default function ExercisesScreen() {
  const router = useRouter();
  const { c } = useCalm();
  const { data: exercises, isLoading, remove } = useExercises();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<Record<string, boolean>>({});

  const list = exercises ?? [];

  return (
    <CalmScreen>
      <Serif style={[styles.title, { color: c.ink }]}>Self-care practices</Serif>
      <Text style={[styles.sub, { color: c.muted }]}>
        {list.length ? `${list.length} guided practices in your library` : 'Your practice library'}
      </Text>

      <View style={styles.quickRow}>
        <Pressable
          onPress={() => router.push('/(tabs)/breath')}
          accessibilityRole="button"
          accessibilityLabel="Open meditation player"
          style={{ flex: 1 }}
        >
          <CalmCard tint="mint">
            <Feather name="anchor" size={20} color={c.ink} />
            <Text style={[styles.quickTitle, { color: c.ink }]}>Meditate</Text>
            <Text style={[styles.quickSub, { color: c.muted }]}>Guided sessions</Text>
          </CalmCard>
        </Pressable>
        <Pressable
          onPress={() => router.push('/perfect-plan')}
          accessibilityRole="button"
          accessibilityLabel="Open perfect plan"
          style={{ flex: 1 }}
        >
          <CalmCard tint="peach">
            <Feather name="zap" size={20} color={c.ink} />
            <Text style={[styles.quickTitle, { color: c.ink }]}>My Plan</Text>
            <Text style={[styles.quickSub, { color: c.muted }]}>Daily routine</Text>
          </CalmCard>
        </Pressable>
      </View>

      {isLoading ? (
        <CalmCard>
          <Text style={[styles.empty, { color: c.muted }]}>Loading your practices…</Text>
        </CalmCard>
      ) : null}

      {!isLoading && list.length === 0 ? (
        <CalmCard tint="lavender">
          <Text style={[styles.empty, { color: c.muted }]}>
            No practices yet. Generate recommendations or activate your Perfect Plan and they will appear here.
          </Text>
          <View style={{ marginTop: 12 }}>
            <InkButton label="Get recommendations" onPress={() => router.push('/(tabs)/recommendations')} />
          </View>
        </CalmCard>
      ) : null}

      {list.map((ex) => {
        const open = expandedId === ex.id;
        const done = !!doneIds[ex.id];
        return (
          <Pressable
            key={ex.id}
            onPress={() => setExpandedId(open ? null : ex.id)}
            accessibilityRole="button"
            accessibilityLabel={`Practice: ${ex.name}`}
          >
            <CalmCard tint={tintFor(ex.category)}>
              <View style={styles.cardHead}>
                <ArtTile kind={artForCategory(ex.category)} size={46} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exName, { color: c.ink }]}>{ex.name}</Text>
                  <Text style={[styles.exMeta, { color: c.muted }]}>
                    {ex.duration} • {ex.category}
                  </Text>
                </View>
                {done ? <Feather name="check-circle" size={20} color={c.ink} /> : null}
                <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
              </View>
              {open ? (
                <View style={styles.steps}>
                  {ex.steps.map((s, i) => (
                    <View key={i} style={styles.stepRow}>
                      <Text style={[styles.stepNum, { color: c.muted }]}>{i + 1}.</Text>
                      <Text style={[styles.stepText, { color: c.ink }]}>{s}</Text>
                    </View>
                  ))}
                  <Text style={[styles.why, { color: c.muted }]}>{ex.explanation}</Text>
                  <View style={styles.cardActions}>
                    <Pressable
                      onPress={() => setDoneIds((p) => ({ ...p, [ex.id]: !p[ex.id] }))}
                      accessibilityRole="button"
                      accessibilityLabel={done ? 'Mark as not done' : 'Mark as done'}
                      style={[styles.doneBtn, { backgroundColor: c.ink }]}
                    >
                      <Text style={[styles.doneText, { color: c.bg }]}>
                        {done ? 'Done ✓' : 'Mark done'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        Alert.alert('Delete practice?', ex.name, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(ex.id) },
                        ])
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${ex.name}`}
                      style={styles.deleteBtn}
                    >
                      <Feather name="trash-2" size={16} color={c.muted} />
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </CalmCard>
          </Pressable>
        );
      })}
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28 },
  sub: { fontFamily: fonts.regular, fontSize: 13, marginTop: -8 },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickTitle: { fontFamily: fonts.bold, fontSize: 15, marginTop: 8 },
  quickSub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  empty: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exName: { fontFamily: fonts.bold, fontSize: 15 },
  exMeta: { fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
  steps: { marginTop: 12, gap: 8 },
  stepRow: { flexDirection: 'row', gap: 8 },
  stepNum: { fontFamily: fonts.bold, fontSize: 13, width: 18 },
  stepText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  why: { fontFamily: fonts.regular, fontSize: 12, fontStyle: 'italic', lineHeight: 17, marginTop: 4 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  doneBtn: { borderRadius: 999, paddingHorizontal: 18, minHeight: 44, justifyContent: 'center' },
  doneText: { fontFamily: fonts.bold, fontSize: 13 },
  deleteBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
