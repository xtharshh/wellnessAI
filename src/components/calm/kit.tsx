import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React, { useEffect } from 'react';
import {
  ImageStyle,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient as SvgGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import { useTheme } from '@/src/hooks/useTheme';
import { CalmPalette, TileTint, calmDark, calmLight, serif, tileColors } from '@/src/theme/calm';
import { fonts } from '@/src/theme/typography';

export function useCalm(): { c: CalmPalette; isDark: boolean } {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return { c: isDark ? calmDark : calmLight, isDark };
}

// ─── Screen + header ─────────────────────────────────────────────

export function CalmScreen({
  children,
  contentStyle,
}: {
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}) {
  const { c } = useCalm();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function CalmHeader({
  onBack,
  onSearch,
  onBell,
  bellDot,
}: {
  onBack?: () => void;
  onSearch?: () => void;
  onBell?: () => void;
  bellDot?: boolean;
}) {
  const { c } = useCalm();
  const circle: ViewStyle = {
    backgroundColor: c.surface,
    borderColor: c.line,
  };
  return (
    <View style={styles.headerRow}>
      <View style={{ width: 44 }}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={[styles.iconCircle, circle]}
          >
            <Feather name="arrow-left" size={18} color={c.ink} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.headerActions}>
        {onSearch ? (
          <Pressable
            onPress={onSearch}
            accessibilityRole="button"
            accessibilityLabel="Search"
            style={[styles.iconCircle, circle]}
          >
            <Feather name="search" size={17} color={c.ink} />
          </Pressable>
        ) : null}
        {onBell ? (
          <Pressable
            onPress={onBell}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            style={[styles.iconCircle, circle]}
          >
            <Feather name="bell" size={17} color={c.ink} />
            {bellDot ? <View style={styles.bellDot} /> : null}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// ─── Type + cards + buttons ──────────────────────────────────────

export function Serif({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text style={[{ fontFamily: serif, fontWeight: '700' }, style]}>{children}</Text>
  );
}

export function CalmCard({
  children,
  tint,
  style,
}: {
  children: React.ReactNode;
  tint?: TileTint;
  style?: ViewStyle;
}) {
  const { c } = useCalm();
  const bg = tint ? tileColors(c, tint).bg : c.surface;
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderColor: tint ? 'transparent' : c.line,
          shadowColor: c.shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function InkButton({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Feather>['name'];
}) {
  const { c } = useCalm();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.inkBtn,
        { backgroundColor: c.btnBg, opacity: pressed ? 0.88 : 1 },
      ]}
    >
      <Text style={[styles.inkBtnText, { color: c.btnInk }]}>{label}</Text>
      {icon ? <Feather name={icon} size={16} color={c.btnInk} /> : null}
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { c } = useCalm();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.ghostBtn,
        { borderColor: c.line, backgroundColor: c.surface, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={[styles.ghostBtnText, { color: c.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function PoweredByAI() {
  const { c } = useCalm();
  return (
    <View style={[styles.aiPill, { backgroundColor: c.limeSoft }]}>
      <Feather name="zap" size={12} color={c.limeInk} />
      <Text style={[styles.aiPillText, { color: c.limeInk }]}>powered by AI</Text>
    </View>
  );
}

// ─── Emotions ────────────────────────────────────────────────────

export const EMOTIONS = [
  { tag: 'Happy', emoji: '😊', score: 85 },
  { tag: 'Angry', emoji: '😠', score: 30 },
  { tag: 'Excited', emoji: '🤩', score: 90 },
  { tag: 'Stressed', emoji: '😰', score: 35 },
  { tag: 'Sad', emoji: '😢', score: 25 },
] as const;

export function EmotionChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (tag: string) => void;
}) {
  const { c } = useCalm();
  return (
    <View style={styles.emoRow}>
      {EMOTIONS.map((e) => {
        const active = value === e.tag;
        return (
          <Pressable
            key={e.tag}
            onPress={() => onChange(e.tag)}
            accessibilityRole="button"
            accessibilityLabel={`Feeling ${e.tag}`}
            accessibilityState={{ selected: active }}
            style={[
              styles.emoChip,
              {
                backgroundColor: active ? c.ink : c.surface,
                borderColor: active ? c.ink : c.line,
              },
            ]}
          >
            <Text style={styles.emoEmoji}>{e.emoji}</Text>
            <Text style={[styles.emoLabel, { color: active ? c.bg : c.ink }]}>
              {e.tag}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Day strip ───────────────────────────────────────────────────

export interface DayItem {
  key: string;
  dayNum: string;
  weekday: string;
  selected?: boolean;
}

export function DayStrip({
  days,
  onSelect,
}: {
  days: DayItem[];
  onSelect?: (key: string) => void;
}) {
  const { c } = useCalm();
  return (
    <View style={styles.dayRow}>
      {days.map((d) => {
        const active = !!d.selected;
        return (
          <Pressable
            key={d.key}
            onPress={() => onSelect?.(d.key)}
            accessibilityRole="button"
            accessibilityLabel={`${d.weekday} ${d.dayNum}`}
            style={styles.dayCol}
          >
            <View
              style={[
                styles.dayCircle,
                {
                  backgroundColor: active ? c.lime : c.limeSoft,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayNum,
                  { color: active ? c.ink : c.muted },
                ]}
              >
                {d.dayNum}
              </Text>
            </View>
            <Text style={[styles.dayLetter, { color: c.muted }]}>{d.weekday}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Stat tiles ──────────────────────────────────────────────────

export function StatTile({
  value,
  label,
  icon,
  tint,
}: {
  value: string;
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  tint: TileTint;
}) {
  const { c } = useCalm();
  const t = tileColors(c, tint);
  return (
    <View style={[styles.tile, { backgroundColor: t.bg }]}>
      <View style={styles.tileIcon}>
        <Feather name={icon} size={20} color={t.ink} />
      </View>
      <Text style={[styles.tileValue, { color: c.ink }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: c.muted }]}>{label}</Text>
    </View>
  );
}

// ─── Waveform (meditation player) ────────────────────────────────

const BARS = [
  10, 16, 22, 14, 26, 34, 20, 28, 16, 30, 22, 12, 24, 32, 18, 26, 14, 20, 30,
  16, 24, 12, 28, 20, 14, 26, 18, 32, 22, 12, 16, 28, 20, 14, 24, 30, 16, 22,
  12, 26, 18, 30, 14, 20, 26, 12, 18, 24,
];

export function Waveform({
  progress,
  playing,
  width = 320,
}: {
  progress: number; // 0..1 elapsed
  playing: boolean;
  width?: number;
}) {
  const { c, isDark } = useCalm();
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (playing) {
      pulse.value = withRepeat(withTiming(1.15, { duration: 900 }), -1, true);
    } else {
      pulse.value = withTiming(1, { duration: 300 });
    }
  }, [playing, pulse]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scaleY: pulse.value }] }));

  const gap = 3;
  const bw = (width - gap * (BARS.length - 1)) / BARS.length;
  const played = isDark ? c.ink : '#3A352A';
  return (
    <View style={{ width, alignItems: 'center' }}>
      <Animated.View style={anim}>
        <Svg width={width} height={40}>
          {BARS.map((h, i) => {
            const done = i / BARS.length <= progress;
            return (
              <Rect
                key={i}
                x={i * (bw + gap)}
                y={(40 - h) / 2}
                width={Math.max(bw, 2)}
                height={h}
                rx={2}
                fill={done ? played : c.lime}
                opacity={done ? 1 : 0.85}
              />
            );
          })}
        </Svg>
      </Animated.View>
    </View>
  );
}

// ─── Mood curve (emotion analytics) ──────────────────────────────

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export function MoodCurve({
  data,
  width = 320,
  height = 120,
  peakLabel,
}: {
  data: number[]; // 0..100
  width?: number;
  height?: number;
  peakLabel?: string;
}) {
  const { c } = useCalm();
  if (data.length < 2) {
    return (
      <View style={[styles.curveEmpty, { borderColor: c.line }]}>
        <Text style={{ color: c.muted, fontFamily: fonts.regular, fontSize: 13 }}>
          Not enough history yet — your curve appears after a few real days.
        </Text>
      </View>
    );
  }
  const pad = 8;
  const max = 100;
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: pad + (1 - Math.min(Math.max(v, 0), max) / max) * (height - pad * 2),
  }));
  const line = smoothPath(pts);
  const peakIdx = data.indexOf(Math.max(...data));
  const peak = pts[peakIdx];
  return (
    <View>
      <Svg width={width} height={height}>
        <Defs>
          <SvgGradient id="moodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#8B5CF6" />
            <Stop offset="55%" stopColor="#6D7FD4" />
            <Stop offset="100%" stopColor="#9DBE52" />
          </SvgGradient>
        </Defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <Rect
            key={f}
            x={0}
            y={height * f}
            width={width}
            height={1}
            fill={c.line}
            opacity={0.6}
          />
        ))}
        <Path d={line} fill="none" stroke="url(#moodGrad)" strokeWidth={3.5} strokeLinecap="round" />
        <Circle cx={peak.x} cy={peak.y} r={5} fill={c.surface} stroke="#8B5CF6" strokeWidth={3} />
      </Svg>
      {peakLabel ? (
        <View style={[styles.peakPill, { backgroundColor: c.limeSoft, left: Math.min(Math.max(peak.x - 34, 0), width - 76) }]}>
          <Text style={[styles.peakText, { color: c.limeInk }]}>{peakLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Meditation illustration (abstract calm scene) ───────────────

export function MeditateArt({ size = 260 }: { size?: number }) {
  const { isDark } = useCalm();
  const sun = isDark ? '#E8C86A' : '#F2CE5F';
  const leaf = isDark ? '#4E7A4E' : '#7BAF7B';
  const leafDeep = isDark ? '#3A5E3A' : '#5E915E';
  const robe = isDark ? '#3FA7A0' : '#4FBDB5';
  const pants = isDark ? '#C07A2E' : '#E09A3E';
  const skin = '#C68B59';
  const hair = '#7A4A2B';
  const w = size;
  const h = size * 0.86;
  return (
    <Svg width={w} height={h} viewBox="0 0 260 224">
      <Circle cx={130} cy={86} r={62} fill={sun} opacity={0.85} />
      {/* leaves */}
      <Path d="M18 190 C 40 150, 70 140, 92 148 C 74 168, 48 182, 18 190 Z" fill={leaf} />
      <Path d="M242 190 C 220 150, 190 140, 168 148 C 186 168, 212 182, 242 190 Z" fill={leaf} />
      <Path d="M38 200 C 62 178, 88 174, 104 180 C 86 194, 60 202, 38 200 Z" fill={leafDeep} />
      <Path d="M222 200 C 198 178, 172 174, 156 180 C 174 194, 200 202, 222 200 Z" fill={leafDeep} />
      {/* body */}
      <Path d="M96 190 C 100 160, 116 148, 130 148 C 144 148, 160 160, 164 190 C 140 198, 120 198, 96 190 Z" fill={pants} />
      <Path d="M104 158 C 108 136, 118 128, 130 128 C 142 128, 152 136, 156 158 L 148 162 C 140 156, 120 156, 112 162 Z" fill={robe} />
      {/* head */}
      <Circle cx={130} cy={112} r={17} fill={skin} />
      <Path d="M113 108 C 114 92, 124 86, 130 86 C 136 86, 146 92, 147 108 C 142 100, 136 98, 130 98 C 124 98, 118 100, 113 108 Z" fill={hair} />
      <Circle cx={130} cy={86} r={6} fill={hair} />
      {/* arms */}
      <Path d="M106 156 C 96 164, 90 172, 88 180" stroke={skin} strokeWidth={9} strokeLinecap="round" fill="none" />
      <Path d="M154 156 C 164 164, 170 172, 172 180" stroke={skin} strokeWidth={9} strokeLinecap="round" fill="none" />
      {/* breath arcs */}
      <Path d="M70 60 C 80 44, 96 36, 112 34" stroke={robe} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.5} />
      <Path d="M190 60 C 180 44, 164 36, 148 34" stroke={robe} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.5} />
    </Svg>
  );
}

// ─── Cached images (expo-image: GIF-capable, transitions, recycling) ───

export function CalmImage({
  uri,
  style,
  rounded = 14,
}: {
  uri?: string;
  style?: ImageStyle;
  rounded?: number;
}) {
  const { c } = useCalm();
  if (!uri) {
    return <View style={[{ backgroundColor: c.surface2, borderRadius: rounded }, style]} />;
  }
  return (
    <ExpoImage
      source={{ uri }}
      style={[{ borderRadius: rounded }, style]}
      contentFit="cover"
      transition={400}
      recyclingKey={uri}
      accessibilityIgnoresInvertColors
    />
  );
}

// ─── Ambient animated halo (GIF-like breathing glow, pure native motion) ───

export function BreathHalo({ active, size = 280 }: { active: boolean; size?: number }) {
  const { c } = useCalm();
  const s1 = useSharedValue(1);
  const s2 = useSharedValue(1);
  const o1 = useSharedValue(0.5);
  useEffect(() => {
    if (active) {
      s1.value = withRepeat(withTiming(1.25, { duration: 2400 }), -1, true);
      s2.value = withDelay(600, withRepeat(withTiming(1.4, { duration: 2400 }), -1, true));
      o1.value = withRepeat(withTiming(0.15, { duration: 2400 }), -1, true);
    } else {
      s1.value = withTiming(1, { duration: 500 });
      s2.value = withTiming(1, { duration: 500 });
      o1.value = withTiming(0.35, { duration: 500 });
    }
  }, [active, s1, s2, o1]);
  const a1 = useAnimatedStyle(() => ({ transform: [{ scale: s1.value }], opacity: o1.value }));
  const a2 = useAnimatedStyle(() => ({ transform: [{ scale: s2.value }], opacity: 0.18 }));
  const ring = {
    position: 'absolute' as const,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: c.lime,
  };
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[ring, a2]} />
      <Animated.View style={[ring, a1]} />
    </View>
  );
}

// ─── Small SVG scenes for empty states ─────────────────────────────────

export function EmptyArt({ kind = 'sprout', size = 120 }: { kind?: 'sprout' | 'moon' | 'sun'; size?: number }) {
  const { isDark } = useCalm();
  const green = isDark ? '#6FA06F' : '#7BAF7B';
  const deep = isDark ? '#3A5E3A' : '#5E915E';
  const sun = isDark ? '#E8C86A' : '#E8B84B';
  const moon = isDark ? '#C9C0EC' : '#8B84C9';
  const w = size;
  const h = size * 0.8;
  return (
    <Svg width={w} height={h} viewBox="0 0 120 96">
      {kind === 'sprout' ? (
        <>
          <Path d="M60 90 C 58 66, 60 44, 66 24" stroke={green} strokeWidth={4} fill="none" strokeLinecap="round" />
          <Path d="M61 70 C 46 62, 36 62, 28 68 C 38 76, 52 76, 61 70 Z" fill={green} />
          <Path d="M62 52 C 74 42, 84 42, 90 48 C 82 56, 70 56, 62 52 Z" fill={deep} />
          <Circle cx={72} cy={26} r={10} fill="#E8A0BF" />
          <Circle cx={72} cy={26} r={3.4} fill="#C96A8E" />
        </>
      ) : kind === 'moon' ? (
        <>
          <Path d="M78 12 C 60 18, 50 34, 54 52 C 58 70, 74 80, 90 74 C 78 70, 70 58, 71 44 C 72 30, 74 20, 78 12 Z" fill={moon} />
          <Circle cx={36} cy={30} r={2.4} fill={moon} opacity={0.7} />
          <Circle cx={48} cy={18} r={1.8} fill={moon} opacity={0.5} />
          <Circle cx={30} cy={56} r={1.8} fill={moon} opacity={0.5} />
          <Ellipse cx={60} cy={88} rx={34} ry={5} fill={moon} opacity={0.25} />
        </>
      ) : (
        <>
          <Circle cx={60} cy={44} r={22} fill={sun} opacity={0.9} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
            const r1 = 30;
            const r2 = 38;
            const rad = (a * Math.PI) / 180;
            return (
              <Path
                key={a}
                d={`M ${60 + r1 * Math.cos(rad)} ${44 + r1 * Math.sin(rad)} L ${60 + r2 * Math.cos(rad)} ${44 + r2 * Math.sin(rad)}`}
                stroke={sun}
                strokeWidth={4}
                strokeLinecap="round"
              />
            );
          })}
          <Ellipse cx={60} cy={88} rx={34} ry={5} fill={sun} opacity={0.3} />
        </>
      )}
    </Svg>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 110, gap: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C96A2E',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  inkBtn: {
    minHeight: 52,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  inkBtnText: { fontFamily: fonts.bold, fontSize: 15 },
  ghostBtn: {
    minHeight: 50,
    borderRadius: 999,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ghostBtnText: { fontFamily: fonts.semiBold, fontSize: 14 },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  aiPillText: { fontFamily: fonts.semiBold, fontSize: 12 },
  emoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  emoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 46,
    paddingHorizontal: 15,
    borderRadius: 999,
    borderWidth: 1.2,
  },
  emoEmoji: { fontSize: 19 },
  emoLabel: { fontFamily: fonts.semiBold, fontSize: 13 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  dayCol: { alignItems: 'center', gap: 6, minWidth: 38 },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: { fontFamily: fonts.bold, fontSize: 13 },
  dayLetter: { fontFamily: fonts.semiBold, fontSize: 11 },
  tile: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    gap: 6,
    minHeight: 128,
    justifyContent: 'flex-end',
  },
  tileIcon: { position: 'absolute', top: 14, right: 14, opacity: 0.9 },
  tileValue: { fontFamily: serif, fontWeight: '700', fontSize: 30, lineHeight: 34 },
  tileLabel: { fontFamily: fonts.medium, fontSize: 12 },
  curveEmpty: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  peakPill: {
    position: 'absolute',
    top: -8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  peakText: { fontFamily: fonts.bold, fontSize: 11 },
});
