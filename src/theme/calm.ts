import { Platform } from 'react-native';

export interface CalmPalette {
  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  muted: string;
  faint: string;
  line: string;
  // pastel tiles
  sage: string;
  sageInk: string;
  lavender: string;
  lavenderInk: string;
  periwinkle: string;
  periInk: string;
  mint: string;
  mintInk: string;
  peach: string;
  peachInk: string;
  lime: string;
  limeSoft: string;
  limeInk: string;
  // actions
  btnBg: string;
  btnInk: string;
  danger: string;
  shadow: string;
}

export const calmLight: CalmPalette = {
  bg: '#F5F1E8',
  surface: '#FFFDF7',
  surface2: '#EFEAD9',
  ink: '#211C12',
  muted: '#655D4E',
  faint: '#A29A86',
  line: '#E6DFCC',
  sage: '#DCE6CC',
  sageInk: '#2C3F20',
  lavender: '#E4DFF2',
  lavenderInk: '#3E3670',
  periwinkle: '#DCE2F1',
  periInk: '#2E3C63',
  mint: '#D5E9E9',
  mintInk: '#1F4A4A',
  peach: '#F3E2CF',
  peachInk: '#6B4226',
  lime: '#B9D46A',
  limeSoft: '#EDF2D8',
  limeInk: '#4A5E1E',
  btnBg: '#221D13',
  btnInk: '#F7F3E8',
  danger: '#B4432B',
  shadow: 'rgba(60,50,30,0.10)',
};

export const calmDark: CalmPalette = {
  bg: '#14110C',
  surface: '#1F1A13',
  surface2: '#292219',
  ink: '#F1EADA',
  muted: '#B6AB94',
  faint: '#7A7060',
  line: '#322A1F',
  sage: '#26331E',
  sageInk: '#CFE0B8',
  lavender: '#2A2440',
  lavenderInk: '#C9C0EC',
  periwinkle: '#232B45',
  periInk: '#BCC9E8',
  mint: '#1D2E2E',
  mintInk: '#A9D8D8',
  peach: '#33271A',
  peachInk: '#EAC9A4',
  lime: '#9DBE52',
  limeSoft: '#2A3018',
  limeInk: '#D4E69A',
  btnBg: '#EFE7D3',
  btnInk: '#211C12',
  danger: '#E08064',
  shadow: 'rgba(0,0,0,0.35)',
};

// Display serif — no download needed: Georgia (iOS) / serif → Noto Serif (Android).
export const serif: string = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

export const calmRadius = { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 };

export type TileTint = 'sage' | 'lavender' | 'periwinkle' | 'mint' | 'peach' | 'limeSoft';

export function tileColors(c: CalmPalette, tint: TileTint): { bg: string; ink: string } {
  switch (tint) {
    case 'sage':
      return { bg: c.sage, ink: c.sageInk };
    case 'lavender':
      return { bg: c.lavender, ink: c.lavenderInk };
    case 'periwinkle':
      return { bg: c.periwinkle, ink: c.periInk };
    case 'mint':
      return { bg: c.mint, ink: c.mintInk };
    case 'peach':
      return { bg: c.peach, ink: c.peachInk };
    case 'limeSoft':
      return { bg: c.limeSoft, ink: c.limeInk };
  }
}
