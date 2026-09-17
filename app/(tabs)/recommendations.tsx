import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  CalmCard,
  CalmImage,
  CalmScreen,
  EmptyArt,
  InkButton,
  Serif,
  useCalm,
} from '@/src/components/calm/kit';
import { useRecommendations } from '@/src/hooks/useRecommendations';
import { fonts } from '@/src/theme/typography';

const CATS = ['all', 'books', 'movies', 'songs', 'podcasts', 'meditation', 'productivity', 'stress-relief'] as const;

export default function RecommendationsScreen() {
  const router = useRouter();
  const { c } = useCalm();
  const { data: recs, isLoading, complete, dismiss, regenerate, lifestyleRecs } = useRecommendations();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const plans = recs ?? [];
  const lifestyle = (lifestyleRecs ?? []).filter((i) => (filter === 'all' ? true : i.category === filter));

  const openLink = async (url?: string) => {
    if (!url) return;
    try {
      if (await Linking.canOpenURL(url)) await Linking.openURL(url);
    } catch {}
  };

  return (
    <CalmScreen>
      <Serif style={[styles.title, { color: c.ink }]}>Today's action plans</Serif>
      <Text style={[styles.sub, { color: c.muted }]}>
        Generated from your real signals •{' '}
        <Text style={{ color: c.ink, fontFamily: fonts.semiBold }} onPress={() => router.push('/ai-insights')}>
          view analytics →
        </Text>
      </Text>

      {isLoading ? (
        <CalmCard>
          <Text style={[styles.body, { color: c.muted }]}>Reading your patterns…</Text>
        </CalmCard>
      ) : null}

      {!isLoading && plans.length === 0 ? (
        <CalmCard tint="sage">
          <View style={{ alignItems: 'center', gap: 8 }}>
            <EmptyArt kind="sun" size={100} />
            <Text style={[styles.body, { color: c.muted, textAlign: 'center' }]}>
              No active plans. Sync telemetry or journal, then generate your first real set.
            </Text>
            <InkButton label="Generate plans" onPress={() => regenerate.mutate()} />
          </View>
        </CalmCard>
      ) : null}

      {plans.map((rec) => {
        let details: { description?: string; exercise?: any } = {};
        try {
          details = JSON.parse(rec.body);
        } catch {
          details = { description: rec.body };
        }
        const open = expandedId === rec.id;
        return (
          <Pressable key={rec.id} onPress={() => setExpandedId(open ? null : rec.id)} accessibilityRole="button">
            <CalmCard>
              <View style={styles.planHead}>
                <View style={[styles.catPill, { backgroundColor: c.limeSoft }]}>
                  <Text style={[styles.catText, { color: c.limeInk }]}>{rec.category}</Text>
                </View>
                <Text style={[styles.planTitle, { color: c.ink }]}>{rec.title}</Text>
                <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
              </View>
              {open ? (
                <View style={styles.planBody}>
                  {details.description ? (
                    <Text style={[styles.body, { color: c.muted }]}>{details.description}</Text>
                  ) : null}
                  {details.exercise ? (
                    <View style={[styles.exBox, { backgroundColor: c.bg, borderColor: c.line }]}>
                      <Text style={[styles.exName, { color: c.ink }]}>{details.exercise.name}</Text>
                      <Text style={[styles.exMeta, { color: c.muted }]}>{details.exercise.duration}</Text>
                      {(details.exercise.steps ?? []).map((s: string, i: number) => (
                        <Text key={i} style={[styles.step, { color: c.ink }]}>
                          {i + 1}. {s}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  <View style={styles.planActions}>
                    {rec.completed ? (
                      <Text style={[styles.doneTag, { color: c.muted }]}>Completed ✓</Text>
                    ) : (
                      <Pressable
                        onPress={() => complete.mutate(rec.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Complete ${rec.title}`}
                        style={[styles.doneBtn, { backgroundColor: c.ink }]}
                      >
                        <Text style={[styles.doneBtnText, { color: c.bg }]}>Mark done</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => dismiss.mutate(rec.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Dismiss ${rec.title}`}
                      style={styles.dismissBtn}
                    >
                      <Feather name="x" size={16} color={c.muted} />
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </CalmCard>
          </Pressable>
        );
      })}

      <View style={styles.lifeHead}>
        <Serif style={[styles.lifeTitle, { color: c.ink }]}>Tool packs for you</Serif>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
        {CATS.map((cat) => {
          const active = filter === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => setFilter(cat)}
              accessibilityRole="button"
              style={[
                styles.pill,
                { backgroundColor: active ? c.ink : c.surface, borderColor: c.line },
              ]}
            >
              <Text style={[styles.pillText, { color: active ? c.bg : c.ink }]}>
                {cat === 'all' ? 'All' : cat.replace('-', ' ')}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
        {lifestyle.map((item) => (
          <Pressable key={item.id} onPress={() => openLink(item.linkUrl)} accessibilityRole="button">
            <View style={[styles.lifeCard, { backgroundColor: c.surface, borderColor: c.line }]}>
              <CalmImage uri={item.imageUrl} style={styles.lifeImage} rounded={14} />
              <Text style={[styles.lifeCat, { color: c.muted }]}>{item.category.toUpperCase()}</Text>
              <Text style={[styles.lifeName, { color: c.ink }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.lifeCreator, { color: c.muted }]} numberOfLines={1}>
                {item.creator}
              </Text>
            </View>
          </Pressable>
        ))}
        {lifestyle.length === 0 ? (
          <CalmCard>
            <Text style={[styles.body, { color: c.muted }]}>Nothing here yet for this shelf.</Text>
          </CalmCard>
        ) : null}
      </ScrollView>
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28 },
  sub: { fontFamily: fonts.regular, fontSize: 13, marginTop: -8 },
  body: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  catText: { fontFamily: fonts.bold, fontSize: 10, textTransform: 'uppercase' },
  planTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 14 },
  planBody: { marginTop: 10, gap: 10 },
  exBox: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 6 },
  exName: { fontFamily: fonts.bold, fontSize: 14 },
  exMeta: { fontFamily: fonts.medium, fontSize: 11 },
  step: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  planActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  doneBtn: { borderRadius: 999, paddingHorizontal: 18, minHeight: 44, justifyContent: 'center' },
  doneBtnText: { fontFamily: fonts.bold, fontSize: 13 },
  doneTag: { fontFamily: fonts.semiBold, fontSize: 13 },
  dismissBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  lifeHead: { marginTop: 6 },
  lifeTitle: { fontSize: 22 },
  pills: { gap: 8, paddingVertical: 4 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, minHeight: 40, justifyContent: 'center', marginRight: 2 },
  pillText: { fontFamily: fonts.bold, fontSize: 12, textTransform: 'capitalize' },
  cards: { gap: 12, paddingBottom: 4 },
  lifeCard: { width: 170, borderWidth: 1, borderRadius: 20, padding: 10, gap: 4, marginRight: 2 },
  lifeImage: { width: '100%', height: 110 },
  lifeCat: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.8, marginTop: 4 },
  lifeName: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 18 },
  lifeCreator: { fontFamily: fonts.regular, fontSize: 12 },
});
