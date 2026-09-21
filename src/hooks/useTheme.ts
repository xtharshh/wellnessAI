import { useAuthStore } from '@/src/stores/authStore';
import { getThemeColors } from '@/src/theme/colors';

export function useTheme() {
  const themeMode = useAuthStore((state) => state.theme);
  const setTheme = useAuthStore((state) => state.setTheme);
  const colors = getThemeColors(themeMode);

  return {
    theme: themeMode,
    setTheme,
    colors,
    isDark: themeMode === 'dark',
  };
}
