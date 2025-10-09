// Phase3Layout.jsx (for Road Markings Phase 3)
import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SessionProvider } from '../../../../contexts/SessionManager';

export default function Phase3Layout() {
  // Get the parameters passed from navigation
  const { categoryId, phaseId, categoryName } = useLocalSearchParams();
  
  // Default values if not passed (for road markings phase 3)
  const finalCategoryId = categoryId || '1';
  const finalPhaseId = phaseId || '3'; // Changed to '3' for Phase 3
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
        <Stack.Screen name="S1P3" />
        <Stack.Screen name="S2P3" />
        <Stack.Screen name="S3P3" />
        <Stack.Screen name="S4P3" />
        <Stack.Screen name="S5P3" />
        <Stack.Screen name="S6P3" />
        <Stack.Screen name="S7P3" />
        <Stack.Screen name="S8P3" />
        <Stack.Screen name="S9P3" />
        <Stack.Screen name="S10P3" />
      </Stack>
    </SessionProvider>
  );
}