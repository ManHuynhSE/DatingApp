import React, { useEffect, useMemo, useState, useRef } from 'react';
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
import { colors, darkColors, typography, spacing, borderRadius, resolveThemeStyles } from '@/theme';
import { discoveryProfiles } from '@/data/mockData';
import { useDiscoveryStore } from '@/store/discoveryStore';
import { useThemeStore } from '@/store/themeStore';

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

const mapProfile = (profile: (typeof discoveryProfiles)[number]): ProfileCard => ({
  id: profile.id,
  name: profile.name,
  age: profile.age,
  pronouns: profile.pronouns,
  occupation: profile.company ? `${profile.occupation} at ${profile.company}` : profile.occupation,
  verified: profile.verified,
  image: profile.photos[0],
});

const PROGRESS_SEGMENTS = 5;

export default function DiscoveryScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLikeOverlay, setShowLikeOverlay] = useState(false);
  const [showPassOverlay, setShowPassOverlay] = useState(false);
  const [decision, setDecision] = useState<'like' | 'pass' | null>(null);
  const [swipeFeedback, setSwipeFeedback] = useState('');
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const feedbackScale = useRef(new Animated.Value(0.86)).current;
  const decisionOpacity = useRef(new Animated.Value(0)).current;
  const decisionScale = useRef(new Animated.Value(0.72)).current;
  const cardEntrance = useRef(new Animated.Value(1)).current;
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const decisionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filters = useDiscoveryStore((state) => state.filters);
  const swipeRight = useDiscoveryStore((state) => state.swipeRight);
  const swipeLeft = useDiscoveryStore((state) => state.swipeLeft);
  const undoSwipe = useDiscoveryStore((state) => state.undoSwipe);
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === 'dark' ? darkColors : colors;
  const styles = resolveThemeStyles(baseStyles, theme);

  const filteredProfiles = useMemo(() => {
    const profiles = discoveryProfiles.filter((profile) => {
      const distance = Number.parseInt(profile.distance, 10);
      const genderMatches =
        filters.gender === 'everyone' ||
        (filters.gender === 'women' && profile.pronouns.toLowerCase().includes('she')) ||
        (filters.gender === 'men' && profile.pronouns.toLowerCase().includes('he'));
      const ageMatches = profile.age >= filters.ageRange[0] && profile.age <= filters.ageRange[1];
      const distanceMatches = Number.isNaN(distance) || distance <= filters.distance;
      const languageMatches =
        filters.languages.length === 0 ||
        filters.languages.some((language) => profile.languages.includes(language));
      return genderMatches && ageMatches && distanceMatches && languageMatches;
    }).map(mapProfile);
    return [{ ...mapProfile(discoveryProfiles[0]), id: 'intro', isIntro: true }, ...profiles];
  }, [filters]);

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

  const activeIndex = currentIndex < filteredProfiles.length ? currentIndex : 0;
  const currentProfile = filteredProfiles[activeIndex];
  const isLastCard = filteredProfiles.length > 1 && currentIndex >= filteredProfiles.length;
  const currentProfileRef = useRef<ProfileCard | undefined>(currentProfile);
  currentProfileRef.current = currentProfile;

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      if (decisionTimer.current) clearTimeout(decisionTimer.current);
    };
  }, []);

  const showSwipeFeedback = (message: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setSwipeFeedback(message);
    feedbackOpacity.setValue(0);
    feedbackScale.setValue(0.86);
    Animated.parallel([
      Animated.timing(feedbackOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(feedbackScale, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();
    feedbackTimer.current = setTimeout(() => {
      Animated.timing(feedbackOpacity, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setSwipeFeedback('');
      });
    }, 1150);
  };

  const goToNext = () => {
    position.setValue({ x: 0, y: 0 });
    cardEntrance.setValue(0);
    setCurrentIndex((prev) => Math.min(prev + 1, filteredProfiles.length));
    Animated.spring(cardEntrance, {
      toValue: 1,
      friction: 8,
      tension: 70,
      useNativeDriver: true,
    }).start();
  };

  const showDecision = (nextDecision: 'like' | 'pass') => {
    if (decisionTimer.current) clearTimeout(decisionTimer.current);
    setDecision(nextDecision);
    decisionOpacity.setValue(0);
    decisionScale.setValue(0.72);
    Animated.parallel([
      Animated.timing(decisionOpacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.spring(decisionScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
    decisionTimer.current = setTimeout(() => {
      Animated.timing(decisionOpacity, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setDecision(null);
      });
    }, 900);
  };

  const handleLike = () => {
    const profile = currentProfileRef.current;
    if (isAnimating.current || !profile) return;
    isAnimating.current = true;
    showDecision('like');
    setShowLikeOverlay(true);
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: 430,
      easing: (value) => value * (2 - value),
      useNativeDriver: true,
    }).start(() => {
      setShowLikeOverlay(false);
      showSwipeFeedback('Interest sent');
      if (!profile.isIntro) swipeRight(profile.id);
      goToNext();
      isAnimating.current = false;
    });
  };

  const handlePass = () => {
    const profile = currentProfileRef.current;
    if (isAnimating.current || !profile) return;
    isAnimating.current = true;
    showDecision('pass');
    setShowPassOverlay(true);
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: 430,
      easing: (value) => value * (2 - value),
      useNativeDriver: true,
    }).start(() => {
      setShowPassOverlay(false);
      showSwipeFeedback('Passed');
      if (!profile.isIntro) swipeLeft(profile.id);
      goToNext();
      isAnimating.current = false;
    });
  };

  const handleUndo = () => {
    if (currentIndex > 1) {
      undoSwipe();
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
      {
        translateY: cardEntrance.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
      {
        scale: cardEntrance.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
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
              index <= activeIndex && styles.progressSegmentActive,
            ]}
          />
        ))}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/(tabs)/profile')}
          accessibilityLabel="Open profile"
        >
          <Ionicons name="person-circle-outline" size={25} color={theme.headerIcon ?? theme.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={handleUndo}>
          <Ionicons name="arrow-undo-outline" size={22} color={theme.headerIcon ?? theme.textPrimary} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.headerTitle, { color: theme.headerTitle ?? theme.textPrimary }]}>HeartSync</Text>
      <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/filters')} accessibilityLabel="Open filters">
        <Ionicons name="options-outline" size={22} color={theme.primary} />
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {renderHeader()}
      {renderProgressBar()}
      {swipeFeedback ? (
        <Animated.View
          style={[
            styles.swipeFeedback,
            { opacity: feedbackOpacity, transform: [{ scale: feedbackScale }] },
          ]}
        >
          <Ionicons name="sparkles" size={16} color={colors.primary} />
          <Text style={styles.swipeFeedbackText}>{swipeFeedback}</Text>
        </Animated.View>
      ) : null}
      {decision ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.decisionOverlay,
            {
              opacity: decisionOpacity,
              transform: [
                { scale: decisionScale },
                { rotate: decision === 'like' ? '10deg' : '-10deg' },
              ],
            },
          ]}
        >
          <Ionicons
            name={decision === 'like' ? 'checkmark-circle' : 'close-circle'}
            size={96}
            color={decision === 'like' ? colors.success : colors.error}
          />
          <Text style={styles.decisionText}>
            {decision === 'like' ? 'LIKE' : 'PASS'}
          </Text>
        </Animated.View>
      ) : null}
      <View style={styles.cardContainer}>
        {renderCard()}
      </View>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
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
    paddingBottom: 84,
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
    bottom: spacing.xl,
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
  decisionOverlay: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  decisionText: {
    marginTop: spacing.sm,
    fontSize: typography.h3.fontSize,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
