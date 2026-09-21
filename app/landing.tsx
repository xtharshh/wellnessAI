import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

import { InkButton, Serif, useCalm } from '@/src/components/calm/kit';
import { AppLogo } from '@/src/components/ui/AppLogo';
import { Art, ArtKind } from '@/src/components/calm/art';
import { fonts } from '@/src/theme/typography';

const { width: SCREEN_W } = Dimensions.get('window');

function FloatingArt({ kind, tint }: { kind: ArtKind; tint: string }) {
  const { c } = useCalm();
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withTiming(-10, { duration: 1800 }), -1, true);
  }, [y]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <View style={[styles.artStage, { backgroundColor: tint }]}>
      <Animated.View style={anim}>
        <Art kind={kind} size={132} />
      </Animated.View>
    </View>
  );
}

function CurveArt() {
  const { c } = useCalm();
  const draw = useSharedValue(0);
  useEffect(() => {
    draw.value = withRepeat(withTiming(1, { duration: 2600 }), -1, false);
  }, [draw]);
  // Static product illustration (not user data): a rising insight curve.
  return (
    <View style={[styles.artStage, { backgroundColor: c.limeSoft }]}>
      <Svg width={200} height={110} viewBox="0 0 200 110">
        <Defs>
          <SvgGradient id="landCurve" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#8B5CF6" />
            <Stop offset="100%" stopColor="#9DBE52" />
          </SvgGradient>
        </Defs>
        {[28, 55, 82].map((yy) => (
          <Path key={yy} d={`M 12 ${yy} L 188 ${yy}`} stroke={c.line} strokeWidth={1} />
        ))}
        <Path
          d="M 14 88 C 50 86, 60 50, 95 54 C 130 58, 140 30, 186 24"
          fill="none"
          stroke="url(#landCurve)"
          strokeWidth={5}
          strokeLinecap="round"
        />
        <Circle cx={95} cy={54} r={6} fill={c.surface} stroke="#8B5CF6" strokeWidth={3.5} />
        <Circle cx={186} cy={24} r={6} fill="#9DBE52" />
      </Svg>
    </View>
  );
}

const SLIDES = [
  {
    key: 'track',
    eyebrow: 'TRACK • 1 OF 3',
    title: 'Your days, gently recorded.',
    body: 'Mood, sleep, steps and calm — measured passively. No logging marathons.',
  },
  {
    key: 'understand',
    eyebrow: 'UNDERSTAND • 2 OF 3',
    title: 'Patterns, not just numbers.',
    body: 'Wellness AI connects sleep, stress and mood into plain, honest insight.',
  },
  {
    key: 'act',
    eyebrow: 'ACT • 3 OF 3',
    title: 'One small step daily.',
    body: 'A kinder plan, quick relief, and human help when it matters most.',
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const { c, isDark } = useCalm();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onViewableChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
    }
  ).current;

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    }
  };

  const artFor = (key: string) => {
    if (key === 'track')
      return <FloatingArt kind="path" tint={isDark ? c.surface : '#E4EBD8'} />;
    if (key === 'understand') return <CurveArt />;
    return <FloatingArt kind="sprout" tint={isDark ? c.surface : '#E9EDD2'} />;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <AppLogo size={34} />
          <Text style={[styles.brandName, { color: c.ink }]}>Wellness AI</Text>
        </View>
        {index < SLIDES.length - 1 ? (
          <Pressable
            onPress={() => listRef.current?.scrollToIndex({ index: 2, animated: true })}
            accessibilityRole="button"
            accessibilityLabel="Skip intro"
            style={styles.skip}
          >
            <Text style={[styles.skipText, { color: c.muted }]}>Skip</Text>
          </Pressable>
        ) : (
          <View style={{ width: 52 }} />
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_W }]}>
            {artFor(item.key)}
            <Text style={[styles.eyebrow, { color: c.muted }]}>{item.eyebrow}</Text>
            <Serif style={[styles.title, { color: c.ink }]}>{item.title}</Serif>
            <Text style={[styles.body, { color: c.muted }]}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View
            key={s.key}
            style={[
              styles.dot,
              {
                width: i === index ? 22 : 6,
                backgroundColor: i === index ? c.ink : c.line,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        {index < SLIDES.length - 1 ? (
          <InkButton label="Next" onPress={next} icon="arrow-right" />
        ) : (
          <>
            <InkButton label="Get Started" onPress={() => router.push('/(auth)/signup')} icon="arrow-right" />
            <Pressable
              onPress={() => router.push('/(auth)/login')}
              accessibilityRole="button"
              accessibilityLabel="Sign in to existing account"
              style={styles.signin}
            >
              <Text style={[styles.signinText, { color: c.ink }]}>I already have an account</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    minHeight: 52,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandName: { fontFamily: fonts.bold, fontSize: 16 },
  skip: { minHeight: 44, minWidth: 52, alignItems: 'flex-end', justifyContent: 'center' },
  skipText: { fontFamily: fonts.semiBold, fontSize: 14 },
  slide: { gap: 10, paddingTop: 8, paddingHorizontal: 20 },
  artStage: {
    height: 250,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  eyebrow: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 2, textAlign: 'center' },
  title: { fontSize: 30, lineHeight: 36, textAlign: 'center' },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, textAlign: 'center', paddingHorizontal: 12 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7, paddingVertical: 12 },
  dot: { height: 6, borderRadius: 3 },
  footer: { paddingHorizontal: 20, paddingBottom: 26, gap: 2 },
  signin: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  signinText: { fontFamily: fonts.semiBold, fontSize: 14 },
});
