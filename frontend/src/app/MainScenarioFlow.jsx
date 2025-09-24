// MainScenarioFlow.jsx - Entry point for the 10 scenario flow
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SessionProvider } from './SessionManager';

// Import all your scenario components
import S1P1 from './scenarios/road-markings/phase1/S1P1';
import S2P1 from './scenarios/road-markings/phase1/S2P1';
import S3P1 from './scenarios/road-markings/phase1/S3P1';
import S4P1 from './scenarios/road-markings/phase1/S4P1';
import S5P1 from './scenarios/road-markings/phase1/S5P1';
import S6P1 from './scenarios/road-markings/phase1/S6P1';
import S7P1 from './scenarios/road-markings/phase1/S7P1';
import S8P1 from './scenarios/road-markings/phase1/S8P1';
import S9P1 from './scenarios/road-markings/phase1/S9P1';
import S10P1 from './scenarios/road-markings/phase1/S10P1';

const Stack = createNativeStackNavigator();

export default function MainScenarioFlow({ route }) {
  const { categoryId, phaseId, categoryName } = route.params;

  return (
    <SessionProvider
      categoryId={categoryId}
      phaseId={phaseId}
      categoryName={categoryName}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false, // Prevent back gestures during scenarios
        }}
        initialRouteName="S1P1"
      >
        <Stack.Screen name="S1P1" component={S1P1} />
        <Stack.Screen name="S2P1" component={S2P1} />
        <Stack.Screen name="S3P1" component={S3P1} />
        <Stack.Screen name="S4P1" component={S4P1} />
        <Stack.Screen name="S5P1" component={S5P1} />
        <Stack.Screen name="S6P1" component={S6P1} />
        <Stack.Screen name="S7P1" component={S7P1} />
        <Stack.Screen name="S8P1" component={S8P1} />
        <Stack.Screen name="S9P1" component={S9P1} />
        <Stack.Screen name="S10P1" component={S10P1} />
        <Stack.Screen name="ResultPage" component={ResultPage} />
      </Stack.Navigator>
    </SessionProvider>
  );
}