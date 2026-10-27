import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_SIZE = SCREEN_WIDTH * 0.35;

// Confetti decoration positions
const CONFETTI_DOTS = [
  { top: 60, left: 30, size: 8, color: '#FFD700', shape: 'circle' },
  { top: 80, left: SCREEN_WIDTH - 60, size: 10, color: colors.secondary, shape: 'circle' },
  { top: 120, left: 60, size: 6, color: colors.primary, shape: 'circle' },
  { top: 100, left: SCREEN_WIDTH - 90, size: 12, color: '#FF6B6B', shape: 'triangle' },
  { top: 140, left: SCREEN_WIDTH - 40, size: 8, color: '#FFD700', shape: 'circle' },
  { top: 50, left: SCREEN_WIDTH / 2 - 20, size: 10, color: colors.primary, shape: 'triangle' },
  { top: 70, left: SCREEN_WIDTH / 2 + 40, size: 6, color: '#FF6B6B', shape: 'circle' },
  { top: 160, left: 40, size: 10, color: colors.secondary, shape: 'triangle' },
  { top: 45, left: SCREEN_WIDTH - 120, size: 8, color: colors.primary, shape: 'circle' },
  { top: 130, left: SCREEN_WIDTH / 2, size: 7, color: '#FFD700', shape: 'circle' },
];

export default function MatchFoundScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    matchedName?: string;
    matchedPhoto?: string;
    userPhoto?: string;
  }>();
  const [message, setMessage] = useState('');

  const matchedName = params.matchedName ?? 'your match';
  const matchedPhoto =
    params.matchedPhoto ??
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400';
  const userPhoto =
    params.userPhoto ??
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400';

  const handleSend = () => {
    if (message.trim()) {
      router.push('/chat/1');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
        >
          <Ionicons name="close" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.headerBtn} onPress={() => Alert.alert('Match menu', 'You can report or hide this match from this menu.')}>
          <Ionicons
            name="ellipsis-horizontal"
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Confetti decorations */}
      {CONFETTI_DOTS.map((dot, i) => (
        <View
          key={i}
          style={[
            styles.confettiDot,
            {
              top: dot.top,
              left: dot.left,
              width: dot.size,
              height: dot.size,
              backgroundColor: dot.color,
              borderRadius: dot.shape === 'circle' ? dot.size / 2 : 0,
              transform:
                dot.shape === 'triangle'
                  ? [{ rotate: `${i * 45}deg` }]
                  : [],
            },
          ]}
        />
      ))}

      {/* Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {/* Title */}
        <Text style={styles.matchTitle}>Match found!</Text>

        {/* Photos */}
        <View style={styles.photosContainer}>
          {/* Match's photo */}
          <View style={[styles.photoWrapper, styles.leftPhoto]}>
            <View
              style={[
                styles.photoBackground,
                { backgroundColor: '#EDE9FE' },
              ]}
            >
              <Image
                source={{
                  uri: matchedPhoto,
                }}
                style={styles.matchPhoto}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Heart icon in center */}
          <View style={styles.heartContainer}>
            <View style={styles.heartCircle}>
              <Ionicons name="heart" size={24} color={colors.secondary} />
            </View>
          </View>

          {/* User's photo */}
          <View style={[styles.photoWrapper, styles.rightPhoto]}>
            <View
              style={[
                styles.photoBackground,
                { backgroundColor: '#FEF3C7' },
              ]}
            >
              <Image
                source={{
                  uri: userPhoto,
                }}
                style={styles.matchPhoto}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          You and {matchedName} have both shown interest in each other! Send a message to break the ice.
        </Text>

        {/* Conversation starters banner */}
        <TouchableOpacity
          style={styles.startersBanner}
          activeOpacity={0.8}
          onPress={() => setMessage('What is your favorite way to spend a Sunday?')}
        >
          <Ionicons name="chatbubbles" size={20} color={colors.white} />
          <Text style={styles.startersText}>
            Stuck on what to say? Choose from these conversation starters!
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.white} />
        </TouchableOpacity>

        {/* Message input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.lightbulbBtn}
            onPress={() => setMessage('What is the best trip you have ever taken?')}
          >
            <Ionicons name="bulb-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              message.trim() ? styles.sendBtnActive : {},
            ]}
            onPress={handleSend}
          >
            <Ionicons
              name="send"
              size={18}
              color={message.trim() ? colors.white : colors.textTertiary}
            />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    zIndex: 10,
  },
  headerBtn: {
    padding: spacing.xs,
  },
  confettiDot: {
    position: 'absolute',
    zIndex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  matchTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  photosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    height: PHOTO_SIZE + 40,
  },
  photoWrapper: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE + 20,
  },
  leftPhoto: {
    transform: [{ rotate: '-8deg' }],
    marginRight: -20,
    zIndex: 1,
  },
  rightPhoto: {
    transform: [{ rotate: '8deg' }],
    marginLeft: -20,
    zIndex: 1,
  },
  photoBackground: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    ...shadows.md,
  },
  matchPhoto: {
    flex: 1,
    borderRadius: borderRadius.md,
  },
  heartContainer: {
    position: 'absolute',
    zIndex: 10,
    alignSelf: 'center',
  },
  heartCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  description: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  startersBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    marginBottom: spacing.xl,
    width: '100%',
  },
  startersText: {
    flex: 1,
    fontSize: typography.bodySmall.fontSize,
    color: colors.white,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  lightbulbBtn: {
    padding: spacing.xs,
  },
  messageInput: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: colors.primary,
  },
});
