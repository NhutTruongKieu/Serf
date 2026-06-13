import { AppSettingsProvider, useAppSettings } from '@/contexts/app-settings';
import { AuthProvider } from '@/contexts/auth-context';
import { VocabularyProvider } from '@/contexts/vocabulary-context';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import SplashScreen from "react-native-splash-screen";

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutInner() {
  const { themeMode } = useAppSettings();

  useEffect(() => {
    SplashScreen.hide();
  }, []);

  return (
    <ThemeProvider value={themeMode === 'light' ? DefaultTheme : DarkTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="review" options={{ headerShown: false }} />
        <Stack.Screen name="srs-quiz" options={{ headerShown: false }} />
        <Stack.Screen name="passage" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={themeMode === 'light' ? 'dark' : 'light'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppSettingsProvider>
        <VocabularyProvider>
          <RootLayoutInner />
        </VocabularyProvider>
      </AppSettingsProvider>
    </AuthProvider>
  );
}
