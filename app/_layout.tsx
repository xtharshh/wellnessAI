import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';

import { AppProviders } from '@/src/providers/AppProviders';
import { useRealtimeSync } from '@/src/hooks/useRealtimeSync';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuthStore } from '@/src/stores/authStore';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AppWithTheme() {
  const { colors, theme } = useTheme();
  useRealtimeSync();

  const activeNavigationTheme = {
    ...(theme === 'light' ? DefaultTheme : DarkTheme),
    colors: {
      ...(theme === 'light' ? DefaultTheme.colors : DarkTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.onSurface,
      border: colors.outline,
      primary: colors.primaryAccent,
    },
  };

  return (
    <ThemeProvider value={activeNavigationTheme}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)/privacy" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/signup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="ai-insights" />
        <Stack.Screen name="perfect-plan" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true, title: 'Metric Detail' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydrated = useAuthStore((state) => state.hydrated);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && hydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, hydrated]);

  if (!fontsLoaded || !hydrated) {
    return null;
  }

  return (
    <AppProviders>
      <AppWithTheme />
    </AppProviders>
  );
}
