import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { router, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { firebaseAuth } from '../src/auth/firebase';
import { refreshEmailVerificationStatus } from '../src/auth/emailVerification';
import { datingApi } from '../src/api/datingClient';
import type { UserProfile } from '../src/data/mockData';
import { useAuthStore } from '../src/store/authStore';
import { useLocationStore } from '../src/store/locationStore';
import { useThemeStore } from '../src/store/themeStore';
import { requestCurrentCoordinates } from '../src/location/currentLocation';

function calculateAge(birthDate: string) {
  const date = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  if (today.getMonth() < date.getMonth() || (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())) age -= 1;
  return age;
}

export default function RootLayout() {
  const setSession = useAuthStore((state) => state.setSession);
  const setAuthReady = useAuthStore((state) => state.setAuthReady);
  const isAuthReady = useAuthStore((state) => state.isAuthReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const segments = useSegments();
  const setCoordinates = useLocationStore((state) => state.setCoordinates);
  const mode = useThemeStore((state) => state.mode);
  const hydrateTheme = useThemeStore((state) => state.hydrate);

  useEffect(() => {
    void hydrateTheme();
  }, [hydrateTheme]);

  // Keep accounts with an unverified email on the verification screen, including
  // attempts to open an app route directly or from a restored navigation state.
  useEffect(() => {
    if (!isAuthReady || !isAuthenticated || !user?.email || user.email_verified) return;
    if (segments[0] !== 'verify-email') router.replace('/verify-email');
  }, [isAuthReady, isAuthenticated, segments, user?.email, user?.email_verified]);

  // Firebase's hosted action handler verifies the email. Reload on resume so the
  // current device and PostgreSQL pick up verification completed in a browser/device.
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.id && currentUser.email && !currentUser.email_verified) {
          try {
            const isVerified = await refreshEmailVerificationStatus();
            useAuthStore.getState().updateUser({ email_verified: isVerified });
          } catch {
            // Silently ignore background refresh errors
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = firebaseAuth.subscribe(async (firebaseUser) => {
      if (!isMounted) return;

      if (!firebaseUser) {
        // Firebase says "no session" — mark auth as resolved so index.tsx can redirect.
        setSession(null, null);
        setCoordinates(null);
        return;
      }

      try {
        const idToken = await firebaseUser.getIdToken();
        const auth = await datingApi.signInWithFirebase(idToken);
        if (!isMounted) return;

        const backendUser = auth.data.user;
        let hasProfile = false;
        const user: UserProfile = {
          id: backendUser.id,
          email: backendUser.email ?? (firebaseUser.email ?? undefined),
          email_verified: backendUser.email_verified ?? false,
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
          hasProfile = true;
          const photos = [...(profile.users?.photos ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position);
          user.name = profile.display_name;
          user.age = calculateAge(profile.birth_date);
          user.verified = profile.is_verified;
          user.pronouns = profile.gender === 'female' ? 'She/Her' : profile.gender === 'male' ? 'He/Him' : profile.gender;
          user.occupation = profile.job_title ?? '';
          user.city = profile.city ?? undefined;
          user.ward = profile.ward ?? undefined;
          user.location = [profile.ward, profile.city].filter(Boolean).join(', ') || profile.city || '';
          user.distance = user.location;
          user.aboutMe = profile.bio ?? '';
          user.photos = photos.map((photo) => photo.url);
          user.education = profile.education ?? '';
          user.details = { ...user.details, height: profile.height_cm ? `${profile.height_cm}cm` : '', education: profile.education ?? '', pets: profile.pet ?? '', exercise: profile.life_style?.join(', ') ?? '' };
          user.hobbies = profile.hobbies ?? [];
          user.interests = profile.hobbies?.map((h) => h.name) ?? [];
          user.languages = profile.languages ?? [];
          user.relationship_intention = profile.relationship_intention ?? null;
          user.relationshipGoal = profile.relationship_intention ?? '';
          user.profileCompletion = 100;
          if (profile.users?.email) {
            user.email = profile.users.email;
          }
          if (typeof profile.users?.email_verified === 'boolean') {
            user.email_verified = profile.users.email_verified;
          }
        } catch {
          // A user may sign in before creating a profile; keep the real backend user id.
        }

        if (isMounted) setSession(idToken, user);

        // Ask for foreground permission at sign-in, then refresh saved coordinates.
        // Location is optional: denied permission or unavailable GPS must not block login.
        void requestCurrentCoordinates().then(async (coordinates) => {
          if (!isMounted) return;
          setCoordinates(coordinates);
          if (!coordinates || !hasProfile) return;
          try {
            await datingApi.updateProfile(backendUser.id, coordinates);
          } catch (error) {
            console.warn('Could not save current location:', error);
          }
        });
      } catch (error) {
        console.error('Unable to load dating account after Firebase sign-in:', error);
        // Even on error, mark auth as ready so the app doesn't hang on splash.
        if (isMounted) setAuthReady();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [setCoordinates, setSession, setAuthReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
          <Stack.Screen name="settings" options={{ presentation: 'card' }} />
          <Stack.Screen name="verify-email" options={{ presentation: 'card', gestureEnabled: false }} />
          <Stack.Screen name="verify-phone" options={{ presentation: 'card' }} />
          <Stack.Screen name="create-profile" options={{ presentation: 'card' }} />
          <Stack.Screen name="likes-review" options={{ presentation: 'card' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
