import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { firebaseAuth } from '../src/auth/firebase';
import { api } from '../src/api/client';
import { useAuthStore } from '../src/store/authStore';

export default function RootLayout() {
  const setSession = useAuthStore((state) => state.setSession);
  const setProfile = useAuthStore((state) => state.setProfile);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = firebaseAuth.subscribe(async (firebaseUser) => {
      if (!isMounted) return;

      if (!firebaseUser) {
        setSession(null, null);
        return;
      }

      const idToken = await firebaseUser.getIdToken();
      if (!isMounted) return;

      setSession(idToken, {
        id: firebaseUser.uid,
        name: firebaseUser.displayName ?? 'HeartSync member',
        age: 0,
        verified: false,
        pronouns: '',
        occupation: '',
        distance: '',
        location: '',
        aboutMe: '',
        photos: firebaseUser.photoURL ? [firebaseUser.photoURL] : [],
        details: {
          height: '',
          smoking: '',
          drinking: '',
          pets: '',
          children: '',
          zodiac: '',
          religion: '',
          education: '',
          exercise: '',
        },
        interests: [],
        languages: [],
        relationshipGoal: '',
        profileCompletion: 0,
        online: true,
      });

      try {
        const profile = await api.getMyProfile(idToken);
        if (isMounted && profile) {
          setProfile(profile);
        }
      } catch {
        // Keep the Firebase session available if the profile API is temporarily unavailable.
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [setProfile, setSession]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="match-found" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="filters" options={{ presentation: 'modal' }} />
        <Stack.Screen name="profile-detail" options={{ presentation: 'card' }} />
        <Stack.Screen name="chat/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="video-call" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="edit-profile" options={{ presentation: 'card' }} />
        <Stack.Screen name="create-profile" options={{ presentation: 'card' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
