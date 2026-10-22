import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_GAP = spacing.sm;
const PHOTO_SECTION_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const LARGE_PHOTO_SIZE = (PHOTO_SECTION_WIDTH * 2) / 3 - PHOTO_GAP / 2;
const SMALL_PHOTO_SIZE = PHOTO_SECTION_WIDTH / 3 - PHOTO_GAP / 2;

interface DetailRow {
  label: string;
  value: string;
  icon: string;
}

const DETAIL_ROWS: DetailRow[] = [
  { label: 'Occupation', value: 'Add', icon: 'briefcase-outline' },
  { label: 'Gender & Pronouns', value: 'Male', icon: 'person-outline' },
  { label: 'Education', value: 'Add', icon: 'school-outline' },
  { label: 'Location', value: 'NV 89104', icon: 'location-outline' },
];

const EXTRA_DETAIL_ROWS: DetailRow[] = [
  { label: 'Height', value: 'Add', icon: 'resize-outline' },
  { label: 'Smoking', value: 'Add', icon: 'ban-outline' },
  { label: 'Drinking', value: 'Add', icon: 'wine-outline' },
  { label: 'Pets', value: 'Add', icon: 'paw-outline' },
  { label: 'Children', value: 'Add', icon: 'people-outline' },
  { label: 'Zodiac sign', value: 'Add', icon: 'star-outline' },
  { label: 'Religion', value: 'Add', icon: 'leaf-outline' },
];

const LINKED_ACCOUNTS = [
  { name: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
  { name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { name: 'Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const [aboutMe, setAboutMe] = useState('');
  const [interests, setInterests] = useState<string[]>([
    'Coffee brewing',
    'Trekking',
  ]);
  const [languages, setLanguages] = useState<string[]>(['Finnish']);
  const profileCompletion = 45;

  const removeInterest = (item: string) => {
    setInterests((prev) => prev.filter((i) => i !== item));
  };

  const removeLanguage = (item: string) => {
    setLanguages((prev) => prev.filter((l) => l !== item));
  };

  const mainPhoto = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400';
  const handlePhotoSlot = () => Alert.alert('Add photo', 'Photo picker will be connected in the native build. This slot is ready for upload.');
  const handleDetail = (label: string) => Alert.alert(label, `Edit ${label.toLowerCase()} from this profile field.`);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit profile</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile completion */}
        <View style={styles.completionSection}>
          <Text style={styles.completionText}>
            Profile completion: {profileCompletion}%
          </Text>
          <View style={styles.completionTrack}>
            <View
              style={[
                styles.completionFill,
                { width: `${profileCompletion}%` },
              ]}
            />
          </View>
        </View>

        {/* Photos section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.sectionSubtitle}>
            The main photo is how you appear to others on the swipe view.
          </Text>
          <View style={styles.photoGrid}>
            {/* Large main photo */}
            <View style={styles.largePhotoSlot}>
              <Image
                source={{ uri: mainPhoto }}
                style={styles.largePhoto}
                resizeMode="cover"
              />
              <View style={styles.mainBadge}>
                <Text style={styles.mainBadgeText}>Main</Text>
              </View>
            </View>
            {/* Small photo slots */}
            <View style={styles.smallPhotosColumn}>
              {[0, 1, 2].map((i) => (
                <TouchableOpacity key={i} style={styles.emptyPhotoSlot} onPress={handlePhotoSlot}>
                  <Ionicons name="add" size={28} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* About me */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About me</Text>
          <TextInput
            style={styles.aboutInput}
            value={aboutMe}
            onChangeText={setAboutMe}
            placeholder="Write something interesting about yourself..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.divider} />

        {/* My details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My details</Text>
          {DETAIL_ROWS.map((row, i) => (
            <TouchableOpacity key={i} style={styles.detailRow} onPress={() => handleDetail(row.label)}>
              <Ionicons
                name={row.icon as any}
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.detailLabel}>{row.label}</Text>
              <Text
                style={[
                  styles.detailValue,
                  row.value === 'Add' && styles.detailValueAdd,
                ]}
              >
                {row.value}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          ))}

          <Text style={styles.subsectionTitle}>
            Most people also want to know:
          </Text>

          {EXTRA_DETAIL_ROWS.map((row, i) => (
            <TouchableOpacity key={i} style={styles.detailRow} onPress={() => handleDetail(row.label)}>
              <Ionicons
                name={row.icon as any}
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.detailLabel}>{row.label}</Text>
              <Text
                style={[
                  styles.detailValue,
                  row.value === 'Add' && styles.detailValueAdd,
                ]}
              >
                {row.value}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        {/* I enjoy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I enjoy</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setInterests((prev) => prev.includes('Cooking') ? prev : [...prev, 'Cooking'])}>
            <Ionicons
              name="search-outline"
              size={20}
              color={colors.textTertiary}
            />
            <Text style={styles.dropdownPlaceholder}>
              Search and add interests
            </Text>
            <Ionicons
              name="chevron-down"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
          <View style={styles.chipsRow}>
            {interests.map((item) => (
              <View key={item} style={styles.chip}>
                <Text style={styles.chipText}>{item}</Text>
                <TouchableOpacity onPress={() => removeInterest(item)}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* I communicate in */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I communicate in</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setLanguages((prev) => prev.includes('English') ? prev : [...prev, 'English'])}>
            <Ionicons
              name="globe-outline"
              size={20}
              color={colors.textTertiary}
            />
            <Text style={styles.dropdownPlaceholder}>
              Search and add languages
            </Text>
            <Ionicons
              name="chevron-down"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
          <View style={styles.chipsRow}>
            {languages.map((item) => (
              <View key={item} style={styles.chip}>
                <Text style={styles.chipText}>{item}</Text>
                <TouchableOpacity onPress={() => removeLanguage(item)}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Linked accounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Linked accounts</Text>
          {LINKED_ACCOUNTS.map((account, i) => (
            <TouchableOpacity key={i} style={styles.linkedRow} onPress={() => Alert.alert(account.name, `Connect ${account.name} from the account integration flow.`)}>
              <Ionicons
                name={account.icon as any}
                size={24}
                color={account.color}
              />
              <Text style={styles.linkedLabel}>{account.name}</Text>
              <Text style={styles.linkedAdd}>Add</Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          ))}
        </View>

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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  completionSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  completionText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  completionTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: PHOTO_GAP,
  },
  largePhotoSlot: {
    width: LARGE_PHOTO_SIZE,
    height: LARGE_PHOTO_SIZE,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  largePhoto: {
    width: '100%',
    height: '100%',
  },
  mainBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  mainBadgeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.white,
  },
  smallPhotosColumn: {
    flex: 1,
    gap: PHOTO_GAP,
  },
  emptyPhotoSlot: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    minHeight: SMALL_PHOTO_SIZE * 0.75,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  aboutInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    minHeight: 100,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailLabel: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
  },
  detailValue: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  detailValueAdd: {
    color: colors.primary,
    fontWeight: '500',
  },
  subsectionTitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textTertiary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dropdownPlaceholder: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.textTertiary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  chipText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.primary,
    fontWeight: '500',
  },
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  linkedLabel: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
  },
  linkedAdd: {
    fontSize: typography.body.fontSize,
    color: colors.primary,
    fontWeight: '500',
  },
});
