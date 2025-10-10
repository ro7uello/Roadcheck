// frontend/src/app/scenarios/road-markings/phase2/_layout.jsx
import { SessionProvider } from '../../../../contexts/SessionManager';
import { Stack } from 'expo-router';

export default function Phase2Layout() {
  return (
    <SessionProvider 
      categoryId={1} 
      phaseId={2}
      categoryName="Road Markings"
    >
      <Stack screenOptions={{ headerShown: false }} />
    </SessionProvider>
  );
}