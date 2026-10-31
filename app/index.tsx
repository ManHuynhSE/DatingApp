import { router, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../src/store/authStore';

/**
 * Root entry point.
 *
 * Waits for the Firebase onAuthStateChanged callback to fire (isAuthReady = true)
 * before deciding where to navigate:
 *  - Authenticated  → /(tabs)/swipe   (skip sign-in, session restored from AsyncStorage)
 *  - Not authenticated → /(auth)/sign-in
 *
 * This prevents the "must log in every time" UX regression caused by the old
 * implementation that always redirected to sign-in unconditionally.
 */
export default function Index() {
  const navigationState = useRootNavigationState();
  const isAuthReady = useAuthStore((state) => state.isAuthReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Wait until:
    // 1. Expo Router's navigation is mounted (navigationState.key exists)
    // 2. Firebase has resolved the persisted session (isAuthReady = true)
    if (!navigationState?.key || !isAuthReady || hasNavigated.current) return;

    hasNavigated.current = true;
    if (isAuthenticated) {
      router.replace('/(tabs)/swipe');
    } else {
      router.replace('/(auth)/sign-in');
    }
  }, [navigationState?.key, isAuthReady, isAuthenticated]);

  // Show a blank spinner while Firebase is resolving the persisted session.
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
