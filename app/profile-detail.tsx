import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '../src/theme';
import { datingApi, type DatingProfile } from '../src/api/datingClient';
import { useAuthStore } from '../src/store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_HEIGHT = SCREEN_WIDTH * 1.1;

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

export default function ProfileDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string; distance_km?: string }>();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [profile, setProfile] = useState<DatingProfile | null>(null);
  const [loading, setLoading] = useState(!!params.userId);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const handleLike = async () => {
    if (!profile || isSubmittingAction) return;
    setIsSubmittingAction(true);
    if (currentUserId) {
      try {
        const res = await datingApi.createSwipe(currentUserId, profile.user_id, 'like');
        if (res.isMatch) {
          router.replace({
            pathname: '/match-found',
            params: {
              matchedUserId: profile.user_id,
              matchedName: profile.display_name,
              matchedPhoto: photoUrls[0] || '',
            },
          });
          return;
        }
      } catch (err) {
        console.warn('Swipe like failed:', err);
      }
    }
    router.back();
  };

  const handlePass = async () => {
    if (!profile || isSubmittingAction) return;
    setIsSubmittingAction(true);
    if (currentUserId) {
      try {
        await datingApi.createSwipe(currentUserId, profile.user_id, 'pass');
      } catch (err) {
        console.warn('Swipe pass failed:', err);
      }
    }
    router.back();
  };

  useEffect(() => {
    if (params.userId) {
      datingApi
        .getProfileByUserId(params.userId, true, true)
        .then((response) => {
          if (response.success && response.data) {
            setProfile(response.data);
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load profile');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [params.userId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const photos = profile.users?.photos ?? [];
  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.position - b.position;
  });
  const photoUrls = sortedPhotos.map((p) => p.url);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Profile detail header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => Alert.alert('Profile menu', 'You can hide, report or block this profile here.')}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Hero Photo */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: photoUrls[0] || 'https://picsum.photos/seed/profile/700/900' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          {/* Overlay info */}
          <View style={styles.heroOverlay}>
            <View style={styles.nameRow}>
              <Text style={styles.heroName}>
                {profile.display_name}, {calculateAge(profile.birth_date)}
              </Text>
              {profile.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={12} color={colors.white} />
                </View>
              )}
            </View>
            <View style={styles.pronounsChip}>
              <Text style={styles.pronounsText}>
                {profile.gender === 'female'
                  ? 'She/Her'
                  : profile.gender === 'male'
                    ? 'He/Him'
                    : profile.gender}
              </Text>
            </View>
            <Text style={styles.occupation}>{profile.job_title || 'Open to meeting someone new'}</Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={styles.locationDistance}>
              {(() => {
                const distanceKmVal =
                  profile.distance_km ??
                  (params.distance_km ? Number(params.distance_km) : null);
                const distanceLabel =
                  distanceKmVal !== null && distanceKmVal !== undefined
                    ? distanceKmVal < 1
                      ? '< 1 km away'
                      : `${distanceKmVal} km away`
                    : null;
                const locationString = [profile.ward, profile.city]
                  .filter(Boolean)
                  .join(', ');
                return (
                  [distanceLabel, locationString].filter(Boolean).join(' · ') ||
                  'Location not shared'
                );
              })()}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* About me */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About me</Text>
          <Text style={styles.bioText}>{profile.bio || 'No bio provided yet'}</Text>
        </View>

        <View style={styles.divider} />

        {/* My details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My details</Text>
          <View style={styles.chipsContainer}>
            {profile.height_cm && (
              <View style={styles.detailChip}>
                <Ionicons name="resize-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailChipText}>{profile.height_cm}cm</Text>
              </View>
            )}
            {profile.education ? (
              <View style={styles.detailChip}>
                <Ionicons name="school-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailChipText}>{profile.education}</Text>
              </View>
            ) : null}
            {profile.pet ? (
              <View style={styles.detailChip}>
                <Ionicons name="paw-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailChipText}>{profile.pet}</Text>
              </View>
            ) : null}
            {profile.life_style && profile.life_style.length > 0 ? (
              <View style={styles.detailChip}>
                <Ionicons name="barbell-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailChipText}>{profile.life_style.join(', ')}</Text>
              </View>
            ) : null}
            {profile.languages && profile.languages.length > 0 && (
              <View style={styles.detailChip}>
                <Ionicons name="language-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailChipText}>{profile.languages.join(', ')}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Hobbies / Interests */}
        {profile.hobbies && profile.hobbies.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My interests</Text>
              <View style={styles.chipsContainer}>
                {profile.hobbies.map((hobby) => (
                  <View key={hobby.id} style={styles.languageChip}>
                    <Text style={styles.languageChipText}>{hobby.name}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.divider} />
          </>
        )}

        <View style={styles.divider} />

        {/* I communicate in */}
        {profile.languages && profile.languages.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>I communicate in</Text>
              <View style={styles.chipsContainer}>
                {profile.languages.map((lang, i) => (
                  <View key={i} style={styles.languageChip}>
                    <Text style={styles.languageChipText}>{lang}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* Photo gallery */}
        {photoUrls.length > 1 && (
          <View style={styles.section}>
            <View style={styles.photoGrid}>
              {photoUrls.slice(1).map((photo, i) => (
                <Image
                  key={i}
                  source={{ uri: photo }}
                  style={styles.galleryPhoto}
                  resizeMode="cover"
                />
              ))}
            </View>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.passButton}
            onPress={handlePass}
            disabled={isSubmittingAction}
          >
            <Ionicons name="close" size={32} color={colors.error} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={handleLike}
            disabled={isSubmittingAction}
          >
            <Ionicons name="checkmark" size={32} color={colors.success} />
          </TouchableOpacity>
        </View>

        {/* Hide and Report */}
        <TouchableOpacity style={styles.reportLink} onPress={() => Alert.alert('Hide and report', 'This profile has been hidden from your discovery list.')}>
          <Text style={styles.reportText}>Hide and Report Profile</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.textPrimary,
  },
  errorText: {
    fontSize: typography.body.fontSize,
    color: colors.error,
    textAlign: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: 4,
    marginBottom: spacing.sm,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xxxl,
    // Gradient-like effect with semi-transparent background
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  heroName: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    color: colors.white,
    marginRight: spacing.sm,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pronounsChip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  pronounsText: {
    fontSize: typography.caption.fontSize,
    color: colors.white,
  },
  occupation: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.white,
    opacity: 0.9,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  locationDistance: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  locationCity: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginLeft: spacing.xl + 2,
  },
  bioText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailChipText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  interestChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  interestChipText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.primary,
    fontWeight: '500',
  },
  languageChip: {
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  languageChipText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.secondary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  galleryPhoto: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2,
    height: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2 * 1.2,
    borderRadius: borderRadius.md,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxl,
    paddingVertical: spacing.xl,
  },
  passButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.error,
    ...shadows.md,
  },
  likeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.success,
    ...shadows.md,
  },
  reportLink: {
    alignItems: 'center',
    paddingVertical: spacing.base,
  },
  reportText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textTertiary,
    textDecorationLine: 'underline',
  },
});
