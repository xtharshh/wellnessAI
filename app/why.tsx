import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  CalmCard,
  CalmHeader,
  CalmScreen,
  EmptyArt,
  InkButton,
  Serif,
  useCalm,
} from '@/src/components/calm/kit';
import { useWhyFeeling } from '@/src/hooks/useWhy';
import type { PatternInsight } from '@/src/services/whyFeel';
import { fonts } from '@/src/theme/typography';

const CONF_LABEL: Record<string, string> = {
  emerging: 'Emerging pattern',
  steady: 'Steady pattern',
  strong: 'Strong pattern',
};

function InsightCard({ insight }: { insight: PatternInsight }) {
  const router = useRouter();
  const { c } = useCalm();
  const { feedback, feedbackPending } = useWhyFeeling();
  const [correcting, setCorrecting] = useState(false);
  const [note, setNote] = useState('');

  const send = (action: 'helpful' | 'dismissed' | 'hidden_type' | 'corrected', extra?: string) => {
    feedback(
      { key: insight.key, type: insight.type, action, note: extra },
      {
        onSuccess: () => {
          if (action === 'corrected') {
            setCorrecting(false);
            setNote('');
            Alert.alert('Noted', 'Thanks — your correction will shape future insights.');
          }
        },
        onError: () => Alert.alert('Could not save', 'Check your connection and try again.'),
      }
    );
  };

  return (
    <CalmCard>
      <View style={styles.pills}>
        <View style={[styles.pill, { backgroundColor: c.limeSoft }]}>
          <Text style={[styles.pillText, { color: c.limeInk }]}>{insight.type.replace('-', ' ')}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: c.surface2 }]}>
          <Text style={[styles.pillText, { color: c.muted }]}>{CONF_LABEL[insight.confidence]}</Text>
        </View>
      </View>

      <Serif style={[styles.title, { color: c.ink }]}>{insight.title}</Serif>
      <Text style={[styles.body, { color: c.ink }]}>{insight.explanation}</Text>

      <View style={styles.evidence}>
        {insight.evidence.map((e) => (
          <View key={e.label} style={[styles.evRow, { borderColor: c.line }]}>
            <Text style={[styles.evLabel, { color: c.muted }]}>{e.label}</Text>
            <Text style={[styles.evVal, { color: c.ink }]}>{e.value}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.suggestBox, { backgroundColor: c.bg }]}>
        <Feather name="zap" size={14} color={c.ink} />
        <Text style={[styles.suggest, { color: c.ink }]}>{insight.suggestion}</Text>
      </View>

      {insight.correction ? (
        <View style={[styles.correction, { borderColor: c.line }]}>
          <Text style={[styles.correctionLabel, { color: c.muted }]}>YOUR TAKE</Text>
          <Text style={[styles.correctionText, { color: c.ink }]}>{insight.correction}</Text>
        </View>
      ) : null}

      {correcting ? (
        <View style={{ gap: 8, marginTop: 4 }}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="What do you think is really going on?"
            placeholderTextColor={c.faint}
            multiline
            style={[styles.input, { color: c.ink, backgroundColor: c.bg, borderColor: c.line }]}
            accessibilityLabel="Correct this insight"
          />
          <InkButton
            label={feedbackPending ? 'Saving…' : 'Save correction'}
            onPress={() => note.trim() && send('corrected', note.trim())}
          />
        </View>
      ) : (
        <>
          <View style={{ marginTop: 10 }}>
            <InkButton
              label={insight.ctaLabel}
              onPress={() => router.push(insight.ctaRoute as any)}
              icon="arrow-right"
            />
          </View>
          <View style={styles.actions}>
            <Pressable
              onPress={() => send('helpful')}
              accessibilityRole="button"
              accessibilityLabel="This was helpful"
              style={styles.action}
            >
              <Feather name="thumbs-up" size={15} color={c.muted} />
              <Text style={[styles.actionText, { color: c.muted }]}>Helpful</Text>
            </Pressable>
            <Pressable
              onPress={() => setCorrecting(true)}
              accessibilityRole="button"
              accessibilityLabel="Correct this insight"
              style={styles.action}
            >
              <Feather name="edit-2" size={15} color={c.muted} />
              <Text style={[styles.actionText, { color: c.muted }]}>Correct</Text>
            </Pressable>
            <Pressable
              onPress={() => send('dismissed')}
              accessibilityRole="button"
              accessibilityLabel="Dismiss this insight"
              style={styles.action}
            >
              <Feather name="x" size={15} color={c.muted} />
              <Text style={[styles.actionText, { color: c.muted }]}>Dismiss</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert(
                  'Hide this type?',
                  'We will stop showing this kind of pattern.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Hide', onPress: () => send('hidden_type') },
                  ]
                )
              }
              accessibilityRole="button"
              accessibilityLabel="Hide this type of insight"
              style={styles.action}
            >
              <Feather name="eye-off" size={15} color={c.muted} />
              <Text style={[styles.actionText, { color: c.muted }]}>Hide type</Text>
            </Pressable>
          </View>
        </>
      )}
    </CalmCard>
  );
}

export default function WhyScreen() {
  const router = useRouter();
  const { c } = useCalm();
  const { insights, isLoading, hasHistory } = useWhyFeeling();

  return (
    <CalmScreen>
      <CalmHeader
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard'))}
      />
      <Serif style={[styles.head, { color: c.ink }]}>Why am I feeling this way?</Serif>
      <Text style={[styles.sub, { color: c.muted }]}>
        Relationships in your own data — patterns, never diagnoses. Correct us; we learn.
      </Text>

      {isLoading ? (
        <CalmCard>
          <Text style={[styles.body, { color: c.muted }]}>Reading your patterns…</Text>
        </CalmCard>
      ) : null}

      {!isLoading && !hasHistory ? (
        <CalmCard tint="sage">
          <View style={{ alignItems: 'center', gap: 8 }}>
            <EmptyArt kind="sun" size={100} />
            <Text style={[styles.body, { color: c.muted, textAlign: 'center' }]}>
              Patterns need at least 4 days of real history. Keep checking in — your first explanation is forming.
            </Text>
          </View>
        </CalmCard>
      ) : null}

      {!isLoading && hasHistory && insights.length === 0 ? (
        <CalmCard tint="mint">
          <Text style={[styles.body, { color: c.muted, textAlign: 'center' }]}>
            Nothing strong enough to call a pattern right now — steady itself is good news. Dismissed and hidden types stay off.
          </Text>
        </CalmCard>
      ) : null}

      {insights.map((i) => (
        <InsightCard key={i.key} insight={i} />
      ))}
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  head: { fontSize: 28, textAlign: 'center' },
  sub: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: -8 },
  pills: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontFamily: fonts.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 20, lineHeight: 25 },
  body: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, marginTop: 6 },
  evidence: { marginTop: 10, gap: 0 },
  evRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderTopWidth: 1,
  },
  evLabel: { fontFamily: fonts.medium, fontSize: 12 },
  evVal: { fontFamily: fonts.bold, fontSize: 13 },
  suggestBox: {
    flexDirection: 'row', gap: 8, borderRadius: 14, padding: 12, marginTop: 10, alignItems: 'flex-start',
  },
  suggest: { flex: 1, fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 19 },
  correction: { borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 10, gap: 4 },
  correctionLabel: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.2 },
  correctionText: { fontFamily: fonts.regular, fontSize: 13, fontStyle: 'italic', lineHeight: 19 },
  input: {
    borderWidth: 1.2, borderRadius: 14, minHeight: 80, padding: 12,
    fontFamily: fonts.regular, fontSize: 13, textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44, paddingHorizontal: 4 },
  actionText: { fontFamily: fonts.semiBold, fontSize: 12 },
});
