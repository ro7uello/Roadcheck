import { Stack } from 'expo-router';

export default function PedestrianLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false
      }}
    />
  );
}