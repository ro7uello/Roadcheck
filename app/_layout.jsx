import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Pixel3': require('../assets/fonts/pixel3.ttf'),
    // You can also add multiple variants if the font has them
    'Pixel3-Regular': require('../assets/fonts/pixel3.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Debug font loading
    console.log('Pixel3 font loaded:', fontsLoaded);
    if (fontError) {
      console.error('Font loading error:', fontError);
      console.log('Make sure pixel3.ttf is in assets/fonts/ folder');
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        orientation: 'landscape',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="loadingScreen" options={{ title: 'Loading' }} />
    </Stack>
  );
}