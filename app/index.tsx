import { router, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';

export default function Index() {
  const navigationState = useRootNavigationState();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!navigationState?.key || hasNavigated.current) return;

    let isMounted = true;
    const task = InteractionManager.runAfterInteractions(() => {
      if (!isMounted || hasNavigated.current) return;
      hasNavigated.current = true;
      router.replace('/(auth)/sign-in');
    });

    return () => {
      isMounted = false;
      task.cancel();
    };
  }, [navigationState?.key]);

  return null;
}
