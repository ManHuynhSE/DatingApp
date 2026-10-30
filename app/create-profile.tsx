import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, darkColors, borderRadius, spacing, typography } from '../src/theme';
import { datingApi } from '../src/api/datingClient';
import { useThemeStore } from '../src/store/themeStore';
import { useLocationStore } from '../src/store/locationStore';
import ProfilePickerModal from '../src/components/ProfilePickerModal';
import { requestCurrentCoordinates } from '../src/location/currentLocation';

function calculateAge(birthDate: string): number {
  const parts = birthDate.split('-').map(Number);
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    const today = new Date();
    let age = today.getFullYear() - parts[0];
    const m = today.getMonth() + 1 - parts[1];
    if (m < 0 || (m === 0 && today.getDate() < parts[2])) {
      age--;
    }
    return age;
  }
  const date = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  if (
    today.getMonth() < date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())
  ) {
    age--;
  }
  return age;
}

function formatDisplayDate(birthDate: string): string {
  const parts = birthDate.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return birthDate;
}

export default function CreateProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === 'dark' ? darkColors : colors;
  const savedCoordinates = useLocationStore((state) => state.coordinates);
  const setCoordinates = useLocationStore((state) => state.setCoordinates);

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('2000-01-01');
  const [gender, setGender] = useState<'male' | 'female' | 'non_binary'>('male');
  const [occupation, setOccupation] = useState('');
  const [city, setCity] = useState('');
  const [ward, setWard] = useState('');
  const [location, setLocation] = useState('');
  const [about, setAbout] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [interestedIn, setInterestedIn] = useState<'male' | 'female' | 'everyone'>('everyone');
  const [languages, setLanguages] = useState<string[]>(['Vietnamese', 'English']);
  const [isSaving, setIsSaving] = useState(false);
  const [activePicker, setActivePicker] = useState<{
    type: string;
    field?: string;
  } | null>(null);

  const age = useMemo(() => {
    if (!birthDate) return null;
    return calculateAge(birthDate);
  }, [birthDate]);

  const openPicker = (type: string, field?: string) => {
    setActivePicker({ type, field });
  };

  const closePicker = () => {
    setActivePicker(null);
  };

  const finish = async () => {
    if (!name.trim() || !birthDate || !userId) {
      Alert.alert(
        'Complete your profile',
        'Please enter your name and select your birth date.',
      );
      return;
    }

    const ageNum = calculateAge(birthDate);
    if (ageNum < 18) {
      Alert.alert(
        'Age requirement',
        'You must be at least 18 years old to join HeartSync.',
      );
      return;
    }
    if (ageNum > 120) {
      Alert.alert('Invalid birth date', 'Please select a valid birth date.');
      return;
    }

    setIsSaving(true);
    try {
      const coordinates = savedCoordinates ?? await requestCurrentCoordinates();
      if (coordinates) setCoordinates(coordinates);
      let finalWard: string | null = ward ? ward.slice(0, 100) : null;
      let finalCity: string | null = city ? city.slice(0, 100) : null;
      if (!finalCity && location.trim()) {
        const parts = location.split(',').map((p) => p.trim()).filter(Boolean);
        if (parts.length > 1) {
          finalWard = parts[0].slice(0, 100);
          finalCity = parts.slice(1).join(', ').slice(0, 100);
        } else if (parts.length === 1) {
          finalCity = parts[0].slice(0, 100);
        }
      }

      const profile = await datingApi.createProfile({
        user_id: userId,
        display_name: name.trim().slice(0, 50),
        birth_date: birthDate,
        gender,
        bio: about.trim() ? about.trim().slice(0, 500) : null,
        job_title: occupation.trim() ? occupation.trim().slice(0, 100) : null,
        city: finalCity,
        ward: finalWard,
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
        languages: languages.slice(0, 20),
      });

      if (profile.success) {
        router.replace('/(tabs)/discovery');
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Please check your connection and try again.';
      Alert.alert('Unable to save profile', message);
    } finally {
      setIsSaving(false);
    }
  };

  const interestedInLabel =
    interestedIn === 'male'
      ? 'Men (Male)'
      : interestedIn === 'female'
        ? 'Women (Female)'
        : 'Everyone';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top']}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable
          onPress={() => router.replace('/(auth)/sign-in')}
          hitSlop={12}
          style={styles.iconButton}
          accessibilityLabel="Back to sign in"
        >
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Create your profile
        </Text>
        <View style={styles.iconButtonPlaceholder} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.progressLabel}>Let&apos;s get to know you</Text>
        <View style={styles.progressTrack}><View style={styles.progressFill} /></View>

          {/* Photos */}
          <SectionTitle
            title="Add your photos"
            theme={theme}
            action="Choose"
            onActionPress={() => openPicker('photos')}
          />
          <Text style={[styles.helper, { color: theme.textSecondary }]}>
            Your main photo is how you appear in the swipe view.
          </Text>
          <Pressable
            onPress={() => openPicker('photos')}
            style={[
              styles.photosCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Choose profile photos"
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoStrip}
            >
              {photos.slice(0, 6).map((photo, index) => (
                <View
                  key={`${photo}-${index}`}
                  style={[styles.photoSlot, { borderColor: theme.border }]}
                >
                  <Image source={{ uri: photo }} style={styles.slotImage} />
                  {index === 0 && (
                    <View style={[styles.mainPhotoBadge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.mainPhotoBadgeText}>Main</Text>
                    </View>
                  )}
                </View>
              ))}
              {photos.length < 6 && (
                <View style={[styles.addPhotoSlot, { borderColor: theme.border, backgroundColor: theme.background }]}>
                  <Ionicons name="add" size={23} color={theme.primary} />
                </View>
              )}
            </ScrollView>
            <Text style={[styles.choosePhotoAction, { color: theme.primary }]}>
              {photos.length > 0
                ? `${photos.length}/6 photos · Edit or add more`
                : 'Choose up to 6 photos'}
            </Text>
            <Text style={[styles.photosHint, { color: theme.textSecondary }]}>You can select several photos at once.</Text>
          </Pressable>

          {/* About You */}
          <SectionTitle title="About you" theme={theme} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor={theme.textTertiary}
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.textPrimary,
              },
            ]}
          />

          {/* Birth Date Picker Trigger */}
          <Pressable
            onPress={() => openPicker('birth_date')}
            style={[
              styles.inputPickerRow,
              {
                backgroundColor: theme.surface,
                borderColor: birthDate ? theme.primary : theme.border,
              },
            ]}
          >
            <View style={styles.inputPickerContent}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={birthDate ? theme.primary : theme.textTertiary}
              />
              <Text
                style={[
                  styles.inputPickerText,
                  {
                    color: birthDate ? theme.textPrimary : theme.textTertiary,
                    fontWeight: birthDate ? '600' : '400',
                  },
                ]}
                numberOfLines={1}
              >
                {birthDate
                  ? `${formatDisplayDate(birthDate)}${age !== null ? ` (${age} years old)` : ''}`
                  : 'Date of birth (DD/MM/YYYY)'}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.textTertiary}
            />
          </Pressable>

          <TextInput
            value={occupation}
            onChangeText={setOccupation}
            placeholder="Occupation"
            placeholderTextColor={theme.textTertiary}
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.textPrimary,
              },
            ]}
          />

          {/* Location Picker Trigger */}
          <Pressable
            onPress={() => openPicker('detail', 'location')}
            style={[
              styles.inputPickerRow,
              {
                backgroundColor: theme.surface,
                borderColor: location ? theme.primary : theme.border,
              },
            ]}
          >
            <View style={styles.inputPickerContent}>
              <Ionicons
                name="location-outline"
                size={20}
                color={location ? theme.primary : theme.textTertiary}
              />
              <Text
                style={[
                  styles.inputPickerText,
                  {
                    color: location ? theme.textPrimary : theme.textTertiary,
                    fontWeight: location ? '600' : '400',
                  },
                ]}
                numberOfLines={1}
              >
                {location || 'Location (City, Ward)'}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.textTertiary}
            />
          </Pressable>

          <TextInput
            value={about}
            onChangeText={setAbout}
            placeholder="Tell people a little about yourself..."
            placeholderTextColor={theme.textTertiary}
            style={[
              styles.input,
              styles.about,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.textPrimary,
              },
            ]}
            multiline
          />

          {/* Gender */}
          <SectionTitle title="Gender" theme={theme} />
          <View style={styles.genderRow}>
            {(['male', 'female', 'non_binary'] as const).map((g) => {
              const isSelected = gender === g;
              return (
                <Pressable
                  key={g}
                  style={[
                    styles.genderOption,
                    {
                      backgroundColor: isSelected
                        ? theme.primaryLight
                        : theme.surface,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setGender(g)}
                >
                  <Text
                    style={[
                      styles.genderOptionText,
                      {
                        color: isSelected ? theme.primary : theme.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {g === 'male'
                      ? 'Male'
                      : g === 'female'
                        ? 'Female'
                        : 'Non-binary'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Your Preferences */}
          <SectionTitle title="Your preferences" theme={theme} />

          {/* Interested in */}
          <Pressable
            onPress={() => openPicker('interested_in')}
            style={[
              styles.preferenceCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.preferenceHeader}>
              <View style={styles.preferenceIconTitle}>
                <Ionicons
                  name="heart-outline"
                  size={20}
                  color={theme.primary}
                />
                <Text
                  style={[
                    styles.preferenceTitle,
                    { color: theme.textPrimary },
                  ]}
                >
                  I&apos;m interested in
                </Text>
              </View>
              <View style={styles.preferenceValueRow}>
                <Text
                  style={[
                    styles.preferenceValueHighlight,
                    { color: theme.primary },
                  ]}
                >
                  {interestedInLabel}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.textTertiary}
                />
              </View>
            </View>
          </Pressable>

          {/* Languages */}
          <Pressable
            onPress={() => openPicker('languages')}
            style={[
              styles.preferenceCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.preferenceHeader}>
              <View style={styles.preferenceIconTitle}>
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color={theme.secondary}
                />
                <Text
                  style={[
                    styles.preferenceTitle,
                    { color: theme.textPrimary },
                  ]}
                >
                  Languages
                </Text>
              </View>
              <View style={styles.preferenceValueRow}>
                <Text
                  style={[
                    styles.preferenceCountBadge,
                    { color: theme.textSecondary },
                  ]}
                >
                  {languages.length > 0
                    ? `${languages.length}/10 selected`
                    : 'Add languages'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.textTertiary}
                />
              </View>
            </View>
            {languages.length > 0 && (
              <View style={styles.tagsContainer}>
                {languages.map((lang) => (
                  <View
                    key={lang}
                    style={[
                      styles.tagBadge,
                      { backgroundColor: theme.primaryLight },
                    ]}
                  >
                    <Text
                      style={[styles.tagBadgeText, { color: theme.primary }]}
                    >
                      {lang}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Pressable>

          {/* Submit Button */}
          <Pressable
            style={[
              styles.primaryButton,
              { backgroundColor: theme.primary },
              isSaving && { opacity: 0.7 },
            ]}
            onPress={finish}
            disabled={isSaving}
          >
            <Text style={styles.primaryText}>
              {isSaving ? 'Saving...' : 'Continue to HeartSync'}
            </Text>
          </Pressable>
        </ScrollView>

      <ProfilePickerModal
        visible={activePicker !== null}
        type={activePicker?.type ?? 'detail'}
        field={activePicker?.field}
        onClose={closePicker}
        initialData={{
          city,
          ward,
          languages,
          interestedIn,
          photos,
          birthDate: birthDate || '2000-01-01',
        }}
        onSelectAddress={({ city: selCity, ward: selWard, fullAddress }) => {
          setCity(selCity);
          setWard(selWard);
          setLocation(fullAddress);
        }}
        onSelectLanguages={(selectedLangs) => {
          setLanguages(selectedLangs);
        }}
        onSelectInterestedIn={(selectedInterestedIn) => {
          setInterestedIn(selectedInterestedIn);
        }}
        onSelectPhotos={(selectedPhotos) => {
          setPhotos(selectedPhotos);
        }}
        onSelectBirthDate={(selectedBirthDate) => {
          setBirthDate(selectedBirthDate);
        }}
      />
    </SafeAreaView>
  );
}

function SectionTitle({
  title,
  theme,
  action,
  onActionPress,
}: {
  title: string;
  theme: typeof colors;
  action?: string;
  onActionPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        {title}
      </Text>
      {action && (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <Text style={[styles.sectionActionText, { color: theme.primary }]}>
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { height: 76, paddingHorizontal: spacing.base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  iconButtonPlaceholder: { width: 40, height: 40 },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  content: { padding: spacing.base, paddingBottom: 50 },
  progressLabel: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: 8 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.primaryLight, marginBottom: spacing.xl },
  progressFill: { width: '25%', height: '100%', borderRadius: 4, backgroundColor: colors.primary },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: 6 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionActionText: { ...typography.bodySmall, fontWeight: '700' },
  helper: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  photosCard: { borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.md, marginTop: spacing.sm },
  photoStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 100 },
  photoSlot: { width: 74, height: 98, borderWidth: 1, borderRadius: borderRadius.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  addPhotoSlot: { width: 54, height: 70, borderWidth: 1, borderStyle: 'dashed', borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  slotImage: { width: '100%', height: '100%' },
  mainPhotoBadge: { position: 'absolute', left: 4, bottom: 4, borderRadius: borderRadius.full, paddingHorizontal: 6, paddingVertical: 2 },
  mainPhotoBadgeText: { ...typography.captionBold, color: colors.white, fontSize: 9 },
  choosePhotoAction: { ...typography.bodySmall, fontWeight: '700', marginTop: spacing.sm },
  photosHint: { ...typography.caption, marginTop: 2 },
  input: { height: 50, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, marginTop: 10, color: colors.textPrimary, ...typography.body },
  inputPickerRow: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputPickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  inputPickerText: {
    ...typography.body,
    flex: 1,
  },
  about: {
    height: 110,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  genderOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  genderOptionText: {
    ...typography.bodySmall,
  },
  preferenceCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: 10,
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  preferenceTitle: {
    ...typography.bodyBold,
  },
  preferenceValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  preferenceValueHighlight: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  preferenceCountBadge: {
    ...typography.bodySmall,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm + 2,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  tagBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  tagBadgeText: {
    ...typography.captionBold,
  },
  primaryButton: {
    height: 52,
    borderRadius: borderRadius.md,
    marginTop: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    ...typography.bodyBold,
    color: colors.white,
  },
});
