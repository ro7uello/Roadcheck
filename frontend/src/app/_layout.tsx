// frontend/src/app/_layout.tsx
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Pixel3': require('../../assets/fonts/pixel3.ttf'),
    'Pixel3-Regular': require('../../assets/fonts/pixel3.ttf'),
    'pixel': require('../../assets/fonts/pixel3.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="loadingScreen" />
      <Stack.Screen name="optionPage" />
      <Stack.Screen name="phaseSelectionScreen" />
      <Stack.Screen name="account-creation" />
      <Stack.Screen name="register" />
      <Stack.Screen name="categorySelectionScreen" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="scenarios" />
    </Stack>
  );
}