export const darkColors = {
  background: '#0c0d12',
  backgroundDeep: '#050608',
  surface: '#161922',
  surfaceContainer: '#1f222e',
  surfaceContainerHigh: '#2a2d3c',
  primary: '#a2cbfd', // Soft Blue
  primaryAccent: '#a2cbfd',
  primaryContainer: 'rgba(162, 203, 253, 0.2)',
  secondary: '#f7bee9', // Soft Pink
  secondaryAccent: '#f7bee9',
  tertiary: '#ffdc62', // Warm Yellow
  tertiaryAccent: '#ffdc62',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#a29bb0',
  outline: 'rgba(162, 203, 253, 0.2)',
  error: '#ffb4ab',
  riskLow: '#a7f3d0', // Soft Green
  riskMedium: '#a2cbfd', // Soft Blue
  riskHigh: '#f7bee9', // Soft Pink
  glassBorder: 'rgba(162, 203, 253, 0.15)',
  glassBackground: 'rgba(22, 25, 34, 0.7)',
};

export const lightColors = {
  background: '#f4f7fa', // Soft clinical blue-gray
  backgroundDeep: '#e8edf3',
  surface: '#ffffff',
  surfaceContainer: '#eef2f7',
  surfaceContainerHigh: '#e2e8f0',
  primary: '#5a9efa', // Deepened Soft Blue for active buttons/text in light mode
  primaryAccent: '#a2cbfd', // Soft Blue
  primaryContainer: '#d0e6ff',
  secondary: '#eb86d6', // Deepened Soft Pink
  secondaryAccent: '#f7bee9', // Soft Pink
  tertiary: '#e0b516', // Deepened Warm Yellow
  tertiaryAccent: '#ffdc62', // Warm Yellow
  onSurface: '#1e293b', // Slate black
  onSurfaceVariant: '#64748b', // Slate gray
  outline: 'rgba(162, 203, 253, 0.3)',
  error: '#dc2626',
  riskLow: '#10b981',
  riskMedium: '#0ea5e9',
  riskHigh: '#f43f5e',
  glassBorder: 'rgba(162, 203, 253, 0.2)',
  glassBackground: 'rgba(255, 255, 255, 0.85)',
};

export function getThemeColors(themeMode: 'dark' | 'light') {
  return themeMode === 'light' ? lightColors : darkColors;
}

// Default fallback colors matching dark mode for backwards compatibility
export const colors = darkColors;
