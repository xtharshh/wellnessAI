import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg';

import { CalmCard, CalmHeader, CalmScreen, Serif, useCalm } from '@/src/components/calm/kit';
import { useGarden } from '@/src/hooks/useGarden';
import type { GrowthStage } from '@/src/services/garden';
import { fonts } from '@/src/theme/typography';

const STAGE_LABEL: Record<GrowthStage, string> = {
  0: 'Seed',
  1: 'Sprout',
  2: 'Bud',
  3: 'Bloom',
  4: 'Flourish',
};

function BloomPlant({ x, stage }: { x: number; stage: GrowthStage }) {
  const h = 26 + stage * 20;
  const top = 200 - h;
  return (
    <>
      <Path d={`M ${x} 200 C ${x - 4} ${200 - h * 0.5}, ${x + 4} ${200 - h * 0.7}, ${x} ${top}`} stroke="#4E7A4E" strokeWidth={4} fill="none" strokeLinecap="round" />
      {stage >= 1 ? (
        <>
          <Path d={`M ${x} ${200 - h * 0.4} C ${x - 16} ${200 - h * 0.45}, ${x - 24} ${200 - h * 0.4}, ${x - 28} ${200 - h * 0.32}`} stroke="#4E7A4E" strokeWidth={3} fill="none" strokeLinecap="round" />
          <Path d={`M ${x} ${200 - h * 0.55} C ${x + 16} ${200 - h * 0.6}, ${x + 24} ${200 - h * 0.6}, ${x + 28} ${200 - h * 0.52}`} stroke="#4E7A4E" strokeWidth={3} fill="none" strokeLinecap="round" />
          <Path d={`M ${x} ${200 - h * 0.4} C ${x - 12} ${200 - h * 0.52}, ${x - 22} ${200 - h * 0.5}, ${x - 27} ${200 - h * 0.4} C ${x - 20} ${200 - h * 0.32}, ${x - 8} ${200 - h * 0.32}, ${x} ${200 - h * 0.4} Z`} fill="#6FA06F" />
          <Path d={`M ${x} ${200 - h * 0.55} C ${x + 12} ${200 - h * 0.67}, ${x + 22} ${200 - h * 0.65}, ${x + 27} ${200 - h * 0.55} C ${x + 20} ${200 - h * 0.47}, ${x + 8} ${200 - h * 0.47}, ${x} ${200 - h * 0.55} Z`} fill="#7BAF7B" />
        </>
      ) : null}
      {stage === 2 ? <Circle cx={x} cy={top - 4} r={6} fill="#C99ADE" /> : null}
      {stage >= 3 ? (
        <>
          <Path d={`M ${x} ${top} C ${x - 10} ${top - 16}, ${x - 6} ${top - 26}, ${x} ${top - 30} C ${x + 6} ${top - 26}, ${x + 10} ${top - 16}, ${x} ${top} Z`} fill="#B678C9" />
          <Path d={`M ${x} ${top} C ${x - 16} ${top - 8}, ${x - 20} ${top - 16}, ${x - 18} ${top - 24} C ${x - 10} ${top - 22}, ${x - 2} ${top - 12}, ${x} ${top} Z`} fill="#C99ADE" />
          <Path d={`M ${x} ${top} C ${x + 16} ${top - 8}, ${x + 20} ${top - 16}, ${x + 18} ${top - 24} C ${x + 10} ${top - 22}, ${x + 2} ${top - 12}, ${x} ${top} Z`} fill="#C99ADE" />
          <Circle cx={x} cy={top - 6} r={3.4} fill="#F3EADB" />
        </>
      ) : null}
      {stage >= 4 ? <Circle cx={x} cy={top - 14} r={20} fill="#E8C86A" opacity={0.25} /> : null}
    </>
  );
}

function VinePlant({ x, stage }: { x: number; stage: GrowthStage }) {
  const leaves: React.ReactNode[] = [];
  const spots: [number, number][] = [[-14, -30], [14, -52], [-13, -74], [13, -96]];
  for (let i = 0; i < Math.min(stage * 2, 4); i++) {
    const [dx, dy] = spots[i];
    leaves.push(
      <Ellipse key={i} cx={x + dx} cy={200 + dy} rx={9} ry={5} fill={i % 2 ? '#7BAF7B' : '#6FA06F'} rotation={dx > 0 ? -25 : 25} />
    );
  }
  const h = 24 + stage * 20;
  return (
    <>
      <Path
        d={`M ${x} 200 C ${x - 18} ${200 - h * 0.3}, ${x + 18} ${200 - h * 0.6}, ${x} ${200 - h}`}
        stroke="#3E6B3E"
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
      {leaves}
      {stage >= 3 ? (
        <>
          <Circle cx={x + 2} cy={200 - h - 6} r={7} fill="#E8A0BF" />
          <Circle cx={x + 2} cy={200 - h - 6} r={2.6} fill="#C96A8E" />
        </>
      ) : null}
      {stage >= 4 ? <Circle cx={x + 2} cy={200 - h - 6} r={13} fill="#E8A0BF" opacity={0.3} /> : null}
    </>
  );
}

function RhythmSun({ x, y, stage }: { x: number; y: number; stage: GrowthStage }) {
  const rays = stage * 2;
  return (
    <>
      <Circle cx={x} cy={y} r={15 + stage * 2.5} fill="#E8A83E" opacity={0.35 + stage * 0.15} />
      <Circle cx={x} cy={y} r={11 + stage * 2} fill="#E8A83E" />
      {Array.from({ length: rays }, (_, i) => {
        const a = (i / Math.max(rays, 1)) * Math.PI * 2;
        const r1 = 20 + stage * 2;
        const r2 = 27 + stage * 2;
        return (
          <Path
            key={i}
            d={`M ${x + r1 * Math.cos(a)} ${y + r1 * Math.sin(a)} L ${x + r2 * Math.cos(a)} ${y + r2 * Math.sin(a)}`}
            stroke="#E8A83E"
            strokeWidth={3}
            strokeLinecap="round"
          />
        );
      })}
    </>
  );
}

export default function GardenScreen() {
  const router = useRouter();
  const { c, isDark } = useCalm();
  const { data, isLoading } = useGarden();

  const hour = new Date().getHours();
  const night = hour < 6 || hour >= 19;

  const plants = data?.plants ?? [];
  const bloom = plants.find((p) => p.kind === 'bloom');
  const vine = plants.find((p) => p.kind === 'vine');
  const sun = plants.find((p) => p.kind === 'sun');

  return (
    <CalmScreen>
      <CalmHeader
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard'))}
      />
      <Serif style={[styles.title, { color: c.ink }]}>Wellness Garden</Serif>
      <Text style={[styles.sub, { color: c.muted }]}>
        {data ? `${data.activeDays} of ${data.windowDays} days engaged` : 'Your garden grows with you'}
      </Text>

      <CalmCard style={{ padding: 0, overflow: 'hidden' }}>
        <Svg width="100%" height={240} viewBox="0 0 340 240" preserveAspectRatio="xMidYMid slice">
          <Defs>
            <SvgGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={isDark ? '#232A22' : '#DCE6CC'} />
              <Stop offset="100%" stopColor={isDark ? '#1A1C14' : '#F1ECDB'} />
            </SvgGradient>
          </Defs>
          <Rect x={0} y={0} width={340} height={240} fill="url(#sky)" />
          {night ? (
            <>
              <Circle cx={282} cy={48} r={17} fill="#C9C0EC" />
              <Circle cx={40} cy={36} r={2} fill="#F3EADB" />
              <Circle cx={110} cy={22} r={1.6} fill="#F3EADB" />
              <Circle cx={200} cy={40} r={2} fill="#F3EADB" />
              <Circle cx={250} cy={20} r={1.6} fill="#F3EADB" />
            </>
          ) : null}
          {Array.from({ length: data?.stars ?? 0 }, (_, i) => (
            <Path
              key={i}
              d={`M ${30 + i * 18} 34 l 2.2 4.6 5 .6 -3.7 3.4 1 4.9 -4.5-2.5 -4.5 2.5 1-4.9 -3.7-3.4 5-.6 Z`}
              fill="#E8C86A"
            />
          ))}
          <Ellipse cx={170} cy={228} rx={190} ry={46} fill={isDark ? '#222B1E' : '#CBD8B4'} />
          <Ellipse cx={170} cy={222} rx={150} ry={34} fill={isDark ? '#2A3524' : '#DCE6CC'} />
          <BloomPlant x={80} stage={bloom?.stage ?? 0} />
          <VinePlant x={175} stage={vine?.stage ?? 0} />
          <RhythmSun x={272} y={150} stage={sun?.stage ?? 0} />
        </Svg>
      </CalmCard>

      {isLoading ? (
        <CalmCard>
          <Text style={[styles.body, { color: c.muted }]}>Tending your garden…</Text>
        </CalmCard>
      ) : null}

      {plants.map((p) => (
        <CalmCard key={p.kind}>
          <View style={styles.plantHead}>
            <Text style={[styles.plantName, { color: c.ink }]}>{p.name}</Text>
            <Text style={[styles.stage, { color: c.muted }]}>
              {STAGE_LABEL[p.stage]} • {Math.min(p.count, p.goal)}/{p.goal}
            </Text>
          </View>
          <View style={[styles.track, { backgroundColor: c.bg }]}>
            <View
              style={[
                styles.fill,
                { width: `${Math.min(100, Math.round((p.count / p.goal) * 100))}%`, backgroundColor: c.ink },
              ]}
            />
          </View>
          <Text style={[styles.fed, { color: c.muted }]}>{p.fedBy} · grows to full bloom at {p.goal}</Text>
        </CalmCard>
      ))}

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push('/(tabs)/journal')}
          accessibilityRole="button"
          accessibilityLabel="Water with a journal entry"
          style={[styles.action, { backgroundColor: c.ink }]}
        >
          <Text style={[styles.actionText, { color: c.bg }]}>＋ Water with journaling</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/constellations' as any)}
          accessibilityRole="button"
          accessibilityLabel="View your constellations"
          style={[styles.action, { backgroundColor: c.surface, borderColor: c.line, borderWidth: 1.2 }]}
        >
          <Text style={[styles.actionText, { color: c.ink }]}>✦ See your constellations</Text>
        </Pressable>
      </View>

      <Text style={[styles.note, { color: c.muted }]}>
        No streaks, no shame — plants pause when you rest and keep growing when you return.
      </Text>
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, textAlign: 'center' },
  sub: { fontFamily: fonts.medium, fontSize: 13, textAlign: 'center', marginTop: -8 },
  body: { fontFamily: fonts.regular, fontSize: 13 },
  plantHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  plantName: { fontFamily: fonts.bold, fontSize: 15 },
  stage: { fontFamily: fonts.semiBold, fontSize: 12 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 10 },
  fill: { height: '100%', borderRadius: 4 },
  fed: { fontFamily: fonts.regular, fontSize: 12, marginTop: 8 },
  actions: { gap: 10 },
  action: { borderRadius: 999, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: fonts.bold, fontSize: 14 },
  note: { fontFamily: fonts.regular, fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
