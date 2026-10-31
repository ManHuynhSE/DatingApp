import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { datingApi } from "@/api/datingClient";
import { firebaseAuth } from "@/auth/firebase";
import { colors, darkColors, spacing, typography } from "@/theme";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";

type Stage = "phone" | "code" | "done";

function toE164Phone(value: string) {
  const compact = value.trim().replace(/[\s()-]/g, "");
  const normalized = compact.startsWith("0")
    ? `+84${compact.slice(1)}`
    : compact;
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw new Error(
      "Enter a valid number with country code, for example +84901234567.",
    );
  }
  return normalized;
}

function friendlyError(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
  const message = error instanceof Error ? error.message : "";
  if (
    /RNFB|native module|not registered|not found/i.test(`${code} ${message}`)
  ) {
    return "Phone verification needs the Android development build. It is not available in Expo Go.";
  }
  if (
    code.includes("credential-already-in-use") ||
    code.includes("account-exists-with-different-credential")
  ) {
    return "This phone number is already linked to another Firebase account.";
  }
  if (code.includes("invalid-verification-code"))
    return "The code is incorrect. Check it and try again.";
  if (code.includes("too-many-requests"))
    return "Too many attempts. Wait a while before trying again.";
  return message || "Could not verify this phone number.";
}

export default function VerifyPhoneScreen() {
  const router = useRouter();
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === "dark" ? darkColors : colors;
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [stage, setStage] = useState<Stage>(user?.verified ? "done" : "phone");
  const [phone, setPhone] = useState("+84");
  const [code, setCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [busy, setBusy] = useState(false);

  const synchronizeVerifiedProfile = async () => {
    const { getAuth } = await import("@react-native-firebase/auth");
    const nativeUser = getAuth().currentUser;
    if (!nativeUser?.phoneNumber)
      throw new Error(
        "Firebase has not linked a verified phone to this account yet.",
      );
    const idToken = await nativeUser.getIdToken(true);
    const result = await datingApi.syncFirebasePhoneVerification(idToken);
    if (!result.data.is_verified)
      throw new Error("The server did not confirm account verification.");
    updateUser({ verified: true });
    setStage("done");
  };

  const startPhoneSession = async () => {
    const { getAuth, signInWithCustomToken } =
      await import("@react-native-firebase/auth");
    const jsIdToken = await firebaseAuth.getIdToken();
    const nativeAuth = getAuth();
    const jsUid = firebaseAuth.currentAuth?.currentUser?.uid;
    if (!jsUid)
      throw new Error("Please sign in again before verifying your phone.");
    if (nativeAuth.currentUser?.uid === jsUid) {
      return nativeAuth;
    }
    const { data } =
      await datingApi.createFirebaseNativePhoneSession(jsIdToken);
    const credential = await signInWithCustomToken(
      nativeAuth,
      data.customToken,
    );
    if (credential.user.uid !== jsUid) {
      await nativeAuth.signOut();
      throw new Error("Firebase account mismatch. Sign in again and retry.");
    }
    return nativeAuth;
  };

  const handlePhoneSend = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Use the Android app",
        "Phone OTP verification requires the Android development build.",
      );
      return;
    }

    setBusy(true);

    try {
      console.log("[OTP] Step 1: Converting phone number");

      const e164 = toE164Phone(phone);
      console.log("[OTP] Phone:", e164);

      console.log("[OTP] Step 2: Starting native auth");

      const nativeAuth = await startPhoneSession();

      console.log("[OTP] Auth initialized:", !!nativeAuth);
      console.log("[OTP] Current user:", nativeAuth.currentUser?.uid);

      if (nativeAuth.currentUser?.phoneNumber) {
        await synchronizeVerifiedProfile();
        return;
      }

      console.log("[OTP] Step 3: Calling verifyPhoneNumber");

      const { verifyPhoneNumber } = await import("@react-native-firebase/auth");

      const listener = verifyPhoneNumber(nativeAuth, e164);

      listener.on(
        "state_changed",
        async (snapshot) => {
          console.log("[OTP] Firebase state:", snapshot.state);
          console.log("[OTP] Verification ID:", snapshot.verificationId);

          if (snapshot.state === "sent" || snapshot.state === "timeout") {
            setVerificationId(snapshot.verificationId);
            setStage("code");
            setBusy(false);
            return;
          }

          if (snapshot.state === "verified" && snapshot.code) {
            try {
              setBusy(true);

              const currentNativeUser = nativeAuth.currentUser;

              if (!currentNativeUser) {
                throw new Error("Firebase session expired. Start again.");
              }

              const { linkWithCredential, PhoneAuthProvider } =
                await import("@react-native-firebase/auth");

              const phoneCredential = PhoneAuthProvider.credential(
                snapshot.verificationId,
                snapshot.code,
              );

              await linkWithCredential(currentNativeUser, phoneCredential);

              await synchronizeVerifiedProfile();
            } catch (error) {
              console.error("[OTP] Linking error:", error);
              Alert.alert("Verification failed", friendlyError(error));
            } finally {
              setBusy(false);
            }
          }
          if (snapshot.state === "error") {
            console.error("[OTP] Snapshot error:", snapshot.error);

            setBusy(false);

            Alert.alert(
              "Could not send code",
              `${snapshot.error?.code ?? "UNKNOWN"}\n${snapshot.error?.message ?? ""}`,
            );
            return;
          }
        },
        (error) => {
          console.error("[OTP] Firebase callback error:", {
            code: error.code,
            message: error.message,
            verificationId: error.verificationId,
            stack: error.stack,
          });

          setBusy(false);

          Alert.alert(
            "Could not send code",
            `${error.code ?? "UNKNOWN"}\n${error.message ?? "Unknown error"}`,
          );
        },
      );

      setPhone(e164);
    } catch (error) {
      console.error("[OTP] Initialization error:", error);

      setBusy(false);

      Alert.alert("Could not send code", friendlyError(error));
    }
  };

  const handleCodeVerify = async () => {
    if (!verificationId) return;
    const normalizedCode = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(normalizedCode)) {
      Alert.alert("Invalid code", "Enter the six digit code from the SMS.");
      return;
    }
    setBusy(true);
    try {
      const { getAuth, linkWithCredential, PhoneAuthProvider } =
        await import("@react-native-firebase/auth");
      const nativeAuth = getAuth();
      const nativeUser = nativeAuth.currentUser;
      if (!nativeUser)
        throw new Error("Firebase session expired. Start again.");
      const phoneCredential = PhoneAuthProvider.credential(
        verificationId,
        normalizedCode,
      );
      await linkWithCredential(nativeUser, phoneCredential);
      await synchronizeVerifiedProfile();
    } catch (error) {
      Alert.alert("Verification failed", friendlyError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "bottom"]}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.titleContainer} pointerEvents="none">
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Verify account
          </Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={23} color={theme.textPrimary} />
        </Pressable>
        <View style={styles.back} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.heroIcon,
            {
              backgroundColor:
                stage === "done" ? `${theme.success}20` : `${theme.primary}18`,
            },
          ]}
        >
          <Ionicons
            name={
              stage === "done" ? "shield-checkmark" : "phone-portrait-outline"
            }
            size={34}
            color={stage === "done" ? theme.success : theme.primary}
          />
        </View>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {stage === "done"
            ? "You’re verified"
            : stage === "code"
              ? "Enter your code"
              : "Verify your phone"}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {stage === "done"
            ? "Your phone is linked to your account. The verified badge will appear on your profile."
            : stage === "code"
              ? `We sent a 6 digit code to ${phone}.`
              : "We’ll send a one time code by SMS and link the number to your signed in account."}
        </Text>

        {stage === "phone" && (
          <>
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              Phone number
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              placeholder="+84901234567"
              placeholderTextColor={theme.textTertiary}
              style={[
                styles.input,
                {
                  color: theme.textPrimary,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            />
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              Use an international number. Vietnamese numbers starting with 0
              are converted to +84.
            </Text>
          </>
        )}

        {stage === "code" && (
          <>
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              6 digit code
            </Text>
            <TextInput
              value={code}
              onChangeText={(value) =>
                setCode(value.replace(/\D/g, "").slice(0, 6))
              }
              keyboardType="number-pad"
              autoComplete="sms-otp"
              textContentType="oneTimeCode"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor={theme.textTertiary}
              style={[
                styles.input,
                styles.codeInput,
                {
                  color: theme.textPrimary,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            />
            <Pressable
              onPress={() => {
                setStage("phone");
                setCode("");
              }}
              style={styles.changeNumber}
            >
              <Text style={[styles.link, { color: theme.primary }]}>
                Change phone number
              </Text>
            </Pressable>
          </>
        )}

        {stage !== "done" && (
          <Pressable
            onPress={stage === "phone" ? handlePhoneSend : handleCodeVerify}
            disabled={busy}
            accessibilityRole="button"
            style={[
              styles.primaryButton,
              { backgroundColor: theme.primary, opacity: busy ? 0.7 : 1 },
            ]}
          >
            {busy ? (
              <ActivityIndicator color={theme.white} />
            ) : (
              <Text style={[styles.buttonText, { color: theme.white }]}>
                {stage === "phone" ? "Send code" : "Verify phone"}
              </Text>
            )}
          </Pressable>
        )}

        {stage === "done" && (
          <Pressable
            onPress={() => router.back()}
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.buttonText, { color: theme.white }]}>
              Done
            </Text>
          </Pressable>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    position: "relative",
  },
  titleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  back: { width: 36, height: 40, justifyContent: "center" },
  headerTitle: { ...typography.bodyBold, textAlign: "center" },
  content: { flex: 1, paddingHorizontal: spacing.base, paddingTop: 48 },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  title: { ...typography.h2 },
  subtitle: {
    ...typography.body,
    lineHeight: 24,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  label: { ...typography.captionBold, marginBottom: spacing.sm },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: spacing.base,
    ...typography.body,
  },
  codeInput: { fontSize: 24, letterSpacing: 8, textAlign: "center" },
  hint: { ...typography.caption, marginTop: spacing.sm, lineHeight: 18 },
  changeNumber: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  link: { ...typography.bodyBold },
  primaryButton: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  buttonText: { ...typography.bodyBold },
});
