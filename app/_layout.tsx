import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/providers/auth-provider';

const BYPASS_AUTH = process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true';

function AuthGuard() {
  const { isLoading, session } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const isSignedIn = BYPASS_AUTH || !!session;
    const inAuthGroup = segments[0] === '(auth)';
    const inPublicRoute =
      segments[0] === 'splash' ||
      segments[0] === 'video' ||
      segments[0] === 'welcome';

    if (!isSignedIn && !inAuthGroup && !inPublicRoute) {
      router.replace('/welcome');
    } else if (isSignedIn && (inAuthGroup || segments[0] === 'welcome')) {
      router.replace('/home');
    }
  }, [isLoading, session, segments, router]);

  return null;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Tous les écrans déclarés inconditionnellement — règle expo-router */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splash" />
        <Stack.Screen name="video" />
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="hunts/[id]" options={{ title: 'Chasse' }} />
        <Stack.Screen name="hunt-map/[id]" options={{ title: 'Carte de la chasse' }} />
        <Stack.Screen name="ar-step/[id]" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <AuthGuard />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
