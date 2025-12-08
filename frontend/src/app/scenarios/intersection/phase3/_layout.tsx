// frontend/src/app/scenarios/road-markings/phase3/_layout.jsx
import { SessionProvider } from '../../../../contexts/SessionManager';
import { Stack } from 'expo-router';

export default function Phase3Layout() {
  return (
    <SessionProvider
      categoryId={3}
      phaseId={3}
      categoryName="Intersection"
    >
      <Stack screenOptions={{ headerShown: false }} />
    </SessionProvider>
  );
}