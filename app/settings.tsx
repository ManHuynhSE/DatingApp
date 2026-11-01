import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, darkColors, spacing, typography } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { useThemeStore } from '@/store/themeStore';
import { firebaseAuth } from '@/auth/firebase';
import {
  getFirebaseVerificationErrorMessage,
  refreshEmailVerificationStatus,
} from '@/auth/emailVerification';

export default function SettingsScreen() {
  const router = useRouter();
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === 'dark' ? darkColors : colors;
  const verified = useAuthStore((state) => state.user?.verified ?? false);
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);
  const setCoordinates = useLocationStore((state) => state.setCoordinates);

  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownTimerRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || isResending || !user?.email) return;

    setIsResending(true);
    try {
      const firebaseUser = await firebaseAuth.reloadCurrentUser();
      if (firebaseUser.emailVerified) {
        const isVerified = await refreshEmailVerificationStatus();
        if (isVerified) updateUser({ email_verified: true });
        return;
      }
      await firebaseAuth.sendVerificationEmail();
      setResendCooldown(60);
      Alert.alert(
        'Đã gửi email',
        'Firebase đã gửi email xác minh đến hộp thư của bạn. Hãy mở liên kết trong email để hoàn tất.'
      );
    } catch (error) {
      Alert.alert('Không thể gửi email', getFirebaseVerificationErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckEmailStatus = async () => {
    if (isCheckingEmail || !user?.id) return;

    setIsCheckingEmail(true);
    try {
      const isVerified = await refreshEmailVerificationStatus();
      if (isVerified) {
        updateUser({ email_verified: true });
        Alert.alert('Xác minh thành công', 'Email của bạn đã được xác minh thành công!');
      } else {
        Alert.alert(
          'Chưa xác minh',
          'Email vẫn chưa được xác minh. Bạn có muốn nhận lại email xác minh không?',
          [
            { text: 'Đóng', style: 'cancel' },
            {
              text: 'Gửi lại email',
              onPress: handleResendEmail,
            },
          ]
        );
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể kiểm tra trạng thái xác minh lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi Mewdy không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseAuth.signOut();
            } catch (error) {
              console.warn('Firebase sign out error:', error);
            } finally {
              // Ensure store and local session are cleared even if offline
              logout();
              setCoordinates(null);
              router.replace('/(auth)/sign-in');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.titleContainer} pointerEvents="none">
          <Text style={[styles.title, { color: theme.textPrimary }]}>Cài đặt</Text>
        </View>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Quay lại" style={styles.back}>
          <Ionicons name="arrow-back" size={23} color={theme.textPrimary} />
        </Pressable>
        <View style={styles.back} />
      </View>

      {/* Account Section */}
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>TÀI KHOẢN</Text>
      <Pressable
        onPress={() => router.push('/verify-phone')}
        accessibilityRole="button"
        style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View style={[styles.iconWrap, { backgroundColor: verified ? `${theme.success}20` : `${theme.primary}18` }]}>
          <Ionicons name={verified ? 'shield-checkmark-outline' : 'phone-portrait-outline'} size={22} color={verified ? theme.success : theme.primary} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Xác minh số điện thoại</Text>
          <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
            {verified ? 'Tài khoản của bạn đã được xác minh' : 'Xác minh tài khoản qua mã tin nhắn SMS'}
          </Text>
        </View>
        {verified ? <Ionicons name="checkmark-circle" size={22} color={theme.success} /> : <Ionicons name="chevron-forward" size={21} color={theme.textTertiary} />}
      </Pressable>

      {user?.email ? (
        <Pressable
          onPress={user.email_verified ? undefined : handleCheckEmailStatus}
          accessibilityRole="button"
          style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: spacing.sm }]}
        >
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: user.email_verified ? `${theme.success}20` : `${theme.warning}20`,
              },
            ]}
          >
            <Ionicons
              name={user.email_verified ? 'mail-open-outline' : 'mail-unread-outline'}
              size={22}
              color={user.email_verified ? theme.success : theme.warning}
            />
          </View>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Xác minh email</Text>
            <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
              {user.email} • {user.email_verified ? 'Đã xác minh' : 'Chưa xác minh'}
            </Text>
          </View>
          {user.email_verified ? (
            <Ionicons name="checkmark-circle" size={22} color={theme.success} />
          ) : isCheckingEmail ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Pressable
              onPress={handleResendEmail}
              disabled={isResending || resendCooldown > 0}
              style={[
                styles.resendBadge,
                {
                  backgroundColor:
                    resendCooldown > 0
                      ? mode === 'dark'
                        ? '#374151'
                        : '#E5E7EB'
                      : `${theme.primary}20`,
                },
              ]}
            >
              {isResending ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Text
                  style={[
                    styles.resendBadgeText,
                    {
                      color:
                        resendCooldown > 0
                          ? mode === 'dark'
                            ? '#9CA3AF'
                            : '#6B7280'
                          : theme.primary,
                    },
                  ]}
                >
                  {resendCooldown > 0 ? `${resendCooldown}s` : 'Gửi lại'}
                </Text>
              )}
            </Pressable>
          )}
        </Pressable>
      ) : null}

      {/* Session / Log Out Section */}
      <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: spacing.xl }]}>PHIÊN ĐĂNG NHẬP</Text>
      <Pressable
        onPress={handleLogout}
        accessibilityRole="button"
        style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: '#EF4444' }]}>Đăng xuất</Text>
          <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
            {user?.name ? `Đang đăng nhập với tên ${user.name}` : 'Đăng xuất khỏi thiết bị này'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={21} color={theme.textTertiary} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    position: 'relative',
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: { width: 36, height: 40, justifyContent: 'center' },
  title: { ...typography.bodyBold, textAlign: 'center' },
  sectionLabel: { ...typography.captionBold, marginTop: spacing.xl, marginBottom: spacing.sm, marginHorizontal: spacing.base, letterSpacing: 1 },
  row: { marginHorizontal: spacing.base, padding: spacing.base, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { ...typography.bodyBold },
  rowSubtitle: { ...typography.caption },
  resendBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  resendBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
