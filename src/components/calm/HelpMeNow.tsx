import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useCalm } from '@/src/components/calm/kit';
import { fonts } from '@/src/theme/typography';

// Signature quick-intervention sheet (§13 of the product doc): one tap, no
// decisions. Each option deep-links to the matching tool with a "why" line.
const OPTIONS = [
  {
    icon: 'wind' as const,
    title: '2-minute breathing',
    why: 'Fastest known calm-down for acute tension.',
    go: '/(tabs)/breath' as const,
  },
  {
    icon: 'activity' as const,
    title: '5-minute movement',
    why: 'A short walk resets both body and looping thoughts.',
    go: '/(tabs)/exercises' as const,
  },
  {
    icon: 'anchor' as const,
    title: 'Grounding exercise',
    why: 'Pulls attention back to the present moment.',
    go: '/(tabs)/chat' as const,
  },
  {
    icon: 'moon' as const,
    title: 'Sleep wind-down',
    why: 'Dim, slow and screen-free before bed.',
    go: '/(tabs)/breath' as const,
  },
];

export function HelpMeNow({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const { c } = useCalm();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.line }]}>
          <View style={[styles.handle, { backgroundColor: c.line }]} />
          <Text style={[styles.title, { color: c.ink }]}>Help me now</Text>
          <Text style={[styles.sub, { color: c.muted }]}>
            No decisions needed — pick what fits, start immediately.
          </Text>
          {OPTIONS.map((o) => (
            <Pressable
              key={o.title}
              onPress={() => {
                onClose();
                router.push(o.go);
              }}
              accessibilityRole="button"
              accessibilityLabel={o.title}
              style={[styles.opt, { backgroundColor: c.bg, borderColor: c.line }]}
            >
              <View style={[styles.icon, { backgroundColor: c.limeSoft }]}>
                <Feather name={o.icon} size={18} color={c.limeInk} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optTitle, { color: c.ink }]}>{o.title}</Text>
                <Text style={[styles.optWhy, { color: c.muted }]}>{o.why}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={c.muted} />
            </Pressable>
          ))}
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
            <Text style={[styles.close, { color: c.muted }]}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 40,
    gap: 10,
  },
  handle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  sub: { fontFamily: fonts.regular, fontSize: 13, textAlign: 'center', marginBottom: 4 },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    minHeight: 72,
  },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  optTitle: { fontFamily: fonts.bold, fontSize: 15 },
  optWhy: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  close: { fontFamily: fonts.semiBold, fontSize: 14, textAlign: 'center', minHeight: 48, textAlignVertical: 'center' },
});
