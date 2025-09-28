// Phase2Layout.jsx (for Road Markings Phase 2)
import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SessionProvider } from '../../../SessionManager';

export default function Phase2Layout() {
  // Get the parameters passed from navigation
  const { categoryId, phaseId, categoryName } = useLocalSearchParams();
  
  // Default values if not passed (for road markings phase 2)
  const finalCategoryId = categoryId || '1';
  const finalPhaseId = phaseId || '2'; 
  const finalCategoryName = categoryName || 'Road Markings';

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
        <Stack.Screen name="S1P2" />
        <Stack.Screen name="S2P2" />
        <Stack.Screen name="S3P2" />
        <Stack.Screen name="S4P2" />
        <Stack.Screen name="S5P2" />
        <Stack.Screen name="S6P2" />
        <Stack.Screen name="S7P2" />
        <Stack.Screen name="S8P2" />
        <Stack.Screen name="S9P2" />
        <Stack.Screen name="S10P2" />
      </Stack>
    </SessionProvider>
  );
}