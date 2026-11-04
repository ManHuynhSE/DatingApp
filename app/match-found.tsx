import React, { useEffect, useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '../src/theme';
import { datingApi } from '../src/api/datingClient';
import { useAuthStore } from '../src/store/authStore';

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
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    matchedUserId?: string | string[];
    matchedName?: string | string[];
  }>();
  const [message, setMessage] = useState('');
  const initialMatchedName = Array.isArray(params.matchedName)
    ? params.matchedName[0]
    : params.matchedName ?? 'đối phương';
  const [matchedName, setMatchedName] = useState(initialMatchedName);
  const [matchedPhoto, setMatchedPhoto] = useState('');
  const [userPhoto, setUserPhoto] = useState('');
  const currentUserId = useAuthStore((state) => state.user?.id);
  const matchedUserId = Array.isArray(params.matchedUserId)
    ? params.matchedUserId[0]
    : params.matchedUserId;

  useEffect(() => {
    if (!currentUserId || !matchedUserId) return;
    let active = true;

    const loadMatchPhotos = async () => {
      const [currentUserResult, matchedUserResult] = await Promise.allSettled([
        datingApi.getUserProfile(currentUserId),
        datingApi.getUserProfile(matchedUserId),
      ]);
      if (!active) return;

      if (currentUserResult.status === 'fulfilled') {
        const photos = [...(currentUserResult.value.data.users?.photos ?? [])].sort(
          (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position,
        );
        setUserPhoto(photos[0]?.url ?? '');
      } else {
        setUserPhoto('');
      }

      if (matchedUserResult.status === 'fulfilled') {
        const profile = matchedUserResult.value.data;
        const photos = [...(profile.users?.photos ?? [])].sort(
          (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position,
        );
        setMatchedName(profile.display_name || initialMatchedName);
        setMatchedPhoto(photos[0]?.url ?? '');
      } else {
        setMatchedPhoto('');
      }
    };

    void loadMatchPhotos();
    return () => {
      active = false;
    };
  }, [currentUserId, matchedUserId, initialMatchedName]);

  const handleSend = () => {
    if (message.trim()) {
      router.push('/chat/1');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, spacing.base) }]}>
      {/* Header - cố định trên cùng, nằm ngoài KeyboardAvoidingView để không bao giờ bị bàn phím đẩy lên */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
          accessibilityLabel="Đóng"
        >
          <Ionicons name="close" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => Alert.alert('Tùy chọn tương hợp', 'Bạn có thể ẩn hoặc báo cáo người này tại đây.')}
        >
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
          pointerEvents="none"
          style={[
            styles.confettiDot,
            {
              top: dot.top + insets.top,
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

      {/* KeyboardAvoidingView bọc ScrollView */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 50 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Title */}
          <Text style={styles.matchTitle}>Tương hợp mới!</Text>

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
                {matchedPhoto ? (
                  <Image
                    source={{ uri: matchedPhoto }}
                    style={styles.matchPhoto}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.matchPhoto, styles.emptyMatchPhoto]} />
                )}
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
                {userPhoto ? (
                  <Image
                    source={{ uri: userPhoto }}
                    style={styles.matchPhoto}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.matchPhoto, styles.emptyMatchPhoto]} />
                )}
              </View>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Bạn và {matchedName} đều đã thích nhau! Hãy gửi tin nhắn ngay để bắt đầu trò chuyện nhé.
          </Text>

          {/* Conversation starters banner */}
          <TouchableOpacity
            style={styles.startersBanner}
            activeOpacity={0.8}
            onPress={() => setMessage('Bạn thường thích làm gì nhất vào ngày Chủ nhật?')}
          >
            <Ionicons name="chatbubbles" size={20} color={colors.white} />
            <Text style={styles.startersText}>
              Chưa biết nói gì? Nhấn vào đây để thử câu gợi ý làm quen!
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.white} />
          </TouchableOpacity>

          {/* Message input */}
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.lightbulbBtn}
              onPress={() => setMessage('Chuyến đi đáng nhớ nhất của bạn từ trước tới nay là ở đâu thế?')}
            >
              <Ionicons name="bulb-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Nhập tin nhắn..."
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
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
    height: 50,
    zIndex: 20,
  },
  headerBtn: {
    padding: spacing.xs,
  },
  confettiDot: {
    position: 'absolute',
    zIndex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    paddingBottom: spacing.lg,
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
  emptyMatchPhoto: {
    backgroundColor: colors.surface,
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
