import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

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
import { ArtTile, artForMood } from '@/src/components/calm/art';
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

  const persistEntry = async (content: string, tag: string) => {
    if (!user) return;
    const emo = EMOTIONS.find((e) => e.tag === tag) ?? EMOTIONS[0];
    setSaving(true);
    try {
      await createJournalEntry(user.id, content.trim(), emo.score, emo.tag);
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
      setVoiceMode('idle');
      setVoiceText('');
      await load();
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert('Write something', 'Journal text is required.');
      return;
    }
    await persistEntry(text, selected);
  };

  // ─── Voice journal: record → transcribe → review → save ───
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder, 500);
  const [voiceMode, setVoiceMode] = useState<'idle' | 'recording' | 'transcribing' | 'review'>('idle');
  const [voiceText, setVoiceText] = useState('');
  const [voiceMood, setVoiceMood] = useState('Happy');

  const suggestMood = (t: string): string => {
    const q = t.toLowerCase();
    if (/\b(sad|cry|crying|down|lonely|depress|miss|grief)\b/.test(q)) return 'Sad';
    if (/\b(stress|anxious|anxiety|worried|overwhelm|pressure|nervous|panic|tense)\b/.test(q)) return 'Stressed';
    if (/\b(angry|furious|annoyed|frustrat|hate|mad|irritat)\b/.test(q)) return 'Angry';
    if (/\b(excit|thrilled|awesome|pumped|amazing|wonderful|joy|happy|great|love)\b/.test(q)) return 'Happy';
    return selected;
  };

  const startVoice = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Mic needed', 'Allow microphone access to dictate journal entries.');
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
      setVoiceMode('recording');
    } catch (e) {
      Alert.alert('Could not record', e instanceof Error ? e.message : 'Microphone unavailable here.');
    }
  };

  const stopVoice = async () => {
    try {
      await recorder.stop();
      const uri = recorder.getStatus().url;
      if (!uri) throw new Error('No audio captured.');
      setVoiceMode('transcribing');
      const blob = await (await fetch(uri)).blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const url = String(reader.result || '');
          const parts = url.split(',');
          if (parts.length < 2) reject(new Error('Audio encoding failed.'));
          else resolve(parts[1]);
        };
        reader.onerror = () => reject(new Error('Audio encoding failed.'));
        reader.readAsDataURL(blob);
      });
      const data = await apiFetch<{ text: string }>('/api/voice/transcribe', {
        method: 'POST',
        body: { audioBase64: base64, mimeType: 'audio/m4a' },
      });
      setVoiceText(data.text);
      setVoiceMood(suggestMood(data.text));
      setVoiceMode('review');
    } catch (e) {
      setVoiceMode('idle');
      Alert.alert('Voice entry failed', e instanceof Error ? e.message : 'Please try again or type instead.');
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

      <View style={styles.entryActions}>
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
        <Pressable
          onPress={startVoice}
          disabled={voiceMode === 'recording' || voiceMode === 'transcribing'}
          accessibilityRole="button"
          accessibilityLabel="Dictate a journal entry"
          style={[styles.micBtn, { backgroundColor: c.ink, opacity: voiceMode === 'idle' || voiceMode === 'review' ? 1 : 0.6 }]}
        >
          <Feather name="mic" size={17} color={c.bg} />
        </Pressable>
      </View>

      {voiceMode === 'recording' ? (
        <CalmCard tint="peach">
          <View style={styles.voiceRow}>
            <View style={styles.recDot} />
            <Text style={[styles.voiceTimer, { color: c.ink }]}>
              Listening… {Math.floor((recState.durationMillis ?? 0) / 1000)}s
            </Text>
            <Pressable
              onPress={stopVoice}
              accessibilityRole="button"
              accessibilityLabel="Stop recording"
              style={[styles.stopBtn, { backgroundColor: c.ink }]}
            >
              <Feather name="square" size={14} color={c.bg} />
              <Text style={[styles.stopText, { color: c.bg }]}>Done</Text>
            </Pressable>
          </View>
          <Text style={[styles.voiceHint, { color: c.muted }]}>Speak naturally — pause anytime, tap Done to transcribe.</Text>
        </CalmCard>
      ) : null}

      {voiceMode === 'transcribing' ? (
        <CalmCard>
          <View style={styles.voiceRow}>
            <ActivityIndicator size="small" color={c.muted} />
            <Text style={[styles.voiceTimer, { color: c.ink }]}>Transcribing…</Text>
          </View>
        </CalmCard>
      ) : null}

      {voiceMode === 'review' ? (
        <CalmCard tint="mint">
          <Text style={[styles.reviewLabel, { color: c.muted }]}>REVIEW YOUR WORDS — NOTHING SAVES UNTIL YOU APPROVE</Text>
          <TextInput
            value={voiceText}
            onChangeText={setVoiceText}
            multiline
            style={[styles.input, { color: c.ink, backgroundColor: c.surface }]}
            accessibilityLabel="Transcribed entry, editable"
          />
          <Text style={[styles.reviewLabel, { color: c.muted }]}>SUGGESTED MOOD — TAP TO CHANGE</Text>
          <View style={styles.moodRow}>
            {EMOTIONS.map((e) => {
              const active = voiceMood === e.tag;
              return (
                <Pressable
                  key={e.tag}
                  onPress={() => setVoiceMood(e.tag)}
                  accessibilityRole="button"
                  accessibilityLabel={`Set mood ${e.tag}`}
                  style={[
                    styles.moodChip,
                    { backgroundColor: active ? c.ink : c.surface, borderColor: c.line },
                  ]}
                >
                  <Text style={styles.moodEmoji}>{e.emoji}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.reviewActions}>
            <Pressable
              onPress={() => persistEntry(voiceText, voiceMood)}
              disabled={saving || !voiceText.trim()}
              accessibilityRole="button"
              accessibilityLabel="Save voice entry"
              style={[styles.saveVoiceBtn, { backgroundColor: c.ink, opacity: saving ? 0.6 : 1 }]}
            >
              <Text style={[styles.saveVoiceText, { color: c.bg }]}>
                {saving ? 'Saving…' : `Save as ${voiceMood}`}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { setVoiceMode('idle'); setVoiceText(''); }}
              accessibilityRole="button"
              accessibilityLabel="Discard voice entry"
              style={styles.discardBtn}
            >
              <Text style={[styles.discardText, { color: c.muted }]}>Discard</Text>
            </Pressable>
          </View>
        </CalmCard>
      ) : null}

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

      {visible.map((en) => {
        const tint = TILE_TINTS[visible.indexOf(en) % TILE_TINTS.length];
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
                <ArtTile kind={artForMood(en.moodTag)} size={52} />
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: 999,
    borderWidth: 1.2,
  },
  entryActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  micBtn: {
    width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center',
  },
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#C0392B' },
  voiceTimer: { flex: 1, fontFamily: fonts.bold, fontSize: 14 },
  stopBtn: {
    flexDirection: 'row', gap: 6, alignItems: 'center', borderRadius: 999,
    paddingHorizontal: 16, minHeight: 42,
  },
  stopText: { fontFamily: fonts.bold, fontSize: 13 },
  voiceHint: { fontFamily: fonts.regular, fontSize: 12, marginTop: 8 },
  reviewLabel: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.2, marginTop: 4 },
  moodRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  moodChip: {
    width: 46, height: 46, borderRadius: 23, borderWidth: 1.2,
    alignItems: 'center', justifyContent: 'center',
  },
  moodEmoji: { fontSize: 20 },
  reviewActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  saveVoiceBtn: { flex: 1, borderRadius: 999, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  saveVoiceText: { fontFamily: fonts.bold, fontSize: 14 },
  discardBtn: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 8 },
  discardText: { fontFamily: fonts.semiBold, fontSize: 13 },
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
  entryText: { flex: 1, gap: 4 },
  entryDate: { fontFamily: fonts.medium, fontSize: 11 },
  entrySnippet: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 20 },
});
