import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { firebaseAuth } from '../../src/auth/firebase';

export default function PhoneLoginScreen() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSendOTP = () => {
    if (!firebaseAuth.isConfigured) {
      alert('Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* to .env.local.');
      return;
    }
    alert('Phone OTP needs an Expo development build with native Firebase Auth. The backend is ready for the resulting ID token.');
    return;
  };

  const handleBack = () => {
    router.back();
  };

  const isPhoneValid = phoneNumber.length >= 7;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Enter your phone number</Text>
          <Text style={styles.subtitle}>
            We&apos;ll send you a verification code to confirm your number.
          </Text>

          {/* Phone Input Row */}
          <View style={styles.phoneInputRow}>
            {/* Country Code */}
            <TouchableOpacity
              style={styles.countryCodeButton}
              activeOpacity={0.7}
              onPress={() => setCountryCode((value) => (value === '+1' ? '+84' : '+1'))}
            >
              <Text style={styles.countryCodeText}>{countryCode}</Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Phone Number Input */}
            <TextInput
              style={styles.phoneInput}
              placeholder="Phone number"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={15}
              autoFocus
            />
          </View>
        </View>

        {/* Send OTP Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[
              styles.sendButton,
              !isPhoneValid && styles.sendButtonDisabled,
            ]}
            onPress={handleSendOTP}
            activeOpacity={0.8}
            disabled={!isPhoneValid}
          >
            <Text
              style={[
                styles.sendButtonText,
                !isPhoneValid && styles.sendButtonTextDisabled,
              ]}
            >
              Send OTP
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  countryCodeText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  bottomSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: Platform.OS === 'android' ? spacing.xl : spacing.md,
  },
  sendButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  sendButtonTextDisabled: {
    color: colors.textTertiary,
  },
});
