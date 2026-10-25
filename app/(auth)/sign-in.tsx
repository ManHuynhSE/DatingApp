import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants, { AppOwnership } from 'expo-constants';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { firebaseAuth } from '../../src/auth/firebase';
import { api } from '../../src/api/client';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Please try again.';

const completeAuthentication = async (
  router: ReturnType<typeof useRouter>,
  authentication: Promise<unknown> = Promise.resolve(),
) => {
  await authentication;
  const idToken = await firebaseAuth.currentAuth?.currentUser?.getIdToken();
  if (!idToken) {
    throw new Error('Unable to establish an authenticated session.');
  }

  const profile = await api.getMyProfile(idToken);
  router.replace(profile ? '/(tabs)/discovery' : '/create-profile');
};

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isExpoGo = Constants.appOwnership === AppOwnership.Expo;
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'heartsync' });
  const [googleRequest, googleResponse, promptGoogle] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
    },
    {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    },
  );

  useEffect(() => {
    const accessToken = googleResponse?.type === 'success'
      ? googleResponse.authentication?.accessToken
      : undefined;
    if (!accessToken) return;
    completeAuthentication(
      router,
      firebaseAuth.signInWithGoogleToken(accessToken),
    ).catch((error) => Alert.alert('Google sign-in failed', getErrorMessage(error)));
  }, [googleResponse, router]);

  const handleEmailAuth = async () => {
    if (!firebaseAuth.isConfigured) {
      Alert.alert('Firebase is not configured', 'Add Firebase values to .env.local.');
      return;
    }
    if (!email.trim() || password.length < 6) {
      Alert.alert('Check your details', 'Use a valid email and a password with at least 6 characters.');
      return;
    }
    setIsLoading(true);
    try {
      if (isCreateMode) {
        await firebaseAuth.createAccount(email.trim(), password);
      } else {
        await firebaseAuth.signInWithEmail(email.trim(), password);
      }
      await completeAuthentication(router);
    } catch (error) {
      Alert.alert('Authentication failed', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    if (isExpoGo) {
      Alert.alert(
        'Google login needs a Development Build',
        'Expo Go cannot receive the OAuth redirect. Email/password login is available now.',
      );
      return;
    }
    promptGoogle();
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Enter your email', 'Add your email first to reset your password.');
      return;
    }
    try {
      await firebaseAuth.resetPassword(email.trim());
      Alert.alert('Email sent', 'Check your inbox for the password reset link.');
    } catch (error) {
      Alert.alert('Unable to reset password', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
      >
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <View style={styles.eyebrow}>
          <View style={styles.eyebrowDot} />
          <Text style={styles.eyebrowText}>A softer way to meet</Text>
        </View>
        <View style={styles.logoOuterRing}>
          <View style={styles.logoMiddleRing}>
            <View style={styles.logoInnerCircle}>
              <Ionicons name="heart" size={44} color={colors.white} />
            </View>
          </View>
        </View>

        <Text style={styles.appName}>HeartSync</Text>
        <Text style={styles.tagline}>Meet with intention.{'\n'}Stay for the feeling.</Text>
      </View>

      {/* Buttons Section */}
      <View style={styles.buttonsSection}>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
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
            {isLoading ? 'Working...' : isCreateMode ? 'Create account' : 'Sign in with email'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleAuth}
          disabled={(!googleRequest && !isExpoGo) || isLoading}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-google" size={20} color={colors.textPrimary} style={styles.buttonIcon} />
          <Text style={[styles.buttonText, styles.googleButtonText]}>Continue with Google</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsCreateMode((value) => !value)}
          style={styles.modeToggle}
        >
          <Text style={styles.modeToggleText}>{isCreateMode ? 'Already have an account? Sign in' : 'New here? Create an account'}</Text>
        </TouchableOpacity>
        {!isCreateMode && <TouchableOpacity onPress={handleResetPassword}><Text style={styles.resetText}>Forgot password?</Text></TouchableOpacity>}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By signing up you agree to our{' '}
          <Text style={styles.footerLink}>Terms and Conditions</Text>
        </Text>
        <Text style={styles.footerText}>
          See how we use your data in our{' '}
          <Text style={styles.footerLink}>Privacy Policy</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    transform: [{ rotate: '-8deg' }],
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoMiddleRing: {
    width: 112,
    height: 112,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInnerCircle: {
    width: 88,
    height: 88,
    borderRadius: 26,
    transform: [{ rotate: '8deg' }],
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xl,
    letterSpacing: -0.8,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsSection: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
  },
  buttonIcon: {
    marginRight: spacing.md,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
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
  modeToggle: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  modeToggleText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  resetText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'android' ? spacing.xl : spacing.md,
    gap: spacing.xs,
  },
  footerText: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    ...typography.caption,
    color: colors.textTertiary,
    textDecorationLine: 'underline',
  },
});
