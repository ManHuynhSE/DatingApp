import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors, darkColors, borderRadius, spacing, typography, getGenderBadgeColor } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useLikesStore } from '@/store/likesStore';
import { HOBBY_EMOJIS } from '@/data/hobbies';
import type { LikedUserItem } from '@/types/likedUser';

interface LikesCardProps {
  profile: LikedUserItem;
  theme: typeof colors;
  styles: ReturnType<typeof createStyles>;
  onOpenProfile: () => void;
}

function LikesCard({ profile, theme, styles, onOpenProfile }: LikesCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);

  const photos = useMemo(() => {
    if (profile.photos && profile.photos.length > 0) {
      return profile.photos;
    }
    return [profile.photo];
  }, [profile]);

  const handleNextPhoto = () => {
    if (photos.length <= 1) return;
    setPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const handlePrevPhoto = () => {
    if (photos.length <= 1) return;
    setPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const validHobbies = (profile.hobbies || [])
    .filter((h) => typeof h?.name === 'string' && h.name.trim().length > 0)
    .slice(0, 4);

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.card}>
      {/* Hero Image */}
      <Image
        source={{ uri: photos[photoIndex] || profile.photo }}
        style={styles.cardImage}
        resizeMode="cover"
      />

      {/* Segmented Photo Progress Bar */}
      {photos.length > 1 && (
        <View style={styles.photoIndicators}>
          {photos.map((_, idx) => (
            <View
              key={`photo-bar-${idx}`}
              style={[
                styles.photoIndicatorBar,
                idx === photoIndex && styles.photoIndicatorBarActive,
              ]}
            />
          ))}
        </View>
      )}

      {/* Touch zones for photo flipping */}
      {photos.length > 1 && (
        <View style={styles.photoTapOverlay} pointerEvents="box-none">
          <Pressable
            style={styles.photoTapLeft}
            onPress={handlePrevPhoto}
            accessibilityLabel="Previous photo"
          />
          <Pressable
            style={styles.photoTapRight}
            onPress={handleNextPhoto}
            accessibilityLabel="Next photo"
          />
        </View>
      )}

      {/* Gradient Overlay for Text Readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.88)']}
        style={styles.cardGradient}
        pointerEvents="none"
      />

      {/* Profile Info Container (Pressable to view full profile details) */}
      <Pressable
        style={styles.cardInfo}
        onPress={onOpenProfile}
        accessibilityRole="button"
        accessibilityLabel={`View full profile of ${profile.name}`}
      >
        <View style={styles.nameRow}>
          <Text style={styles.cardName}>
            {profile.name}
            {profile.age ? `, ${profile.age}` : ''}
          </Text>
          {profile.is_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#4A90D9" />
            </View>
          )}
        </View>

        {/* Tags Row */}
        <View style={styles.tagsRow}>
          {profile.pronouns && (
            <View
              style={[
                styles.pronounsChip,
                {
                  backgroundColor: getGenderBadgeColor(
                    profile.gender,
                    profile.pronouns,
                    theme.primary,
                  ),
                },
              ]}
            >
              <Text style={styles.pronounsText}>{profile.pronouns}</Text>
            </View>
          )}

          {profile.distanceText ? (
            <View style={styles.chip}>
              <Ionicons name="navigate-outline" size={12} color="#FFFFFF" />
              <Text style={styles.chipText}>{profile.distanceText}</Text>
            </View>
          ) : null}

          {profile.city ? (
            <View style={styles.chip}>
              <Ionicons name="location-sharp" size={12} color="#FFFFFF" />
              <Text style={styles.chipText} numberOfLines={1}>
                {profile.city}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Occupation Row */}
        {profile.job_title ? (
          <View style={styles.occupationRow}>
            <Ionicons name="briefcase-outline" size={14} color="#FFFFFF" />
            <Text style={styles.occupationText} numberOfLines={1}>
              {profile.job_title}
            </Text>
          </View>
        ) : null}

        {/* Hobbies Preview */}
        {validHobbies.length > 0 && (
          <View style={styles.hobbiesPreviewRow}>
            {validHobbies.map((hobby, index) => (
              <View
                key={hobby.id || `hobby-chip-${index}`}
                style={styles.hobbyPreviewChip}
              >
                <Text style={styles.hobbyPreviewText}>
                  {HOBBY_EMOJIS[hobby.name] ? `${HOBBY_EMOJIS[hobby.name]} ` : ''}
                  {hobby.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Tap to view full profile prompt */}
        <View style={styles.viewProfilePrompt}>
          <Text style={styles.viewProfilePromptText}>Tap to view full profile</Text>
          <Ionicons name="chevron-up" size={14} color="rgba(255,255,255,0.7)" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function LikesReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    userId?: string;
    initialIndex?: string;
  }>();

  const currentUserId = useAuthStore((state) => state.user?.id);
  const currentUserPhoto = useAuthStore((state) => state.user?.photos?.[0]);
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === 'dark' ? darkColors : colors;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const likedUsers = useLikesStore((state) => state.likedUsers);
  const loading = useLikesStore((state) => state.loading);
  const passLikedUser = useLikesStore((state) => state.passLikedUser);
  const likeLikedUser = useLikesStore((state) => state.likeLikedUser);
  const fetchLikedUsers = useLikesStore((state) => state.fetchLikedUsers);

  // Derive initial index based on params
  const computedIndex = useMemo(() => {
    if (params.userId && likedUsers.length > 0) {
      const idx = likedUsers.findIndex((u) => u.userId === params.userId);
      if (idx !== -1) return idx;
    }
    if (params.initialIndex) {
      const parsed = parseInt(params.initialIndex, 10);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed < likedUsers.length) {
        return parsed;
      }
    }
    return 0;
  }, [params.userId, params.initialIndex, likedUsers]);

  const [currentIndex, setCurrentIndex] = useState(computedIndex);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (likedUsers.length === 0) {
      void fetchLikedUsers(currentUserId);
    }
  }, [likedUsers.length, fetchLikedUsers, currentUserId]);

  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, likedUsers.length - 1));
  const currentProfile: LikedUserItem | undefined = likedUsers[safeIndex];

  const openFullProfile = () => {
    if (!currentProfile) return;
    router.push({
      pathname: '/profile-detail',
      params: {
        userId: currentProfile.userId,
        source: 'likes',
        distance_km: currentProfile.distance_km != null ? String(currentProfile.distance_km) : '',
      },
    });
  };

  const handlePass = async () => {
    if (!currentProfile || isSubmitting) return;
    setIsSubmitting(true);
    const targetUserId = currentProfile.userId;

    try {
      await passLikedUser(currentUserId, targetUserId);
      if (safeIndex >= likedUsers.length - 1) {
        setCurrentIndex(Math.max(0, likedUsers.length - 2));
      }
    } catch {
      Alert.alert('Error', 'Could not pass profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async () => {
    if (!currentProfile || isSubmitting) return;
    setIsSubmitting(true);
    const targetUserId = currentProfile.userId;
    const targetName = currentProfile.name;
    const targetPhoto = currentProfile.photo;

    try {
      const result = await likeLikedUser(currentUserId, targetUserId);

      if (result.isMatch) {
        router.push({
          pathname: '/match-found',
          params: {
            matchedUserId: targetUserId,
            matchedName: targetName,
            matchedPhoto: targetPhoto,
            userPhoto: currentUserPhoto || '',
          },
        });
        return;
      }

      if (safeIndex >= likedUsers.length - 1) {
        setCurrentIndex(Math.max(0, likedUsers.length - 2));
      }
    } catch {
      Alert.alert('Error', 'Could not like profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="heart" size={18} color="#EF4444" />
            <Text style={styles.headerTitle}>Liked You</Text>
          </View>
          {likedUsers.length > 0 && currentProfile && (
            <Text style={styles.headerSubtitle}>
              {safeIndex + 1} of {likedUsers.length}
            </Text>
          )}
        </View>

        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Content Area */}
      {loading && likedUsers.length === 0 ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading profiles who liked you…</Text>
        </View>
      ) : !currentProfile ? (
        <Animated.View entering={FadeIn} style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="sparkles" size={44} color={theme.primary} />
          </View>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySubtitle}>
            You’ve reviewed everyone who liked your photos for now. Check back soon or explore more profiles.
          </Text>

          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/(tabs)/swipe')}
          >
            <Text style={styles.exploreButtonText}>Explore New People</Text>
            <Ionicons name="flame" size={18} color={theme.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Return to Matches</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <View style={styles.cardContainer}>
          {/* Main Profile Card (Swipe-screen styled card without drag) */}
          <LikesCard
            key={currentProfile.userId}
            profile={currentProfile}
            theme={theme}
            styles={styles}
            onOpenProfile={openFullProfile}
          />

          {/* Action Buttons: Pass (Fail) & Like */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.actionButtons}>
            {/* Pass / Fail Button */}
            <View style={styles.actionBtnWrap}>
              <TouchableOpacity
                style={[styles.actionButton, styles.passButton]}
                onPress={handlePass}
                disabled={isSubmitting}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Pass"
              >
                <Ionicons name="close" size={32} color="#EF4444" />
              </TouchableOpacity>
              <Text style={styles.actionBtnLabel}>Pass</Text>
            </View>

            {/* Like / Match Button */}
            <View style={styles.actionBtnWrap}>
              <TouchableOpacity
                style={[styles.actionButton, styles.likeButton]}
                onPress={handleLike}
                disabled={isSubmitting}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Like back"
              >
                <Ionicons name="heart" size={30} color="#10B981" />
              </TouchableOpacity>
              <Text style={styles.actionBtnLabel}>Like</Text>
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.base,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    headerTitle: {
      ...typography.h3,
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    headerSubtitle: {
      ...typography.caption,
      color: theme.textSecondary,
      marginTop: 1,
    },
    headerRightPlaceholder: {
      width: 40,
    },
    cardContainer: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      justifyContent: 'space-between',
    },
    card: {
      flex: 1,
      borderRadius: borderRadius.xl ?? 24,
      overflow: 'hidden',
      backgroundColor: '#18181B',
      position: 'relative',
      elevation: 6,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 10,
    },
    cardImage: {
      ...StyleSheet.absoluteFill,
      width: '100%',
      height: '100%',
    },
    photoIndicators: {
      position: 'absolute',
      top: spacing.sm,
      left: spacing.md,
      right: spacing.md,
      flexDirection: 'row',
      gap: 5,
      zIndex: 10,
    },
    photoIndicatorBar: {
      flex: 1,
      height: 3.5,
      borderRadius: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    photoIndicatorBarActive: {
      backgroundColor: '#FFFFFF',
    },
    photoTapOverlay: {
      position: 'absolute',
      top: 40,
      left: 0,
      right: 0,
      bottom: 120,
      flexDirection: 'row',
      zIndex: 5,
    },
    photoTapLeft: {
      flex: 1,
      height: '100%',
    },
    photoTapRight: {
      flex: 1,
      height: '100%',
    },
    cardGradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 280,
    },
    cardInfo: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      zIndex: 20,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: 6,
    },
    cardName: {
      ...typography.h2,
      fontSize: 26,
      fontWeight: '700',
      color: '#FFFFFF',
      textShadowColor: 'rgba(0,0,0,0.85)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    verifiedBadge: {
      backgroundColor: '#FFFFFF',
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
      marginBottom: 6,
    },
    pronounsChip: {
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    pronounsText: {
      ...typography.caption,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    chipText: {
      ...typography.caption,
      color: '#FFFFFF',
      fontWeight: '600',
      textShadowColor: 'rgba(0,0,0,0.85)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    occupationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: 6,
    },
    occupationText: {
      ...typography.bodySmall,
      color: '#FFFFFF',
      textShadowColor: 'rgba(0,0,0,0.85)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    hobbiesPreviewRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: 2,
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
      color: '#FFFFFF',
      fontWeight: '600',
      textShadowColor: 'rgba(0, 0, 0, 0.6)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    viewProfilePrompt: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      marginTop: spacing.sm,
      paddingTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    viewProfilePromptText: {
      ...typography.caption,
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.75)',
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 48,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
    },
    actionBtnWrap: {
      alignItems: 'center',
      gap: 6,
    },
    actionButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: theme.border,
      elevation: 5,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.16,
      shadowRadius: 6,
    },
    passButton: {
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    likeButton: {
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    actionBtnLabel: {
      ...typography.captionBold,
      color: theme.textSecondary,
    },
    centerState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    loadingText: {
      ...typography.bodySmall,
      color: theme.textSecondary,
      marginTop: spacing.md,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    emptyIconCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: theme.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      ...typography.h2,
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    emptySubtitle: {
      ...typography.bodySmall,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: 290,
      marginBottom: spacing.xl,
    },
    exploreButton: {
      minHeight: 48,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.full,
      backgroundColor: theme.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      width: '100%',
      maxWidth: 260,
    },
    exploreButtonText: {
      ...typography.bodyBold,
      color: theme.white,
    },
    backButton: {
      minHeight: 44,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.md,
    },
    backButtonText: {
      ...typography.bodySmall,
      color: theme.textSecondary,
      fontWeight: '600',
    },
  });
