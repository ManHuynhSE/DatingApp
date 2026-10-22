import { Redirect } from 'expo-router';

export default function Index() {
  // For MVP, always redirect to auth sign-in screen
  return <Redirect href="/(auth)/sign-in" />;
}
