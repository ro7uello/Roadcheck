import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SessionProvider } from '../../../SessionManager';

export default function Phase1Layout() {
  // Get the parameters passed from navigation
  const { categoryId, phaseId, categoryName } = useLocalSearchParams();
  
  // Default values if not passed (for road markings phase 1)
  const finalCategoryId = categoryId || '2';
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
        <Stack.Screen name="s2p2" />
        <Stack.Screen name="s3p2" />
        <Stack.Screen name="s4p2" />
        <Stack.Screen name="s5p2" />
        <Stack.Screen name="s6p2" />
        <Stack.Screen name="s7p2" />
        <Stack.Screen name="s8p2" />
        <Stack.Screen name="s9p2" />
        <Stack.Screen name="s10p2" />
      </Stack>
    </SessionProvider>
  );
}