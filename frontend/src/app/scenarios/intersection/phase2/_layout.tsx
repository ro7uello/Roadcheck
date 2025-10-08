import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SessionProvider } from '../../../../contexts/SessionManager';

export default function Phase2Layout() {
  const { categoryId, phaseId, categoryName } = useLocalSearchParams();
  
  const finalCategoryId = categoryId || '3'; 
  const finalPhaseId = phaseId || '2'; 
  const finalCategoryName = categoryName || 'Intersection';

  return (
    <SessionProvider
      categoryId={parseInt(finalCategoryId as string)}
      phaseId={parseInt(finalPhaseId as string)}
      categoryName={finalCategoryName as string}
    >
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
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