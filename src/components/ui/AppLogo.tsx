import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

interface AppLogoProps {
  size?: number;
}

/**
 * Wellness AI brand mark: deep forest→teal squircle with a cream sprout
 * reaching for the sun. Single source of truth — splash, landing, auth.
 */
export function AppLogo({ size = 90 }: AppLogoProps) {
  const radius = size * 0.28;
  const pad = size * 0.2;
  const inner = size - pad * 2;

  return (
    <View
      style={[
        styles.card,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
      ]}
    >
      <LinearGradient
        colors={['#22402F', '#0E2422']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.face,
          {
            width: inner,
            height: inner,
            borderRadius: radius * 0.72,
          },
        ]}
      >
        <Svg width={inner * 0.66} height={inner * 0.66} viewBox="0 0 64 64">
          {/* sun */}
          <Circle cx={42} cy={16} r={6} fill="#F3EADB" />
          {/* stem */}
          <Path
            d="M30 52 C 29 42, 30 32, 34 22"
            fill="none"
            stroke="#F3EADB"
            strokeWidth={3.4}
            strokeLinecap="round"
          />
          {/* leaves */}
          <Path d="M30 42 C 22 38, 16 38, 11 42 C 17 47, 25 47, 30 42 Z" fill="#9DBE8B" />
          <Path d="M31 33 C 37 27, 43 27, 47 30 C 43 35, 36 35, 31 33 Z" fill="#B9D6A4" />
          {/* ground */}
          <Path
            d="M16 52 C 26 56, 38 56, 48 52"
            fill="none"
            stroke="#F3EADB"
            strokeWidth={2.6}
            strokeLinecap="round"
            opacity={0.7}
          />
        </Svg>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0C1512',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(243, 234, 219, 0.16)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  face: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
