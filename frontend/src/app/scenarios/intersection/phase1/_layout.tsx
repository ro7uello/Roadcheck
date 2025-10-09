import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SessionProvider } from '../../../../contexts/SessionManager';

export default function Phase1Layout() {
  const { categoryId, phaseId, categoryName } = useLocalSearchParams();
  
  const finalCategoryId = categoryId || '3'; 
  const finalPhaseId = phaseId || '1'; 
  const finalCategoryName = categoryName || 'Intersection';

  return (
    <SessionProvider
      categoryId={parseInt(finalCategoryId as string)}
      phaseId={parseInt(finalPhaseId as string)}
      categoryName={finalCategoryName as string}
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