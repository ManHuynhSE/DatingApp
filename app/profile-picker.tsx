import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, darkColors, spacing, typography, borderRadius } from '../src/theme';
import { useAuthStore } from '../src/store/authStore';
import { useProfileEditStore } from '../src/store/profileEditStore';
import { useThemeStore } from '../src/store/themeStore';

const INTERESTS = ['Photography', 'Hiking', 'Cooking', 'Design', 'Travel', 'Music', 'Coffee', 'Art', 'Yoga', 'Reading', 'Films', 'Fitness'];
const LANGUAGES = ['English', 'Spanish', 'French', 'Vietnamese', 'Mandarin', 'Japanese', 'Korean'];
const PHOTO_OPTIONS = [
  'https://picsum.photos/seed/profile-new-1/500/700',
  'https://picsum.photos/seed/profile-new-2/500/700',
  'https://picsum.photos/seed/profile-new-3/500/700',
  'https://picsum.photos/seed/profile-new-4/500/700',
];

export default function ProfilePickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; field?: string }>();
  const themeMode = useThemeStore((state) => state.mode);
  const theme = themeMode === 'dark' ? darkColors : colors;
  const draft = useProfileEditStore((state) => state.draft);
  const update = useProfileEditStore((state) => state.update);
  const user = useAuthStore((state) => state.user);
  const [query, setQuery] = useState('');
  const type = params.type ?? 'interests';
  const title = type === 'photos' ? 'Choose photos' : type === 'detail' ? params.field ?? 'Choose an option' : type === 'languages' ? 'Languages' : 'Interests';

  const options = useMemo(() => {
    const source = type === 'languages' ? LANGUAGES : INTERESTS;
    return source.filter((item) => item.toLowerCase().includes(query.toLowerCase()));
  }, [query, type]);

  const selected = type === 'languages' ? draft?.languages ?? [] : draft?.interests ?? [];
  const detailOptions = params.field === 'location'
    ? ['San Francisco, CA', 'New York, NY', 'Los Angeles, CA', 'Seattle, WA', 'Austin, TX']
    : params.field === 'occupation'
      ? ['Product Designer', 'Software Engineer', 'Photographer', 'Marketing Manager', 'Student']
      : ['Prefer not to say', 'Never', 'Sometimes', 'Socially', 'Active', 'Want someday', 'Dog lover', 'Cat lover', 'Long-term relationship'];
  const toggleItem = (item: string) => {
    const next = selected.includes(item) ? selected.filter((value) => value !== item) : [...selected, item];
    update(type === 'languages' ? { languages: next } : { interests: next });
  };

  const chooseDetail = (value: string) => {
    const field = params.field ?? '';
    if (field === 'location' || field === 'occupation') {
      update({ [field]: value });
      router.back();
      return;
    }
    const detailField = field as keyof NonNullable<typeof draft>['details'];
    const baseDetails = draft?.details ?? user?.details;
    if (!baseDetails) return;
    update({ details: { ...baseDetails, [detailField]: value } });
    router.back();
  };

  const addPhoto = (photo: string) => {
    const photos = draft?.photos ?? [];
    if (!photos.includes(photo)) update({ photos: [...photos, photo].slice(0, 6) });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="close" size={25} color={theme.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        <Pressable onPress={() => router.back()} style={styles.doneButton}>
          <Text style={[styles.doneText, { color: theme.primary }]}>Done</Text>
        </Pressable>
      </View>

      {type === 'photos' ? (
        <ScrollView contentContainerStyle={styles.photoGrid}>
          {PHOTO_OPTIONS.map((photo) => (
            <Pressable key={photo} style={[styles.photoCard, { borderColor: theme.border }]} onPress={() => addPhoto(photo)}>
              <Image source={{ uri: photo }} style={styles.photo} />
              {(draft?.photos ?? []).includes(photo) && (
                <View style={[styles.selectedMark, { backgroundColor: theme.primary }]}>
                  <Ionicons name="checkmark" size={18} color={theme.white} />
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      ) : type === 'detail' ? (
        <ScrollView contentContainerStyle={styles.optionList}>
          {detailOptions.map((option) => (
            <Pressable key={option} style={[styles.option, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => chooseDetail(option)}>
              <Text style={[styles.optionText, { color: theme.textPrimary }]}>{option}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <>
          <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="search-outline" size={20} color={theme.textTertiary} />
            <TextInput value={query} onChangeText={setQuery} placeholder={`Search ${type}...`} placeholderTextColor={theme.textTertiary} style={[styles.searchInput, { color: theme.textPrimary }]} />
          </View>
          <ScrollView contentContainerStyle={styles.chips}>
            {options.map((item) => {
              const isSelected = selected.includes(item);
              return (
                <Pressable key={item} onPress={() => toggleItem(item)} style={[styles.chip, { backgroundColor: isSelected ? theme.primary : theme.surface, borderColor: isSelected ? theme.primary : theme.border }]}>
                  <Text style={[styles.chipText, { color: isSelected ? theme.white : theme.textPrimary }]}>{item}</Text>
                  {isSelected && <Ionicons name="checkmark" size={17} color={theme.white} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, borderBottomWidth: 1 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h3 },
  doneButton: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'flex-end' },
  doneText: { ...typography.bodyBold },
  searchBox: { margin: spacing.base, borderWidth: 1, borderRadius: borderRadius.md, minHeight: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm },
  searchInput: { flex: 1, ...typography.body },
  chips: { paddingHorizontal: spacing.base, paddingBottom: spacing.xxl, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: 44, borderRadius: borderRadius.full, borderWidth: 1, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  chipText: { ...typography.bodySmall },
  optionList: { padding: spacing.base, gap: spacing.sm },
  option: { minHeight: 56, borderRadius: borderRadius.md, borderWidth: 1, paddingHorizontal: spacing.base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionText: { ...typography.body },
  photoGrid: { padding: spacing.base, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  photoCard: { width: '47%', aspectRatio: 0.75, borderRadius: borderRadius.md, overflow: 'hidden', borderWidth: 1 },
  photo: { width: '100%', height: '100%' },
  selectedMark: { position: 'absolute', top: spacing.sm, right: spacing.sm, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
