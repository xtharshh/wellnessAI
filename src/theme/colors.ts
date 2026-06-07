export const darkColors = {
  background: '#0a0813', // Deep dark purple/black matching screenshots
  backgroundDeep: '#050409',
  surface: '#151126', // Premium card surface
  surfaceContainer: '#1f1a36',
  surfaceContainerHigh: '#282245',
  primary: '#a855f7', // Vibrant Purple
  primaryAccent: '#a855f7',
  primaryContainer: 'rgba(168, 85, 247, 0.2)',
  secondary: '#a855f7', // Purple (matched to primary)
  secondaryAccent: '#a855f7',
  tertiary: '#a855f7', // Purple
  tertiaryAccent: '#a855f7',
  onSurface: '#f5f5f7',
  onSurfaceVariant: '#8f8f9e', // Muted label color matching screenshots
  outline: 'rgba(168, 85, 247, 0.15)',
  error: '#ef4444',
  riskLow: '#10b981', // Green
  riskMedium: '#a855f7', // Purple
  riskHigh: '#ef4444', // Red
  glassBorder: 'rgba(168, 85, 247, 0.15)',
  glassBackground: 'rgba(21, 17, 38, 0.8)',
};

export const lightColors = {
  background: '#f4f2ff', // Soft lavender-gray matching screenshots
  backgroundDeep: '#eae6ff',
  surface: '#ffffff', // Clean white card surface
  surfaceContainer: '#f5f0ff',
  surfaceContainerHigh: '#ede5ff',
  primary: '#7c3aed', // Deep Purple for light mode
  primaryAccent: '#a855f7', // Vibrant Purple
  primaryContainer: '#ede9fe',
  secondary: '#7c3aed', // Purple
  secondaryAccent: '#a855f7', // Purple
  tertiary: '#7c3aed', // Purple
  tertiaryAccent: '#a855f7', // Purple
  onSurface: '#1a1a2e', // Dark slate
  onSurfaceVariant: '#6b6b7f', // Medium gray
  outline: 'rgba(124, 58, 237, 0.15)',
  error: '#ef4444',
  riskLow: '#10b981',
  riskMedium: '#7c3aed',
  riskHigh: '#ef4444',
  glassBorder: 'rgba(124, 58, 237, 0.15)',
  glassBackground: 'rgba(255, 255, 255, 0.9)',
};

export function getThemeColors(themeMode: 'dark' | 'light') {
  return themeMode === 'light' ? lightColors : darkColors;
}

// Default fallback colors matching dark mode for backwards compatibility
export const colors = darkColors;
