import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, darkColors, spacing, borderRadius, typography, getGenderBadgeColor } from '@/theme';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useDiscoveryStore } from '@/store/discoveryStore';
import {
  datingApi,
  DatingApiError,
  type Hobby,
  type RecommendationProfile,
} from '@/api/datingClient';
import { HOBBY_EMOJIS } from '@/data/hobbies';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = Math.min(Math.max(SCREEN_WIDTH * 0.25, 90), 140);

export interface DiscoveryFeedTopic {
  type: 'group' | 'intention';
  id: string;
  slug?: string;
  name: string;
  value?: string;
  memberCount: number;
  isMember?: boolean;
  imageUrl?: string;
  glowColor?: string;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  description?: string;
}

export interface DiscoveryFeedModalProps {
  visible: boolean;
  onClose: () => void;
  topic: DiscoveryFeedTopic | null;
}

interface ProfileCard {
  id: string;
  userId: string;
  name: string;
  age: number;
  pronouns: string;
  gender: string;
  occupation: string;
  location: string;
  distanceKm?: number | null;
  city?: string;
  ward?: string;
  languages: string[];
  hobbies: Hobby[];
  lifestyle?: string[];
  pet?: string | null;
  education?: string | null;
  height_cm?: number | null;
  verified: boolean;
  image: string;
  photos: string[];
  bio?: string;
  relationship_intention?: string | null;
}

const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 22;
  const parts = birthDate.split('-').map(Number);
  if (parts.length < 3 || !parts[0] || !parts[1] || !parts[2]) return 22;
  const birth = new Date(parts[0], parts[1] - 1, parts[2]);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return isNaN(age) || age < 18 ? 22 : age;
};

const mapDatingProfile = (profile: RecommendationProfile): ProfileCard => {
  const photos = profile.users?.photos ?? [];
  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.position - b.position;
  });
  const photoUrls = sortedPhotos.map((p) => p.url);
  const primaryPhoto =
    photoUrls[0] ?? `https://picsum.photos/seed/${profile.user_id}/700/900`;

  const locationText =
    [profile.ward, profile.city].filter(Boolean).join(', ') ||
    profile.city ||
    'Nearby';

  const rawHobbies = (profile.hobbies ||
    (profile as unknown as { interests?: unknown[] }).interests ||
    []) as unknown[];

  const normalizedHobbies: Hobby[] = Array.isArray(rawHobbies)
    ? rawHobbies
        .map((item, idx): Hobby | null => {
          let name = '';
          if (typeof item === 'string') {
            name = item.trim();
          } else if (item && typeof item === 'object') {
            const obj = item as Record<string, unknown>;
            if (typeof obj.name === 'string') name = obj.name.trim();
            else if (typeof obj.hobby_name === 'string')
              name = obj.hobby_name.trim();
            else if (typeof obj.title === 'string') name = obj.title.trim();
            else if (typeof obj.label === 'string') name = obj.label.trim();
          }
          if (!name) return null;
          const id =
            item &&
            typeof item === 'object' &&
            typeof (item as { id?: unknown }).id === 'string'
              ? (item as { id: string }).id
              : `hobby-${idx}-${name}`;
          return { id, name, category: 'General' };
        })
        .filter((h): h is Hobby => h !== null)
    : [];

  return {
    id: profile.id,
    userId: profile.user_id,
    name: profile.display_name,
    age: calculateAge(profile.birth_date),
    pronouns:
      profile.gender === 'female'
        ? 'She/Her'
        : profile.gender === 'male'
          ? 'He/Him'
          : profile.gender || 'They/Them',
    gender: profile.gender,
    occupation: profile.job_title ?? 'Open to meeting someone new',
    location: locationText,
    distanceKm: profile.distance_km,
    city: profile.city ?? undefined,
    ward: profile.ward ?? undefined,
    languages: profile.languages ?? [],
    hobbies: normalizedHobbies,
    lifestyle: profile.life_style ?? [],
    pet: profile.pet ?? null,
    education: profile.education ?? null,
    height_cm: profile.height_cm ?? null,
    verified: profile.is_verified,
    image: primaryPhoto,
    photos: photoUrls.length > 0 ? photoUrls : [primaryPhoto],
    bio: profile.bio ?? undefined,
    relationship_intention: profile.relationship_intention ?? null,
  };
};

function formatCount(count: number): string {
  try {
    return new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(count);
  } catch {
    return count > 999 ? `${(count / 1000).toFixed(1)}N` : String(count);
  }
}

export default function DiscoveryFeedModal({
  visible,
  onClose,
  topic,
}: DiscoveryFeedModalProps) {
  if (!visible || !topic) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <DiscoveryFeedContent
          key={`${topic.type}-${topic.id}`}
          topic={topic}
          onClose={onClose}
        />
      </GestureHandlerRootView>
    </Modal>
  );
}

interface DiscoveryCardContentProps {
  profile: ProfileCard;
  onPressInfo?: () => void;
  styles: Record<string, any>;
}

const DiscoveryCardContent = React.memo(function DiscoveryCardContent({
  profile,
  onPressInfo,
  styles,
}: DiscoveryCardContentProps) {
  const validHobbies = (profile.hobbies || [])
    .filter((h) => typeof h?.name === 'string' && h.name.trim().length > 0)
    .slice(0, 4);

  const infoContent = (
    <>
      {/* Name, Age, Verification */}
      <View style={styles.nameRow}>
        <Text style={styles.cardName} numberOfLines={1}>
          {profile.name}, {profile.age}
        </Text>
        {profile.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#4A90D9" />
          </View>
        )}
      </View>

      {/* Tags: Pronouns, Relationship Intention, Distance, Location */}
      <View style={styles.tagsRow}>
        {profile.pronouns ? (
          <View
            style={[
              styles.pronounsChip,
              {
                backgroundColor: getGenderBadgeColor(
                  profile.gender,
                  profile.pronouns,
                  colors.primary,
                ),
              },
            ]}
          >
            <Text style={styles.pronounsText}>
              {profile.pronouns}
            </Text>
          </View>
        ) : null}

        {profile.relationship_intention ? (
          <View style={styles.intentionChip}>
            <Ionicons name="sparkles" size={12} color="#FFF" />
            <Text style={styles.intentionText}>
              {profile.relationship_intention}
            </Text>
          </View>
        ) : null}

        {profile.distanceKm !== null &&
        profile.distanceKm !== undefined ? (
          <View style={styles.distanceChip}>
            <Ionicons name="navigate-outline" size={12} color="#FFF" />
            <Text style={styles.distanceText}>
              {profile.distanceKm < 1
                ? '< 1 km'
                : `${profile.distanceKm.toFixed(1)} km`}
            </Text>
          </View>
        ) : null}

        {profile.location ? (
          <View style={styles.locationChip}>
            <Ionicons name="location-sharp" size={12} color="#FFF" />
            <Text style={styles.locationText} numberOfLines={1}>
              {profile.location}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Occupation */}
      {profile.occupation ? (
        <View style={styles.occupationRow}>
          <Ionicons
            name="briefcase-outline"
            size={14}
            color={colors.white}
          />
          <Text style={styles.occupationText} numberOfLines={1}>
            {profile.occupation}
          </Text>
        </View>
      ) : null}

      {/* Candidate Hobby Badges (Max 4) */}
      {validHobbies.length > 0 && (
        <View style={styles.hobbiesPreviewRow}>
          {validHobbies.map((hobby, index) => (
            <View
              key={hobby.id || `hobby-chip-${index}`}
              style={styles.hobbyPreviewChip}
            >
              <Text style={styles.hobbyPreviewText}>
                {HOBBY_EMOJIS[hobby.name]
                  ? `${HOBBY_EMOJIS[hobby.name]} `
                  : ''}
                {hobby.name}
              </Text>
            </View>
          ))}
        </View>
      )}
    </>
  );

  return (
    <>
      {/* Card Hero Photo */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image
          source={{ uri: profile.image }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      </View>

      {/* Profile Details Container */}
      <Pressable style={styles.cardInfo} onPress={onPressInfo}>
        {infoContent}
      </Pressable>
    </>
  );
});

interface DiscoverySwipeCardProps {
  profile: ProfileCard;
  cardIndex: number;
  isTop: boolean;
  activeIndexSV: SharedValue<number>;
  onSwipeComplete: (action: 'like' | 'pass') => void;
  swipeProgress: SharedValue<number>;
  onPressInfo?: () => void;
  onLayout?: () => void;
  styles: Record<string, any>;
}

function DiscoverySwipeCard({
  profile,
  cardIndex,
  isTop,
  activeIndexSV,
  onSwipeComplete,
  swipeProgress,
  onPressInfo,
  onLayout,
  styles,
}: DiscoverySwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isSwiping = useSharedValue(false);
  const likeScaleBoost = useSharedValue(1);
  const passScaleBoost = useSharedValue(1);
  const showStamp = useSharedValue(false);
  const hasLaidOutRef = useRef(false);

  const handleCardLayout = useCallback(() => {
    hasLaidOutRef.current = true;
    if (isTop) {
      onLayout?.();
    }
  }, [isTop, onLayout]);

  useEffect(() => {
    if (isTop && hasLaidOutRef.current) {
      onLayout?.();
    }
  }, [isTop, onLayout]);

  const panGesture = Gesture.Pan()
    .enabled(isTop)
    .activeOffsetX([-6, 6])
    .activeOffsetY([-6, 6])
    .onStart(() => {
      if (!isTop || isSwiping.get()) return;
      showStamp.set(true);
    })
    .onUpdate((event) => {
      if (!isTop || isSwiping.get()) return;
      showStamp.set(true);
      translateX.set(event.translationX);
      translateY.set(event.translationY * 0.65);
      swipeProgress.set(
        interpolate(
          Math.abs(event.translationX),
          [0, SWIPE_THRESHOLD],
          [0, 1],
          Extrapolation.CLAMP,
        ),
      );
    })
    .onEnd((event) => {
      if (!isTop || isSwiping.get()) return;

      const currentX = translateX.get();
      const currentY = translateY.get();
      const shouldLike =
        currentX >= SWIPE_THRESHOLD ||
        (event.velocityX > 850 && currentX > 40);
      const shouldPass =
        currentX <= -SWIPE_THRESHOLD ||
        (event.velocityX < -850 && currentX < -40);

      if (shouldLike) {
        isSwiping.set(true);
        showStamp.set(true);
        const targetX = SCREEN_WIDTH * 1.45;
        const ratio = targetX / Math.max(Math.abs(currentX), 1);
        const targetY = currentY * Math.min(ratio, 2) + event.velocityY * 0.08;

        swipeProgress.set(withTiming(1, { duration: 260 }));
        translateY.set(
          withTiming(targetY, {
            duration: 260,
            easing: Easing.out(Easing.cubic),
          })
        );
        translateX.set(
          withTiming(
            targetX,
            {
              duration: 260,
              easing: Easing.out(Easing.cubic),
            },
            (finished) => {
              if (finished) {
                showStamp.set(false);
                likeScaleBoost.set(1);
                passScaleBoost.set(1);
                activeIndexSV.set(cardIndex + 1);
                swipeProgress.set(0);
                runOnJS(onSwipeComplete)('like');
              }
            }
          )
        );
      } else if (shouldPass) {
        isSwiping.set(true);
        showStamp.set(true);
        const targetX = -SCREEN_WIDTH * 1.45;
        const ratio = Math.abs(targetX) / Math.max(Math.abs(currentX), 1);
        const targetY = currentY * Math.min(ratio, 2) + event.velocityY * 0.08;

        swipeProgress.set(withTiming(1, { duration: 260 }));
        translateY.set(
          withTiming(targetY, {
            duration: 260,
            easing: Easing.out(Easing.cubic),
          })
        );
        translateX.set(
          withTiming(
            targetX,
            {
              duration: 260,
              easing: Easing.out(Easing.cubic),
            },
            (finished) => {
              if (finished) {
                showStamp.set(false);
                likeScaleBoost.set(1);
                passScaleBoost.set(1);
                activeIndexSV.set(cardIndex + 1);
                swipeProgress.set(0);
                runOnJS(onSwipeComplete)('pass');
              }
            }
          )
        );
      } else {
        swipeProgress.set(
          withSpring(0, {
            damping: 16,
            stiffness: 180,
          }),
        );
        translateX.set(
          withSpring(
            0,
            {
              damping: 16,
              stiffness: 180,
              mass: 0.8,
            },
            (finished) => {
              if (finished) {
                showStamp.set(false);
              }
            }
          )
        );
        translateY.set(
          withSpring(0, {
            damping: 16,
            stiffness: 180,
            mass: 0.8,
          })
        );
      }
    })
    .onFinalize((_event, success) => {
      if (!success && !isSwiping.get()) {
        showStamp.set(false);
      }
    });

  const handleLike = () => {
    if (!isTop || isSwiping.get()) return;
    isSwiping.set(true);
    showStamp.set(true);
    likeScaleBoost.set(1.28);
    swipeProgress.set(withTiming(1, { duration: 340 }));
    translateX.set(
      withTiming(
        SCREEN_WIDTH * 1.4,
        {
          duration: 340,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            showStamp.set(false);
            likeScaleBoost.set(1);
            passScaleBoost.set(1);
            activeIndexSV.set(cardIndex + 1);
            swipeProgress.set(0);
            runOnJS(onSwipeComplete)('like');
          }
        }
      )
    );
    translateY.set(
      withTiming(-24, {
        duration: 340,
        easing: Easing.out(Easing.cubic),
      })
    );
  };

  const handlePass = () => {
    if (!isTop || isSwiping.get()) return;
    isSwiping.set(true);
    showStamp.set(true);
    passScaleBoost.set(1.28);
    swipeProgress.set(withTiming(1, { duration: 340 }));
    translateX.set(
      withTiming(
        -SCREEN_WIDTH * 1.4,
        {
          duration: 340,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            showStamp.set(false);
            likeScaleBoost.set(1);
            passScaleBoost.set(1);
            activeIndexSV.set(cardIndex + 1);
            swipeProgress.set(0);
            runOnJS(onSwipeComplete)('pass');
          }
        }
      )
    );
    translateY.set(
      withTiming(24, {
        duration: 340,
        easing: Easing.out(Easing.cubic),
      })
    );
  };

  useAnimatedReaction(
    () => showStamp.value && translateX.value >= SWIPE_THRESHOLD,
    (isReached, previous) => {
      if (isReached !== previous) {
        likeScaleBoost.set(
          withSpring(isReached ? 1.28 : 1, {
            damping: 12,
            stiffness: 220,
          })
        );
      }
    }
  );

  useAnimatedReaction(
    () => showStamp.value && translateX.value <= -SWIPE_THRESHOLD,
    (isReached, previous) => {
      if (isReached !== previous) {
        passScaleBoost.set(
          withSpring(isReached ? 1.28 : 1, {
            damping: 12,
            stiffness: 220,
          })
        );
      }
    }
  );

  const likeIconStyle = useAnimatedStyle(() => {
    if (!showStamp.value) {
      return {
        opacity: 0,
        transform: [{ scale: 0.65 }, { rotate: '-12deg' }],
      };
    }
    const opacity = interpolate(
      translateX.value,
      [15, SWIPE_THRESHOLD * 0.85],
      [0, 1],
      Extrapolation.CLAMP
    );
    const baseScale = interpolate(
      translateX.value,
      [15, SWIPE_THRESHOLD],
      [0.65, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [
        { scale: baseScale * likeScaleBoost.value },
        { rotate: '-12deg' },
      ],
    };
  });

  const passIconStyle = useAnimatedStyle(() => {
    if (!showStamp.value) {
      return {
        opacity: 0,
        transform: [{ scale: 0.65 }, { rotate: '12deg' }],
      };
    }
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD * 0.85, -15],
      [1, 0],
      Extrapolation.CLAMP
    );
    const baseScale = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, -15],
      [1, 0.65],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [
        { scale: baseScale * passScaleBoost.value },
        { rotate: '12deg' },
      ],
    };
  });

  const cardStyle = useAnimatedStyle(() => {
    const isCardActive = cardIndex <= activeIndexSV.value;
    const scale = isCardActive
      ? 1
      : interpolate(
          swipeProgress.value,
          [0, 1],
          [0.95, 1],
          Extrapolation.CLAMP
        );
    const opacity = isCardActive
      ? 1
      : interpolate(
          swipeProgress.value,
          [0, 1],
          [0.85, 1],
          Extrapolation.CLAMP
        );
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-12, 0, 12],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [
        { scale },
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        pointerEvents={isTop ? 'auto' : 'none'}
        onLayout={handleCardLayout}
        style={[
          styles.card,
          isTop ? styles.topCard : styles.nextCard,
          cardStyle,
        ]}
      >
        <DiscoveryCardContent
          profile={profile}
          onPressInfo={onPressInfo}
          styles={styles}
        />

        {/* Dynamic Reanimated Like / Pass stamp icons */}
        <Animated.View
          pointerEvents="none"
          style={[styles.likeSwipeOverlay, likeIconStyle]}
        >
          <Ionicons
            name="heart"
            size={98}
            color="#EF4444"
            style={styles.floatingSwipeIcon}
          />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[styles.passSwipeOverlay, passIconStyle]}
        >
          <Ionicons
            name="close"
            size={106}
            color="#E5E7EB"
            style={styles.floatingSwipeIcon}
          />
        </Animated.View>

        {/* Action buttons on card */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.passButton]}
            onPress={handlePass}
            activeOpacity={0.8}
            accessibilityLabel="Bỏ qua"
          >
            <Ionicons name="close" size={28} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={handleLike}
            activeOpacity={0.8}
            accessibilityLabel="Thích"
          >
            <Ionicons name="heart" size={26} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

function DiscoveryFeedContent({
  topic,
  onClose,
}: {
  topic: DiscoveryFeedTopic;
  onClose: () => void;
}) {
  const router = useRouter();
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === 'dark' ? darkColors : colors;
  const currentUser = useAuthStore((state) => state.user);
  const userId = currentUser?.id;

  const swipeRight = useDiscoveryStore((state) => state.swipeRight);
  const swipeLeft = useDiscoveryStore((state) => state.swipeLeft);

  const [profiles, setProfiles] = useState<ProfileCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeFeedback, setSwipeFeedback] = useState('');
  const [laidOutProfileKey, setLaidOutProfileKey] = useState<string | null>(null);

  const nextCursorRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);
  const sessionIdRef = useRef<string>('');
  const recordedImpressionsRef = useRef<Set<string>>(new Set());
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Swipe Animation Shared Values
  const activeIndexSV = useSharedValue(0);
  const swipeProgress = useSharedValue(0);
  const feedbackOpacity = useSharedValue(0);
  const feedbackScale = useSharedValue(0.86);

  const currentProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];
  const isLastCard = !loading && (profiles.length === 0 || currentIndex >= profiles.length);

  const currentProfileRef = useRef<ProfileCard | undefined>(currentProfile);
  currentProfileRef.current = currentProfile;

  // Retry or reload first page of recommendations
  const handleRetry = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    activeIndexSV.set(0);
    swipeProgress.set(0);
    sessionIdRef.current = '';
    nextCursorRef.current = null;
    recordedImpressionsRef.current = new Set();

    try {
      let res;
      if (topic.type === 'group' && topic.slug) {
        res = await datingApi.getGroupRecommendations(topic.slug, { limit: 20 });
      } else if (topic.type === 'intention' && topic.value) {
        res = await datingApi.getIntentionRecommendations(topic.value, { limit: 20 });
      }

      if (res && res.success) {
        const seen = new Set<string>();
        const candidateList = (res.data || [])
          .map(mapDatingProfile)
          .filter((cand) => {
            if (cand.userId === userId) return false;
            if (seen.has(cand.userId)) return false;
            seen.add(cand.userId);
            return true;
          });

        setProfiles(candidateList);
        sessionIdRef.current = res.pagination?.sessionId || '';
        nextCursorRef.current = res.pagination?.nextCursor || null;
      } else {
        setProfiles([]);
      }
    } catch (err) {
      console.warn('Discovery feed load error:', err);
      setError(
        err instanceof Error ? err.message : 'Không tải được danh sách hồ sơ'
      );
    } finally {
      setLoading(false);
    }
  }, [activeIndexSV, swipeProgress, topic, userId]);

  useEffect(() => {
    let active = true;
    activeIndexSV.set(0);
    swipeProgress.set(0);
    sessionIdRef.current = '';
    nextCursorRef.current = null;
    recordedImpressionsRef.current = new Set();

    let fetchPromise;
    if (topic.type === 'group' && topic.slug) {
      fetchPromise = datingApi.getGroupRecommendations(topic.slug, { limit: 20 });
    } else if (topic.type === 'intention' && topic.value) {
      fetchPromise = datingApi.getIntentionRecommendations(topic.value, { limit: 20 });
    } else {
      fetchPromise = Promise.resolve(null);
    }

    fetchPromise
      .then((res) => {
        if (!active) return;
        if (res && res.success) {
          const seen = new Set<string>();
          const candidateList = (res.data || [])
            .map(mapDatingProfile)
            .filter((cand) => {
              if (cand.userId === userId) return false;
              if (seen.has(cand.userId)) return false;
              seen.add(cand.userId);
              return true;
            });

          setProfiles(candidateList);
          sessionIdRef.current = res.pagination?.sessionId || '';
          nextCursorRef.current = res.pagination?.nextCursor || null;
        } else {
          setProfiles([]);
        }
      })
      .catch((err) => {
        if (!active) return;
        console.warn('Discovery feed load error:', err);
        setError(
          err instanceof Error ? err.message : 'Không tải được danh sách hồ sơ'
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [activeIndexSV, swipeProgress, topic, userId]);

  // Load next batch using cursor pagination
  const loadMoreRecommendations = useCallback(async () => {
    const cursor = nextCursorRef.current;
    if (!cursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;

    try {
      let res;
      if (topic.type === 'group' && topic.slug) {
        res = await datingApi.getGroupRecommendations(topic.slug, {
          limit: 20,
          cursor,
        });
      } else if (topic.type === 'intention' && topic.value) {
        res = await datingApi.getIntentionRecommendations(topic.value, {
          limit: 20,
          cursor,
        });
      }

      if (res && res.success) {
        setProfiles((current: ProfileCard[]) => {
          const existingUserIds = new Set(current.map((p: ProfileCard) => p.userId));
          const nextCandidates = (res.data || [])
            .map(mapDatingProfile)
            .filter(
              (p: ProfileCard) => p.userId !== userId && !existingUserIds.has(p.userId)
            );
          return [...current, ...nextCandidates];
        });
        nextCursorRef.current = res.pagination?.nextCursor || null;
      }
    } catch (err) {
      if (err instanceof DatingApiError && err.status === 400) {
        nextCursorRef.current = null;
      }
      console.warn('Load more cursor failed:', err);
    } finally {
      loadingMoreRef.current = false;
    }
  }, [topic, userId]);

  // Pre-load next batch using cursor pagination when nearing end
  useEffect(() => {
    if (
      profiles.length > 0 &&
      currentIndex >= profiles.length - 3 &&
      nextCursorRef.current !== null
    ) {
      void loadMoreRecommendations();
    }
  }, [currentIndex, loadMoreRecommendations, profiles.length]);

  // Pre-load upcoming card images
  useEffect(() => {
    if (profiles.length > 0) {
      const nextBatch = profiles
        .slice(currentIndex, currentIndex + 4)
        .map((p) => p.image)
        .filter(
          (url): url is string =>
            typeof url === 'string' && url.startsWith('http')
        );
      if (nextBatch.length > 0) {
        nextBatch.forEach((url) => {
          void Image.prefetch(url);
        });
      }
    }
  }, [currentIndex, profiles]);


  // Visibility Impression recording (Identical to swipe.tsx with 700ms debounce)
  const visibleProfileKey =
    sessionIdRef.current && currentProfile
      ? `${sessionIdRef.current}:${currentProfile.userId}`
      : null;

  const markCurrentProfileLaidOut = useCallback(() => {
    if (visibleProfileKey) setLaidOutProfileKey(visibleProfileKey);
  }, [visibleProfileKey]);

  useEffect(() => {
    if (
      loading ||
      !currentProfile ||
      laidOutProfileKey !== visibleProfileKey ||
      !sessionIdRef.current
    ) {
      return undefined;
    }

    const key = `${sessionIdRef.current}:${currentProfile.userId}`;
    if (recordedImpressionsRef.current.has(key)) return undefined;

    const timer = setTimeout(() => {
      if (currentProfileRef.current?.userId !== currentProfile.userId) return;
      recordedImpressionsRef.current.add(key);

      if (topic.type === 'group' && topic.slug) {
        datingApi
          .recordGroupRecommendationImpressions(
            topic.slug,
            sessionIdRef.current,
            [currentProfile.userId]
          )
          .catch(() => {
            recordedImpressionsRef.current.delete(key);
          });
      } else if (topic.type === 'intention') {
        datingApi
          .recordIntentionRecommendationImpressions(
            sessionIdRef.current,
            [currentProfile.userId]
          )
          .catch(() => {
            recordedImpressionsRef.current.delete(key);
          });
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [currentProfile, laidOutProfileKey, loading, topic, visibleProfileKey]);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const clearSwipeFeedback = useCallback(() => {
    setSwipeFeedback('');
  }, []);

  const showSwipeFeedback = useCallback(
    (message: string) => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      setSwipeFeedback(message);
      feedbackOpacity.set(0);
      feedbackScale.set(0.86);
      feedbackOpacity.set(withTiming(1, { duration: 180 }));
      feedbackScale.set(withSpring(1, { damping: 14, stiffness: 160 }));
      feedbackTimer.current = setTimeout(() => {
        feedbackOpacity.set(
          withTiming(0, { duration: 260 }, (finished) => {
            if (finished) {
              runOnJS(clearSwipeFeedback)();
            }
          })
        );
      }, 1150);
    },
    [clearSwipeFeedback, feedbackOpacity, feedbackScale]
  );

  // Complete swipe action
  const completeSwipe = useCallback(
    (action: 'like' | 'pass') => {
      const profile = currentProfileRef.current;
      if (!profile) return;

      if (action === 'like') {
        swipeRight(profile.userId);
        if (userId) {
          datingApi
            .createSwipe(userId, profile.userId, 'like')
            .then((res) => {
              if (res.isMatch) {
                showSwipeFeedback("It's a Match! 🎉");
                setTimeout(() => {
                  router.push({
                    pathname: '/match-found',
                    params: {
                      matchedUserId: profile.userId,
                      matchedName: profile.name,
                      matchedPhoto: profile.image,
                    },
                  });
                }, 350);
              } else {
                showSwipeFeedback('Đã gửi thích');
              }
            })
            .catch((error: unknown) => {
              showSwipeFeedback(
                error instanceof Error
                  ? error.message
                  : 'Không lưu được lượt thích'
              );
            });
        } else {
          showSwipeFeedback('Đã gửi thích');
        }
      } else {
        swipeLeft(profile.userId);
        if (userId) {
          datingApi
            .createSwipe(userId, profile.userId, 'pass')
            .then(() => {
              showSwipeFeedback('Đã bỏ qua');
            })
            .catch((error: unknown) => {
              showSwipeFeedback(
                error instanceof Error
                  ? error.message
                  : 'Không lưu được lượt bỏ qua'
              );
            });
        } else {
          showSwipeFeedback('Đã bỏ qua');
        }
      }

      setCurrentIndex((prev) => Math.min(prev + 1, profiles.length));
    },
    [
      profiles.length,
      router,
      showSwipeFeedback,
      swipeLeft,
      swipeRight,
      userId,
    ]
  );

  const feedbackAnimatedStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.value,
    transform: [{ scale: feedbackScale.value }],
  }));

  const renderCardContent = () => {
    if (loading) {
      return (
        <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            Đang tải danh sách hồ sơ...
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Tìm kiếm những người phù hợp trong {topic.name}
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
          <Ionicons name="cloud-offline-outline" size={52} color={theme.error} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            Không thể tải hồ sơ
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.reloadBtn, { backgroundColor: theme.primary }]}
            onPress={handleRetry}
          >
            <Ionicons name="reload" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.reloadBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!currentProfile || isLastCard || profiles.length === 0) {
      return (
        <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
          <Ionicons name="sparkles-outline" size={64} color={theme.primary} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            Bạn đã xem hết hồ sơ!
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Không còn hồ sơ nào mới trong {topic.name}. Hãy quay lại sau nhé!
          </Text>
          <TouchableOpacity
            style={[styles.reloadBtn, { backgroundColor: theme.primary }]}
            onPress={handleRetry}
          >
            <Ionicons name="reload" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.reloadBtnText}>Tải lại từ đầu</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cardStackWrapper}>
        {/* Next Card underneath (Pre-rendered and decoded in Deck Stack) */}
        {nextProfile ? (
          <DiscoverySwipeCard
            key={nextProfile.userId}
            profile={nextProfile}
            cardIndex={currentIndex + 1}
            isTop={false}
            activeIndexSV={activeIndexSV}
            onSwipeComplete={completeSwipe}
            swipeProgress={swipeProgress}
            styles={styles}
          />
        ) : null}

        {/* Current Top Card (Interactive, receiving gestures) */}
        {currentProfile ? (
          <DiscoverySwipeCard
            key={currentProfile.userId}
            profile={currentProfile}
            cardIndex={currentIndex}
            isTop={true}
            activeIndexSV={activeIndexSV}
            onSwipeComplete={completeSwipe}
            swipeProgress={swipeProgress}
            onPressInfo={() =>
              router.push({
                pathname: '/profile-detail',
                params: {
                  userId: currentProfile.userId,
                  name: currentProfile.name,
                  age: String(currentProfile.age),
                  occupation: currentProfile.occupation,
                  city: currentProfile.city ?? '',
                  ward: currentProfile.ward ?? '',
                  distance_km:
                    currentProfile.distanceKm !== null &&
                    currentProfile.distanceKm !== undefined
                      ? String(currentProfile.distanceKm)
                      : '',
                  bio: currentProfile.bio ?? '',
                  image: currentProfile.image,
                  verified: String(currentProfile.verified),
                },
              })
            }
            onLayout={markCurrentProfileLaidOut}
            styles={styles}
          />
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}
    >
      {/* Top Header: Close on Left, Title & Subtitle in Center */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={8}
          style={styles.headerCloseBtn}
          accessibilityLabel="Đóng"
        >
          <Ionicons name="close" size={26} color={theme.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text
            style={[styles.headerTitle, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            {topic.name}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {formatCount(topic.memberCount)} thành viên
          </Text>
        </View>

        <View style={styles.headerCloseBtn} />
      </View>

      {/* Swipe Feedback Badge */}
      {swipeFeedback ? (
        <Animated.View style={[styles.swipeFeedback, feedbackAnimatedStyle]}>
          <Ionicons name="sparkles" size={16} color={colors.primary} />
          <Text style={styles.swipeFeedbackText}>{swipeFeedback}</Text>
        </Animated.View>
      ) : null}

      {/* Card Arena */}
      <View style={styles.cardContainer}>{renderCardContent()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCloseBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  swipeFeedback: {
    position: 'absolute',
    top: 86,
    alignSelf: 'center',
    zIndex: 35,
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
  cardContainer: {
    flex: 1,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
    paddingBottom: 24,
  },
  cardStackWrapper: {
    flex: 1,
    position: 'relative',
  },
  nextCard: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  topCard: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
  },
  card: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#18181B',
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    userSelect: 'none',
  },
  cardImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  likeSwipeOverlay: {
    position: 'absolute',
    top: 32,
    left: 32,
    zIndex: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passSwipeOverlay: {
    position: 'absolute',
    top: 32,
    right: 32,
    zIndex: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingSwipeIcon: {
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  cardInfo: {
    position: 'absolute',
    bottom: 84,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    zIndex: 20,
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
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  verifiedBadge: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  pronounsChip: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  pronounsText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  intentionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  intentionText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  distanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  distanceText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  locationText: {
    ...typography.caption,
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  occupationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  occupationText: {
    ...typography.bodySmall,
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hobbiesPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 4,
  },
  hobbyPreviewChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  hobbyPreviewText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
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
    gap: spacing.xxl,
    zIndex: 25,
  },
  actionButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  passButton: {
    backgroundColor: colors.white,
  },
  likeButton: {
    backgroundColor: colors.white,
  },
  emptyCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  reloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  reloadBtnText: {
    ...typography.captionBold,
    color: colors.white,
  },
});
