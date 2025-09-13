// app/_layout.jsx
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Pixel3: require("../assets/fonts/pixel3.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right", // default transition
      }}
    >
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen name="loading-screen" options={{ title: "Loading", animation:"slide_from_right", presentation:"transparentModal" }} />
      <Stack.Screen name="option-screen" options={{ title: "Options", presentation:"transparentModal"}} />

      {/* ✅ Settings-tab uses fade + transparent modal to avoid white flash */}
      <Stack.Screen
        name="settings-tab"
        options={{
          title: "Settings",
          animation: "fade",
          presentation: "transparentModal",
        }}
      />

      <Stack.Screen
       name="driverGame" 
       options={{ title: "Driver Game",animation:"slide_from_right", presentation:"transparentModal"}} />
      <Stack.Screen
        name="pedestrianGame"
        options={{ title: "Pedestrian Game" }}
      />
    </Stack>
  );
}
