import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useCalm } from '@/src/components/calm/kit';
import { TileTint, tileColors } from '@/src/theme/calm';

export type ArtKind =
  | 'sun'
  | 'moon'
  | 'path'
  | 'waves'
  | 'lotus'
  | 'heart'
  | 'drop'
  | 'sprout'
  | 'stars'
  | 'cloudRain'
  | 'bolt'
  | 'leaf';

// Hand-drawn wellness motifs. Fixed harmonious hues sit well on every pastel
// tile in both light and dark modes — no downloads, infinitely sharp.
export function Art({ kind, size = 40 }: { kind: ArtKind; size?: number }) {
  const common = { width: size, height: size };
  switch (kind) {
    case 'sun':
      return (
        <Svg viewBox="0 0 64 64" {...common}>
          <Circle cx={32} cy={32} r={13} fill="#E8A83E" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
            const rad = (a * Math.PI) / 180;
            const x1 = 32 + 18 * Math.cos(rad);
            const y1 = 32 + 18 * Math.sin(rad);
            const x2 = 32 + 24 * Math.cos(rad);
            const y2 = 32 + 24 * Math.sin(rad);
            return <Path key={a} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke="#E8A83E" strokeWidth={3.4} strokeLinecap="round" />;
          })}
          <Circle cx={27} cy={29} r={4} fill="#F6D98A" opacity={0.9} />
        </Svg>
      );
    case 'moon':
      return (
        <Svg viewBox="0 0 64 64" {...common}>
          <Path
            d="M42 8 C 28 12, 20 24, 22 38 C 24 52, 38 60, 50 54 C 40 51, 34 42, 35 31 C 36 21, 38 14, 42 8 Z"
            fill="#7C83C4"
          />
          <Circle cx={20} cy={18} r={2.4} fill="#B9BEE8" />
          <Circle cx={48} cy={50} r={2} fill="#B9BEE8" />
          <Circle cx={16} cy={42} r={1.7} fill="#B9BEE8" />
        </Svg>
      );
    case 'path':
      return (
        <Svg viewBox="0 0 64 64" {...common}>
          <Path d="M10 50 C 22 46, 26 36, 34 32 C 42 28, 46 20, 54 16" stroke="#5E915E" strokeWidth={3.4} fill="none" strokeLinecap="round" strokeDasharray="1 7" />
          <Circle cx={12} cy={51} r={4.4} fill="#4E7A4E" />
          <Circle cx={34} cy={32} r={4.4} fill="#7BAF7B" />
          <Circle cx={53} cy={15} r={4.4} fill="#B9D46A" />
        </Svg>
      );
    case 'waves':
      return (
        <Svg viewBox="0 0 64 64" {...common}>
          <Path d="M8 24 C 16 16, 24 32, 32 24 C 40 16, 48 32, 56 24" stroke="#3FA7A0" strokeWidth={3.6} fill="none" strokeLinecap="round" />
          <Path d="M8 34 C 16 26, 24 42, 32 34 C 40 26, 48 42, 56 34" stroke="#7BC4BE" strokeWidth={3.2} fill="none" strokeLinecap="round" />
          <Path d="M8 44 C 16 36, 24 52, 32 44 C 40 36, 48 52, 56 44" stroke="#B9DCD8" strokeWidth={2.8} fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'lotus':
      return (
        <Svg viewBox="0 0 64 64" {...common}>
          <Path d="M32 12 C 36 22, 36 30, 32 38 C 28 30, 28 22, 32 12 Z" fill="#B678C9" />
          <Path d="M18 22 C 26 26, 30 32, 30 40 C 22 38, 17 31, 18 22 Z" fill="#C99ADE" />
          <Path d="M46 22 C 38 26, 34 32, 34 40 C 42 38, 47 31, 46 22 Z" fill="#C99ADE" />
          <Path d="M12 40 C 20 40, 27 44, 30 50 C 22 52, 14 48, 12 40 Z" fill="#DDB9EC" />
          <Path d="M52 40 C 44 40, 37 44, 34 50 C 42 52, 50 48, 52 40 Z" fill="#DDB9EC" />
          <Path d="M10 52 C 24 58, 40 58, 54 52 C 44 60, 20 60, 10 52 Z" fill="#8B5CF6" opacity={0.55} />
        </Svg>
      );
    case 'heart':
      return (
        <Svg viewBox="0 0 64 64" {...common}>
          <Path
            d="M32 52 C 18 42, 10 34, 10 25 C 10 18, 15 14, 20 14 C 25 14, 30 18, 32 23 C 34 18, 39 14, 44 14 C 49 14, 54 18, 54 25 C 54 34, 46 42, 32 52 Z"
            fill="#D96A8B"
          />
          <Path d="M18 30 L 24 30 L 27 24 L 31 36 L 34 28 L 37 31 L 46 31" stroke="#F6D3DE" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'drop':
      return (
        <Svg viewBox="0 0 64 64" {...common}>
          <Path d="M32 8 C 40 20, 48 30, 48 40 C 48 49, 41 55, 32 55 C 23 55, 16 49, 16 40 C 16 30, 24 20, 32 8 Z" fill="#4FA3D8" />
          <Path d="M25 38 C 25 43, 28 46, 32 46" stroke="#BFE0F5" strokeWidth={3.2} fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'sprout':
      return (
        <Svg viewBox="0 0 64 64" {...common}>
          <Path d="M32 56 C 31 44, 32 32, 36 20" stroke="#4E7A4E" strokeWidth={3.4} fill="none" strokeLinecap="round" />
          <Path d="M32 44 C 24 40, 18 40, 13 44 C 19 49, 27 49, 32 44 Z" fill="#6FA06F" />
          <Path d="M33 34 C 39 28, 45 28, 49 31 C 45 36, 38 36, 33 34 Z" fill="#7BAF7B" />
          <Circle cx={40} cy={16} r={5.4} fill="#E8A0BF" />
          <Circle cx={40} cy={16} r={2} fill="#C96A8E" />
        </Svg>
      );
    case 'stars':
      return (
        <Svg viewBox="0 0 64 64" {...common}>
          <Path d="M32 8 L 36 24 L 52 28 L 36 32 L 32 48 L 28 32 L 12 28 L 28 24 Z" fill="#E8C86A" />
          <Path d="M50 42 L 52 48 L 58 50 L 52 52 L 50 58 L 48 52 L 42 50 L 48 48 Z" fill="#B9D46A" />
          <Circle cx={14} cy={46} r={3} fill="#DDB9EC" />
        </Svg>
      );
    case 'cloudRain':
      return (
        <Svg viewBox="0 0 64 64" {...common}>
          <Path d="M20 40 C 12 40, 8 34, 10 28 C 12 22, 18 20, 22 22 C 24 14, 32 10, 40 13 C 48 16, 52 24, 49 31 C 55 32, 58 38, 55 43 C 50 47, 26 47, 20 40 Z" fill="#9AA5D1" />
          <Path d="M24 50 L 22 56 M32 50 L 30 56 M40 50 L 38 56 M48 50 L 46 56" stroke="#6D84C4" strokeWidth={2.8} strokeLinecap="round" />
        </Svg>
      );
    case 'bolt':
      return (
        <Svg viewBox="0 0 64 64" {...common}>
          <Path d="M18 30 C 12 30, 8 25, 10 20 C 12 15, 17 13, 21 15 C 23 9, 30 6, 36 8 C 42 10, 45 16, 43 21 L 20 21 C 19 24, 19 27, 18 30 Z" fill="#8A8FA8" />
          <Path d="M34 24 L 24 40 L 31 40 L 28 54 L 42 34 L 34 34 L 38 24 Z" fill="#E8A83E" />
        </Svg>
      );
    case 'leaf':
      return (
        <Svg viewBox="0 0 64 64" {...common}>
          <Path d="M50 12 C 30 14, 16 28, 14 50 C 36 48, 50 34, 50 12 Z" fill="#6FA06F" />
          <Path d="M18 46 C 28 36, 38 26, 47 16" stroke="#3E6B3E" strokeWidth={2.6} fill="none" strokeLinecap="round" />
        </Svg>
      );
  }
}

// Rounded art tile for cards: tinted wash + centered motif.
export function ArtTile({
  kind,
  size = 52,
  tint,
}: {
  kind: ArtKind;
  size?: number;
  tint?: TileTint;
}) {
  const { c } = useCalm();
  const bg = tint ? tileColors(c, tint).bg : c.surface2;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Art kind={kind} size={size * 0.62} />
    </View>
  );
}

// Mood tag → motif mapping shared by journal + insights.
export function artForMood(tag: string): ArtKind {
  switch (tag) {
    case 'Happy':
      return 'sun';
    case 'Excited':
      return 'stars';
    case 'Angry':
      return 'bolt';
    case 'Stressed':
      return 'waves';
    case 'Sad':
      return 'cloudRain';
    case 'Calm':
      return 'lotus';
    default:
      return 'leaf';
  }
}

// Practice / recommendation category → motif.
export function artForCategory(cat: string): ArtKind {
  switch (cat) {
    case 'sleep':
      return 'moon';
    case 'mindfulness':
      return 'lotus';
    case 'activity':
      return 'path';
    default:
      return 'sprout';
  }
}
