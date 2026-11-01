import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Constants, { AppOwnership } from "expo-constants";
import { colors, typography, spacing, borderRadius } from "../../src/theme";
import { firebaseAuth } from "../../src/auth/firebase";
import { datingApi } from "../../src/api/datingClient";
import { navigateAfterAuthentication } from "../../src/auth/postAuthNavigation";
import { getFirebaseVerificationErrorMessage } from "../../src/auth/emailVerification";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Please try again.";

const withTimeout = <T,>(
  promise: Promise<T>,
  message: string,
  timeoutMs = 30_000,
) => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
};

const completeAuthentication = async (
  router: ReturnType<typeof useRouter>,
  authentication: Promise<unknown> = Promise.resolve(),
) => {
  await authentication;
  const idToken = await firebaseAuth.currentAuth?.currentUser?.getIdToken();
  if (!idToken) {
    throw new Error("Unable to establish an authenticated session.");
  }

  // Register user in dating-server backend
  try {
    const response = await datingApi.signInWithFirebase(idToken);
    if (response.success && response.data) {
      const userId = response.data.user.id;
      const email = response.data.user.email ?? firebaseAuth.currentAuth?.currentUser?.email;
      if (email && response.data.user.email_verified !== true) {
        router.replace('/verify-email');
        return;
      }

      await navigateAfterAuthentication(router, userId);
    }
  } catch (error) {
    console.error("Failed to register with backend:", error);
    throw error;
  }
};

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isExpoGo = Constants.appOwnership === AppOwnership.Expo;
  const redirectUri = AuthSession.makeRedirectUri({ scheme: "mewdy" });
  const [googleRequest, googleResponse] =
    AuthSession.useAuthRequest(
      {
        clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        redirectUri,
        scopes: ["openid", "profile", "email"],
      },
      {
        authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenEndpoint: "https://oauth2.googleapis.com/token",
        revocationEndpoint: "https://oauth2.googleapis.com/revoke",
      },
    );

  useEffect(() => {
    const accessToken =
      googleResponse?.type === "success"
        ? googleResponse.authentication?.accessToken
        : undefined;
    if (!accessToken) return;
    completeAuthentication(
      router,
      firebaseAuth.signInWithGoogleToken(accessToken),
    ).catch((error) =>
      Alert.alert("Đăng nhập Google thất bại", getErrorMessage(error)),
    );
  }, [googleResponse, router]);

  const handleEmailAuth = async () => {
    if (!firebaseAuth.isConfigured) {
      Alert.alert(
        "Chưa cấu hình Firebase",
        "Vui lòng thêm giá trị Firebase vào .env.local.",
      );
      return;
    }
    if (!email.trim() || password.length < 6) {
      Alert.alert(
        "Kiểm tra thông tin",
        "Vui lòng nhập email hợp lệ và mật khẩu từ 6 ký tự trở lên.",
      );
      return;
    }
    setIsLoading(true);
    try {
      if (isCreateMode) {
        await withTimeout(
          firebaseAuth.createAccount(email.trim(), password),
          "Máy chủ không phản hồi. Vui lòng kiểm tra kết nối mạng và thử lại.",
        );

        let verificationEmailError: unknown = null;
        try {
          await firebaseAuth.sendVerificationEmail();
        } catch (error) {
          verificationEmailError = error;
        }

        await completeAuthentication(router);
        if (verificationEmailError) {
          Alert.alert(
            'Chưa gửi được email xác minh',
            getFirebaseVerificationErrorMessage(verificationEmailError),
          );
        }
        return;
      }

      await withTimeout(
        firebaseAuth.signInWithEmail(email.trim(), password),
        "Máy chủ không phản hồi. Vui lòng kiểm tra kết nối mạng và thử lại.",
      );
      await completeAuthentication(router);
    } catch (error) {
      const currentEmail = firebaseAuth.currentAuth?.currentUser?.email?.toLowerCase();
      if (isCreateMode && currentEmail === email.trim().toLowerCase()) {
        Alert.alert(
          'Tài khoản Firebase đã sẵn sàng',
          'Chưa thể đồng bộ tài khoản với Mewdy. Hãy chuyển sang “Đăng nhập bằng email” và thử lại; không cần tạo tài khoản lần nữa.',
        );
      } else {
        Alert.alert("Xác thực thất bại", getErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      await completeAuthentication(
        router,
        firebaseAuth.signInWithGoogleNative(),
      );
    } catch (error) {
      Alert.alert("Đăng nhập Google thất bại", getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        "Nhập email của bạn",
        "Vui lòng nhập email trước để đặt lại mật khẩu.",
      );
      return;
    }
    try {
      await firebaseAuth.resetPassword(email.trim());
      Alert.alert(
        "Đã gửi email",
        "Vui lòng kiểm tra hộp thư để lấy liên kết đặt lại mật khẩu.",
      );
    } catch (error) {
      Alert.alert(
        "Không thể đặt lại mật khẩu",
        error instanceof Error ? error.message : "Vui lòng thử lại sau.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.eyebrow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrowText}>Kết nối nhẹ nhàng & tinh tế</Text>
            </View>
            <View style={styles.logoOuterRing}>
              <View style={styles.logoMiddleRing}>
                <View style={styles.logoInnerCircle}>
                  <Ionicons name="heart" size={44} color={colors.white} />
                </View>
              </View>
            </View>

            <Text style={styles.appName}>Mewdy</Text>
            <Text style={styles.tagline}>
              Gặp gỡ có chủ đích.{"\n"}Gắn kết bằng cảm xúc.
            </Text>
          </View>

          {/* Buttons Section */}
          <View style={styles.buttonsSection}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Địa chỉ email"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Mật khẩu"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
            />
            <TouchableOpacity
              style={[styles.button, styles.emailButton]}
              onPress={handleEmailAuth}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, styles.emailButtonText]}>
                {isLoading
                  ? "Đang xử lý..."
                  : isCreateMode
                    ? "Tạo tài khoản"
                    : "Đăng nhập bằng email"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.googleButton]}
              onPress={handleGoogleAuth}
              disabled={(!googleRequest && !isExpoGo) || isLoading}
              activeOpacity={0.8}
            >
              <Ionicons
                name="logo-google"
                size={20}
                color={colors.textPrimary}
                style={styles.buttonIcon}
              />
              <Text style={[styles.buttonText, styles.googleButtonText]}>
                Tiếp tục với Google
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.demoButton]}
              onPress={() => router.replace("/(tabs)/swipe")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="sparkles"
                size={18}
                color={colors.primary}
                style={styles.buttonIcon}
              />
              <Text style={[styles.buttonText, styles.demoButtonText]}>
                Vào chế độ thử nghiệm (Bỏ qua login)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsCreateMode((value) => !value)}
              style={styles.modeToggle}
            >
              <Text style={styles.modeToggleText}>
                {isCreateMode
                  ? "Đã có tài khoản? Đăng nhập"
                  : "Chưa có tài khoản? Đăng ký ngay"}
              </Text>
            </TouchableOpacity>
            {!isCreateMode && (
              <TouchableOpacity onPress={handleResetPassword}>
                <Text style={styles.resetText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Bằng việc đăng ký, bạn đồng ý với{" "}
              <Text style={styles.footerLink}>Điều khoản & Điều kiện</Text>
            </Text>
            <Text style={styles.footerText}>
              Xem cách chúng tôi sử dụng dữ liệu trong{" "}
              <Text style={styles.footerLink}>Chính sách quyền riêng tư</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  logoSection: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.xl,
  },
  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  eyebrowText: {
    ...typography.captionBold,
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  logoOuterRing: {
    width: 142,
    height: 142,
    borderRadius: 32,
    transform: [{ rotate: "-8deg" }],
    backgroundColor: colors.secondaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  logoMiddleRing: {
    width: 112,
    height: 112,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  logoInnerCircle: {
    width: 88,
    height: 88,
    borderRadius: 26,
    transform: [{ rotate: "8deg" }],
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: colors.secondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  appName: {
    fontSize: 34,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.xl,
    letterSpacing: -0.8,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: "center",
    lineHeight: 24,
  },
  buttonsSection: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
  },
  buttonIcon: {
    marginRight: spacing.md,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.white,
    color: colors.textPrimary,
  },
  emailButton: {
    backgroundColor: colors.primary,
  },
  emailButtonText: {
    color: colors.white,
  },
  googleButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleButtonText: {
    color: colors.textPrimary,
  },
  phoneButton: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  phoneButtonText: {
    color: colors.primary,
  },
  demoButton: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  demoButtonText: {
    color: colors.primary,
    fontWeight: "700",
  },
  modeToggle: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  modeToggleText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: "600",
  },
  resetText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  footer: {
    alignItems: "center",
    paddingBottom: Platform.OS === "android" ? spacing.xl : spacing.md,
    gap: spacing.xs,
  },
  footerText: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: "center",
    lineHeight: 18,
  },
  footerLink: {
    ...typography.caption,
    color: colors.textTertiary,
    textDecorationLine: "underline",
  },
});
