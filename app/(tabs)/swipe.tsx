import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  AppState,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
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
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useRouter } from "expo-router";
import {
  colors,
  darkColors,
  typography,
  spacing,
  borderRadius,
  resolveThemeStyles,
  getGenderBadgeColor,
} from "@/theme";
import { discoveryProfiles } from "@/data/mockData";
import { useDiscoveryStore } from "@/store/discoveryStore";
import { useThemeStore } from "@/store/themeStore";
import { HOBBY_EMOJIS } from "@/data/hobbies";
import { useAuthStore } from "@/store/authStore";
import {
  datingApi,
  DatingApiError,
  type Hobby,
  type RecommendationProfile,
} from "@/api/datingClient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = Math.min(Math.max(SCREEN_WIDTH * 0.25, 90), 140);

interface ProfileCard {
  id: string; // row profile id
  userId: string; // candidate user uuid (for impressions, swipes, detail)
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
  isIntro?: boolean;
}

const calculateAge = (birthDate: string) => {
  const date = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  if (
    today.getMonth() < date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())
  ) {
    age -= 1;
  }
  return age;
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
    [profile.ward, profile.city].filter(Boolean).join(", ") ||
    profile.city ||
    "Nearby";

  const rawHobbies = (profile.hobbies ||
    (profile as unknown as { interests?: unknown[] }).interests ||
    []) as unknown[];

  const normalizedHobbies: Hobby[] = Array.isArray(rawHobbies)
    ? rawHobbies
        .map((item, idx): Hobby | null => {
          let name = "";
          if (typeof item === "string") {
            name = item.trim();
          } else if (item && typeof item === "object") {
            const obj = item as Record<string, unknown>;
            if (typeof obj.name === "string") name = obj.name.trim();
            else if (typeof obj.hobby_name === "string")
              name = obj.hobby_name.trim();
            else if (typeof obj.title === "string") name = obj.title.trim();
            else if (typeof obj.label === "string") name = obj.label.trim();
          }
          if (!name) return null;
          const id =
            item &&
            typeof item === "object" &&
            typeof (item as { id?: unknown }).id === "string"
              ? (item as { id: string }).id
              : `hobby-${idx}-${name}`;
          return { id, name, category: "General" };
        })
        .filter((h): h is Hobby => h !== null)
    : [];

  return {
    id: profile.id,
    userId: profile.user_id,
    name: profile.display_name,
    age: calculateAge(profile.birth_date),
    pronouns:
      profile.gender === "female"
        ? "She/Her"
        : profile.gender === "male"
          ? "He/Him"
          : profile.gender,
    gender: profile.gender,
    occupation: profile.job_title ?? "Open to meeting someone new",
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
  };
};

const mapMockProfile = (
  profile: (typeof discoveryProfiles)[number],
): ProfileCard => ({
  id: profile.id,
  userId: profile.id,
  name: profile.name,
  age: profile.age,
  pronouns: profile.pronouns,
  gender: profile.pronouns.toLowerCase().includes("she")
    ? "female"
    : profile.pronouns.toLowerCase().includes("he")
      ? "male"
      : "other",
  occupation: profile.company
    ? `${profile.occupation} at ${profile.company}`
    : profile.occupation,
  location: profile.location,
  distanceKm: Number.parseFloat(profile.distance) || 3.2,
  city: profile.location,
  languages: profile.languages,
  hobbies: (profile.interests || []).map((name) => ({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    category: "General",
  })),
  verified: profile.verified,
  image: profile.photos[0],
  photos: profile.photos,
  bio: profile.aboutMe,
});

interface CardContentProps {
  profile: ProfileCard;
  onPressInfo?: () => void;
  styles: Record<string, any>;
}

const CardContent = React.memo(function CardContent({
  profile,
  onPressInfo,
  styles,
}: CardContentProps) {
  const validHobbies = (profile.hobbies || [])
    .filter((h) => typeof h?.name === "string" && h.name.trim().length > 0)
    .slice(0, 4);

  const infoContent = (
    <>
      <View style={styles.nameRow}>
        <Text style={styles.cardName}>
          {profile.name}, {profile.age}
        </Text>
        {profile.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#4A90D9" />
          </View>
        )}
      </View>

      <View style={styles.tagsRow}>
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
          <Text style={styles.pronounsText}>{profile.pronouns}</Text>
        </View>
        {profile.distanceKm !== null && profile.distanceKm !== undefined ? (
          <View style={styles.distanceChip}>
            <Ionicons name="navigate-outline" size={12} color="#FFF" />
            <Text style={styles.distanceText}>
              {profile.distanceKm < 1
                ? "< 1 km away"
                : `${profile.distanceKm} km away`}
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
                  : ""}
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

interface SwipeCardProps {
  profile: ProfileCard;
  cardIndex: number;
  isTop: boolean;
  activeIndexSV: SharedValue<number>;
  onSwipeComplete: (action: "like" | "pass") => void;
  swipeProgress: SharedValue<number>;
  onPressInfo?: () => void;
  onLayout?: () => void;
  styles: Record<string, any>;
}

function SwipeCard({
  profile,
  cardIndex,
  isTop,
  activeIndexSV,
  onSwipeComplete,
  swipeProgress,
  onPressInfo,
  onLayout,
  styles,
}: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isSwiping = useSharedValue(false);
  const showStamp = useSharedValue(false);
  const likeScaleBoost = useSharedValue(1);
  const passScaleBoost = useSharedValue(1);
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
        const targetY =
          currentY * Math.min(ratio, 2) + event.velocityY * 0.08;

        swipeProgress.set(
          withTiming(1, {
            duration: 260,
            easing: Easing.out(Easing.cubic),
          }),
        );
        translateY.set(
          withTiming(targetY, {
            duration: 260,
            easing: Easing.out(Easing.cubic),
          }),
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
                runOnJS(onSwipeComplete)("like");
              }
            },
          ),
        );
      } else if (shouldPass) {
        isSwiping.set(true);
        showStamp.set(true);
        const targetX = -SCREEN_WIDTH * 1.45;
        const ratio =
          Math.abs(targetX) / Math.max(Math.abs(currentX), 1);
        const targetY =
          currentY * Math.min(ratio, 2) + event.velocityY * 0.08;

        swipeProgress.set(
          withTiming(1, {
            duration: 260,
            easing: Easing.out(Easing.cubic),
          }),
        );
        translateY.set(
          withTiming(targetY, {
            duration: 260,
            easing: Easing.out(Easing.cubic),
          }),
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
                runOnJS(onSwipeComplete)("pass");
              }
            },
          ),
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
            },
          ),
        );
        translateY.set(
          withSpring(0, {
            damping: 16,
            stiffness: 180,
            mass: 0.8,
          }),
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
    swipeProgress.set(
      withTiming(1, {
        duration: 340,
        easing: Easing.out(Easing.cubic),
      }),
    );
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
            runOnJS(onSwipeComplete)("like");
          }
        },
      ),
    );
    translateY.set(
      withTiming(-24, {
        duration: 340,
        easing: Easing.out(Easing.cubic),
      }),
    );
  };

  const handlePass = () => {
    if (!isTop || isSwiping.get()) return;
    isSwiping.set(true);
    showStamp.set(true);
    passScaleBoost.set(1.28);
    swipeProgress.set(
      withTiming(1, {
        duration: 340,
        easing: Easing.out(Easing.cubic),
      }),
    );
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
            runOnJS(onSwipeComplete)("pass");
          }
        },
      ),
    );
    translateY.set(
      withTiming(24, {
        duration: 340,
        easing: Easing.out(Easing.cubic),
      }),
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
          }),
        );
      }
    },
  );

  useAnimatedReaction(
    () => showStamp.value && translateX.value <= -SWIPE_THRESHOLD,
    (isReached, previous) => {
      if (isReached !== previous) {
        passScaleBoost.set(
          withSpring(isReached ? 1.28 : 1, {
            damping: 12,
            stiffness: 220,
          }),
        );
      }
    },
  );

  const likeIconStyle = useAnimatedStyle(() => {
    if (!showStamp.value) {
      return {
        opacity: 0,
        transform: [{ scale: 0.65 }, { rotate: "-12deg" }],
      };
    }
    const opacity = interpolate(
      translateX.value,
      [15, SWIPE_THRESHOLD * 0.85],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const baseScale = interpolate(
      translateX.value,
      [15, SWIPE_THRESHOLD],
      [0.65, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity,
      transform: [
        { scale: baseScale * likeScaleBoost.value },
        { rotate: "-12deg" },
      ],
    };
  });

  const passIconStyle = useAnimatedStyle(() => {
    if (!showStamp.value) {
      return {
        opacity: 0,
        transform: [{ scale: 0.65 }, { rotate: "12deg" }],
      };
    }
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD * 0.85, -15],
      [1, 0],
      Extrapolation.CLAMP,
    );
    const baseScale = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, -15],
      [1, 0.65],
      Extrapolation.CLAMP,
    );
    return {
      opacity,
      transform: [
        { scale: baseScale * passScaleBoost.value },
        { rotate: "12deg" },
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
          Extrapolation.CLAMP,
        );
    const opacity = isCardActive
      ? 1
      : interpolate(
          swipeProgress.value,
          [0, 1],
          [0.85, 1],
          Extrapolation.CLAMP,
        );
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-12, 0, 12],
      Extrapolation.CLAMP,
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
        pointerEvents={isTop ? "auto" : "none"}
        onLayout={handleCardLayout}
        style={[
          styles.card,
          isTop ? styles.topCard : styles.nextCard,
          cardStyle,
        ]}
      >
        <CardContent
          profile={profile}
          onPressInfo={onPressInfo}
          styles={styles}
        />

        {/* Dynamic Reanimated Like / Pass icons */}
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
            accessibilityLabel="Pass"
          >
            <Ionicons name="close" size={28} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={handleLike}
            activeOpacity={0.8}
            accessibilityLabel="Like"
          >
            <Ionicons name="heart" size={26} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export default function SwipeScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeFeedback, setSwipeFeedback] = useState("");
  const [remoteProfiles, setRemoteProfiles] = useState<ProfileCard[] | null>(
    null,
  );
  const [recommendationSessionId, setRecommendationSessionId] = useState<
    string | null
  >(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [laidOutProfileKey, setLaidOutProfileKey] = useState<string | null>(
    null,
  );
  const [isAppActive, setIsAppActive] = useState(
    AppState.currentState === "active",
  );
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);

  const nextRecommendationCursorRef = useRef<string | null>(null);
  const loadingMoreRecommendationsRef = useRef(false);
  const recordedImpressionKeysRef = useRef(new Set<string>());

  const activeIndexSV = useSharedValue(0);
  const swipeProgress = useSharedValue(0);
  const feedbackOpacity = useSharedValue(0);
  const feedbackScale = useSharedValue(0.86);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const swipeRight = useDiscoveryStore((state) => state.swipeRight);
  const swipeLeft = useDiscoveryStore((state) => state.swipeLeft);
  const preferencesVersion = useDiscoveryStore(
    (state) => state.preferencesVersion,
  );

  const mode = useThemeStore((state) => state.mode);
  const theme = mode === "dark" ? darkColors : colors;
  const styles = resolveThemeStyles(baseStyles, theme);

  const currentUser = useAuthStore((state) => state.user);
  const userId = currentUser?.id;
  const isScreenFocused = useIsFocused();

  // Reset photo index in completeSwipe, handleUndo, and loadFirstRecommendationPage

  // Track app active state for visibility impression criteria
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setIsAppActive(state === "active");
    });
    return () => subscription.remove();
  }, []);

  // Request recommendations snapshot (First request: GET /api/recommendations/{userId}?limit=20)
  const loadFirstRecommendationPage = useCallback(async () => {
    setIsLoadingProfiles(true);
    setProfileLoadError(null);
    setCurrentIndex(0);
    activeIndexSV.set(0);
    swipeProgress.set(0);
    setRecommendationSessionId(null);
    nextRecommendationCursorRef.current = null;
    recordedImpressionKeysRef.current = new Set();

    if (!userId) {
      // Fallback for non-authenticated exploration mode
      setRemoteProfiles(discoveryProfiles.map(mapMockProfile));
      setIsLoadingProfiles(false);
      return;
    }

    try {
      const response = await datingApi.getRecommendations(userId, { limit: 20 });
      const seen = new Set<string>();
      const candidateList = response.data
        .map(mapDatingProfile)
        .filter((cand) => {
          if (cand.userId === userId) return false;
          if (seen.has(cand.userId)) return false;
          seen.add(cand.userId);
          return true;
        });

      setRemoteProfiles(candidateList);
      setRecommendationSessionId(response.pagination.sessionId);
      nextRecommendationCursorRef.current = response.pagination.nextCursor;
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : "Unable to load recommendations from server";
      setProfileLoadError(msg);
      setRemoteProfiles([]);
    } finally {
      setIsLoadingProfiles(false);
    }
  }, [activeIndexSV, swipeProgress, userId]);

  const handleRefresh = () => {
    void loadFirstRecommendationPage();
  };

  // Cursor pagination (Request next pages: GET /api/recommendations/{userId}?limit=20&cursor={nextCursor})
  const loadMoreRecommendations = useCallback(async () => {
    const cursor = nextRecommendationCursorRef.current;
    if (!userId || !cursor || loadingMoreRecommendationsRef.current) return;
    loadingMoreRecommendationsRef.current = true;

    try {
      const response = await datingApi.getRecommendations(userId, {
        limit: 20,
        cursor,
      });

      setRemoteProfiles((current) => {
        const existingUserIds = new Set(
          current?.map((profile) => profile.userId) ?? [],
        );
        const nextCandidates = response.data
          .map(mapDatingProfile)
          .filter(
            (profile) =>
              profile.userId !== userId && !existingUserIds.has(profile.userId),
          );
        return [...(current ?? []), ...nextCandidates];
      });

      setRecommendationSessionId(response.pagination.sessionId);
      nextRecommendationCursorRef.current = response.pagination.nextCursor;
    } catch (error: unknown) {
      // When cursor expires or is invalid (HTTP 400), reset session snapshot and restart first request
      if (
        (error instanceof DatingApiError && error.status === 400) ||
        (error instanceof Error &&
          error.message.toLowerCase().includes("cursor"))
      ) {
        nextRecommendationCursorRef.current = null;
        void loadFirstRecommendationPage();
        return;
      }
      if (!remoteProfiles?.length) {
        setProfileLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load more recommendations",
        );
      }
    } finally {
      loadingMoreRecommendationsRef.current = false;
    }
  }, [loadFirstRecommendationPage, remoteProfiles?.length, userId]);

  // Load recommendations on mount or when userId changes
  useEffect(() => {
    let active = true;

    // Sync user's own profile info
    if (userId) {
      datingApi
        .getUserProfile(userId)
        .then((response) => {
          if (active && response.success && response.data) {
            const { setSession } = useAuthStore.getState();
            const userState = useAuthStore.getState().user;
            const profile = response.data;
            const photos = profile.users?.photos ?? [];
            const sortedPhotos = [...photos].sort((a, b) => {
              if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
              return a.position - b.position;
            });

            setSession(userState?.id || userId, {
              id: userId,
              name: profile.display_name,
              age: calculateAge(profile.birth_date),
              verified: profile.is_verified,
              pronouns:
                profile.gender === "female"
                  ? "She/Her"
                  : profile.gender === "male"
                    ? "He/Him"
                    : profile.gender,
              occupation: profile.job_title ?? "",
              distance: [profile.ward, profile.city].filter(Boolean).join(", "),
              location:
                [profile.ward, profile.city].filter(Boolean).join(", ") ||
                profile.city ||
                "",
              city: profile.city ?? undefined,
              ward: profile.ward ?? undefined,
              education: profile.education ?? "",
              aboutMe: profile.bio ?? "",
              photos: sortedPhotos.map((p) => p.url),
              details: {
                height: profile.height_cm ? `${profile.height_cm}cm` : "",
                smoking: "",
                drinking: "",
                pets: profile.pet ?? "",
                children: "",
                zodiac: "",
                religion: "",
                education: "",
                exercise: profile.life_style?.join(", ") ?? "",
              },
              interests: profile.hobbies?.map((h) => h.name) ?? [],
              hobbies: profile.hobbies ?? [],
              languages: profile.languages ?? [],
              relationshipGoal: "",
              profileCompletion: 100,
              online: true,
            });
          }
        })
        .catch(() => {
          // Non-critical background sync
        });
    }

    const timer = setTimeout(() => {
      void loadFirstRecommendationPage();
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [loadFirstRecommendationPage, userId]);

  // When preferences change in filters screen, refresh the ranking snapshot
  const prevPrefsVersionRef = useRef(preferencesVersion);
  useEffect(() => {
    if (preferencesVersion !== prevPrefsVersionRef.current) {
      prevPrefsVersionRef.current = preferencesVersion;
      void loadFirstRecommendationPage();
    }
  }, [loadFirstRecommendationPage, preferencesVersion]);

  // When screen comes back into focus (e.g. returning from Discovery or Group swipe),
  // refresh the recommendations to prevent duplicate profiles that were swiped elsewhere.
  const wasScreenFocusedRef = useRef(isScreenFocused);
  useEffect(() => {
    if (isScreenFocused) {
      if (!wasScreenFocusedRef.current) {
        void loadFirstRecommendationPage();
      }
      wasScreenFocusedRef.current = true;
    } else {
      wasScreenFocusedRef.current = false;
    }
  }, [isScreenFocused, loadFirstRecommendationPage]);

  // Order from server ranking snapshot must be preserved directly (no client-side re-sorting)
  const candidateProfiles = useMemo(() => {
    if (remoteProfiles !== null) {
      return remoteProfiles;
    }
    return discoveryProfiles.map(mapMockProfile);
  }, [remoteProfiles]);

  // Pre-load next batch using cursor pagination when nearing end
  useEffect(() => {
    if (
      remoteProfiles !== null &&
      currentIndex >= candidateProfiles.length - 3 &&
      nextRecommendationCursorRef.current !== null
    ) {
      void loadMoreRecommendations();
    }
  }, [
    candidateProfiles.length,
    currentIndex,
    loadMoreRecommendations,
    remoteProfiles,
  ]);

  const currentProfile = candidateProfiles[currentIndex];
  const nextProfile = candidateProfiles[currentIndex + 1];
  const isLastCard = currentIndex >= candidateProfiles.length;
  const currentProfileRef = useRef<ProfileCard | undefined>(currentProfile);
  currentProfileRef.current = currentProfile;

  // Visibility Impression recording (POST /api/recommendations/{userId}/impressions)
  // Contract:
  // - Body: { sessionId, candidateUserIds: [candidateUserId] }
  // - Candidate user UUID from profile.user_id, not profile.id
  // - Only sent after card is rendered, screen is focused, app is active, with 700ms debounce
  const visibleProfileKey =
    recommendationSessionId && currentProfile
      ? `${recommendationSessionId}:${currentProfile.userId}`
      : null;

  const markCurrentProfileLaidOut = useCallback(() => {
    if (visibleProfileKey) setLaidOutProfileKey(visibleProfileKey);
  }, [visibleProfileKey]);

  useEffect(() => {
    if (
      remoteProfiles === null ||
      isLoadingProfiles ||
      !isScreenFocused ||
      !isAppActive ||
      !userId ||
      !recommendationSessionId ||
      !currentProfile ||
      currentProfile.isIntro ||
      laidOutProfileKey !== visibleProfileKey
    ) {
      return undefined;
    }

    const key = `${recommendationSessionId}:${currentProfile.userId}`;
    if (recordedImpressionKeysRef.current.has(key)) return undefined;

    const timer = setTimeout(() => {
      if (
        AppState.currentState !== "active" ||
        currentProfileRef.current?.userId !== currentProfile.userId
      ) {
        return;
      }
      recordedImpressionKeysRef.current.add(key);
      datingApi
        .recordRecommendationImpressions(userId, recommendationSessionId, [
          currentProfile.userId,
        ])
        .catch(() => {
          recordedImpressionKeysRef.current.delete(key);
        });
    }, 700);

    return () => clearTimeout(timer);
  }, [
    currentProfile,
    isAppActive,
    isLoadingProfiles,
    isScreenFocused,
    laidOutProfileKey,
    recommendationSessionId,
    remoteProfiles,
    userId,
    visibleProfileKey,
  ]);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  // Pre-load upcoming card images into memory/disk cache using expo-image
  useEffect(() => {
    if (candidateProfiles.length > 0) {
      const nextBatch = candidateProfiles
        .slice(currentIndex, currentIndex + 4)
        .map((p) => p.image)
        .filter(
          (url): url is string =>
            typeof url === "string" && url.startsWith("http"),
        );
      if (nextBatch.length > 0) {
        nextBatch.forEach((url) => {
          void Image.prefetch(url);
        });
      }
    }
  }, [candidateProfiles, currentIndex]);

  const clearSwipeFeedback = useCallback(() => {
    setSwipeFeedback("");
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
          }),
        );
      }, 1150);
    },
    [clearSwipeFeedback, feedbackOpacity, feedbackScale],
  );

  const completeSwipe = useCallback(
    (action: "like" | "pass") => {
      const profile = currentProfileRef.current;
      if (!profile) return;

      if (!profile.isIntro) {
        if (action === "like") {
          swipeRight(profile.userId);
          if (userId) {
            datingApi
              .createSwipe(userId, profile.userId, "like")
              .then((res) => {
                if (res.isMatch) {
                  showSwipeFeedback("It's a Match! 🎉");
                  setTimeout(() => {
                    router.push({
                      pathname: "/match-found",
                      params: {
                        matchedUserId: profile.userId,
                        matchedName: profile.name,
                        matchedPhoto: profile.image,
                      },
                    });
                  }, 350);
                } else {
                  showSwipeFeedback("Interest sent");
                }
              })
              .catch((error: unknown) => {
                showSwipeFeedback(
                  error instanceof Error
                    ? error.message
                    : "Like could not be saved",
                );
              });
          } else {
            showSwipeFeedback("Interest sent");
          }
        } else {
          swipeLeft(profile.userId);
          if (userId) {
            datingApi
              .createSwipe(userId, profile.userId, "pass")
              .then(() => {
                showSwipeFeedback("Passed");
              })
              .catch((error: unknown) => {
                showSwipeFeedback(
                  error instanceof Error
                    ? error.message
                    : "Pass could not be saved",
                );
              });
          } else {
            showSwipeFeedback("Passed");
          }
        }
      }

      setCurrentIndex((prev) => Math.min(prev + 1, candidateProfiles.length));
    },
    [
      candidateProfiles.length,
      router,
      showSwipeFeedback,
      swipeLeft,
      swipeRight,
      userId,
    ],
  );

  const feedbackAnimatedStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.value,
    transform: [{ scale: feedbackScale.value }],
  }));

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTitleContainer} pointerEvents="none">
        <Text
          style={[
            styles.headerTitle,
            { color: theme.headerTitle ?? theme.textPrimary },
          ]}
        >
          Dành cho bạn
        </Text>
      </View>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push("/(tabs)/profile")}
          accessibilityLabel="Open profile"
        >
          <Ionicons
            name="person-circle-outline"
            size={25}
            color={theme.headerIcon ?? theme.textPrimary}
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => router.push("/filters")}
        accessibilityLabel="Open filters"
      >
        <Ionicons name="options-outline" size={22} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderCard = () => {
    if (isLoadingProfiles) {
      return (
        <View style={styles.emptyCard}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.emptyTitle}>Finding recommendations...</Text>
          <Text style={styles.emptySubtitle}>
            Matching your profile and preferences
          </Text>
        </View>
      );
    }

    if (profileLoadError) {
      return (
        <View style={styles.emptyCard}>
          <Ionicons
            name="cloud-offline-outline"
            size={52}
            color={theme.error}
          />
          <Text style={styles.emptyTitle}>Unable to load recommendations</Text>
          <Text style={styles.emptySubtitle}>{profileLoadError}</Text>
          <TouchableOpacity
            style={[styles.reloadBtn, { backgroundColor: theme.primary }]}
            onPress={handleRefresh}
          >
            <Ionicons
              name="reload"
              size={16}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.reloadBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!currentProfile || isLastCard || candidateProfiles.length === 0) {
      return (
        <View style={styles.emptyCard}>
          <Ionicons
            name="sparkles-outline"
            size={64}
            color={theme.primary}
          />
          <Text style={styles.emptyTitle}>You&apos;re all caught up!</Text>
          <Text style={styles.emptySubtitle}>
            No more profiles right now. Check back soon or expand your filters to
            meet more people.
          </Text>
          <View style={styles.emptyActionsRow}>
            <TouchableOpacity
              style={[styles.filterActionBtn, { borderColor: theme.primary }]}
              onPress={() => router.push("/filters")}
            >
              <Ionicons
                name="options-outline"
                size={16}
                color={theme.primary}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.filterActionText, { color: theme.primary }]}>
                Adjust filters
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reloadBtn, { backgroundColor: theme.primary }]}
              onPress={handleRefresh}
            >
              <Ionicons
                name="reload"
                size={16}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.reloadBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.cardStackWrapper}>
        {/* Next Card underneath (Pre-rendered and decoded in Deck Stack) */}
        {nextProfile ? (
          <SwipeCard
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
          <SwipeCard
            key={currentProfile.userId}
            profile={currentProfile}
            cardIndex={currentIndex}
            isTop={true}
            activeIndexSV={activeIndexSV}
            onSwipeComplete={completeSwipe}
            swipeProgress={swipeProgress}
            onPressInfo={() =>
              router.push({
                pathname: "/profile-detail",
                params: {
                  userId: currentProfile.userId,
                  name: currentProfile.name,
                  age: String(currentProfile.age),
                  occupation: currentProfile.occupation,
                  city: currentProfile.city ?? "",
                  ward: currentProfile.ward ?? "",
                  distance_km:
                    currentProfile.distanceKm !== null &&
                    currentProfile.distanceKm !== undefined
                      ? String(currentProfile.distanceKm)
                      : "",
                  bio: currentProfile.bio ?? "",
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
      edges={["top"]}
    >
      {renderHeader()}
      {swipeFeedback ? (
        <Animated.View style={[styles.swipeFeedback, feedbackAnimatedStyle]}>
          <Ionicons name="sparkles" size={16} color={colors.primary} />
          <Text style={styles.swipeFeedbackText}>{swipeFeedback}</Text>
        </Animated.View>
      ) : null}
      <View style={styles.cardContainer}>{renderCard()}</View>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    position: "relative",
  },
  headerTitleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  headerButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: spacing.base,
    paddingBottom: 84,
  },
  cardStackWrapper: {
    flex: 1,
    position: "relative",
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
    overflow: "hidden",
    backgroundColor: "#18181B",
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    userSelect: "none",
  },
  cardImage: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
  },
  cardInfo: {
    position: "absolute",
    bottom: 84,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    zIndex: 20,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardName: {
    ...typography.h2,
    color: colors.white,
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  verifiedBadge: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
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
    fontWeight: "600",
  },
  distanceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  distanceText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  locationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  locationText: {
    ...typography.caption,
    color: colors.white,
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  occupationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  occupationText: {
    ...typography.bodySmall,
    color: colors.white,
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hobbiesPreviewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: 4,
  },
  hobbyPreviewChip: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  hobbyPreviewText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.white,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionButtons: {
    position: "absolute",
    bottom: spacing.lg,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xxl,
    zIndex: 25,
  },
  actionButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
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
  likeSwipeOverlay: {
    position: "absolute",
    top: 32,
    left: 32,
    zIndex: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  passSwipeOverlay: {
    position: "absolute",
    top: 32,
    right: 32,
    zIndex: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingSwipeIcon: {
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  emptyCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: "center",
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  filterActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
  filterActionText: {
    ...typography.captionBold,
  },
  reloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  reloadBtnText: {
    ...typography.captionBold,
    color: colors.white,
  },
  swipeFeedback: {
    position: "absolute",
    top: 86,
    alignSelf: "center",
    zIndex: 35,
    flexDirection: "row",
    alignItems: "center",
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
