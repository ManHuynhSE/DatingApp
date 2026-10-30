import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../src/theme';
import { useDiscoveryStore } from '../src/store/discoveryStore';
import { useAuthStore } from '../src/store/authStore';
import { datingApi } from '../src/api/datingClient';
import { RangeSlider, SingleSlider } from '../src/components/ui/Sliders';

type GenderOption = 'Male' | 'Female' | 'Nonbinary';

const POPULAR_LANGUAGES = [
  'Vietnamese',
  'English',
  'Japanese',
  'Korean',
  'Chinese',
  'French',
  'Spanish',
  'German',
];

export default function FiltersScreen() {
  const router = useRouter();
  const userId = useAuthStore((state) => state.user?.id);
  const currentFilters = useDiscoveryStore((state) => state.filters);
  const setFilters = useDiscoveryStore((state) => state.setFilters);

  const [selectedGenders, setSelectedGenders] = useState<GenderOption[]>(
    currentFilters.gender === 'women'
      ? ['Female']
      : currentFilters.gender === 'men'
        ? ['Male']
        : ['Male', 'Female', 'Nonbinary'],
  );
  const [ageMin, setAgeMin] = useState(String(currentFilters.ageRange[0]));
  const [ageMax, setAgeMax] = useState(String(currentFilters.ageRange[1]));
  const [distance, setDistance] = useState(String(currentFilters.distance));
  const [showExtraProfiles, setShowExtraProfiles] = useState(
    currentFilters.fallbackDistance > currentFilters.distance,
  );
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    currentFilters.languages,
  );
  const [customLanguage, setCustomLanguage] = useState('');
  const [showLanguageInput, setShowLanguageInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(!!userId);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const genderOptions: GenderOption[] = ['Male', 'Female', 'Nonbinary'];

  useEffect(() => {
    if (!userId) {
      return;
    }

    let active = true;
    datingApi
      .getUserPreferences(userId)
      .then((res) => {
        if (!active || !res.success || !res.data) return;
        const pref = res.data;
        if (pref.interested_in === 'female') {
          setSelectedGenders(['Female']);
        } else if (pref.interested_in === 'male') {
          setSelectedGenders(['Male']);
        } else if (pref.interested_in === 'everyone') {
          setSelectedGenders(['Male', 'Female', 'Nonbinary']);
        }
        if (pref.age_min !== undefined) setAgeMin(String(pref.age_min));
        if (pref.age_max !== undefined) setAgeMax(String(pref.age_max));
        if (pref.max_distance_km !== undefined) {
          setDistance(String(pref.max_distance_km));
        }
        if (Array.isArray(pref.interested_languages)) {
          setSelectedLanguages(pref.interested_languages);
        }
      })
      .catch(() => {
        // Fall back to local filter state
      })
      .finally(() => {
        if (active) setIsLoadingPreferences(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const toggleGender = (gender: GenderOption) => {
    setSelectedGenders((prev) =>
      prev.includes(gender)
        ? prev.filter((g) => g !== gender)
        : [...prev, gender],
    );
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const addCustomLanguage = () => {
    const trimmed = customLanguage.trim();
    if (trimmed && !selectedLanguages.includes(trimmed)) {
      setSelectedLanguages((prev) => [...prev, trimmed]);
      setCustomLanguage('');
      setShowLanguageInput(false);
    }
  };

  const removeLanguage = (lang: string) => {
    setSelectedLanguages((prev) => prev.filter((l) => l !== lang));
  };

  const clearAll = () => {
    setSelectedGenders(['Male', 'Female', 'Nonbinary']);
    setAgeMin('18');
    setAgeMax('80');
    setDistance('50');
    setShowExtraProfiles(true);
    setSelectedLanguages([]);
  };

  const applyFilters = async () => {
    const min = Math.max(18, Math.min(120, Number.parseInt(ageMin, 10) || 18));
    const max = Math.max(min, Math.min(120, Number.parseInt(ageMax, 10) || 80));
    const nextDistance = Math.max(
      1,
      Math.min(20000, Number.parseInt(distance, 10) || 50),
    );
    const gender =
      selectedGenders.length === 1 && selectedGenders[0] === 'Female'
        ? 'women'
        : selectedGenders.length === 1 && selectedGenders[0] === 'Male'
          ? 'men'
          : 'everyone';

    const interested_in: 'male' | 'female' | 'everyone' =
      gender === 'women' ? 'female' : gender === 'men' ? 'male' : 'everyone';

    if (userId) {
      setIsSaving(true);
      try {
        await datingApi.updateUserPreferences(userId, {
          interested_in,
          age_min: min,
          age_max: max,
          max_distance_km: nextDistance,
          show_me: true,
          interested_languages: selectedLanguages,
        });
      } catch {
        try {
          await datingApi.upsertUserPreferences(userId, {
            interested_in,
            age_min: min,
            age_max: max,
            max_distance_km: nextDistance,
            show_me: true,
            interested_languages: selectedLanguages,
          });
        } catch {
          // Continue to update local discovery store even if backend failed
        }
      } finally {
        setIsSaving(false);
      }
    }

    setFilters({
      gender,
      ageRange: [min, max],
      distance: nextDistance,
      fallbackDistance: showExtraProfiles
        ? Math.max(nextDistance, 50)
        : nextDistance,
      languages: selectedLanguages,
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          accessibilityLabel="Close filters"
        >
          <Ionicons name="close" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filters</Text>
        <View style={styles.closeBtn}>
          {isSaving && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.scrollView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          scrollEnabled={scrollEnabled}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
        >
          {isLoadingPreferences ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Syncing preferences...</Text>
            </View>
          ) : null}

          {/* Gender */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What is your preferred gender?</Text>
            {genderOptions.map((gender) => {
              const isSelected = selectedGenders.includes(gender);
              return (
                <TouchableOpacity
                  key={gender}
                  style={styles.checkboxRow}
                  onPress={() => toggleGender(gender)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                    ]}
                  >
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={colors.white}
                      />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>{gender}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Age range */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Age range:</Text>
              <Text style={styles.rangeValueBadge}>
                {ageMin} – {parseInt(ageMax, 10) >= 80 ? '80+' : ageMax}
              </Text>
            </View>
            <View style={styles.rangeContainer}>
              <View style={styles.rangeInputWrapper}>
                <Text style={styles.rangeLabel}>Min</Text>
                <TextInput
                  style={styles.rangeInput}
                  value={ageMin}
                  onChangeText={setAgeMin}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              <View style={styles.rangeDivider}>
                <Text style={styles.rangeDividerText}>to</Text>
              </View>
              <View style={styles.rangeInputWrapper}>
                <Text style={styles.rangeLabel}>Max</Text>
                <TextInput
                  style={styles.rangeInput}
                  value={ageMax}
                  onChangeText={setAgeMax}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>
            <RangeSlider
              min={18}
              max={80}
              low={Math.max(18, Math.min(80, parseInt(ageMin, 10) || 18))}
              high={Math.max(18, Math.min(80, parseInt(ageMax, 10) || 80))}
              step={1}
              minRange={0}
              onValueChange={(newLow, newHigh) => {
                setAgeMin(String(newLow));
                setAgeMax(String(newHigh));
              }}
              onDragStateChange={(isDragging) => setScrollEnabled(!isDragging)}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>18</Text>
              <Text style={styles.sliderLabelText}>80+</Text>
            </View>
          </View>

          {/* Distance */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Maximum distance:</Text>
              <Text style={styles.rangeValueBadge}>
                {parseInt(distance, 10) >= 80 ? '80+ km' : `${distance} km`}
              </Text>
            </View>
            <View style={styles.rangeContainer}>
              <View style={styles.rangeInputWrapper}>
                <TextInput
                  style={styles.rangeInput}
                  value={distance}
                  onChangeText={setDistance}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
            </View>
            <SingleSlider
              min={10}
              max={80}
              value={Math.max(10, Math.min(80, parseInt(distance, 10) || 10))}
              step={1}
              onValueChange={(newVal) => {
                setDistance(String(newVal));
              }}
              onDragStateChange={(isDragging) => setScrollEnabled(!isDragging)}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>10 km</Text>
              <Text style={styles.sliderLabelText}>80+ km</Text>
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>
                Show profiles within extended range when running out of matches
              </Text>
              <Switch
                value={showExtraProfiles}
                onValueChange={setShowExtraProfiles}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          {/* Languages */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Languages (Ranking signal):</Text>
            <Text style={styles.sectionHelper}>
              Languages you are interested in sharing with candidates
            </Text>

            {/* Selected Languages Chips */}
            {selectedLanguages.length > 0 && (
              <View style={styles.chipsRow}>
                {selectedLanguages.map((lang) => (
                  <View key={lang} style={styles.languageChipSelected}>
                    <Text style={styles.languageChipTextSelected}>{lang}</Text>
                    <TouchableOpacity onPress={() => removeLanguage(lang)}>
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={colors.white}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Popular Languages Suggestions */}
            <Text style={styles.subSectionTitle}>Popular languages:</Text>
            <View style={styles.chipsRow}>
              {POPULAR_LANGUAGES.map((lang) => {
                const isSelected = selectedLanguages.includes(lang);
                return (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.languageChip,
                      isSelected && styles.languageChipActive,
                    ]}
                    onPress={() => toggleLanguage(lang)}
                  >
                    <Text
                      style={[
                        styles.languageChipText,
                        isSelected && styles.languageChipActiveText,
                      ]}
                    >
                      {lang}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Add custom language */}
            {showLanguageInput ? (
              <View style={styles.customLangRow}>
                <TextInput
                  style={styles.customLangInput}
                  placeholder="Enter language (e.g. Italian)"
                  placeholderTextColor={colors.textTertiary}
                  value={customLanguage}
                  onChangeText={setCustomLanguage}
                  onSubmitEditing={addCustomLanguage}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.addLangBtn}
                  onPress={addCustomLanguage}
                >
                  <Text style={styles.addLangBtnText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelLangBtn}
                  onPress={() => {
                    setCustomLanguage('');
                    setShowLanguageInput(false);
                  }}
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addLanguageTrigger}
                onPress={() => setShowLanguageInput(true)}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.addLanguageTriggerText}>
                  Add another language
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearAll}
          activeOpacity={0.7}
        >
          <Text style={styles.clearButtonText}>Clear all</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={applyFilters}
          activeOpacity={0.7}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.applyButtonText}>Apply filters</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
  },
  loadingText: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
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
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sectionLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  sectionHelper: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  subSectionTitle: {
    fontSize: typography.caption.fontSize,
    color: colors.textTertiary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  rangeInputWrapper: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  rangeInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  rangeDivider: {
    paddingTop: spacing.base,
  },
  rangeDividerText: {
    fontSize: typography.body.fontSize,
    color: colors.textTertiary,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: spacing.sm,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  rangeValueBadge: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sliderLabelText: {
    fontSize: typography.caption.fontSize,
    color: colors.textTertiary,
  },
  distanceRow: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  distanceValue: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: colors.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  toggleLabel: {
    flex: 1,
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  languageChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  languageChipText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  languageChipActiveText: {
    color: colors.primary,
    fontWeight: '600',
  },
  languageChipSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  languageChipTextSelected: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.white,
    fontWeight: '600',
  },
  addLanguageTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  addLanguageTriggerText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.primary,
    fontWeight: '500',
  },
  customLangRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  customLangInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.bodySmall.fontSize,
  },
  addLangBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  addLangBtnText: {
    color: colors.white,
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  cancelLangBtn: {
    padding: spacing.xs,
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.primary,
  },
  applyButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.white,
  },
});
