import { useEffect, useState } from 'react';
import { firebaseAuth } from '@/auth/firebase';
import { datingApi } from '@/api/datingClient';
import { useAuthStore } from '@/store/authStore';
import type { UserProfile } from '@/data/mockData';

export interface UseFirebaseAuthReturn {
  isLoading: boolean;
  error: string | null;
  signInWithFirebase: () => Promise<void>;
  user: UserProfile | null;
}

export function useFirebaseAuth(): UseFirebaseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, setSession } = useAuthStore();

  // Subscribe to Firebase auth state changes
  useEffect(() => {
    if (!firebaseAuth.isConfigured) {
      setError('Firebase is not configured');
      return;
    }

    const unsubscribe = firebaseAuth.subscribe(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          setIsLoading(true);
          const idToken = await firebaseUser.getIdToken();

          // Send Firebase token to dating-server backend
          const response = await datingApi.signInWithFirebase(idToken);

          if (response.success && response.data) {
            // Map backend user to frontend UserProfile
            const backendUser = response.data.user;
            const mappedUser = {
              id: backendUser.id,
              name: backendUser.email?.split('@')[0] || 'User',
              age: 0,
              verified: false,
              pronouns: '',
              occupation: '',
              distance: '',
              location: '',
              aboutMe: '',
              education: '',
              photos: [],
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
            };

            setSession(idToken, mappedUser);
            setError(null);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
          setError(errorMessage);
          console.error('Firebase sign-in error:', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        // User signed out
        setSession(null, null);
      }
    });

    return unsubscribe;
  }, [setSession]);

  const signInWithFirebase = async () => {
    if (!firebaseAuth.isConfigured) {
      setError('Firebase is not configured');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      // Firebase sign-in UI should be handled by the component
      // This hook just handles the auth state subscription
      // The actual sign-in happens through Firebase UI or custom implementation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Firebase';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    signInWithFirebase,
    user,
  };
}
