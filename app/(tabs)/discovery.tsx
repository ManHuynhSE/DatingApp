import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface ProfileCard {
  id: string;
  name: string;
  age: number;
  pronouns: string;
  occupation: string;
  verified: boolean;
  image: string;
  isIntro?: boolean;
}

const MOCK_PROFILES: ProfileCard[] = [
  {
    id: '0',
    name: 'Sophia',
    age: 25,
    pronouns: 'she/her/hers',
    occupation: 'UX Designer at Google',
    verified: true,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
    isIntro: true,
  },
  {
    id: '1',
    name: 'Emma',
    age: 27,
    pronouns: 'she/her/hers',
    occupation: 'Software Engineer at Meta',
    verified: true,
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800',
  },
  {
    id: '2',
    name: 'Olivia',
    age: 24,
    pronouns: 'she/her/hers',
    occupation: 'Product Manager at Apple',
    verified: false,
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
  },
  {
    id: '3',
    name: 'Ava',
    age: 26,
    pronouns: 'she/her/hers',
    occupation: 'Data Scientist at Netflix',
    verified: true,
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
  },
  {
    id: '4',
    name: 'Isabella',
    age: 28,
    pronouns: 'she/her/hers',
    occupation: 'Marketing Director',
    verified: true,
    image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800',
  },
];

const PROGRESS_SEGMENTS = 5;

export default function DiscoveryScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLikeOverlay, setShowLikeOverlay] = useState(false);
  const [showPassOverlay, setShowPassOverlay] = useState(false);
  const [swipeFeedback, setSwipeFeedback] = useState('');

  const position = useRef(new Animated.ValueXY()).current;
  const isAnimating = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (!isAnimating.current) {
          position.setValue({ x: gestureState.dx, y: 0 });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          handleLike();
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          handlePass();
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const currentProfile = MOCK_PROFILES[currentIndex];
  const isLastCard = currentIndex >= MOCK_PROFILES.length;

  const goToNext = () => {
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex((prev) => Math.min(prev + 1, MOCK_PROFILES.length));
  };

  const handleLike = () => {
    if (isAnimating.current || !currentProfile) return;
    isAnimating.current = true;
    setShowLikeOverlay(true);
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowLikeOverlay(false);
      setSwipeFeedback('Interest sent');
      goToNext();
      isAnimating.current = false;
      setTimeout(() => setSwipeFeedback(''), 1400);
    });
  };

  const handlePass = () => {
    if (isAnimating.current || !currentProfile) return;
    isAnimating.current = true;
    setShowPassOverlay(true);
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowPassOverlay(false);
      goToNext();
      isAnimating.current = false;
    });
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const cardRotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-8deg', '0deg', '8deg'],
    extrapolate: 'clamp',
  });

  const cardStyle = {
    transform: [
      { translateX: position.x },
      { rotate: cardRotation },
    ],
  };

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        {Array.from({ length: PROGRESS_SEGMENTS }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressSegment,
              index <= currentIndex && styles.progressSegmentActive,
            ]}
          />
        ))}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="menu-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={handleUndo}>
          <Ionicons name="arrow-undo-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.headerTitle}>HeartSync</Text>
      <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/filters')}>
        <Ionicons name="options-outline" size={22} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderIntroOverlay = () => (
    <View style={styles.introOverlay}>
      <View style={styles.introSection}>
        <View style={styles.introRow}>
          <View style={styles.introIconContainer}>
            <Ionicons name="arrow-forward-circle" size={32} color={colors.white} />
          </View>
          <View style={styles.introTextContainer}>
            <Text style={styles.introTitle}>Swipe right if you like</Text>
            <Text style={styles.introDescription}>
              Swipe right to express interest and potentially match with this person
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.introDivider} />

      <View style={styles.introSection}>
        <View style={styles.introRow}>
          <View style={[styles.introIconContainer, styles.introIconPass]}>
            <Ionicons name="arrow-back-circle" size={32} color={colors.white} />
          </View>
          <View style={styles.introTextContainer}>
            <Text style={styles.introTitle}>Swipe left to pass</Text>
            <Text style={styles.introDescription}>
              Swipe left to skip this profile and move on to the next person
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderCard = () => {
    if (isLastCard) {
      return (
        <View style={styles.emptyCard}>
          <Ionicons name="heart-dislike-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No more profiles</Text>
          <Text style={styles.emptySubtitle}>Check back later for new matches!</Text>
        </View>
      );
    }

    return (
      <Animated.View
        style={[styles.card, cardStyle]}
        {...panResponder.panHandlers}
      >
        <Image
          source={{ uri: currentProfile.image }}
          style={styles.cardImage}
          resizeMode="cover"
        />

        {/* Like / Pass overlays */}
        {showLikeOverlay && (
          <View style={[styles.swipeOverlay, styles.likeOverlay]}>
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          </View>
        )}
        {showPassOverlay && (
          <View style={[styles.swipeOverlay, styles.passOverlay]}>
            <Ionicons name="close-circle" size={80} color={colors.error} />
          </View>
        )}

        {/* Gradient overlay for text */}
        <View style={styles.cardGradient} />

        {/* Intro overlay for first card */}
        {currentProfile.isIntro && renderIntroOverlay()}

        {/* Profile info */}
        <Pressable
          style={styles.cardInfo}
          onPress={() => router.push('/profile-detail')}
        >
          <View style={styles.nameRow}>
            <Text style={styles.cardName}>
              {currentProfile.name}, {currentProfile.age}
            </Text>
            {currentProfile.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#4A90D9" />
              </View>
            )}
          </View>

          <View style={styles.pronounsChip}>
            <Text style={styles.pronounsText}>{currentProfile.pronouns}</Text>
          </View>

          <View style={styles.occupationRow}>
            <Ionicons name="briefcase-outline" size={14} color={colors.white} />
            <Text style={styles.occupationText}>{currentProfile.occupation}</Text>
          </View>
        </Pressable>

        {/* Action buttons on card */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.passButton]}
            onPress={handlePass}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={28} color={colors.error} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={handleLike}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={28} color={colors.success} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      {renderProgressBar()}
      {swipeFeedback ? (
        <View style={styles.swipeFeedback}>
          <Ionicons name="sparkles" size={16} color={colors.primary} />
          <Text style={styles.swipeFeedbackText}>{swipeFeedback}</Text>
        </View>
      ) : null}
      <View style={styles.cardContainer}>
        {renderCard()}
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: 4,
    marginBottom: spacing.sm,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  progressSegmentActive: {
    backgroundColor: colors.primary,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  card: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    // RN doesn't support CSS gradients; use layers instead
    backgroundColor: 'transparent',
  },
  // Manual gradient layers for React Native
  cardInfo: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardName: {
    ...typography.h2,
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  verifiedBadge: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pronounsChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  pronounsText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '500',
  },
  occupationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  occupationText: {
    ...typography.bodySmall,
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionButtons: {
    position: 'absolute',
    bottom: spacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  actionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  passButton: {
    backgroundColor: colors.white,
  },
  likeButton: {
    backgroundColor: colors.white,
  },
  // Intro overlay
  introOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    zIndex: 10,
  },
  introSection: {
    paddingVertical: spacing.lg,
  },
  introRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  introIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introIconPass: {
    backgroundColor: colors.error,
  },
  introTextContainer: {
    flex: 1,
  },
  introTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  introDescription: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.8)',
  },
  introDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  // Swipe overlays
  swipeOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  likeOverlay: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  passOverlay: {
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  // Empty state
  emptyCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  swipeFeedback: {
    position: 'absolute',
    top: 86,
    alignSelf: 'center',
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  swipeFeedbackText: {
    ...typography.captionBold,
    color: colors.textPrimary,
  },
});
