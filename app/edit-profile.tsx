import React, { useMemo, useState } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../src/theme';
import { useAuthStore } from '../src/store/authStore';

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

const LINKED_ACCOUNTS = [
  { name: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
  { name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { name: 'Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [name, setName] = useState(user?.name ?? '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [occupation, setOccupation] = useState(user?.occupation ?? '');
  const [aboutMe, setAboutMe] = useState(user?.aboutMe ?? '');
  const [interests, setInterests] = useState<string[]>(user?.interests ?? []);
  const [languages, setLanguages] = useState<string[]>(user?.languages ?? []);
  const [photos, setPhotos] = useState<string[]>(user?.photos ?? []);
  const [isSaving, setIsSaving] = useState(false);

  const profileCompletion = useMemo(() => {
    const fields = [name.trim(), age.trim(), occupation.trim(), aboutMe.trim(), interests.length, languages.length, photos.length];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [aboutMe, age, interests.length, languages.length, name, occupation, photos.length]);

  const isDirty = Boolean(
    name !== (user?.name ?? '') ||
      age !== (user?.age ? String(user.age) : '') ||
      occupation !== (user?.occupation ?? '') ||
      aboutMe !== (user?.aboutMe ?? '') ||
      photos !== (user?.photos ?? []) ||
      interests.join('|') !== (user?.interests ?? []).join('|') ||
      languages.join('|') !== (user?.languages ?? []).join('|'),
  );

  const removeInterest = (item: string) => {
    setInterests((prev) => prev.filter((i) => i !== item));
  };

  const removeLanguage = (item: string) => {
    setLanguages((prev) => prev.filter((l) => l !== item));
  };

  const mainPhoto = photos[0] ?? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400';
  const handlePhotoSlot = () => {
    const mockPhoto = [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    ][photos.length % 3];
    setPhotos((current) => [...current, mockPhoto].slice(0, 4));
  };

  const detailRows: DetailRow[] = [
    { label: 'Occupation', value: occupation || 'Add', icon: 'briefcase-outline' },
    { label: 'Gender & Pronouns', value: user?.pronouns || 'Add', icon: 'person-outline' },
    { label: 'Education', value: user?.education || 'Add', icon: 'school-outline' },
    { label: 'Location', value: user?.location || 'Add', icon: 'location-outline' },
  ];

  const extraDetailRows: DetailRow[] = [
    { label: 'Height', value: user?.details.height || 'Add', icon: 'resize-outline' },
    { label: 'Smoking', value: user?.details.smoking || 'Add', icon: 'ban-outline' },
    { label: 'Drinking', value: user?.details.drinking || 'Add', icon: 'wine-outline' },
    { label: 'Pets', value: user?.details.pets || 'Add', icon: 'paw-outline' },
    { label: 'Children', value: user?.details.children || 'Add', icon: 'people-outline' },
    { label: 'Zodiac sign', value: user?.details.zodiac || 'Add', icon: 'star-outline' },
    { label: 'Religion', value: user?.details.religion || 'Add', icon: 'leaf-outline' },
  ];

  const handleDetail = (label: string) => Alert.alert(label, 'This detail editor is available in the prototype. Your current value is shown in this screen.');

  const handleBack = () => {
    if (!isDirty) {
      router.back();
      return;
    }
    Alert.alert('Discard changes?', 'Your unsaved profile changes will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const handleSave = () => {
    if (!name.trim() || !age.trim() || Number(age) < 18 || Number(age) > 100) {
      Alert.alert('Check your profile', 'Enter your name and an age between 18 and 100.');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      updateUser({
        name: name.trim(),
        age: Number(age),
        occupation: occupation.trim(),
        aboutMe: aboutMe.trim(),
        interests,
        languages,
        photos,
        profileCompletion,
      });
      setIsSaving(false);
      Alert.alert('Profile saved', 'Your profile changes are now visible throughout the app.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    }, 450);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBtn} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit profile</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={isSaving || !isDirty}>
          {isSaving ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[styles.saveText, (!isDirty || isSaving) && styles.saveTextDisabled]}>Save</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.scrollView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
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
                <TouchableOpacity key={i} style={styles.emptyPhotoSlot} onPress={handlePhotoSlot} accessibilityLabel={`Add photo ${i + 2}`}>
                  {photos[i + 1] ? <Image source={{ uri: photos[i + 1] }} style={styles.slotPhoto} /> : <Ionicons name="add" size={28} color={colors.textTertiary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your name and age</Text>
          <TextInput style={styles.textInput} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={colors.textTertiary} />
          <TextInput style={styles.textInput} value={age} onChangeText={setAge} placeholder="Age" placeholderTextColor={colors.textTertiary} keyboardType="number-pad" maxLength={3} />
          <TextInput style={styles.textInput} value={occupation} onChangeText={setOccupation} placeholder="Occupation" placeholderTextColor={colors.textTertiary} />
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
          {detailRows.map((row, i) => (
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

          {extraDetailRows.map((row, i) => (
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

        <TouchableOpacity style={[styles.bottomSaveButton, isSaving && styles.disabledButton]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.bottomSaveText}>Save changes</Text>}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
      </KeyboardAvoidingView>
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
  saveButton: {
    minWidth: 52,
    minHeight: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  saveText: {
    color: colors.primary,
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
  saveTextDisabled: {
    color: colors.textTertiary,
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
  slotPhoto: {
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
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    minHeight: 48,
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
  bottomSaveButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.base,
    minHeight: 52,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  disabledButton: {
    opacity: 0.7,
  },
  bottomSaveText: {
    color: colors.white,
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
});
