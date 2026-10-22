import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_HEIGHT = SCREEN_WIDTH * 1.1;

const MOCK_PROFILE = {
  id: '1',
  name: 'Ava Jones',
  age: 25,
  verified: true,
  pronouns: 'she/her/hers',
  occupation: 'Business Analyst at Tech',
  distance: '2.0 kilometres away',
  location: 'Las Vegas, NV 89104',
  bio: 'I love exploring new restaurants and trying different cuisines. On weekends, you can find me hiking in the mountains or reading a good book at a cozy café. I believe in living life to the fullest and making meaningful connections along the way.',
  details: [
    { icon: 'resize-outline', label: '5\'6" 168cm' },
    { icon: 'ban-outline', label: 'Non-smoker' },
    { icon: 'paw-outline', label: 'Cat lover' },
    { icon: 'school-outline', label: 'Master degree' },
    { icon: 'people-outline', label: 'Want two' },
    { icon: 'wine-outline', label: 'Occasionally' },
    { icon: 'star-outline', label: 'Virgo' },
    { icon: 'heart-outline', label: 'Relationship/Friendship' },
    { icon: 'leaf-outline', label: 'No religious affiliation' },
  ],
  interests: [
    'Classical Music & Art',
    'Thriller Films',
    'Nature',
    'Baking',
    'Asian Food',
    'Mathematics & Technology',
  ],
  languages: [
    { name: 'English', level: 'Native' },
    { name: 'Spanish', level: 'Fluent' },
    { name: 'Tagalog', level: 'Verbal' },
    { name: 'Mandarin Chinese', level: 'Verbal' },
  ],
  photos: [
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
  ],
};

export default function ProfileDetailScreen() {
  const router = useRouter();
  const profile = MOCK_PROFILE;
  const [activeSegment] = useState(0);

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
            source={{ uri: profile.photos[0] }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          {/* Overlay info */}
          <View style={styles.heroOverlay}>
            <View style={styles.nameRow}>
              <Text style={styles.heroName}>
                {profile.name}, {profile.age}
              </Text>
              {profile.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={12} color={colors.white} />
                </View>
              )}
            </View>
            <View style={styles.pronounsChip}>
              <Text style={styles.pronounsText}>{profile.pronouns}</Text>
            </View>
            <Text style={styles.occupation}>{profile.occupation}</Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={styles.locationDistance}>{profile.distance}</Text>
          </View>
          <Text style={styles.locationCity}>{profile.location}</Text>
        </View>

        <View style={styles.divider} />

        {/* About me */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About me</Text>
          <Text style={styles.bioText}>{profile.bio}</Text>
        </View>

        <View style={styles.divider} />

        {/* My details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My details</Text>
          <View style={styles.chipsContainer}>
            {profile.details.map((detail, i) => (
              <View key={i} style={styles.detailChip}>
                <Ionicons
                  name={detail.icon as any}
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.detailChipText}>{detail.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* I enjoy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I enjoy</Text>
          <View style={styles.chipsContainer}>
            {profile.interests.map((interest, i) => (
              <View key={i} style={styles.interestChip}>
                <Text style={styles.interestChipText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* I communicate in */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I communicate in</Text>
          <View style={styles.chipsContainer}>
            {profile.languages.map((lang, i) => (
              <View key={i} style={styles.languageChip}>
                <Text style={styles.languageChipText}>
                  {lang.name} ({lang.level})
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Photo gallery */}
        <View style={styles.section}>
          <View style={styles.photoGrid}>
            {profile.photos.slice(1).map((photo, i) => (
              <Image
                key={i}
                source={{ uri: photo }}
                style={styles.galleryPhoto}
                resizeMode="cover"
              />
            ))}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.passButton} onPress={() => router.back()}>
            <Ionicons name="close" size={32} color={colors.error} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.likeButton} onPress={() => router.push('/match-found')}>
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
