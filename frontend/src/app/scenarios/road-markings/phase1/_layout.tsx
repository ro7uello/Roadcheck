import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SessionProvider } from '../../../SessionManager';

export default function Phase1Layout() {
  // Get the parameters passed from navigation
  const { categoryId, phaseId, categoryName } = useLocalSearchParams();
  
  // Default values if not passed (for road markings phase 1)
  const finalCategoryId = categoryId || '1';
  const finalPhaseId = phaseId || '1'; 
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
        <Stack.Screen name="s1p1" />
        <Stack.Screen name="s2p1" />
        <Stack.Screen name="s3p1" />
        <Stack.Screen name="s4p1" />
        <Stack.Screen name="s5p1" />
        <Stack.Screen name="s6p1" />
        <Stack.Screen name="s7p1" />
        <Stack.Screen name="s8p1" />
        <Stack.Screen name="s9p1" />
        <Stack.Screen name="s10p1" />
      </Stack>
    </SessionProvider>
  );
}