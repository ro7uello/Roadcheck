// frontend/src/app/scenarios/road-markings/phase1/_layout.jsx
import { SessionProvider } from '../../../../contexts/SessionManager';
import { Stack } from 'expo-router';

export default function Phase1Layout() {
  return (
    <SessionProvider 
      categoryId={1} 
      phaseId={1}
      categoryName="Road Markings"
    >
      <Stack screenOptions={{ headerShown: false }} />
    </SessionProvider>
  );
}