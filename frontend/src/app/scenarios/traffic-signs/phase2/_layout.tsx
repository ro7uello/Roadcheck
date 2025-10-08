import { Stack } from 'expo-router';
import { SessionProvider } from '../../../../contexts/SessionManager';

export default function TrafficSignsPhase2Layout() {
  return (
    <SessionProvider
      categoryId={2}
      phaseId={5}
      categoryName="Traffic Signs"
    >
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }} />
    </SessionProvider>
  );
}