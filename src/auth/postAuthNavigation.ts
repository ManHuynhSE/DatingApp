import { useRouter } from 'expo-router';
import { DatingApiError, datingApi } from '@/api/datingClient';

type AppRouter = ReturnType<typeof useRouter>;

export async function navigateAfterAuthentication(router: AppRouter, userId: string) {
  try {
    await datingApi.getUserProfile(userId, false, false);
    router.replace('/(tabs)/swipe');
  } catch (error) {
    if (!(error instanceof DatingApiError) || error.status !== 404) {
      throw error;
    }
    router.replace({
      pathname: '/create-profile',
      params: { userId },
    });
  }
}
