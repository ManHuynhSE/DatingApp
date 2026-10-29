import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { firebaseAuth } from '../src/auth/firebase';
import { datingApi } from '../src/api/datingClient';
import type { UserProfile } from '../src/data/mockData';
import { useAuthStore } from '../src/store/authStore';
import { useThemeStore } from '../src/store/themeStore';

function calculateAge(birthDate: string) {
  const date = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  if (today.getMonth() < date.getMonth() || (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())) age -= 1;
  return age;
}

export default function RootLayout() {
  const setSession = useAuthStore((state) => state.setSession);
  const mode = useThemeStore((state) => state.mode);
  const hydrateTheme = useThemeStore((state) => state.hydrate);

  useEffect(() => {
    void hydrateTheme();
  }, [hydrateTheme]);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = firebaseAuth.subscribe(async (firebaseUser) => {
      if (!isMounted) return;

      if (!firebaseUser) {
        setSession(null, null);
        return;
      }

      try {
        const idToken = await firebaseUser.getIdToken();
        const auth = await datingApi.signInWithFirebase(idToken);
        if (!isMounted) return;

        const backendUser = auth.data.user;
        const user: UserProfile = {
          id: backendUser.id,
          name: backendUser.email?.split('@')[0] || firebaseUser.displayName || '',
          age: 0,
          verified: false,
          pronouns: '',
          occupation: '',
          distance: '',
          location: '',
          aboutMe: '',
          education: '',
          photos: firebaseUser.photoURL ? [firebaseUser.photoURL] : [],
          details: { height: '', smoking: '', drinking: '', pets: '', children: '', zodiac: '', religion: '', education: '', exercise: '' },
          interests: [],
          languages: [],
          relationshipGoal: '',
          profileCompletion: 0,
          online: true,
        };

        try {
          const result = await datingApi.getUserProfile(backendUser.id);
          const profile = result.data;
          const photos = [...(profile.users?.photos ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position);
          user.name = profile.display_name;
          user.age = calculateAge(profile.birth_date);
          user.verified = profile.is_verified;
          user.pronouns = profile.gender === 'female' ? 'She/Her' : profile.gender === 'male' ? 'He/Him' : profile.gender;
          user.occupation = profile.job_title ?? '';
          user.location = profile.city ?? '';
          user.distance = user.location;
          user.aboutMe = profile.bio ?? '';
          user.photos = photos.map((photo) => photo.url);
          user.education = profile.education ?? '';
          user.details = { ...user.details, height: profile.height_cm ? `${profile.height_cm}cm` : '', education: profile.education ?? '', pets: profile.pets?.join(', ') ?? '', exercise: profile.life_style?.join(', ') ?? '' };
          user.languages = profile.languages ?? [];
          user.profileCompletion = 100;
        } catch {
          // A user may sign in before creating a profile; keep the real backend user id.
        }

        if (isMounted) setSession(idToken, user);
      } catch (error) {
        console.error('Unable to load dating account after Firebase sign-in:', error);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [setSession]);

  return (
    <SafeAreaProvider>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack key={mode} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="match-found" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="filters" options={{ presentation: 'modal' }} />
        <Stack.Screen name="profile-detail" options={{ presentation: 'card' }} />
        <Stack.Screen name="chat/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="video-call" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="edit-profile" options={{ presentation: 'card' }} />
        <Stack.Screen name="profile-picker" options={{ presentation: 'card' }} />
        <Stack.Screen name="create-profile" options={{ presentation: 'card' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
