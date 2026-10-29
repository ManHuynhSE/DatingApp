import React, {
  useEffect,
  useLayoutEffect,
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
} from "@/theme";
import { discoveryProfiles } from "@/data/mockData";
import { useDiscoveryStore } from "@/store/discoveryStore";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";
import { datingApi, type DatingProfile, type Hobby } from "@/api/datingClient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = Math.min(Math.max(SCREEN_WIDTH * 0.25, 90), 140);

interface ProfileCard {
  id: string;
  name: string;
  age: number;
  pronouns: string;
  gender: string;
  occupation: string;
  distance: string;
  city?: string;
  ward?: string;
  languages: string[];
  hobbies?: Hobby[];
  verified: boolean;
  image: string;
  photos?: string[];
  bio?: string;
  isIntro?: boolean;
}

const mapProfile = (
  profile: (typeof discoveryProfiles)[number],
): ProfileCard => ({
  id: profile.id,
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
  distance: profile.distance,
  city: profile.location,
  languages: profile.languages,
  verified: profile.verified,
  image: profile.photos[0],
  photos: profile.photos,
  bio: profile.aboutMe,
});

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

const mapDatingProfile = (profile: DatingProfile): ProfileCard => {
  const photos = profile.users?.photos ?? [];
  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.position - b.position;
  });
  const primaryPhoto = sortedPhotos[0]?.url;

  return {
    id: profile.user_id,
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
    distance: [profile.ward, profile.city].filter(Boolean).join(", "),
    city: profile.city ?? undefined,
    ward: profile.ward ?? undefined,
    languages: profile.languages ?? [],
    hobbies: profile.hobbies ?? [],
    verified: profile.is_verified,
    image: primaryPhoto ?? "https://picsum.photos/seed/empty-discovery/700/900",
    photos: sortedPhotos.map((p) => p.url),
    bio: profile.bio ?? undefined,
  };
};

const PROGRESS_SEGMENTS = 10;

export default function DiscoveryScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeFeedback, setSwipeFeedback] = useState("");
  const [remoteProfiles, setRemoteProfiles] = useState<ProfileCard[] | null>(
    null,
  );
  const [recommendationSessionId, setRecommendationSessionId] = useState<string | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [laidOutProfileKey, setLaidOutProfileKey] = useState<string | null>(null);
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === "active");
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const nextRecommendationCursorRef = useRef<string | null>(null);
  const loadingMoreRecommendationsRef = useRef(false);
  const recordedImpressionKeysRef = useRef(new Set<string>());
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isSwiping = useSharedValue(false);
  const cardEntrance = useSharedValue(1);
  const feedbackOpacity = useSharedValue(0);
  const feedbackScale = useSharedValue(0.86);
  const likeScaleBoost = useSharedValue(1);
  const passScaleBoost = useSharedValue(1);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filters = useDiscoveryStore((state) => state.filters);
  const swipeRight = useDiscoveryStore((state) => state.swipeRight);
  const swipeLeft = useDiscoveryStore((state) => state.swipeLeft);
  const undoSwipe = useDiscoveryStore((state) => state.undoSwipe);
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === "dark" ? darkColors : colors;
  const styles = resolveThemeStyles(baseStyles, theme);
  const currentUser = useAuthStore((state) => state.user);
  const userId = currentUser?.id;
  const isScreenFocused = useIsFocused();

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setIsAppActive(state === "active");
    });
    return () => subscription.remove();
  }, []);

  const loadFirstRecommendationPage = useCallback(async () => {
    setIsLoadingProfiles(true);
    setProfileLoadError(null);
    setCurrentIndex(0);
    setRecommendationSessionId(null);
    nextRecommendationCursorRef.current = null;
    recordedImpressionKeysRef.current = new Set();

    if (!userId) {
      setRemoteProfiles(null);
      setIsLoadingProfiles(false);
      return;
    }

    try {
      const response = await datingApi.getRecommendations(userId, { limit: 50 });
      setRemoteProfiles(response.data.map(mapDatingProfile));
      setRecommendationSessionId(response.pagination.sessionId);
      nextRecommendationCursorRef.current = response.pagination.nextCursor;
    } catch (error: unknown) {
      setProfileLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load recommendations from server",
      );
      setRemoteProfiles([]);
    } finally {
      setIsLoadingProfiles(false);
    }
  }, [userId]);

  const handleRefresh = () => {
    void loadFirstRecommendationPage();
  };

  const loadMoreRecommendations = useCallback(async () => {
    const cursor = nextRecommendationCursorRef.current;
    if (!userId || !cursor || loadingMoreRecommendationsRef.current) return;
    loadingMoreRecommendationsRef.current = true;
    try {
      const response = await datingApi.getRecommendations(userId, {
        limit: 50,
        cursor,
      });
      setRemoteProfiles((current) => {
        const existingIds = new Set(current?.map((profile) => profile.id) ?? []);
        const nextProfiles = response.data
          .map(mapDatingProfile)
          .filter((profile) => !existingIds.has(profile.id));
        return [...(current ?? []), ...nextProfiles];
      });
      setRecommendationSessionId(response.pagination.sessionId);
      nextRecommendationCursorRef.current = response.pagination.nextCursor;
    } catch (error: unknown) {
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
  }, [remoteProfiles?.length, userId]);

  useEffect(() => {
    let active = true;

    // Load user's own profile data
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

            // Update auth store with real profile data
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
              location: [profile.ward, profile.city].filter(Boolean).join(", ") || profile.city || "",
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
          // Silently fail - user profile data not critical
        });
    }

    const recommendationLoadTimer = setTimeout(() => {
      void loadFirstRecommendationPage();
    }, 0);

    return () => {
      active = false;
      clearTimeout(recommendationLoadTimer);
    };
  }, [loadFirstRecommendationPage, userId]);

  const filteredProfiles = useMemo(() => {
    const sourceProfiles =
      remoteProfiles !== null
        ? userId
          ? remoteProfiles.filter((p) => p.id !== userId)
          : remoteProfiles
        : discoveryProfiles.map(mapProfile);

    const profiles = sourceProfiles.filter((profile) => {
      const distance = Number.parseInt(profile.distance, 10);
      const genderMatches =
        filters.gender === "everyone" ||
        (filters.gender === "women" && profile.gender === "female") ||
        (filters.gender === "men" && profile.gender === "male");
      const ageMatches =
        profile.age >= filters.ageRange[0] &&
        profile.age <= filters.ageRange[1];
      const distanceMatches =
        Number.isNaN(distance) || distance <= filters.distance;
      const languageMatches =
        filters.languages.length === 0 ||
        filters.languages.some((language) =>
          profile.languages.includes(language),
        );
      return genderMatches && ageMatches && distanceMatches && languageMatches;
    });
    return profiles;
  }, [filters, remoteProfiles, userId]);

  useEffect(() => {
    if (remoteProfiles !== null && currentIndex >= filteredProfiles.length - 3) {
      void loadMoreRecommendations();
    }
  }, [currentIndex, filteredProfiles.length, loadMoreRecommendations, remoteProfiles]);

  const activeIndex = currentIndex < filteredProfiles.length ? currentIndex : 0;
  const currentProfile = filteredProfiles[currentIndex];
  const isLastCard = currentIndex >= filteredProfiles.length;
  const currentProfileRef = useRef<ProfileCard | undefined>(currentProfile);
  currentProfileRef.current = currentProfile;

  const visibleProfileKey =
    recommendationSessionId && currentProfile
      ? `${recommendationSessionId}:${currentProfile.id}`
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
    const key = `${recommendationSessionId}:${currentProfile.id}`;
    if (recordedImpressionKeysRef.current.has(key)) return undefined;

    // Count a card after it remains laid out, focused, and foregrounded briefly.
    const timer = setTimeout(() => {
      if (
        AppState.currentState !== "active" ||
        currentProfileRef.current?.id !== currentProfile.id
      ) {
        return;
      }
      recordedImpressionKeysRef.current.add(key);
      datingApi
        .recordRecommendationImpressions(userId, recommendationSessionId, [currentProfile.id])
        .catch(() => recordedImpressionKeysRef.current.delete(key));
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

  useLayoutEffect(() => {
    translateX.set(0);
    translateY.set(0);
    likeScaleBoost.set(1);
    passScaleBoost.set(1);
    cardEntrance.set(0);
    cardEntrance.set(
      withSpring(1, {
        damping: 16,
        stiffness: 150,
      }),
    );
    isSwiping.set(false);
  }, [
    currentIndex,
    cardEntrance,
    isSwiping,
    likeScaleBoost,
    passScaleBoost,
    translateX,
    translateY,
  ]);

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
      if (!profile) {
        isSwiping.set(false);
        return;
      }

      if (!profile.isIntro) {
        if (action === "like") {
          swipeRight(profile.id);
          if (userId) {
            datingApi
              .createSwipe(userId, profile.id, "like")
              .then((res) => {
                if (res.isMatch) {
                  showSwipeFeedback("It's a Match! 🎉");
                  setTimeout(() => {
                    router.push({
                      pathname: "/match-found",
                      params: {
                        matchedUserId: profile.id,
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
          swipeLeft(profile.id);
          if (userId) {
            datingApi
              .createSwipe(userId, profile.id, "pass")
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

      setCurrentIndex((prev) => Math.min(prev + 1, filteredProfiles.length));
    },
    [
      filteredProfiles.length,
      isSwiping,
      router,
      showSwipeFeedback,
      swipeLeft,
      swipeRight,
      userId,
    ],
  );

  const panGesture = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .activeOffsetY([-6, 6])
    .onUpdate((event) => {
      if (isSwiping.get()) return;
      translateX.set(event.translationX);
      translateY.set(event.translationY * 0.65);
    })
    .onEnd((event) => {
      if (isSwiping.get()) return;

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
        const targetX = SCREEN_WIDTH * 1.45;
        const ratio = targetX / Math.max(Math.abs(currentX), 1);
        const targetY =
          currentY * Math.min(ratio, 2) + event.velocityY * 0.08;

        translateX.set(
          withTiming(targetX, {
            duration: 260,
            easing: Easing.out(Easing.cubic),
          }),
        );
        translateY.set(
          withTiming(
            targetY,
            {
              duration: 260,
              easing: Easing.out(Easing.cubic),
            },
            (finished) => {
              if (finished) {
                runOnJS(completeSwipe)("like");
              }
            },
          ),
        );
      } else if (shouldPass) {
        isSwiping.set(true);
        const targetX = -SCREEN_WIDTH * 1.45;
        const ratio =
          Math.abs(targetX) / Math.max(Math.abs(currentX), 1);
        const targetY =
          currentY * Math.min(ratio, 2) + event.velocityY * 0.08;

        translateX.set(
          withTiming(targetX, {
            duration: 260,
            easing: Easing.out(Easing.cubic),
          }),
        );
        translateY.set(
          withTiming(
            targetY,
            {
              duration: 260,
              easing: Easing.out(Easing.cubic),
            },
            (finished) => {
              if (finished) {
                runOnJS(completeSwipe)("pass");
              }
            },
          ),
        );
      } else {
        translateX.set(
          withSpring(0, {
            damping: 16,
            stiffness: 180,
            mass: 0.8,
          }),
        );
        translateY.set(
          withSpring(0, {
            damping: 16,
            stiffness: 180,
            mass: 0.8,
          }),
        );
      }
    });

  const handleLike = () => {
    const profile = currentProfileRef.current;
    if (isSwiping.get() || !profile) return;
    isSwiping.set(true);
    likeScaleBoost.set(1.28);
    translateX.set(
      withTiming(
        SCREEN_WIDTH * 1.4,
        {
          duration: 340,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(completeSwipe)("like");
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
    const profile = currentProfileRef.current;
    if (isSwiping.get() || !profile) return;
    isSwiping.set(true);
    passScaleBoost.set(1.28);
    translateX.set(
      withTiming(
        -SCREEN_WIDTH * 1.4,
        {
          duration: 340,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(completeSwipe)("pass");
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

  const handleUndo = () => {
    if (currentIndex > 1) {
      undoSwipe();
      setCurrentIndex((prev) => prev - 1);
    }
  };

  useAnimatedReaction(
    () => translateX.value >= SWIPE_THRESHOLD,
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
    () => translateX.value <= -SWIPE_THRESHOLD,
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
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-12, 0, 12],
      Extrapolation.CLAMP,
    );
    const entranceY = interpolate(
      cardEntrance.value,
      [0, 1],
      [18, 0],
      Extrapolation.CLAMP,
    );
    const entranceScale = interpolate(
      cardEntrance.value,
      [0, 1],
      [0.96, 1],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + entranceY },
        { rotate: `${rotate}deg` },
        { scale: entranceScale },
      ],
    };
  });

  const feedbackAnimatedStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.value,
    transform: [{ scale: feedbackScale.value }],
  }));

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
          onPress={() => router.push("/(tabs)/profile")}
          accessibilityLabel="Open profile"
        >
          <Ionicons
            name="person-circle-outline"
            size={25}
            color={theme.headerIcon ?? theme.textPrimary}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={handleUndo}>
          <Ionicons
            name="arrow-undo-outline"
            size={22}
            color={theme.headerIcon ?? theme.textPrimary}
          />
        </TouchableOpacity>
      </View>
      <Text
        style={[
          styles.headerTitle,
          { color: theme.headerTitle ?? theme.textPrimary },
        ]}
      >
        HeartSync
      </Text>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => router.push("/filters")}
        accessibilityLabel="Open filters"
      >
        <Ionicons name="options-outline" size={22} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderIntroOverlay = () => (
    <View style={styles.introOverlay}>
      <View style={styles.introSection}>
        <View style={styles.introRow}>
          <View style={styles.introIconContainer}>
            <Ionicons
              name="arrow-forward-circle"
              size={32}
              color={colors.white}
            />
          </View>
          <View style={styles.introTextContainer}>
            <Text style={styles.introTitle}>Swipe right if you like</Text>
            <Text style={styles.introDescription}>
              Swipe right to express interest and potentially match with this
              person
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
    if (isLoadingProfiles) {
      return (
        <View style={styles.emptyCard}>
          <Ionicons name="sync-outline" size={52} color={theme.primary} />
          <Text style={styles.emptyTitle}>Loading profiles...</Text>
          <Text style={styles.emptySubtitle}>Finding people near you</Text>
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
          <Text style={styles.emptyTitle}>Unable to load profiles</Text>
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

    if (!currentProfile || isLastCard) {
      return (
        <View style={styles.emptyCard}>
          <Ionicons
            name="heart-dislike-outline"
            size={64}
            color={theme.textTertiary}
          />
          <Text style={styles.emptyTitle}>No more profiles</Text>
          <Text style={styles.emptySubtitle}>
            You&apos;ve seen all active profiles!
          </Text>
          <TouchableOpacity
            style={[styles.reloadBtn, { backgroundColor: theme.primary }]}
            onPress={() => {
              setCurrentIndex(0);
              handleRefresh();
            }}
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
      );
    }

    return (
      <GestureDetector gesture={panGesture}>
        <Animated.View
          key={currentProfile.id}
          onLayout={markCurrentProfileLaidOut}
          style={[styles.card, cardStyle]}
        >
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Image
              source={{ uri: currentProfile.image }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          </View>

          {/* Dynamic Reanimated Like / Pass icons (no background) */}
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

          {/* Gradient overlay for text */}
          <View style={styles.cardGradient} />

          {/* Intro overlay for first card */}
          {currentProfile.isIntro && renderIntroOverlay()}

          {/* Profile info */}
          <Pressable
            style={styles.cardInfo}
            onPress={() =>
              router.push({
                pathname: "/profile-detail",
                params: {
                  userId: currentProfile.id,
                  name: currentProfile.name,
                  age: String(currentProfile.age),
                  occupation: currentProfile.occupation,
                  city: currentProfile.city ?? "",
                  ward: currentProfile.ward ?? "",
                  bio: currentProfile.bio ?? "",
                  image: currentProfile.image,
                  verified: String(currentProfile.verified),
                },
              })
            }
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
              <Ionicons
                name="briefcase-outline"
                size={14}
                color={colors.white}
              />
              <Text style={styles.occupationText}>
                {currentProfile.occupation}
              </Text>
            </View>
          </Pressable>

          {/* Action buttons on card */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.passButton]}
              onPress={handlePass}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={28} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.likeButton]}
              onPress={handleLike}
              activeOpacity={0.8}
            >
              <Ionicons name="heart" size={26} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </GestureDetector>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      {renderHeader()}
      {renderProgressBar()}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
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
    ...typography.h3,
    color: colors.textPrimary,
  },
  progressContainer: {
    flexDirection: "row",
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
    overflow: "hidden",
    backgroundColor: colors.surface,
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
  cardGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "55%",
    // RN doesn't support CSS gradients; use layers instead
    backgroundColor: "transparent",
  },
  // Manual gradient layers for React Native
  cardInfo: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
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
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  verifiedBadge: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  pronounsChip: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  pronounsText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "500",
  },
  occupationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  occupationText: {
    ...typography.bodySmall,
    color: colors.white,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionButtons: {
    position: "absolute",
    bottom: spacing.xl,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xl,
  },
  actionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    zIndex: 10,
  },
  introSection: {
    paddingVertical: spacing.lg,
  },
  introRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
  },
  introIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
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
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  introDescription: {
    ...typography.bodySmall,
    color: "rgba(255,255,255,0.8)",
  },
  introDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  // Swipe overlays
  likeSwipeOverlay: {
    position: "absolute",
    top: 32,
    left: 32,
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  passSwipeOverlay: {
    position: "absolute",
    top: 32,
    right: 32,
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingSwipeIcon: {
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  // Empty state
  emptyCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
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
    position: "absolute",
    top: 86,
    alignSelf: "center",
    zIndex: 30,
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
  decisionOverlay: {
    position: "absolute",
    top: "38%",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 40,
  },
  decisionText: {
    marginTop: spacing.sm,
    fontSize: typography.h3.fontSize,
    fontWeight: "800",
    letterSpacing: 2,
    color: colors.white,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  reloadBtn: {
    marginTop: spacing.lg,
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
});
