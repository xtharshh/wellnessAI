import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import {
  CalmCard,
  CalmScreen,
  EmotionChips,
  EMOTIONS,
  EmptyArt,
  InkButton,
  Serif,
  useCalm,
} from '@/src/components/calm/kit';
import { useAuthStore } from '@/src/stores/authStore';
import { createJournalEntry, getJournals, type JournalEntry } from '@/src/services/journals';
import { getSnapshots } from '@/src/services/wellness';
import { apiFetch } from '@/src/services/apiClient';
import { fonts } from '@/src/theme/typography';

function Botanical() {
  return (
    <Svg width={92} height={104} viewBox="0 0 92 104">
      <Path d="M46 100 C 44 70, 46 44, 52 20" stroke="#4E7A4E" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M48 78 C 34 70, 24 70, 14 76 C 24 84, 38 84, 48 78 Z" fill="#6FA06F" />
      <Path d="M49 60 C 61 50, 71 50, 79 56 C 71 64, 59 64, 49 60 Z" fill="#6FA06F" />
      <Path d="M47 92 C 59 86, 69 86, 77 92 C 69 98, 57 98, 47 92 Z" fill="#5E915E" />
      <Circle cx={62} cy={26} r={9} fill="#E8A0BF" />
      <Circle cx={56} cy={22} r={3.5} fill="#F2C4D8" />
      <Circle cx={68} cy={22} r={3.5} fill="#F2C4D8" />
      <Circle cx={62} cy={28} r={3} fill="#C96A8E" />
      <Circle cx={30} cy={40} r={6} fill="#E8B84B" />
      <Circle cx={30} cy={40} r={2.4} fill="#9A6B1E" />
    </Svg>
  );
}

const TILE_ICONS = ['message-circle', 'sun', 'moon', 'heart', 'star'] as const;
const TILE_TINTS = ['lavender', 'periwinkle', 'mint', 'peach'] as const;

export default function JournalScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { c } = useCalm();

  const [selected, setSelected] = useState<string>('Happy');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const load = async () => {
    if (!user) return;
    setEntries(await getJournals(user.id));
  };
  useEffect(() => {
    load().catch(() => {});
  }, [user?.id]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'MT';

  const handleSave = async () => {
    if (!user) return;
    if (!text.trim()) {
      Alert.alert('Write something', 'Journal text is required.');
      return;
    }
    const emo = EMOTIONS.find((e) => e.tag === selected) ?? EMOTIONS[0];
    setSaving(true);
    try {
      await createJournalEntry(user.id, text.trim(), emo.score, emo.tag);
      const history = await getSnapshots(user.id, 365);
      const last = history[history.length - 1];
      const stress =
        emo.tag === 'Stressed' ? 70 : emo.tag === 'Sad' ? 60 : emo.tag === 'Angry' ? 65 : 35;
      await apiFetch('/api/snapshots', {
        method: 'POST',
        body: last
          ? {
              moodScore: emo.score,
              sleepHours: last.sleepHours,
              activityLevel: last.activityLevel,
              stressIndex: stress,
              metadata: { source: 'emotion_checkin', emotion: emo.tag },
            }
          : {
              moodScore: emo.score,
              sleepHours: 7,
              activityLevel: 50,
              stressIndex: stress,
              metadata: { source: 'first_emotion_checkin', emotion: emo.tag },
            },
      });
      setText('');
      setComposerOpen(false);
      await load();
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const visible = showAll ? entries : entries.slice(0, 3);

  return (
    <CalmScreen>
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: c.limeSoft }]}>
          <Text style={[styles.avatarText, { color: c.ink }]}>{initials}</Text>
        </View>
        <View style={styles.topActions}>
          <Pressable
            onPress={() => router.push('/ai-insights')}
            accessibilityRole="button"
            accessibilityLabel="Open insights"
            style={[styles.topCircle, { backgroundColor: c.surface, borderColor: c.line }]}
          >
            <Feather name="search" size={17} color={c.ink} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/(tabs)/dashboard')}
            accessibilityRole="button"
            accessibilityLabel="Open home"
            style={[styles.topCircle, { backgroundColor: c.surface, borderColor: c.line }]}
          >
            <Feather name="bell" size={17} color={c.ink} />
          </Pressable>
        </View>
      </View>

      <Text style={[styles.greeting, { color: c.muted }]}>☀️  {greeting}</Text>
      <Serif style={[styles.headline, { color: c.ink }]}>How have things been today?</Serif>

      <EmotionChips value={selected} onChange={setSelected} />

      <CalmCard tint="sage">
        <View style={styles.bannerRow}>
          <View style={styles.bannerText}>
            <Serif style={[styles.bannerTitle, { color: c.ink }]}>
              Take charge of your mental well-being
            </Serif>
            <Text style={[styles.bannerSub, { color: c.muted }]}>
              We're here for you every step of the way
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/chat')}
              accessibilityRole="button"
              accessibilityLabel="Get help with AI"
              style={[styles.helpBtn, { backgroundColor: c.surface }]}
            >
              <Feather name="zap" size={13} color={c.ink} />
              <Text style={[styles.helpText, { color: c.ink }]}>Help With AI</Text>
            </Pressable>
          </View>
          <Botanical />
        </View>
      </CalmCard>

      <Pressable
        onPress={() => setComposerOpen(!composerOpen)}
        accessibilityRole="button"
        accessibilityLabel={composerOpen ? 'Close check-in composer' : 'Write a new check-in'}
        style={[styles.newEntry, { backgroundColor: c.surface, borderColor: c.line }]}
      >
        <Feather name={composerOpen ? 'chevron-up' : 'plus'} size={16} color={c.ink} />
        <Text style={[styles.newEntryText, { color: c.ink }]}>
          {composerOpen ? 'Close' : `New check-in as ${selected}`}
        </Text>
      </Pressable>

      {composerOpen ? (
        <CalmCard>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write freely about what's on your mind…"
            placeholderTextColor={c.faint}
            multiline
            style={[styles.input, { color: c.ink, backgroundColor: c.bg }]}
            accessibilityLabel="Journal entry text"
          />
          <InkButton
            label={saving ? 'Saving…' : `Save as ${selected}`}
            onPress={handleSave}
          />
        </CalmCard>
      ) : null}

      <View style={styles.journalHead}>
        <Serif style={[styles.journalTitle, { color: c.ink }]}>Your Journal</Serif>
        {entries.length > 3 ? (
          <Pressable
            onPress={() => setShowAll(!showAll)}
            accessibilityRole="button"
            accessibilityLabel={showAll ? 'Show fewer entries' : 'See all entries'}
          >
            <Text style={[styles.seeAll, { color: c.muted }]}>
              {showAll ? 'Show less' : 'See All'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {entries.length === 0 ? (
        <CalmCard tint="lavender">
          <View style={{ alignItems: 'center', gap: 8 }}>
            <EmptyArt kind="sprout" size={110} />
            <Text style={[styles.emptyText, { color: c.muted, textAlign: 'center' }]}>
              No entries yet — write your first check-in above. Nothing is pre-filled.
            </Text>
          </View>
        </CalmCard>
      ) : null}

      {visible.map((en, i) => {
        const tint = TILE_TINTS[i % TILE_TINTS.length];
        const icon = TILE_ICONS[i % TILE_ICONS.length];
        const open = expandedId === en.id;
        return (
          <Pressable
            key={en.id}
            onPress={() => setExpandedId(open ? null : en.id)}
            accessibilityRole="button"
            accessibilityLabel={`Journal entry from ${new Date(en.createdAt).toLocaleDateString()}`}
          >
            <CalmCard tint={tint}>
              <View style={styles.entryRow}>
                <View style={[styles.entryIcon, { backgroundColor: c.surface }]}>
                  <Feather name={icon} size={20} color={c.ink} />
                </View>
                <View style={styles.entryText}>
                  <Text style={[styles.entryDate, { color: c.muted }]}>
                    {new Date(en.createdAt).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    • {en.moodTag}
                  </Text>
                  <Text
                    style={[styles.entrySnippet, { color: c.ink }]}
                    numberOfLines={open ? undefined : 2}
                  >
                    {en.content}
                  </Text>
                </View>
                <Feather
                  name={open ? 'chevron-up' : 'chevron-right'}
                  size={18}
                  color={c.muted}
                />
              </View>
            </CalmCard>
          </Pressable>
        );
      })}
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topActions: { flexDirection: 'row', gap: 10 },
  topCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  greeting: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: fonts.semiBold,
  },
  headline: { fontSize: 31, lineHeight: 37, textAlign: 'center' },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerText: { flex: 1, gap: 6 },
  bannerTitle: { fontSize: 19, lineHeight: 24 },
  bannerSub: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginTop: 4,
  },
  helpText: { fontFamily: fonts.semiBold, fontSize: 13 },
  newEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: 999,
    borderWidth: 1.2,
  },
  newEntryText: { fontFamily: fonts.semiBold, fontSize: 14 },
  input: {
    minHeight: 96,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
    fontFamily: fonts.regular,
    marginBottom: 12,
  },
  journalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  journalTitle: { fontSize: 21 },
  seeAll: { fontFamily: fonts.medium, fontSize: 13, minHeight: 44, textAlignVertical: 'center' },
  emptyText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  entryIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryText: { flex: 1, gap: 4 },
  entryDate: { fontFamily: fonts.medium, fontSize: 11 },
  entrySnippet: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 20 },
});
