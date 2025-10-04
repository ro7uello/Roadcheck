import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SessionProvider } from '../../../SessionManager';

export default function Phase2Layout() {
  // Get the parameters passed from navigation
  const { categoryId, phaseId, categoryName } = useLocalSearchParams();

  // Default values if not passed (for road markings phase 1)
  const finalCategoryId = categoryId || '2';
  const finalPhaseId = phaseId || '2';
  const finalCategoryName = categoryName || 'Traffic Signs';

  return (
    <SessionProvider
      categoryId={parseInt(finalCategoryId as string)}
      phaseId={parseInt(finalPhaseId as string)}
      categoryName={finalCategoryName as string}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
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