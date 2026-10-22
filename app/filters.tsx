import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '../src/theme';

type GenderOption = 'Male' | 'Female' | 'Nonbinary';

export default function FiltersScreen() {
  const router = useRouter();

  const [selectedGenders, setSelectedGenders] = useState<GenderOption[]>(['Female']);
  const [ageMin, setAgeMin] = useState('18');
  const [ageMax, setAgeMax] = useState('35');
  const [distance, setDistance] = useState('15');
  const [showExtraProfiles, setShowExtraProfiles] = useState(true);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([
    'English',
    'Spanish',
  ]);

  const genderOptions: GenderOption[] = ['Male', 'Female', 'Nonbinary'];

  const toggleGender = (gender: GenderOption) => {
    setSelectedGenders((prev) =>
      prev.includes(gender)
        ? prev.filter((g) => g !== gender)
        : [...prev, gender]
    );
  };

  const removeLanguage = (lang: string) => {
    setSelectedLanguages((prev) => prev.filter((l) => l !== lang));
  };

  const clearAll = () => {
    setSelectedGenders([]);
    setAgeMin('18');
    setAgeMax('80');
    setDistance('15');
    setShowExtraProfiles(true);
    setSelectedLanguages([]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filters</Text>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{gender}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Age range */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Age range:</Text>
          <View style={styles.rangeContainer}>
            <View style={styles.rangeInputWrapper}>
              <Text style={styles.rangeLabel}>Min</Text>
              <TextInput
                style={styles.rangeInput}
                value={ageMin}
                onChangeText={setAgeMin}
                keyboardType="number-pad"
                maxLength={2}
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
                maxLength={2}
              />
            </View>
          </View>
          {/* Visual slider track */}
          <View style={styles.sliderTrack}>
            <View
              style={[
                styles.sliderFill,
                {
                  left: `${((parseInt(ageMin) - 18) / 62) * 100}%`,
                  right: `${100 - ((parseInt(ageMax) - 18) / 62) * 100}%`,
                },
              ]}
            />
            <View
              style={[
                styles.sliderThumb,
                { left: `${((parseInt(ageMin) - 18) / 62) * 100}%` },
              ]}
            />
            <View
              style={[
                styles.sliderThumb,
                { left: `${((parseInt(ageMax) - 18) / 62) * 100}%` },
              ]}
            />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>18</Text>
            <Text style={styles.sliderLabelText}>80</Text>
          </View>
        </View>

        {/* Distance */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Distance:</Text>
          <View style={styles.distanceRow}>
            <Text style={styles.distanceValue}>{distance} km</Text>
          </View>
          <View style={styles.sliderTrack}>
            <View
              style={[
                styles.sliderFill,
                {
                  left: '0%',
                  right: `${100 - ((parseInt(distance) - 10) / 70) * 100}%`,
                },
              ]}
            />
            <View
              style={[
                styles.sliderThumb,
                { left: `${((parseInt(distance) - 10) / 70) * 100}%` },
              ]}
            />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>10 km</Text>
            <Text style={styles.sliderLabelText}>80 km</Text>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>
              Show profiles within a 15-km range when run out of matches
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
          <Text style={styles.sectionLabel}>Languages:</Text>
          <TouchableOpacity
            style={styles.dropdown}
            activeOpacity={0.7}
            onPress={() => {
              const next = selectedLanguages.includes('French')
                ? selectedLanguages.filter((item) => item !== 'French')
                : [...selectedLanguages, 'French'];
              setSelectedLanguages(next);
            }}
          >
            <Ionicons name="globe-outline" size={20} color={colors.textTertiary} />
            <Text style={styles.dropdownPlaceholder}>Select languages</Text>
            <Ionicons
              name="chevron-down"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
          <View style={styles.chipsRow}>
            {selectedLanguages.map((lang) => (
              <View key={lang} style={styles.languageChip}>
                <Text style={styles.languageChipText}>{lang}</Text>
                <TouchableOpacity onPress={() => removeLanguage(lang)}>
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
      </ScrollView>

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
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.applyButtonText}>Apply filters</Text>
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
    marginBottom: spacing.base,
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
    marginTop: spacing.md,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    marginLeft: -8,
    ...shadows.sm,
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
    marginBottom: spacing.sm,
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
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  languageChipText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.primary,
    fontWeight: '500',
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
