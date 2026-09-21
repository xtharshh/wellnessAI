import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

import { CalmCard, CalmHeader, CalmScreen, EmptyArt, Serif, useCalm } from '@/src/components/calm/kit';
import { useWellnessSummary } from '@/src/hooks/useWellnessSummary';
import { getSnapshots } from '@/src/services/wellness';
import { useAuthStore } from '@/src/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { fonts } from '@/src/theme/typography';

// Deterministic scatter from the date string (stable sky, no RNG).
function hash01(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

function starColor(mood: number): string {
  if (mood >= 70) return '#E8C86A';
  if (mood >= 50) return '#B9BEE8';
  return '#8A8FA8';
}

export default function ConstellationsScreen() {
  const router = useRouter();
  const { c, isDark } = useCalm();
  const user = useAuthStore((s) => s.user);
  const { data } = useQuery({
    queryKey: ['constellation-snapshots', user?.id],
    queryFn: () => {
      if (!user) throw new Error('Not authenticated');
      return getSnapshots(user.id, 30);
    },
    enabled: !!user,
  });

  const snaps = data ?? [];
  const W = 340;
  const H = 250;
  const pts = snaps.map((s, i) => {
    const t = snaps.length === 1 ? 0.5 : i / (snaps.length - 1);
    return {
      x: 24 + t * (W - 48) + (hash01(s.recordedAt) - 0.5) * 26,
      y: H - 30 - (s.moodScore / 100) * (H - 70) + (hash01(s.id) - 0.5) * 18,
      r: 2 + (s.moodScore / 100) * 3.4,
      color: starColor(s.moodScore),
      mood: s.moodScore,
      date: s.recordedAt.slice(0, 10),
    };
  });
  const links =
    pts.length >= 2
      ? `M ${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`
      : '';
  const bright = snaps.filter((s) => s.moodScore >= 70).length;

  return (
    <CalmScreen>
      <CalmHeader
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard'))}
      />
      <Serif style={[styles.title, { color: c.ink }]}>Your constellations</Serif>
      <Text style={[styles.sub, { color: c.muted }]}>
        {snaps.length
          ? `${snaps.length} nights mapped • ${bright} bright ${bright === 1 ? 'star' : 'stars'}`
          : 'Your month, written in stars'}
      </Text>

      <CalmCard style={{ padding: 0, overflow: 'hidden' }}>
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
          <Defs>
            <SvgGradient id="night" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={isDark ? '#141322' : '#2A2A44'} />
              <Stop offset="100%" stopColor={isDark ? '#1E1B30' : '#4A4A6E'} />
            </SvgGradient>
          </Defs>
          <Path d={`M0 0 H${W} V${H} H0 Z`} fill="url(#night)" />
          {Array.from({ length: 24 }, (_, i) => (
            <Circle
              key={i}
              cx={(hash01(`bg${i}`) * W).toFixed(1)}
              cy={(hash01(`sk${i}`) * H * 0.8).toFixed(1)}
              r={0.9}
              fill="#F3EADB"
              opacity={0.35}
            />
          ))}
          {links ? <Path d={links} fill="none" stroke="#F3EADB" strokeWidth={1} opacity={0.3} /> : null}
          {pts.map((p, i) => (
            <React.Fragment key={i}>
              <Circle cx={p.x} cy={p.y} r={p.r + 3.5} fill={p.color} opacity={0.25} />
              <Circle cx={p.x} cy={p.y} r={p.r} fill={p.color} />
            </React.Fragment>
          ))}
        </Svg>
      </CalmCard>

      {snaps.length === 0 ? (
        <CalmCard tint="lavender">
          <View style={{ alignItems: 'center', gap: 8 }}>
            <EmptyArt kind="moon" size={100} />
            <Text style={[styles.body, { color: c.muted, textAlign: 'center' }]}>
              No nights mapped yet — check in and sync for a few days and your sky fills in.
            </Text>
          </View>
        </CalmCard>
      ) : (
        <CalmCard>
          <View style={styles.legend}>
            <View style={styles.legRow}>
              <View style={[styles.dot, { backgroundColor: '#E8C86A' }]} />
              <Text style={[styles.legText, { color: c.muted }]}>Bright — mood 70+</Text>
            </View>
            <View style={styles.legRow}>
              <View style={[styles.dot, { backgroundColor: '#B9BEE8' }]} />
              <Text style={[styles.legText, { color: c.muted }]}>Steady — mood 50–69</Text>
            </View>
            <View style={styles.legRow}>
              <View style={[styles.dot, { backgroundColor: '#8A8FA8' }]} />
              <Text style={[styles.legText, { color: c.muted }]}>Dim — tender days</Text>
            </View>
          </View>
          <Text style={[styles.note, { color: c.muted }]}>
            Higher stars are brighter moods. Lines trace your month in order — every sky tells a story, none of them a verdict.
          </Text>
        </CalmCard>
      )}

      <Text style={[styles.note2, { color: c.muted }]}>
        Tip: open this after journaling — bright evenings follow honest ones.
      </Text>
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, textAlign: 'center' },
  sub: { fontFamily: fonts.medium, fontSize: 13, textAlign: 'center', marginTop: -8 },
  body: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  legend: { gap: 8 },
  legRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legText: { fontFamily: fonts.medium, fontSize: 13 },
  note: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 10 },
  note2: { fontFamily: fonts.regular, fontSize: 12, textAlign: 'center' },
});
