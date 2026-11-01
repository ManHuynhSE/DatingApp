import { datingApi } from '@/api/datingClient';
import { firebaseAuth } from '@/auth/firebase';

/** Reload Firebase Auth, then let the backend sync its verified UserRecord state. */
export async function refreshEmailVerificationStatus(): Promise<boolean> {
  const user = await firebaseAuth.reloadCurrentUser();
  const idToken = await user.getIdToken(true);
  const response = await datingApi.signInWithFirebase(idToken);
  return response.data.user.email_verified === true;
}

export function getFirebaseVerificationErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : '';

  if (code === 'auth/too-many-requests') {
    return 'Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Firebase chưa bật phương thức đăng nhập Email/Password. Hãy bật trong Firebase Console > Authentication > Sign-in method.';
  }
  if (code === 'auth/invalid-api-key' || code === 'auth/api-key-not-valid') {
    return 'Firebase API key không hợp lệ. Kiểm tra EXPO_PUBLIC_FIREBASE_API_KEY trong cấu hình của app.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'Domain xác minh chưa được cho phép trong Firebase Authentication settings.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Không thể kết nối Firebase. Hãy kiểm tra mạng rồi thử lại.';
  }
  if (code === 'auth/user-disabled') {
    return 'Tài khoản này đã bị vô hiệu hóa.';
  }
  if (code === 'auth/user-token-expired' || code === 'auth/requires-recent-login') {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại rồi thử tiếp.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Không thể gửi email xác minh. Vui lòng thử lại sau.';
}
