import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  SectionList,
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

const vnAddressData = require("../assets/vn-address.json") as Record<
  string,
  string[]
>;

interface LanguageItem {
  code: string;
  name: string;
}

interface HobbyItem {
  id: string;
  name: string;
  category: string;
}

interface LifestyleItem {
  id: string;
  value: string;
}

interface LifestyleCategory {
  categoryId: string;
  categoryName: string;
  description: string;
  maxSelection: number;
  items: LifestyleItem[];
}

const languagesData = require("../assets/languages_list.json") as LanguageItem[];
const hobbiesData = require("../assets/hobbies_list.json") as HobbyItem[];
const petListData = require("../assets/pet_list.json") as string[];
const lifestylesData = require("../assets/lifestyles_list.json") as LifestyleCategory[];

const MAX_LANGUAGES = 10;
const MAX_INTERESTS = 10;

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
  const type = params.type ?? "interests";

  const isAddressField = type === "detail" && params.field === "location";
  const isPetField =
    type === "detail" && (params.field === "pets" || params.field === "pet");
  const isLifestyleField =
    type === "detail" &&
    (params.field === "exercise" || params.field === "lifestyle");
  const isFreeTextField =
    type === "detail" &&
    (params.field === "occupation" || params.field === "height");

  const [detailValue, setDetailValue] = useState(() => {
    const field = params.field;
    const details = draft?.details ?? user?.details;
    if (field === "occupation") return draft?.occupation ?? user?.occupation ?? "";
    if (field === "height") return (details?.height ?? "").replace(/\s*cm$/i, "");
    if (field === "pets") return details?.pets ?? "";
    if (field === "exercise") return details?.exercise ?? "";
    return "";
  });

  const [selectedPet, setSelectedPet] = useState<string>(() => {
    const details = draft?.details ?? user?.details;
    return details?.pets ?? "";
  });

  // ─── Lifestyle State ────────────────────────────────────────────────────────
  const [selectedLifestyles, setSelectedLifestyles] = useState<string[]>(() => {
    const details = draft?.details ?? user?.details;
    const raw = details?.exercise ?? "";
    return raw
      ? raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  });
  const [lifestyleSearchQuery, setLifestyleSearchQuery] = useState("");

  const filteredLifestyleCategories = useMemo(() => {
    const q = lifestyleSearchQuery.toLowerCase().trim();
    if (!q) return lifestylesData;
    return lifestylesData
      .map((cat) => {
        const matchesCategory =
          cat.categoryName.toLowerCase().includes(q) ||
          cat.description.toLowerCase().includes(q);
        const filteredItems = cat.items.filter(
          (item) =>
            item.value.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q),
        );
        if (matchesCategory) return cat;
        if (filteredItems.length > 0) {
          return { ...cat, items: filteredItems };
        }
        return null;
      })
      .filter((cat): cat is LifestyleCategory => cat !== null);
  }, [lifestyleSearchQuery]);

  // ─── Languages State ────────────────────────────────────────────────────────
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(() => {
    return draft?.languages ?? user?.languages ?? [];
  });
  const [langSearchQuery, setLangSearchQuery] = useState("");

  const filteredLanguages = useMemo(() => {
    if (!langSearchQuery.trim()) return languagesData;
    const q = langSearchQuery.toLowerCase().trim();
    return languagesData.filter((lang) =>
      lang.name.toLowerCase().includes(q),
    );
  }, [langSearchQuery]);

  const toggleLanguage = (langName: string) => {
    if (selectedLanguages.includes(langName)) {
      setSelectedLanguages((prev) => prev.filter((l) => l !== langName));
    } else {
      if (selectedLanguages.length >= MAX_LANGUAGES) {
        Alert.alert(
          "Giới hạn ngôn ngữ",
          `Bạn chỉ có thể chọn tối đa ${MAX_LANGUAGES} ngôn ngữ.`,
        );
        return;
      }
      setSelectedLanguages((prev) => [...prev, langName]);
    }
  };

  // ─── Hobbies / Interests State ─────────────────────────────────────────────
  const [selectedInterests, setSelectedInterests] = useState<string[]>(() => {
    return draft?.interests ?? user?.interests ?? [];
  });
  const [hobbySearchQuery, setHobbySearchQuery] = useState("");

  const hobbySections = useMemo(() => {
    const q = hobbySearchQuery.toLowerCase().trim();
    const categoryMap = new Map<string, HobbyItem[]>();
    for (const h of hobbiesData) {
      if (
        q &&
        !h.name.toLowerCase().includes(q) &&
        !h.category.toLowerCase().includes(q)
      ) {
        continue;
      }
      if (!categoryMap.has(h.category)) {
        categoryMap.set(h.category, []);
      }
      categoryMap.get(h.category)!.push(h);
    }
    return Array.from(categoryMap.entries()).map(([title, data]) => ({
      title,
      data,
    }));
  }, [hobbySearchQuery]);

  const toggleInterest = (hobbyName: string) => {
    if (selectedInterests.includes(hobbyName)) {
      setSelectedInterests((prev) => prev.filter((item) => item !== hobbyName));
    } else {
      if (selectedInterests.length >= MAX_INTERESTS) {
        Alert.alert(
          "Giới hạn sở thích",
          `Bạn chỉ có thể chọn tối đa ${MAX_INTERESTS} sở thích.`,
        );
        return;
      }
      setSelectedInterests((prev) => [...prev, hobbyName]);
    }
  };

  // ─── Address Picker State ──────────────────────────────────────────────────
  const [selectedCity, setSelectedCity] = useState(() => {
    if (draft?.city) return draft.city;
    if (user?.city) return user.city;
    const loc = draft?.location ?? user?.location ?? "";
    const allCitiesList = Object.keys(vnAddressData);
    const matched = allCitiesList.find((c) =>
      loc.toLowerCase().includes(c.toLowerCase()),
    );
    return matched ?? "";
  });

  const [selectedWard, setSelectedWard] = useState(() => {
    if (draft?.ward) return draft.ward;
    if (user?.ward) return user.ward;
    const loc = draft?.location ?? user?.location ?? "";
    const city = draft?.city ?? user?.city;
    if (city && vnAddressData[city]) {
      const matched = vnAddressData[city].find((w) =>
        loc.toLowerCase().includes(w.toLowerCase()),
      );
      return matched ?? "";
    }
    return "";
  });

  const [addressStep, setAddressStep] = useState<"city" | "ward">(() =>
    draft?.city || user?.city ? "ward" : "city",
  );
  const [addressSearchQuery, setAddressSearchQuery] = useState("");

  const allCities = useMemo(() => Object.keys(vnAddressData), []);
  const filteredCities = useMemo(() => {
    if (!addressSearchQuery.trim()) return allCities;
    const q = addressSearchQuery.toLowerCase().trim();
    return allCities.filter((c) => c.toLowerCase().includes(q));
  }, [allCities, addressSearchQuery]);

  const availableWards = useMemo(() => {
    if (!selectedCity || !vnAddressData[selectedCity]) return [];
    return vnAddressData[selectedCity];
  }, [selectedCity]);

  const filteredWards = useMemo(() => {
    if (!addressSearchQuery.trim()) return availableWards;
    const q = addressSearchQuery.toLowerCase().trim();
    return availableWards.filter((w) => w.toLowerCase().includes(q));
  }, [availableWards, addressSearchQuery]);

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    setSelectedWard("");
    setAddressSearchQuery("");
    setAddressStep("ward");
  };

  const handleSelectWard = (ward: string) => {
    setSelectedWard(ward);
  };

  // ─── Capitalized Field Title ───────────────────────────────────────────────
  const getFieldTitle = (field?: string) => {
    switch (field) {
      case "location":
        return "Address";
      case "occupation":
        return "Occupation";
      case "height":
        return "Height";
      case "education":
        return "Education";
      case "pets":
        return "Pets";
      case "exercise":
        return "Lifestyle";
      default:
        return field
          ? field.charAt(0).toUpperCase() + field.slice(1)
          : "Choose option";
    }
  };

  const title =
    type === "photos"
      ? "Photos"
      : isAddressField
        ? "Address"
        : type === "detail"
          ? getFieldTitle(params.field)
          : type === "languages"
            ? "Languages"
            : "My Interests";

  // ─── Header Done Handler ───────────────────────────────────────────────────
  const handleDone = () => {
    if (isAddressField) {
      const fullAddress = [selectedWard, selectedCity].filter(Boolean).join(", ");
      update({
        location: fullAddress,
        city: selectedCity || undefined,
        ward: selectedWard || undefined,
      });
      router.back();
      return;
    }

    if (type === "languages") {
      update({ languages: selectedLanguages });
      router.back();
      return;
    }

    if (type === "interests") {
      const selectedHobbies = hobbiesData.filter((h) =>
        selectedInterests.includes(h.name),
      );
      update({
        interests: selectedInterests,
        hobbies: selectedHobbies,
      });
      router.back();
      return;
    }

    if (isPetField) {
      const baseDetails = draft?.details ?? user?.details;
      if (baseDetails) {
        update({ details: { ...baseDetails, pets: selectedPet } });
      }
      router.back();
      return;
    }

    if (isLifestyleField) {
      const baseDetails = draft?.details ?? user?.details;
      if (baseDetails) {
        update({
          details: { ...baseDetails, exercise: selectedLifestyles.join(", ") },
        });
      }
      router.back();
      return;
    }

    if (isFreeTextField) {
      const field = params.field;
      const value = detailValue.trim();
      if (field === "occupation") {
        update({ occupation: value });
      } else if (field === "height") {
        if (value) {
          const centimeters = Number(value);
          if (
            !Number.isInteger(centimeters) ||
            centimeters < 100 ||
            centimeters > 250
          ) {
            Alert.alert(
              "Chiều cao không hợp lệ",
              "Nhập chiều cao từ 100 đến 250 cm.",
            );
            return;
          }
          const baseDetails = draft?.details ?? user?.details;
          if (baseDetails) {
            update({ details: { ...baseDetails, height: `${centimeters}cm` } });
          }
        } else {
          const baseDetails = draft?.details ?? user?.details;
          if (baseDetails) {
            update({ details: { ...baseDetails, height: "" } });
          }
        }
      }
      router.back();
      return;
    }

    router.back();
  };

  const selectPetBadge = (badge: string) => {
    const next = selectedPet === badge ? "" : badge;
    setSelectedPet(next);
    const baseDetails = draft?.details ?? user?.details;
    if (baseDetails) {
      update({ details: { ...baseDetails, pets: next } });
    }
  };

  const toggleLifestyleItem = (
    category: LifestyleCategory,
    itemValue: string,
  ) => {
    const isSelected = selectedLifestyles.includes(itemValue);
    if (isSelected) {
      const next = selectedLifestyles.filter((v) => v !== itemValue);
      setSelectedLifestyles(next);
      const baseDetails = draft?.details ?? user?.details;
      if (baseDetails) {
        update({ details: { ...baseDetails, exercise: next.join(", ") } });
      }
    } else {
      const categoryValues = category.items.map((i) => i.value);
      const selectedInCategory = selectedLifestyles.filter((v) =>
        categoryValues.includes(v),
      );

      if (selectedInCategory.length >= category.maxSelection) {
        Alert.alert(
          "Giới hạn lựa chọn",
          `Mục "${category.categoryName}" chỉ được chọn tối đa ${category.maxSelection} lựa chọn.`,
        );
        return;
      }

      const next = [...selectedLifestyles, itemValue];
      setSelectedLifestyles(next);
      const baseDetails = draft?.details ?? user?.details;
      if (baseDetails) {
        update({ details: { ...baseDetails, exercise: next.join(", ") } });
      }
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case "personality_energy":
        return "sparkles";
      case "daily_routine":
        return "time-outline";
      case "diet_nutrition":
        return "restaurant-outline";
      case "smoking_drinking":
        return "wine-outline";
      default:
        return "heart-outline";
    }
  };

  // ─── Other Detail Options (Education, etc.) ────────────────────────────────
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
          "Long-term relationship",
        ];

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
      {/* Header with capitalized title and Done button */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="close" size={25} color={theme.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {title}
        </Text>
        <Pressable onPress={handleDone} style={styles.doneButton}>
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
      ) : type === "languages" ? (
        <View style={styles.flex}>
          {/* Language search bar */}
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                marginTop: spacing.sm,
                marginBottom: spacing.xs,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={theme.textTertiary}
            />
            <TextInput
              value={langSearchQuery}
              onChangeText={setLangSearchQuery}
              placeholder="Tìm kiếm ngôn ngữ (Search languages)..."
              placeholderTextColor={theme.textTertiary}
              style={[styles.searchInput, { color: theme.textPrimary }]}
              autoCorrect={false}
            />
            {langSearchQuery.length > 0 && (
              <Pressable onPress={() => setLangSearchQuery("")} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={theme.textTertiary}
                />
              </Pressable>
            )}
          </View>

          {/* Selected count indicator */}
          <View style={styles.selectedCountRow}>
            <Ionicons name="globe-outline" size={16} color={theme.primary} />
            <Text
              style={[styles.selectedCountText, { color: theme.textSecondary }]}
            >
              Đã chọn:{" "}
              <Text style={{ color: theme.primary, fontWeight: "700" }}>
                {selectedLanguages.length}
              </Text>
              /{MAX_LANGUAGES} ngôn ngữ (Tối đa 10)
            </Text>
          </View>

          {/* Small text preview showing currently selected languages */}
          {selectedLanguages.length > 0 && (
            <View style={styles.selectedPreviewRow}>
              <Text
                numberOfLines={2}
                style={[
                  styles.selectedPreviewText,
                  { color: theme.textSecondary },
                ]}
              >
                <Text style={{ fontWeight: "600", color: theme.textPrimary }}>
                  Đang chọn:{" "}
                </Text>
                {selectedLanguages.join(", ")}
              </Text>
            </View>
          )}

          {/* Languages FlatList without code badges */}
          <FlatList
            data={filteredLanguages}
            keyExtractor={(item) => item.code}
            contentContainerStyle={styles.langList}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = selectedLanguages.includes(item.name);
              return (
                <Pressable
                  onPress={() => toggleLanguage(item.name)}
                  style={[
                    styles.langItem,
                    {
                      backgroundColor: isSelected
                        ? theme.surface
                        : theme.surface,
                      borderColor: isSelected ? theme.primary : theme.border,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.langItemText,
                      {
                        color: isSelected
                          ? theme.primary
                          : theme.textPrimary,
                        fontWeight: isSelected ? "700" : "500",
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Ionicons
                    name={
                      isSelected
                        ? "checkmark-circle"
                        : "ellipse-outline"
                    }
                    size={22}
                    color={isSelected ? theme.primary : theme.textTertiary}
                  />
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text
                  style={[styles.emptyText, { color: theme.textSecondary }]}
                >
                  Không tìm thấy ngôn ngữ nào phù hợp
                </Text>
              </View>
            }
          />
        </View>
      ) : type === "interests" ? (
        <View style={styles.flex}>
          {/* Hobbies / Interests search bar */}
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                marginTop: spacing.sm,
                marginBottom: spacing.xs,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={theme.textTertiary}
            />
            <TextInput
              value={hobbySearchQuery}
              onChangeText={setHobbySearchQuery}
              placeholder="Tìm kiếm sở thích (Search interests)..."
              placeholderTextColor={theme.textTertiary}
              style={[styles.searchInput, { color: theme.textPrimary }]}
              autoCorrect={false}
            />
            {hobbySearchQuery.length > 0 && (
              <Pressable onPress={() => setHobbySearchQuery("")} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={theme.textTertiary}
                />
              </Pressable>
            )}
          </View>

          {/* Selected count indicator */}
          <View style={styles.selectedCountRow}>
            <Ionicons name="sparkles-outline" size={16} color={theme.primary} />
            <Text
              style={[styles.selectedCountText, { color: theme.textSecondary }]}
            >
              Đã chọn:{" "}
              <Text style={{ color: theme.primary, fontWeight: "700" }}>
                {selectedInterests.length}
              </Text>
              /{MAX_INTERESTS} sở thích (Tối đa 10)
            </Text>
          </View>

          {/* Small text preview showing currently selected interests */}
          {selectedInterests.length > 0 && (
            <View style={styles.selectedPreviewRow}>
              <Text
                numberOfLines={2}
                style={[
                  styles.selectedPreviewText,
                  { color: theme.textSecondary },
                ]}
              >
                <Text style={{ fontWeight: "600", color: theme.textPrimary }}>
                  Đang chọn:{" "}
                </Text>
                {selectedInterests.join(", ")}
              </Text>
            </View>
          )}

          {/* Hobbies SectionList */}
          <SectionList
            sections={hobbySections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.hobbyList}
            stickySectionHeadersEnabled={false}
            keyboardShouldPersistTaps="handled"
            renderSectionHeader={({ section: { title: sectionTitle } }) => (
              <View
                style={[
                  styles.sectionHeaderBox,
                  { backgroundColor: theme.background },
                ]}
              >
                <Text
                  style={[
                    styles.sectionHeaderText,
                    { color: theme.primary },
                  ]}
                >
                  {sectionTitle}
                </Text>
              </View>
            )}
            renderItem={({ item }) => {
              const isSelected = selectedInterests.includes(item.name);
              return (
                <Pressable
                  onPress={() => toggleInterest(item.name)}
                  style={[
                    styles.hobbyItem,
                    {
                      backgroundColor: isSelected
                        ? theme.surface
                        : theme.surface,
                      borderColor: isSelected ? theme.primary : theme.border,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.hobbyItemText,
                      {
                        color: isSelected
                          ? theme.primary
                          : theme.textPrimary,
                        fontWeight: isSelected ? "700" : "500",
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Ionicons
                    name={
                      isSelected
                        ? "checkmark-circle"
                        : "ellipse-outline"
                    }
                    size={22}
                    color={isSelected ? theme.primary : theme.textTertiary}
                  />
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text
                  style={[styles.emptyText, { color: theme.textSecondary }]}
                >
                  Không tìm thấy sở thích nào phù hợp
                </Text>
              </View>
            }
          />
        </View>
      ) : isAddressField ? (
        <View style={styles.addressContainer}>
          {/* 2 Step Pickers Selector Header */}
          <View style={styles.addressStepRow}>
            {/* Step 1: City */}
            <Pressable
              onPress={() => {
                setAddressStep("city");
                setAddressSearchQuery("");
              }}
              style={[
                styles.stepCard,
                {
                  backgroundColor:
                    addressStep === "city" ? theme.surface : theme.background,
                  borderColor:
                    addressStep === "city" ? theme.primary : theme.border,
                },
              ]}
            >
              <View style={styles.stepHeader}>
                <Ionicons
                  name="business-outline"
                  size={16}
                  color={
                    addressStep === "city" ? theme.primary : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.stepNumber,
                    {
                      color:
                        addressStep === "city"
                          ? theme.primary
                          : theme.textSecondary,
                    },
                  ]}
                >
                  1. Tỉnh / TP
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.stepValue,
                  {
                    color: selectedCity ? theme.textPrimary : theme.textTertiary,
                    fontWeight: selectedCity ? "600" : "400",
                  },
                ]}
              >
                {selectedCity || "Chọn Tỉnh / TP"}
              </Text>
            </Pressable>

            {/* Step 2: Ward */}
            <Pressable
              onPress={() => {
                if (!selectedCity) {
                  Alert.alert(
                    "Chọn Tỉnh/Thành phố trước",
                    "Bạn cần chọn Tỉnh hoặc Thành phố trước khi chọn Xã / Phường.",
                  );
                  return;
                }
                setAddressStep("ward");
                setAddressSearchQuery("");
              }}
              style={[
                styles.stepCard,
                {
                  backgroundColor:
                    addressStep === "ward" ? theme.surface : theme.background,
                  borderColor:
                    addressStep === "ward" ? theme.primary : theme.border,
                  opacity: selectedCity ? 1 : 0.6,
                },
              ]}
            >
              <View style={styles.stepHeader}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={
                    addressStep === "ward" ? theme.primary : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.stepNumber,
                    {
                      color:
                        addressStep === "ward"
                          ? theme.primary
                          : theme.textSecondary,
                    },
                  ]}
                >
                  2. Xã / Phường
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.stepValue,
                  {
                    color: selectedWard ? theme.textPrimary : theme.textTertiary,
                    fontWeight: selectedWard ? "600" : "400",
                  },
                ]}
              >
                {selectedWard ||
                  (selectedCity ? "Chọn Xã / Phường" : "Cần chọn Tỉnh/TP")}
              </Text>
            </Pressable>
          </View>

          {/* Search Bar */}
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                marginTop: spacing.sm,
                marginBottom: spacing.xs,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={theme.textTertiary}
            />
            <TextInput
              value={addressSearchQuery}
              onChangeText={setAddressSearchQuery}
              placeholder={
                addressStep === "city"
                  ? "Tìm kiếm Tỉnh / Thành phố..."
                  : `Tìm kiếm Xã / Phường tại ${selectedCity}...`
              }
              placeholderTextColor={theme.textTertiary}
              style={[styles.searchInput, { color: theme.textPrimary }]}
              autoCorrect={false}
            />
            {addressSearchQuery.length > 0 && (
              <Pressable onPress={() => setAddressSearchQuery("")} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={theme.textTertiary}
                />
              </Pressable>
            )}
          </View>

          {/* List Content */}
          {addressStep === "city" ? (
            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.addressList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = item === selectedCity;
                const wardCount = vnAddressData[item]?.length ?? 0;
                return (
                  <Pressable
                    onPress={() => handleSelectCity(item)}
                    style={[
                      styles.addressItem,
                      {
                        backgroundColor: isSelected
                          ? theme.surface
                          : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                        borderWidth: isSelected ? 1.5 : 1,
                      },
                    ]}
                  >
                    <View style={styles.addressItemContent}>
                      <Text
                        style={[
                          styles.addressItemText,
                          {
                            color: isSelected ? theme.primary : theme.textPrimary,
                            fontWeight: isSelected ? "700" : "500",
                          },
                        ]}
                      >
                        {item}
                      </Text>
                      <Text
                        style={[
                          styles.addressItemSub,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {wardCount} xã / phường
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "chevron-forward"}
                      size={20}
                      color={isSelected ? theme.primary : theme.textTertiary}
                    />
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text
                    style={[
                      styles.emptyText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Không tìm thấy tỉnh / thành phố phù hợp
                  </Text>
                </View>
              }
            />
          ) : !selectedCity ? (
            <View style={styles.addressPromptBox}>
              <Ionicons
                name="map-outline"
                size={48}
                color={theme.textTertiary}
              />
              <Text
                style={[
                  styles.addressPromptTitle,
                  { color: theme.textPrimary },
                ]}
              >
                Chưa chọn Tỉnh / Thành phố
              </Text>
              <Text
                style={[
                  styles.addressPromptSub,
                  { color: theme.textSecondary },
                ]}
              >
                Vui lòng chọn Tỉnh hoặc Thành phố trước để hiển thị danh sách xã / phường tương ứng.
              </Text>
              <Pressable
                onPress={() => setAddressStep("city")}
                style={[
                  styles.chooseCityButton,
                  { backgroundColor: theme.primary },
                ]}
              >
                <Text style={styles.chooseCityButtonText}>
                  Chọn Tỉnh / Thành phố
                </Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={filteredWards}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.addressList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = item === selectedWard;
                return (
                  <Pressable
                    onPress={() => handleSelectWard(item)}
                    style={[
                      styles.addressItem,
                      {
                        backgroundColor: isSelected
                          ? theme.surface
                          : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                        borderWidth: isSelected ? 1.5 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.addressItemText,
                        {
                          color: isSelected ? theme.primary : theme.textPrimary,
                          fontWeight: isSelected ? "700" : "500",
                        },
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={theme.primary}
                      />
                    )}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text
                    style={[
                      styles.emptyText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Không tìm thấy xã / phường nào phù hợp tại {selectedCity}
                  </Text>
                </View>
              }
            />
          )}

          {/* Compact bottom preview - No Save Button */}
          <View
            style={[
              styles.addressPreviewBar,
              { backgroundColor: theme.surface, borderTopColor: theme.border },
            ]}
          >
            <Ionicons name="location-sharp" size={18} color={theme.primary} />
            <Text
              numberOfLines={1}
              style={[
                styles.addressPreviewBarText,
                {
                  color: selectedCity ? theme.textPrimary : theme.textSecondary,
                },
              ]}
            >
              {[selectedWard, selectedCity].filter(Boolean).join(", ") ||
                "Chưa chọn địa chỉ"}
            </Text>
          </View>
        </View>
      ) : isFreeTextField ? (
        <View style={styles.freeTextContainer}>
          <Text style={[styles.freeTextHint, { color: theme.textSecondary }]}>
            {params.field === "occupation"
              ? "Nhập nghề nghiệp hoặc vị trí công việc của bạn. Nhấn 'Done' ở góc phải trên để lưu."
              : "Nhập chiều cao tính bằng cm (từ 100 đến 250). Nhấn 'Done' ở góc phải trên để lưu."}
          </Text>
          <TextInput
            value={detailValue}
            onChangeText={setDetailValue}
            placeholder={
              params.field === "occupation"
                ? "Nghề nghiệp (Occupation)"
                : "Chiều cao (cm)"
            }
            placeholderTextColor={theme.textTertiary}
            keyboardType={params.field === "height" ? "number-pad" : "default"}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleDone}
            style={[
              styles.freeTextInput,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.textPrimary,
              },
            ]}
          />
        </View>
      ) : isPetField ? (
        <ScrollView contentContainerStyle={styles.petBadgeContainer}>
          <Text
            style={[styles.petBadgeSubtitle, { color: theme.textSecondary }]}
          >
            Chọn 1 lựa chọn về thú cưng phù hợp với bạn:
          </Text>
          <View style={styles.petBadgeWrap}>
            {petListData.map((badge) => {
              const isSelected = selectedPet === badge;
              return (
                <Pressable
                  key={badge}
                  onPress={() => selectPetBadge(badge)}
                  style={[
                    styles.petBadge,
                    {
                      backgroundColor: isSelected
                        ? theme.primary
                        : theme.surface,
                      borderColor: isSelected
                        ? theme.primary
                        : theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="paw"
                    size={16}
                    color={isSelected ? theme.white : theme.primary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.petBadgeText,
                      {
                        color: isSelected ? theme.white : theme.textPrimary,
                        fontWeight: isSelected ? "700" : "500",
                      },
                    ]}
                  >
                    {badge}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={theme.white}
                      style={{ marginLeft: 6 }}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      ) : isLifestyleField ? (
        <View style={styles.flex}>
          {/* Lifestyle search bar */}
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                marginTop: spacing.sm,
                marginBottom: spacing.xs,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={theme.textTertiary}
            />
            <TextInput
              value={lifestyleSearchQuery}
              onChangeText={setLifestyleSearchQuery}
              placeholder="Tìm kiếm phong cách sống..."
              placeholderTextColor={theme.textTertiary}
              style={[styles.searchInput, { color: theme.textPrimary }]}
              autoCorrect={false}
            />
            {lifestyleSearchQuery.length > 0 && (
              <Pressable
                onPress={() => setLifestyleSearchQuery("")}
                hitSlop={8}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={theme.textTertiary}
                />
              </Pressable>
            )}
          </View>

          {/* Selected count indicator */}
          <View style={styles.selectedCountRow}>
            <Ionicons name="sparkles-outline" size={16} color={theme.primary} />
            <Text
              style={[styles.selectedCountText, { color: theme.textSecondary }]}
            >
              Đã chọn:{" "}
              <Text style={{ color: theme.primary, fontWeight: "700" }}>
                {selectedLifestyles.length}
              </Text>{" "}
              mục phong cách sống
            </Text>
          </View>

          {/* Small text preview showing currently selected lifestyles */}
          {selectedLifestyles.length > 0 && (
            <View style={styles.selectedPreviewRow}>
              <Text
                numberOfLines={2}
                style={[
                  styles.selectedPreviewText,
                  { color: theme.textSecondary },
                ]}
              >
                <Text style={{ fontWeight: "600", color: theme.textPrimary }}>
                  Đang chọn:{" "}
                </Text>
                {selectedLifestyles.join(", ")}
              </Text>
            </View>
          )}

          {/* FlatList rendering Category Sections */}
          <FlatList
            data={filteredLifestyleCategories}
            keyExtractor={(item) => item.categoryId}
            contentContainerStyle={styles.lifestyleList}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: category }) => {
              const categoryValues = category.items.map((i) => i.value);
              const selectedCount = selectedLifestyles.filter((v) =>
                categoryValues.includes(v),
              ).length;
              const isLimitReached = selectedCount >= category.maxSelection;

              return (
                <View
                  style={[
                    styles.lifestyleSectionCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {/* Category Header */}
                  <View style={styles.lifestyleSectionHeader}>
                    <View style={styles.lifestyleTitleRow}>
                      <View
                        style={[
                          styles.lifestyleIconContainer,
                          { backgroundColor: theme.primaryLight },
                        ]}
                      >
                        <Ionicons
                          name={getCategoryIcon(category.categoryId) as any}
                          size={18}
                          color={theme.primary}
                        />
                      </View>
                      <View style={styles.lifestyleHeaderTextWrap}>
                        <Text
                          style={[
                            styles.lifestyleCategoryTitle,
                            { color: theme.textPrimary },
                          ]}
                        >
                          {category.categoryName}
                        </Text>
                        <Text
                          style={[
                            styles.lifestyleCategoryDesc,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {category.description}
                        </Text>
                      </View>
                    </View>

                    {/* Limit badge */}
                    <View
                      style={[
                        styles.lifestyleLimitBadge,
                        {
                          backgroundColor: isLimitReached
                            ? theme.primaryLight
                            : theme.surface,
                          borderColor: isLimitReached
                            ? theme.primary
                            : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.lifestyleLimitBadgeText,
                          {
                            color: isLimitReached
                              ? theme.primary
                              : theme.textSecondary,
                            fontWeight: isLimitReached ? "700" : "500",
                          },
                        ]}
                      >
                        {selectedCount}/{category.maxSelection}
                      </Text>
                    </View>
                  </View>

                  {/* Badges / Chips */}
                  <View style={styles.lifestyleBadgesWrap}>
                    {category.items.map((item) => {
                      const isSelected = selectedLifestyles.includes(item.value);
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() =>
                            toggleLifestyleItem(category, item.value)
                          }
                          style={[
                            styles.lifestyleBadge,
                            {
                              backgroundColor: isSelected
                                ? theme.primary
                                : theme.background,
                              borderColor: isSelected
                                ? theme.primary
                                : theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.lifestyleBadgeText,
                              {
                                color: isSelected
                                  ? theme.white
                                  : theme.textPrimary,
                                fontWeight: isSelected ? "700" : "500",
                              },
                            ]}
                          >
                            {item.value}
                          </Text>
                          {isSelected && (
                            <Ionicons
                              name="checkmark"
                              size={15}
                              color={theme.white}
                              style={{ marginLeft: 5 }}
                            />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text
                  style={[styles.emptyText, { color: theme.textSecondary }]}
                >
                  Không tìm thấy phong cách sống nào phù hợp
                </Text>
              </View>
            }
          />
        </View>
      ) : (
        /* Other detail fields: education, etc. */
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
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
    paddingRight: 4,
  },
  doneText: { ...typography.bodyBold },
  searchBox: {
    marginHorizontal: spacing.base,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, ...typography.body },
  chips: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
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
  // Free text styles (Occupation, Height)
  freeTextContainer: {
    padding: spacing.base,
    gap: spacing.md,
  },
  freeTextHint: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  freeTextInput: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    ...typography.body,
  },
  // Selected counter & preview
  selectedCountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  selectedCountText: {
    ...typography.caption,
  },
  selectedPreviewRow: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xs,
  },
  selectedPreviewText: {
    ...typography.caption,
    lineHeight: 16,
  },
  // Languages styles
  langList: {
    paddingHorizontal: spacing.base,
    paddingBottom: 40,
    gap: spacing.xs,
  },
  langItem: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  langItemText: {
    ...typography.body,
    flex: 1,
    marginRight: spacing.sm,
  },
  // Hobbies SectionList styles
  sectionHeaderBox: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionHeaderText: {
    ...typography.bodyBold,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hobbyList: {
    paddingHorizontal: spacing.base,
    paddingBottom: 40,
    gap: spacing.xs,
  },
  hobbyItem: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hobbyItemText: {
    ...typography.body,
    flex: 1,
    marginRight: spacing.sm,
  },
  // Address Picker Styles
  addressContainer: {
    flex: 1,
  },
  addressStepRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  stepCard: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    justifyContent: "center",
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  stepNumber: {
    ...typography.caption,
    fontWeight: "700",
  },
  stepValue: {
    ...typography.bodySmall,
  },
  addressList: {
    paddingHorizontal: spacing.base,
    paddingBottom: 70,
    gap: spacing.xs,
  },
  addressItem: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addressItemContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  addressItemText: {
    ...typography.body,
  },
  addressItemSub: {
    ...typography.caption,
    marginTop: 2,
  },
  addressPromptBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  addressPromptTitle: {
    ...typography.h3,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  addressPromptSub: {
    ...typography.bodySmall,
    textAlign: "center",
    lineHeight: 20,
  },
  chooseCityButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  chooseCityButtonText: {
    ...typography.bodyBold,
    color: colors.white,
  },
  addressPreviewBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    gap: spacing.xs,
  },
  addressPreviewBarText: {
    ...typography.bodySmall,
    flex: 1,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    ...typography.bodySmall,
    textAlign: "center",
  },
  petBadgeContainer: {
    padding: spacing.base,
    paddingBottom: 40,
  },
  petBadgeSubtitle: {
    ...typography.bodySmall,
    marginBottom: spacing.base,
  },
  petBadgeWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  petBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  petBadgeText: {
    ...typography.body,
    fontSize: 14,
  },
  lifestyleList: {
    padding: spacing.base,
    paddingBottom: 40,
    gap: spacing.md,
  },
  lifestyleSectionCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  lifestyleSectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  lifestyleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
  },
  lifestyleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  lifestyleHeaderTextWrap: {
    flex: 1,
  },
  lifestyleCategoryTitle: {
    ...typography.bodyBold,
    fontSize: 15,
    marginBottom: 2,
  },
  lifestyleCategoryDesc: {
    ...typography.caption,
  },
  lifestyleLimitBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  lifestyleLimitBadgeText: {
    fontSize: 12,
  },
  lifestyleBadgesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs + 2,
  },
  lifestyleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  lifestyleBadgeText: {
    ...typography.bodySmall,
    fontSize: 13,
  },
});
