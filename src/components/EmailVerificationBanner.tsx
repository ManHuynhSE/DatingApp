import React, { useEffect, useState, useRef } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, darkColors, spacing, borderRadius } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { firebaseAuth } from '@/auth/firebase';
import {
  getFirebaseVerificationErrorMessage,
  refreshEmailVerificationStatus,
} from '@/auth/emailVerification';

export function EmailVerificationBanner() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === 'dark' ? darkColors : colors;

  const [isDismissed, setIsDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Countdown effect
  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  // Non-blocking: only show if user has an email and is NOT verified
  if (!user?.email || user.email_verified || isDismissed) {
    return null;
  }

  const handleResend = async () => {
    if (cooldown > 0 || isResending || !user?.email) return;

    setIsResending(true);
    try {
      const firebaseUser = await firebaseAuth.reloadCurrentUser();
      if (firebaseUser.emailVerified) {
        const isVerified = await refreshEmailVerificationStatus();
        if (isVerified) updateUser({ email_verified: true });
        return;
      }
      await firebaseAuth.sendVerificationEmail();
      setCooldown(60);
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

  const handleRefreshStatus = async () => {
    if (isRefreshing || !user?.id) return;

    setIsRefreshing(true);
    try {
      const isVerified = await refreshEmailVerificationStatus();
      if (isVerified) {
        updateUser({ email_verified: true });
        Alert.alert(
          'Xác minh thành công',
          'Email của bạn đã được xác minh thành công!'
        );
      } else {
        Alert.alert(
          'Chưa xác minh',
          'Email của bạn vẫn chưa được xác minh. Vui lòng kiểm tra hộp thư đến (kể cả mục Thư rác/Spam) và nhấp vào liên kết xác minh.'
        );
      }
    } catch {
      Alert.alert(
        'Kiểm tra thất bại',
        'Không thể kiểm tra trạng thái xác minh lúc này. Vui lòng thử lại sau.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: mode === 'dark' ? '#2A201A' : '#FFF9F0',
          borderColor: mode === 'dark' ? '#5E3E20' : '#FDE68A',
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.headerLeft}>
          <Ionicons
            name="mail-outline"
            size={18}
            color={mode === 'dark' ? '#FBBF24' : '#D97706'}
            style={styles.icon}
          />
          <Text
            style={[
              styles.title,
              { color: mode === 'dark' ? '#FDE68A' : '#92400E' },
            ]}
          >
            Xác minh địa chỉ email
          </Text>
        </View>
        <Pressable
          onPress={() => setIsDismissed(true)}
          hitSlop={8}
          accessibilityLabel="Đóng thông báo"
          style={styles.closeBtn}
        >
          <Ionicons
            name="close"
            size={18}
            color={mode === 'dark' ? '#D1D5DB' : '#78350F'}
          />
        </Pressable>
      </View>

      <Text
        style={[
          styles.message,
          { color: mode === 'dark' ? '#E5E7EB' : '#78350F' },
        ]}
      >
        Email của bạn chưa được xác minh. Gửi hướng dẫn xác minh đến{' '}
        <Text style={styles.emailHighlight}>{user.email}</Text> để hoàn tất khi thuận tiện.
      </Text>

      <View style={styles.actionRow}>
        <Pressable
          onPress={handleResend}
          disabled={cooldown > 0 || isResending}
          style={[
            styles.actionButton,
            styles.resendButton,
            {
              backgroundColor:
                cooldown > 0
                  ? mode === 'dark'
                    ? '#374151'
                    : '#E5E7EB'
                  : theme.primary,
            },
          ]}
        >
          {isResending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.actionButtonText,
                {
                  color:
                    cooldown > 0
                      ? mode === 'dark'
                        ? '#9CA3AF'
                        : '#6B7280'
                      : '#FFFFFF',
                },
              ]}
            >
              {cooldown > 0 ? `Gửi lại (${cooldown}s)` : 'Gửi lại email'}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleRefreshStatus}
          disabled={isRefreshing}
          style={[
            styles.actionButton,
            styles.refreshButton,
            {
              borderColor: mode === 'dark' ? '#6B7280' : '#D1D5DB',
              backgroundColor: mode === 'dark' ? '#1F2937' : '#FFFFFF',
            },
          ]}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={theme.textPrimary} />
          ) : (
            <Text
              style={[
                styles.refreshButtonText,
                { color: theme.textPrimary },
              ]}
            >
              Đã xác minh
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 2,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  emailHighlight: {
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendButton: {
    minWidth: 110,
  },
  refreshButton: {
    borderWidth: 1,
    minWidth: 90,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
export default EmailVerificationBanner;
