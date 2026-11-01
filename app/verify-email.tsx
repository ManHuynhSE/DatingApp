import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, darkColors, spacing, typography, borderRadius } from '@/theme';
import { firebaseAuth } from '@/auth/firebase';
import {
  getFirebaseVerificationErrorMessage,
  refreshEmailVerificationStatus,
} from '@/auth/emailVerification';
import { navigateAfterAuthentication } from '@/auth/postAuthNavigation';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === 'dark' ? darkColors : colors;
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const routedAfterVerification = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((remaining) => Math.max(remaining - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!user?.id || !user.email_verified || routedAfterVerification.current) return;
    routedAfterVerification.current = true;
    void navigateAfterAuthentication(router, user.id).catch((error) => {
      routedAfterVerification.current = false;
      Alert.alert(
        'Email đã xác minh',
        error instanceof Error ? error.message : 'Không thể tải tài khoản. Vui lòng thử lại.',
      );
    });
  }, [router, user?.email_verified, user?.id]);

  const handleResend = async () => {
    if (isSending || cooldown > 0) return;
    setIsSending(true);
    try {
      const currentUser = await firebaseAuth.reloadCurrentUser();
      if (currentUser.emailVerified) {
        const verified = await refreshEmailVerificationStatus();
        if (verified) updateUser({ email_verified: true });
        else Alert.alert('Chưa xác minh', 'Firebase chưa xác nhận email này.');
        return;
      }

      await firebaseAuth.sendVerificationEmail();
      setCooldown(RESEND_COOLDOWN_SECONDS);
      Alert.alert(
        'Đã gửi email',
        `Firebase đã gửi liên kết xác minh đến ${currentUser.email}. Kiểm tra cả thư mục Spam nếu chưa thấy thư.`,
      );
    } catch (error) {
      Alert.alert('Không gửi được email', getFirebaseVerificationErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckStatus = async () => {
    if (isChecking) return;
    setIsChecking(true);
    try {
      const verified = await refreshEmailVerificationStatus();
      updateUser({ email_verified: verified });
      if (!verified) {
        Alert.alert(
          'Chưa xác minh',
          'Mở liên kết trong email rồi quay lại đây để tiếp tục.',
        );
      }
    } catch (error) {
      Alert.alert('Không kiểm tra được', getFirebaseVerificationErrorMessage(error));
    } finally {
      setIsChecking(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseAuth.signOut();
    } catch {
      // Clear the local session even if Firebase cannot be reached.
    } finally {
      logout();
      router.replace('/(auth)/sign-in');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}18` }]}>
          <Ionicons name="mail-unread-outline" size={36} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Xác minh email để tiếp tục</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>Xác minh địa chỉ email này để tiếp tục</Text>
        <Text style={[styles.email, { color: theme.textPrimary }]}>{user?.email ?? 'email của bạn'}</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          Mở liên kết xác minh trong email rồi quay lại đây. Nếu email chưa đến, kiểm tra Spam hoặc yêu cầu gửi lại.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={handleCheckStatus}
          disabled={isChecking}
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
        >
          {isChecking ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Tôi đã xác minh</Text>}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={handleResend}
          disabled={isSending || cooldown > 0}
          style={[styles.secondaryButton, { borderColor: theme.border }]}
        >
          {isSending ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
              {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại email xác minh'}
            </Text>
          )}
        </Pressable>

        <Pressable accessibilityRole="button" onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={[styles.signOutText, { color: theme.textSecondary }]}>Đăng xuất</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  email: {
    ...typography.body,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  primaryButton: {
    minHeight: 50,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    minHeight: 48,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  secondaryButtonText: { fontSize: 15, fontWeight: '600' },
  signOutButton: { padding: spacing.lg, marginTop: spacing.sm },
  signOutText: { ...typography.bodySmall },
});
