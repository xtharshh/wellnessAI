import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';

import { AppProviders } from '@/src/providers/AppProviders';
import { useRealtimeSync } from '@/src/hooks/useRealtimeSync';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuthStore } from '@/src/stores/authStore';
import { NotificationService } from '@/src/services/notificationService';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AppWithTheme() {
  console.log('[AppWithTheme] Initializing...');
  const { colors, theme } = useTheme();
  useRealtimeSync();

  useEffect(() => {
    console.log('[AppWithTheme] Initializing NotificationService');
    NotificationService.init().catch((error) => {
      console.error('[AppWithTheme] NotificationService initialization error:', error);
    });
  }, []);

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
        <Stack.Screen name="landing" />
        <Stack.Screen name="(onboarding)/privacy" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/signup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="ai-insights" />
        <Stack.Screen name="perfect-plan" />
        <Stack.Screen name="telemetry" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true, title: 'Metric Detail' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydrated = useAuthStore((state) => state.hydrated);

  // Locally bundled fonts (assets/fonts) — no runtime network download,
  // so Expo Go / offline devices can't fail here the way remote Google
  // Fonts fetching can (ExpoAsset.downloadAsync rejections).
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular: require('../assets/fonts/Inter_400Regular.ttf'),
    Inter_500Medium: require('../assets/fonts/Inter_500Medium.ttf'),
    Inter_600SemiBold: require('../assets/fonts/Inter_600SemiBold.ttf'),
    Inter_700Bold: require('../assets/fonts/Inter_700Bold.ttf'),
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    console.log('[RootLayout] Starting hydration...');
    hydrate().catch((err) => {
      console.error('[RootLayout] Hydration failed:', err);
    });
  }, [hydrate]);

  useEffect(() => {
    if (fontError) {
      // Never hard-crash the app over fonts — fall back to system fonts.
      console.warn('[RootLayout] Font load failed, using system fonts:', fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && hydrated) {
      console.log('[RootLayout] Ready, hiding splash screen');
      SplashScreen.hideAsync().catch((err) => {
        console.warn('[RootLayout] Error hiding splash screen:', err);
      });
    }
  }, [fontsLoaded, fontError, hydrated]);

  console.log('[RootLayout] Render - fontsLoaded:', fontsLoaded, 'hydrated:', hydrated);

  if ((!fontsLoaded && !fontError) || !hydrated) {
    return null;
  }

  return (
    <AppProviders>
      <AppWithTheme />
    </AppProviders>
  );
}
