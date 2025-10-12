import React from 'react';
import { Stack } from 'expo-router';
import { SessionProvider } from '../../../../contexts/SessionManager';

export default function PedestrianPhase1Layout() {
  return (
    <SessionProvider
      categoryId={4}
      phaseId={10}
      categoryName="Pedestrian"
    >
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
        <Stack.Screen name="S1P1" />
        <Stack.Screen name="S2P1" />
        <Stack.Screen name="S3P1" />
        <Stack.Screen name="S4P1" />
        <Stack.Screen name="S5P1" />
        <Stack.Screen name="S6P1" />
        <Stack.Screen name="S7P1" />
        <Stack.Screen name="S8P1" />
        <Stack.Screen name="S9P1" />
        <Stack.Screen name="S10P1" />
      </Stack>
    </SessionProvider>
  );
}