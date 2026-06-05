import { TextStyle } from 'react-native';

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  mono: 'SpaceMono',
} as const;

export const typography = {
  displayLg: {
    fontFamily: fonts.bold,
    fontSize: 48,
    lineHeight: 53,
    letterSpacing: -0.96,
  },
  headlineLgMobile: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    lineHeight: 29,
  },
  titleMd: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  bodyLg: {
    fontFamily: fonts.regular,
    fontSize: 18,
    lineHeight: 29,
  },
  bodyMd: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  labelCaps: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  },
  dataMono: {
    fontFamily: fonts.mono,
    fontSize: 14,
    lineHeight: 14,
  },
} as const;
