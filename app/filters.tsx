import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { colors, darkColors, typography, spacing, borderRadius } from '../src/theme';
import { useDiscoveryStore } from '../src/store/discoveryStore';
import { useAuthStore } from '../src/store/authStore';
import { useThemeStore } from '../src/store/themeStore';
import { datingApi } from '../src/api/datingClient';
import { RangeSlider, SingleSlider } from '../src/components/ui/Sliders';
import ProfilePickerModal from '../src/components/ProfilePickerModal';

type GenderOption = 'Female' | 'Male';

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
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === 'dark' ? darkColors : colors;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selectedGenders, setSelectedGenders] = useState<GenderOption[]>(
    currentFilters.gender === 'women'
      ? ['Female']
      : currentFilters.gender === 'men'
        ? ['Male']
        : ['Female', 'Male'],
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
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(!!userId);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const genderOptions: GenderOption[] = ['Female', 'Male'];

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
          setSelectedGenders(['Female', 'Male']);
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
    setSelectedGenders((prev) => {
      if (prev.includes(gender)) {
        if (prev.length <= 1) {
          // Keep at least one selected so filter is always active
          return prev;
        }
        return prev.filter((g) => g !== gender);
      }
      return [...prev, gender];
    });
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const removeLanguage = (lang: string) => {
    setSelectedLanguages((prev) => prev.filter((l) => l !== lang));
  };

  const clearAll = () => {
    setSelectedGenders(['Female', 'Male']);
    setAgeMin('18');
    setAgeMax('80');
    setDistance('50');
    setShowExtraProfiles(true);
    setSelectedLanguages([]);
  };

  const handleAgeChange = useCallback((newLow: number, newHigh: number) => {
    setAgeMin(String(newLow));
    setAgeMax(String(newHigh));
  }, []);

  const handleDistanceChange = useCallback((newVal: number) => {
    setDistance(String(newVal));
  }, []);

  const handleDragStateChange = useCallback((isDragging: boolean) => {
    setScrollEnabled(!isDragging);
  }, []);

  const handleAgeMinBlur = useCallback(() => {
    const minVal = parseInt(ageMin, 10);
    const maxVal = parseInt(ageMax, 10);
    if (isNaN(minVal) || minVal < 18) {
      setAgeMin('18');
    } else if (minVal > 80) {
      setAgeMin('80');
    } else if (!isNaN(maxVal) && minVal > maxVal) {
      setAgeMax(String(minVal));
    }
  }, [ageMin, ageMax]);

  const handleAgeMaxBlur = useCallback(() => {
    const minVal = parseInt(ageMin, 10);
    const maxVal = parseInt(ageMax, 10);
    if (isNaN(maxVal) || maxVal < 18) {
      setAgeMax('18');
    } else if (maxVal > 80) {
      setAgeMax('80');
    } else if (!isNaN(minVal) && maxVal < minVal) {
      setAgeMin(String(maxVal));
    }
  }, [ageMin, ageMax]);

  const handleDistanceBlur = useCallback(() => {
    const distVal = parseInt(distance, 10);
    if (isNaN(distVal) || distVal < 10) {
      setDistance('10');
    }
  }, [distance]);

  const applyFilters = async () => {
    const min = Math.max(18, Math.min(120, Number.parseInt(ageMin, 10) || 18));
    const max = Math.max(min, Math.min(120, Number.parseInt(ageMax, 10) || 80));
    const nextDistance = Math.max(
      1,
      Math.min(20000, Number.parseInt(distance, 10) || 50),
    );
    const isFemaleSelected = selectedGenders.includes('Female');
    const isMaleSelected = selectedGenders.includes('Male');
    const gender =
      isFemaleSelected && !isMaleSelected
        ? 'women'
        : isMaleSelected && !isFemaleSelected
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
        <View style={styles.headerTitleContainer} pointerEvents="none">
          <Text style={styles.headerTitle}>Bộ lọc tìm kiếm</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          accessibilityLabel="Đóng bộ lọc"
        >
          <Ionicons name="close" size={26} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.closeBtn}>
          {isSaving && <ActivityIndicator size="small" color={theme.primary} />}
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
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={styles.loadingText}>Đang đồng bộ tùy chọn...</Text>
            </View>
          ) : null}

          {/* Gender */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Bạn muốn tìm kiếm đối tượng nào?</Text>
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
                        color={theme.white}
                      />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    {gender === 'Female' ? 'Nữ' : 'Nam'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Age range */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Độ tuổi:</Text>
              <Text style={styles.rangeValueBadge}>
                {ageMin} – {parseInt(ageMax, 10) >= 80 ? '80+' : ageMax}
              </Text>
            </View>
            <View style={styles.rangeContainer}>
              <View style={styles.rangeInputWrapper}>
                <Text style={styles.rangeLabel}>Tối thiểu</Text>
                <TextInput
                  style={styles.rangeInput}
                  value={ageMin}
                  onChangeText={setAgeMin}
                  onBlur={handleAgeMinBlur}
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              <View style={styles.rangeDivider}>
                <Text style={styles.rangeDividerText}>đến</Text>
              </View>
              <View style={styles.rangeInputWrapper}>
                <Text style={styles.rangeLabel}>Tối đa</Text>
                <TextInput
                  style={styles.rangeInput}
                  value={ageMax}
                  onChangeText={setAgeMax}
                  onBlur={handleAgeMaxBlur}
                  placeholderTextColor={theme.textTertiary}
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
              onValueChange={handleAgeChange}
              onDragStateChange={handleDragStateChange}
              activeColor={theme.primary}
              inactiveColor={theme.border}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>18</Text>
              <Text style={styles.sliderLabelText}>80+</Text>
            </View>
          </View>

          {/* Distance */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Khoảng cách tối đa:</Text>
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
                  onBlur={handleDistanceBlur}
                  placeholderTextColor={theme.textTertiary}
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
              onValueChange={handleDistanceChange}
              onDragStateChange={handleDragStateChange}
              activeColor={theme.primary}
              inactiveColor={theme.border}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>10 km</Text>
              <Text style={styles.sliderLabelText}>80+ km</Text>
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>
                Mở rộng phạm vi tìm kiếm khi danh sách tương hợp đã hết
              </Text>
              <Switch
                value={showExtraProfiles}
                onValueChange={setShowExtraProfiles}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.white}
              />
            </View>
          </View>

          {/* Languages */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Ngôn ngữ giao tiếp:</Text>
              <TouchableOpacity
                onPress={() => setIsLanguageModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.headerActionText}>Chọn từ danh sách</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionHelper}>
              Ưu tiên những hồ sơ có chung ngôn ngữ với bạn
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
                        color={theme.white}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Popular Languages Suggestions */}
            <Text style={styles.subSectionTitle}>Ngôn ngữ phổ biến:</Text>
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

            {/* Add custom language from list */}
            <TouchableOpacity
              style={styles.addLanguageTrigger}
              onPress={() => setIsLanguageModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="list-circle-outline"
                size={20}
                color={theme.primary}
              />
              <Text style={styles.addLanguageTriggerText}>
                Thêm ngôn ngữ khác từ danh sách...
              </Text>
            </TouchableOpacity>
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
          <Text style={styles.clearButtonText}>Đặt lại</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={applyFilters}
          activeOpacity={0.7}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={theme.white} />
          ) : (
            <Text style={styles.applyButtonText}>Áp dụng bộ lọc</Text>
          )}
        </TouchableOpacity>
      </View>

      <ProfilePickerModal
        key={`filter-language-picker-${isLanguageModalVisible}`}
        visible={isLanguageModalVisible}
        type="languages"
        initialData={{ languages: selectedLanguages }}
        onSelectLanguages={(langs) => setSelectedLanguages(langs)}
        onClose={() => setIsLanguageModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: theme.primaryLight,
    },
    loadingText: {
      fontSize: typography.caption.fontSize,
      color: theme.primary,
    },
    header: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.base,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      position: 'relative',
    },
    headerTitleContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
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
      color: theme.textPrimary,
      textAlign: 'center',
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
      borderBottomColor: theme.borderLight,
    },
    sectionLabel: {
      fontSize: typography.body.fontSize,
      fontWeight: '600',
      color: theme.primary,
      marginBottom: spacing.xs,
    },
    sectionHelper: {
      fontSize: typography.caption.fontSize,
      color: theme.textSecondary,
      marginBottom: spacing.md,
    },
    subSectionTitle: {
      fontSize: typography.caption.fontSize,
      color: theme.textTertiary,
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
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    checkboxLabel: {
      fontSize: typography.body.fontSize,
      color: theme.textPrimary,
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
      color: theme.textTertiary,
      marginBottom: spacing.xs,
    },
    rangeInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: typography.body.fontSize,
      color: theme.textPrimary,
      backgroundColor: theme.surface,
      textAlign: 'center',
    },
    rangeDivider: {
      paddingTop: spacing.base,
    },
    rangeDividerText: {
      fontSize: typography.body.fontSize,
      color: theme.textTertiary,
    },
    sliderTrack: {
      height: 4,
      backgroundColor: theme.border,
      borderRadius: 2,
      marginTop: spacing.sm,
      position: 'relative',
    },
    sliderFill: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      backgroundColor: theme.primary,
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
      color: theme.primary,
    },
    sliderLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    sliderLabelText: {
      fontSize: typography.caption.fontSize,
      color: theme.textTertiary,
    },
    distanceRow: {
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    distanceValue: {
      fontSize: typography.h3.fontSize,
      fontWeight: typography.h3.fontWeight,
      color: theme.primary,
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
      color: theme.textSecondary,
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
      backgroundColor: theme.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: theme.border,
    },
    languageChipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    languageChipText: {
      fontSize: typography.bodySmall.fontSize,
      color: theme.textSecondary,
    },
    languageChipActiveText: {
      color: theme.primary,
      fontWeight: '600',
    },
    languageChipSelected: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      gap: spacing.xs,
    },
    languageChipTextSelected: {
      fontSize: typography.bodySmall.fontSize,
      color: theme.white,
      fontWeight: '600',
    },
    headerActionText: {
      ...typography.bodySmall,
      color: theme.primary,
      fontWeight: '600',
    },
    addLanguageTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
    },
    addLanguageTriggerText: {
      fontSize: typography.bodySmall.fontSize,
      color: theme.primary,
      fontWeight: '600',
    },
    bottomButtons: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.base,
      gap: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.background,
    },
    clearButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.full,
      borderWidth: 1.5,
      borderColor: theme.primary,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearButtonText: {
      fontSize: typography.body.fontSize,
      fontWeight: '600',
      color: theme.primary,
    },
    applyButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.full,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyButtonText: {
      fontSize: typography.body.fontSize,
      fontWeight: '600',
      color: theme.white,
    },
  });
