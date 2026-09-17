import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface AppLogoProps {
  size?: number;
}

/**
 * MindTrace brand mark: dark squircle, purple + teal spheres,
 * white signal wave. Single source of truth for the logo —
 * used by splash, landing, login and signup.
 */
export function AppLogo({ size = 90 }: AppLogoProps) {
  const radius = size * 0.27;
  const spheres = size * 0.58;
  const ball = spheres * 0.54;
  const waveW = spheres * 0.92;
  const waveH = spheres * 0.31;

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
      <View style={[styles.spheres, { width: spheres, height: spheres }]}>
        <LinearGradient
          colors={['#9f62ff', '#491b9a']}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          style={[
            styles.ball,
            {
              width: ball,
              height: ball,
              borderRadius: ball / 2,
              top: spheres * 0.1,
              left: spheres * 0.08,
            },
          ]}
        />
        <LinearGradient
          colors={['#3de2b5', '#0c6e54']}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          style={[
            styles.ball,
            {
              width: ball,
              height: ball,
              borderRadius: ball / 2,
              bottom: spheres * 0.1,
              right: spheres * 0.08,
            },
          ]}
        />
        <Svg
          height={waveH}
          width={waveW}
          viewBox="0 0 48 16"
          style={[styles.wave, { top: (spheres - waveH) / 2, left: (spheres - waveW) / 2 }]}
        >
          <Path
            d="M 2 8 C 10 0, 14 16, 24 8 C 34 0, 38 16, 46 8"
            fill="none"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161129',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  spheres: {
    position: 'relative',
  },
  ball: {
    position: 'absolute',
  },
  wave: {
    position: 'absolute',
    zIndex: 10,
  },
});
