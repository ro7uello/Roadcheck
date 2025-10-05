import { Stack } from 'expo-router';
import { SessionProvider } from '../../contexts/SessionManager';

export default function ScenariosLayout() {
  return (
    <SessionProvider>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }} />
    </SessionProvider>
  );
}