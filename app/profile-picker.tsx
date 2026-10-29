import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  colors,
  darkColors,
  spacing,
  typography,
  borderRadius,
} from "../src/theme";
import { useAuthStore } from "../src/store/authStore";
import { useProfileEditStore } from "../src/store/profileEditStore";
import { useThemeStore } from "../src/store/themeStore";

const INTERESTS = [
  "Photography",
  "Hiking",
  "Cooking",
  "Design",
  "Travel",
  "Music",
  "Coffee",
  "Art",
  "Yoga",
  "Reading",
  "Films",
  "Fitness",
];
const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "Vietnamese",
  "Mandarin",
  "Japanese",
  "Korean",
];
const PHOTO_OPTIONS = [
  "https://picsum.photos/seed/profile-new-1/500/700",
  "https://picsum.photos/seed/profile-new-2/500/700",
  "https://picsum.photos/seed/profile-new-3/500/700",
  "https://picsum.photos/seed/profile-new-4/500/700",
];

export default function ProfilePickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; field?: string }>();
  const themeMode = useThemeStore((state) => state.mode);
  const theme = themeMode === "dark" ? darkColors : colors;
  const draft = useProfileEditStore((state) => state.draft);
  const update = useProfileEditStore((state) => state.update);
  const user = useAuthStore((state) => state.user);
  const [query, setQuery] = useState("");
  const type = params.type ?? "interests";
  const [detailValue, setDetailValue] = useState(() => {
    const field = params.field;
    const details = draft?.details ?? user?.details;
    if (field === "location") return draft?.location ?? user?.location ?? "";
    if (field === "occupation") return draft?.occupation ?? user?.occupation ?? "";
    if (field === "height") return (details?.height ?? "").replace(/\s*cm$/i, "");
    if (field === "pets") return details?.pets ?? "";
    if (field === "exercise") return details?.exercise ?? "";
    return "";
  });
  const title =
    type === "photos"
      ? "Choose photos"
      : type === "detail"
        ? (params.field ?? "Choose an option")
        : type === "languages"
          ? "Languages"
          : "Interests";

  const options = useMemo(() => {
    const source = type === "languages" ? LANGUAGES : INTERESTS;
    return source.filter((item) =>
      item.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query, type]);

  const selected =
    type === "languages" ? (draft?.languages ?? []) : (draft?.interests ?? []);
  const detailOptions =
    params.field === "education"
      ? ["Đại học", "Cao Đẳng", "Thạc sĩ"]
      : [
          "Prefer not to say",
          "Never",
          "Sometimes",
          "Socially",
          "Active",
          "Want someday",
          "Dog lover",
          "Cat lover",
          "Long-term relationship",
        ];
  const toggleItem = (item: string) => {
    const next = selected.includes(item)
      ? selected.filter((value) => value !== item)
      : [...selected, item];
    update(type === "languages" ? { languages: next } : { interests: next });
  };

  const isFreeTextField =
    type === "detail" &&
    (params.field === "location" || params.field === "occupation" || params.field === "height");
  const isMultiSelectDetail =
    type === "detail" &&
    (params.field === "pets" || params.field === "exercise");
  const multiSelectOptions =
    params.field === "pets"
      ? ["Dog", "Cat", "Bird", "Fish", "Other", "No pets"]
      : ["Active", "Sometimes", "Rarely", "Never"];

  const selectedDetailValues = detailValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const saveFreeTextDetail = () => {
    const field = params.field;
    const value = detailValue.trim();

    if (field === "location") {
      update({ location: value });
    } else if (field === "occupation") {
      update({ occupation: value });
    } else if (field === "height") {
      const centimeters = Number(value);
      if (!Number.isInteger(centimeters) || centimeters < 100 || centimeters > 250) {
        Alert.alert("Chiều cao không hợp lệ", "Nhập chiều cao từ 100 đến 250 cm.");
        return;
      }
      const baseDetails = draft?.details ?? user?.details;
      if (baseDetails) {
        update({ details: { ...baseDetails, height: `${centimeters}cm` } });
      }
    }

    router.back();
  };

  const toggleDetailValue = (option: string) => {
    const field = params.field;
    if (field !== "pets" && field !== "exercise") return;

    let next = selectedDetailValues.includes(option)
      ? selectedDetailValues.filter((value) => value !== option)
      : [...selectedDetailValues, option];

    if (field === "pets" && option === "No pets" && next.includes("No pets")) {
      next = ["No pets"];
    } else if (field === "pets") {
      next = next.filter((value) => value !== "No pets");
    }

    const joined = next.join(", ");
    const baseDetails = draft?.details ?? user?.details;
    setDetailValue(joined);
    if (baseDetails) {
      update({ details: { ...baseDetails, [field]: joined } });
    }
  };

  const chooseDetail = (value: string) => {
    const field = params.field ?? "";
    if (
      field === "location" ||
      field === "occupation" ||
      field === "education"
    ) {
      update({ [field]: value });
      router.back();
      return;
    }
    const detailField = field as keyof NonNullable<typeof draft>["details"];
    const baseDetails = draft?.details ?? user?.details;
    if (!baseDetails) return;
    update({ details: { ...baseDetails, [detailField]: value } });
    router.back();
  };

  const addPhoto = (photo: string) => {
    const photos = draft?.photos ?? [];
    if (!photos.includes(photo))
      update({ photos: [...photos, photo].slice(0, 6) });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="close" size={25} color={theme.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {title}
        </Text>
        <Pressable onPress={() => router.back()} style={styles.doneButton}>
          <Text style={[styles.doneText, { color: theme.primary }]}>Done</Text>
        </Pressable>
      </View>

      {type === "photos" ? (
        <ScrollView contentContainerStyle={styles.photoGrid}>
          {PHOTO_OPTIONS.map((photo) => (
            <Pressable
              key={photo}
              style={[styles.photoCard, { borderColor: theme.border }]}
              onPress={() => addPhoto(photo)}
            >
              <Image source={{ uri: photo }} style={styles.photo} />
              {(draft?.photos ?? []).includes(photo) && (
                <View
                  style={[
                    styles.selectedMark,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Ionicons name="checkmark" size={18} color={theme.white} />
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      ) : isFreeTextField ? (
        <View style={styles.freeTextContainer}>
          <TextInput
            value={detailValue}
            onChangeText={setDetailValue}
            placeholder={
              params.field === "location"
                ? "Nhập thành phố"
                : params.field === "occupation"
                  ? "Nhập nghề nghiệp"
                  : "Chiều cao (cm)"
            }
            keyboardType={params.field === "height" ? "number-pad" : "default"}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={saveFreeTextDetail}
            style={styles.freeTextInput}
          />
          <Pressable
            onPress={saveFreeTextDetail}
            style={styles.saveDetailButton}
          >
            <Text style={styles.saveDetailButtonText}>Lưu</Text>
          </Pressable>
        </View>
      ) : type === "detail" ? (
        isMultiSelectDetail ? (
          <ScrollView contentContainerStyle={styles.chips}>
            {multiSelectOptions.map((option) => {
              const selected = selectedDetailValues.includes(option);
              return (
                <Pressable
                  key={option}
                  onPress={() => toggleDetailValue(option)}
                  style={[styles.chip, { backgroundColor: selected ? theme.primary : theme.surface, borderColor: selected ? theme.primary : theme.border }]}
                >
                  <Text style={[styles.chipText, { color: selected ? theme.white : theme.textPrimary }]}>{option}</Text>
                  {selected && <Ionicons name="checkmark" size={17} color={theme.white} />}
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.optionList}>
            {detailOptions.map((option) => (
              <Pressable
                key={option}
                style={[
                  styles.option,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => chooseDetail(option)}
              >
                <Text style={[styles.optionText, { color: theme.textPrimary }]}>
                  {option}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.textTertiary}
                />
              </Pressable>
            ))}
          </ScrollView>
        )
      ) : (
        <>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={theme.textTertiary}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={`Search ${type}...`}
              placeholderTextColor={theme.textTertiary}
              style={[styles.searchInput, { color: theme.textPrimary }]}
            />
          </View>
          <ScrollView contentContainerStyle={styles.chips}>
            {options.map((item) => {
              const isSelected = selected.includes(item);
              return (
                <Pressable
                  key={item}
                  onPress={() => toggleItem(item)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected
                        ? theme.primary
                        : theme.surface,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isSelected ? theme.white : theme.textPrimary },
                    ]}
                  >
                    {item}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={17} color={theme.white} />
                  )}
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
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...typography.h3 },
  doneButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  doneText: { ...typography.bodyBold },
  searchBox: {
    margin: spacing.base,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, ...typography.body },
  chips: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxl,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    minHeight: 44,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  chipText: { ...typography.bodySmall },
  optionList: { padding: spacing.base, gap: spacing.sm },
  option: {
    minHeight: 56,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.base,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionText: { ...typography.body },
  photoGrid: {
    padding: spacing.base,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  photoCard: {
    width: "47%",
    aspectRatio: 0.75,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
  },
  photo: { width: "100%", height: "100%" },
  selectedMark: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  freeTextContainer: {
    padding: spacing.base,
    gap: spacing.md,
  },
  freeTextInput: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    ...typography.body,
  },
  saveDetailButton: {
    minHeight: 50,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveDetailButtonText: {
    color: colors.white,
    ...typography.bodyBold,
  },
});
