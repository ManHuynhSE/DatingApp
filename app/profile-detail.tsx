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
  const params = useLocalSearchParams<{
    userId?: string | string[];
    source?: string | string[];
  }>();
  const routeUserId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const source = Array.isArray(params.source) ? params.source[0] : params.source;
  const currentUserId = useAuthStore((state) => state.user?.id);
  const userId = routeUserId || currentUserId;
  const [profile, setProfile] = useState<DatingProfile | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = Boolean(userId) && loadedUserId !== userId;
  const isOwnProfile = Boolean(userId && userId === currentUserId);
  const isMatchedProfile = source === 'matches';
  const hideProfileActions = isOwnProfile || isMatchedProfile;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    datingApi
      .getProfileByUserId(userId, true, true)
      .then((response) => {
        if (!active) return;
        setError(null);
        if (!response.success || !response.data) {
          throw new Error('Profile not found');
        }
        setProfile(response.data);
      })
      .catch((err) => {
        if (active) {
          setProfile(null);
          setError(err instanceof Error ? err.message : 'Failed to load profile');
        }
      })
      .finally(() => {
        if (active) setLoadedUserId(userId);
      });
    return () => {
      active = false;
    };
  }, [userId]);

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
          <Text style={styles.errorText}>
            {error || (userId ? 'Profile not found' : 'Sign in to view a profile')}
          </Text>
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
  const selectedPets = profile.pets ?? [];
  const selectedLifestyle = profile.life_style ?? [];
  const selectedLanguages = profile.languages ?? [];
  const hasProfileDetails = Boolean(
    profile.job_title || profile.education || profile.height_cm
      || selectedPets.length || selectedLifestyle.length || selectedLanguages.length,
  );
  const renderChoice = (label: string) => (
    <View key={label} style={styles.choiceChip}>
      <Text style={styles.choiceChipText}>{label}</Text>
    </View>
  );
  const renderScalarChoice = (value: string | null | undefined) => {
    if (value) return renderChoice(value);
    return isOwnProfile ? <Text style={styles.emptyDetail}>Not added yet</Text> : null;
  };

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
              {[profile.ward, profile.city].filter(Boolean).join(', ') || 'Location not shared'}
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

        {/* Profile details */}
        {(hasProfileDetails || isOwnProfile) && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profile details</Text>
              <View style={styles.detailPanel}>
                {(profile.job_title || isOwnProfile) && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Occupation</Text>
                    <View style={styles.choiceList}>{renderScalarChoice(profile.job_title)}</View>
                  </View>
                )}

                {(profile.education || isOwnProfile) && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Education</Text>
                    <View style={styles.choiceList}>{renderScalarChoice(profile.education)}</View>
                  </View>
                )}

                {(profile.height_cm || isOwnProfile) && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Height</Text>
                    <View style={styles.choiceList}>
                      {renderScalarChoice(profile.height_cm ? `${profile.height_cm} cm` : null)}
                    </View>
                  </View>
                )}

                {(selectedPets.length > 0 || isOwnProfile) && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Pets</Text>
                    <View style={styles.choiceList}>
                      {selectedPets.length
                        ? selectedPets.map(renderChoice)
                        : <Text style={styles.emptyDetail}>Not added yet</Text>}
                    </View>
                  </View>
                )}

                {(selectedLifestyle.length > 0 || isOwnProfile) && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Lifestyle</Text>
                    <View style={styles.choiceList}>
                      {selectedLifestyle.length
                        ? selectedLifestyle.map(renderChoice)
                        : <Text style={styles.emptyDetail}>Not added yet</Text>}
                    </View>
                  </View>
                )}

                {(selectedLanguages.length > 0 || isOwnProfile) && (
                  <View style={[styles.fieldGroup, styles.fieldGroupLast]}>
                    <Text style={styles.fieldLabel}>Languages</Text>
                    <View style={styles.choiceList}>
                      {selectedLanguages.length
                        ? selectedLanguages.map(renderChoice)
                        : <Text style={styles.emptyDetail}>Not added yet</Text>}
                    </View>
                  </View>
                )}
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
        {!hideProfileActions && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.passButton} onPress={() => router.back()}>
              <Ionicons name="close" size={32} color={colors.error} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.likeButton} onPress={() => router.push('/match-found')}>
              <Ionicons name="checkmark" size={32} color={colors.success} />
            </TouchableOpacity>
          </View>
        )}

        {/* Hide and Report */}
        {!hideProfileActions && (
          <TouchableOpacity style={styles.reportLink} onPress={() => Alert.alert('Hide and report', 'This profile has been hidden from your discovery list.')}>
            <Text style={styles.reportText}>Hide and Report Profile</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
  detailPanel: {
    padding: spacing.base,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#EEEAE4',
  },
  fieldGroup: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  fieldGroupLast: {
    marginBottom: 0,
  },
  fieldLabel: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  choiceList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  choiceChip: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E9E4DD',
    borderRadius: borderRadius.full,
  },
  choiceChipText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  emptyDetail: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textTertiary,
    fontStyle: 'italic',
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
