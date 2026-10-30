import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  borderRadius,
  colors,
  darkColors,
  spacing,
  typography,
} from "../theme";
import { useAuthStore } from "../store/authStore";
import { useProfileEditStore } from "../store/profileEditStore";
import { useThemeStore } from "../store/themeStore";

const vnAddressData = require("../../assets/vn-address.json") as Record<
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

const languagesData = require("../../assets/languages_list.json") as LanguageItem[];
const hobbiesData = require("../../assets/hobbies_list.json") as HobbyItem[];
const petListData = require("../../assets/pet_list.json") as string[];
const lifestylesData = require("../../assets/lifestyles_list.json") as LifestyleCategory[];

const MAX_LANGUAGES = 10;
const MAX_INTERESTS = 10;

const PHOTO_OPTIONS = [
  "https://picsum.photos/seed/profile-new-1/500/700",
  "https://picsum.photos/seed/profile-new-2/500/700",
  "https://picsum.photos/seed/profile-new-3/500/700",
  "https://picsum.photos/seed/profile-new-4/500/700",
];

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.86, 740);

export interface ProfilePickerModalProps {
  visible: boolean;
  type: string;
  field?: string;
  onClose: () => void;
}

export default function ProfilePickerModal({
  visible,
  type,
  field,
  onClose,
}: ProfilePickerModalProps) {
  if (!visible) return null;

  return (
    <ProfilePickerSheetContent
      key={`${type}-${field ?? ""}`}
      type={type}
      field={field}
      onClose={onClose}
    />
  );
}

function ProfilePickerSheetContent({
  type,
  field,
  onClose,
}: {
  type: string;
  field?: string;
  onClose: () => void;
}) {
  const themeMode = useThemeStore((state) => state.mode);
  const theme = themeMode === "dark" ? darkColors : colors;
  const draft = useProfileEditStore((state) => state.draft);
  const update = useProfileEditStore((state) => state.update);
  const user = useAuthStore((state) => state.user);

  // Field flags
  const isAddressField = type === "detail" && field === "location";
  const isPetField = type === "detail" && (field === "pets" || field === "pet");
  const isLifestyleField =
    type === "detail" && (field === "exercise" || field === "lifestyle");
  const isFreeTextField =
    type === "detail" && (field === "occupation" || field === "height");

  const details = draft?.details ?? user?.details;

  // Animation values
  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(SHEET_HEIGHT);

  // ─── Local Temporary State (Cancelled on Cancel, Saved on Done) ───────────
  const [tempOccupation, setTempOccupation] = useState(
    () => draft?.occupation ?? user?.occupation ?? "",
  );
  const [tempHeight, setTempHeight] = useState(() =>
    (details?.height ?? "").replace(/\s*cm$/i, ""),
  );
  const [tempEducation, setTempEducation] = useState(
    () =>
      draft?.education ??
      user?.education ??
      details?.education ??
      "",
  );
  const [tempPets, setTempPets] = useState<string[]>(() =>
    (details?.pets ?? "").split(",").map((pet) => pet.trim()).filter(Boolean),
  );
  const [tempPhotos, setTempPhotos] = useState<string[]>(
    () => draft?.photos ?? user?.photos ?? [],
  );
  const [tempLanguages, setTempLanguages] = useState<string[]>(
    () => draft?.languages ?? user?.languages ?? [],
  );
  const [tempInterests, setTempInterests] = useState<string[]>(
    () => draft?.interests ?? user?.interests ?? [],
  );
  const [tempLifestyles, setTempLifestyles] = useState<string[]>(() => {
    const rawLifestyle = details?.exercise ?? "";
    return rawLifestyle
      ? rawLifestyle
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  });

  const cityVal = draft?.city ?? user?.city ?? "";
  const wardVal = draft?.ward ?? user?.ward ?? "";
  const [tempCity, setTempCity] = useState(cityVal);
  const [tempWard, setTempWard] = useState(wardVal);
  const [addressStep, setAddressStep] = useState<"city" | "ward">(() =>
    cityVal ? "ward" : "city",
  );

  // Search states
  const [langSearch, setLangSearch] = useState("");
  const [hobbySearch, setHobbySearch] = useState("");
  const [lifestyleSearch, setLifestyleSearch] = useState("");
  const [addressSearch, setAddressSearch] = useState("");

  // Slide Up Animation on mount
  useEffect(() => {
    backdropOpacity.set(withTiming(0.5, { duration: 250 }));
    sheetTranslateY.set(
      withSpring(0, {
        damping: 22,
        stiffness: 240,
        mass: 0.85,
      }),
    );
  }, [backdropOpacity, sheetTranslateY]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const animateClose = (callback: () => void) => {
    backdropOpacity.set(withTiming(0, { duration: 180 }));
    sheetTranslateY.set(
      withTiming(
        SHEET_HEIGHT,
        { duration: 220, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) {
            runOnJS(callback)();
          }
        },
      ),
    );
  };

  const handleFinishModal = () => {
    onClose();
  };

  // ─── CANCEL HANDLER: Discards temporary state ──────────────────────────────
  const handleCancel = () => {
    animateClose(handleFinishModal);
  };

  // ─── DONE HANDLER: Validates and commits temporary state to draft ──────────
  const handleDone = () => {
    const baseDetails = draft?.details ?? user?.details;

    if (isAddressField) {
      const fullAddress = [tempWard, tempCity].filter(Boolean).join(", ");
      update({
        location: fullAddress,
        city: tempCity || undefined,
        ward: tempWard || undefined,
      });
      animateClose(handleFinishModal);
      return;
    }

    if (type === "photos") {
      update({ photos: tempPhotos });
      animateClose(handleFinishModal);
      return;
    }

    if (type === "languages") {
      update({ languages: tempLanguages });
      animateClose(handleFinishModal);
      return;
    }

    if (type === "interests") {
      const selectedHobbies = hobbiesData.filter((h) =>
        tempInterests.includes(h.name),
      );
      update({
        interests: tempInterests,
        hobbies: selectedHobbies,
      });
      animateClose(handleFinishModal);
      return;
    }

    if (isPetField) {
      if (baseDetails) {
        update({ details: { ...baseDetails, pets: tempPets.join(", ") } });
      }
      animateClose(handleFinishModal);
      return;
    }

    if (isLifestyleField) {
      if (baseDetails) {
        update({
          details: { ...baseDetails, exercise: tempLifestyles.join(", ") },
        });
      }
      animateClose(handleFinishModal);
      return;
    }

    if (isFreeTextField) {
      if (field === "occupation") {
        update({ occupation: tempOccupation.trim() });
      } else if (field === "height") {
        const val = tempHeight.trim();
        if (val) {
          const cm = Number(val);
          if (!Number.isInteger(cm) || cm < 100 || cm > 250) {
            Alert.alert(
              "Chiều cao không hợp lệ",
              "Nhập chiều cao từ 100 đến 250 cm.",
            );
            return;
          }
          if (baseDetails) {
            update({ details: { ...baseDetails, height: `${cm}cm` } });
          }
        } else {
          if (baseDetails) {
            update({ details: { ...baseDetails, height: "" } });
          }
        }
      }
      animateClose(handleFinishModal);
      return;
    }

    if (field === "education") {
      update({
        education: tempEducation,
        details: baseDetails
          ? { ...baseDetails, education: tempEducation }
          : undefined,
      });
      animateClose(handleFinishModal);
      return;
    }

    animateClose(handleFinishModal);
  };

  // ─── Modal Title ───────────────────────────────────────────────────────────
  const title = useMemo(() => {
    if (type === "photos") return "Photos";
    if (isAddressField) return "Address";
    if (type === "languages") return "Languages";
    if (type === "interests") return "My Interests";
    if (isLifestyleField) return "Lifestyle";
    if (isPetField) return "Pets";
    if (field === "occupation") return "Occupation";
    if (field === "height") return "Height";
    if (field === "education") return "Education";
    return field ? field.charAt(0).toUpperCase() + field.slice(1) : "Options";
  }, [type, isAddressField, isLifestyleField, isPetField, field]);

  // ─── Filtered Lists for Pickers ───────────────────────────────────────────
  const filteredLanguages = useMemo(() => {
    if (!langSearch.trim()) return languagesData;
    const q = langSearch.toLowerCase().trim();
    return languagesData.filter((l) => l.name.toLowerCase().includes(q));
  }, [langSearch]);

  const hobbySections = useMemo(() => {
    const q = hobbySearch.toLowerCase().trim();
    const map = new Map<string, HobbyItem[]>();
    for (const h of hobbiesData) {
      if (
        q &&
        !h.name.toLowerCase().includes(q) &&
        !h.category.toLowerCase().includes(q)
      ) {
        continue;
      }
      if (!map.has(h.category)) map.set(h.category, []);
      map.get(h.category)!.push(h);
    }
    return Array.from(map.entries()).map(([secTitle, data]) => ({
      title: secTitle,
      data,
    }));
  }, [hobbySearch]);

  const filteredLifestyleCategories = useMemo(() => {
    const q = lifestyleSearch.toLowerCase().trim();
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
  }, [lifestyleSearch]);

  const availableCities = useMemo(() => {
    const all = Object.keys(vnAddressData);
    if (!addressSearch.trim()) return all;
    const q = addressSearch.toLowerCase().trim();
    return all.filter((c) => c.toLowerCase().includes(q));
  }, [addressSearch]);

  const availableWards = useMemo(() => {
    if (!tempCity || !vnAddressData[tempCity]) return [];
    return vnAddressData[tempCity];
  }, [tempCity]);

  const filteredWards = useMemo(() => {
    if (!addressSearch.trim()) return availableWards;
    const q = addressSearch.toLowerCase().trim();
    return availableWards.filter((w) => w.toLowerCase().includes(q));
  }, [availableWards, addressSearch]);

  // ─── Item Toggle Handlers (Updating Temp State Only) ───────────────────────
  const toggleLanguage = (langName: string) => {
    if (tempLanguages.includes(langName)) {
      setTempLanguages((prev) => prev.filter((l) => l !== langName));
    } else {
      if (tempLanguages.length >= MAX_LANGUAGES) {
        Alert.alert(
          "Giới hạn ngôn ngữ",
          `Bạn chỉ có thể chọn tối đa ${MAX_LANGUAGES} ngôn ngữ.`,
        );
        return;
      }
      setTempLanguages((prev) => [...prev, langName]);
    }
  };

  const toggleInterest = (hobbyName: string) => {
    if (tempInterests.includes(hobbyName)) {
      setTempInterests((prev) => prev.filter((h) => h !== hobbyName));
    } else {
      if (tempInterests.length >= MAX_INTERESTS) {
        Alert.alert(
          "Giới hạn sở thích",
          `Bạn chỉ có thể chọn tối đa ${MAX_INTERESTS} sở thích.`,
        );
        return;
      }
      setTempInterests((prev) => [...prev, hobbyName]);
    }
  };

  const toggleLifestyleItem = (
    category: LifestyleCategory,
    itemValue: string,
  ) => {
    const isSelected = tempLifestyles.includes(itemValue);
    if (isSelected) {
      setTempLifestyles((prev) => prev.filter((v) => v !== itemValue));
    } else {
      const categoryValues = category.items.map((i) => i.value);
      const selectedInCategory = tempLifestyles.filter((v) =>
        categoryValues.includes(v),
      );

      // Single-select category: smoothly switch to new choice
      if (category.maxSelection === 1) {
        setTempLifestyles((prev) => {
          const filtered = prev.filter((v) => !categoryValues.includes(v));
          return [...filtered, itemValue];
        });
        return;
      }

      // Multi-select category: enforce maxSelection
      if (selectedInCategory.length >= category.maxSelection) {
        Alert.alert(
          "Giới hạn lựa chọn",
          `Mục "${category.categoryName}" chỉ được chọn tối đa ${category.maxSelection} lựa chọn.`,
        );
        return;
      }

      setTempLifestyles((prev) => [...prev, itemValue]);
    }
  };

  const selectPetBadge = (badge: string) => {
    setTempPets((previous) => {
      if (previous.includes(badge)) return previous.filter((pet) => pet !== badge);
      if (badge === "Không nuôi thú cưng") return [badge];
      return [...previous.filter((pet) => pet !== "Không nuôi thú cưng"), badge];
    });
  };

  const addPhoto = (photo: string) => {
    if (!tempPhotos.includes(photo)) {
      setTempPhotos((prev) => [...prev, photo].slice(0, 6));
    }
  };

  const removePhoto = (photo: string) => {
    setTempPhotos((prev) => prev.filter((p) => p !== photo));
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

  const detailOptions =
    field === "education"
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

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalRoot}>
        {/* Backdrop: Tapping outside commits Done & closes */}
        <Animated.View
          style={[styles.backdrop, animatedBackdropStyle]}
          pointerEvents="auto"
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleDone}
            accessibilityLabel="Done and close"
          />
        </Animated.View>

        {/* Bottom Sheet Animated Panel */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.sheetContainer}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.bottomSheet,
              { backgroundColor: theme.background },
              animatedSheetStyle,
            ]}
          >
            {/* Top Drag Handle Indicator */}
            <View style={styles.handleBarWrap}>
              <View
                style={[styles.handleBar, { backgroundColor: theme.border }]}
              />
            </View>

            {/* Modal Header: Cancel on Left, Title in Center, Done on Right */}
            <View
              style={[styles.header, { borderBottomColor: theme.border }]}
            >
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.headerBtn}
                hitSlop={8}
                accessibilityLabel="Cancel changes"
              >
                <Text
                  style={[styles.cancelText, { color: theme.textSecondary }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <Text
                style={[styles.headerTitle, { color: theme.textPrimary }]}
                numberOfLines={1}
              >
                {title}
              </Text>

              <TouchableOpacity
                onPress={handleDone}
                style={styles.headerBtn}
                hitSlop={8}
                accessibilityLabel="Done and save changes"
              >
                <Text style={[styles.doneText, { color: theme.primary }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            {/* ─── Content Bodies ────────────────────────────────────────── */}
            <View style={styles.contentBody}>
              {/* 1. Photos */}
              {type === "photos" ? (
                <ScrollView contentContainerStyle={styles.scrollPadding}>
                  <Text
                    style={[styles.helper, { color: theme.textSecondary }]}
                  >
                    Select photos to add to your profile (max 6):
                  </Text>
                  <View style={styles.photoGrid}>
                    {tempPhotos.map((photo) => (
                      <View key={photo} style={styles.photoThumbWrap}>
                        <Image
                          source={{ uri: photo }}
                          style={styles.photoThumb}
                        />
                        {tempPhotos.length > 1 && (
                          <TouchableOpacity
                            style={styles.removePhotoBtn}
                            onPress={() => removePhoto(photo)}
                          >
                            <Ionicons name="close" size={14} color="#fff" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>

                  <Text
                    style={[
                      styles.sectionHeading,
                      { color: theme.textPrimary },
                    ]}
                  >
                    Suggestions
                  </Text>
                  <View style={styles.suggestionsGrid}>
                    {PHOTO_OPTIONS.map((item) => {
                      const isAdded = tempPhotos.includes(item);
                      return (
                        <TouchableOpacity
                          key={item}
                          onPress={() =>
                            isAdded ? removePhoto(item) : addPhoto(item)
                          }
                          style={[
                            styles.suggestionItem,
                            isAdded && { borderColor: theme.primary, borderWidth: 2 },
                          ]}
                        >
                          <Image
                            source={{ uri: item }}
                            style={styles.suggestionThumb}
                          />
                          {isAdded && (
                            <View style={styles.photoCheckedOverlay}>
                              <Ionicons
                                name="checkmark-circle"
                                size={22}
                                color={theme.primary}
                              />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              ) : type === "languages" ? (
                /* 2. Languages Picker */
                <View style={styles.flex}>
                  <View
                    style={[
                      styles.searchBox,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="search-outline"
                      size={18}
                      color={theme.textTertiary}
                    />
                    <TextInput
                      value={langSearch}
                      onChangeText={setLangSearch}
                      placeholder="Tìm kiếm ngôn ngữ..."
                      placeholderTextColor={theme.textTertiary}
                      style={[styles.searchInput, { color: theme.textPrimary }]}
                      autoCorrect={false}
                    />
                    {langSearch.length > 0 && (
                      <Pressable onPress={() => setLangSearch("")} hitSlop={8}>
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color={theme.textTertiary}
                        />
                      </Pressable>
                    )}
                  </View>

                  <View style={styles.countBadgeRow}>
                    <Ionicons
                      name="globe-outline"
                      size={16}
                      color={theme.primary}
                    />
                    <Text
                      style={[
                        styles.countBadgeText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Đã chọn:{" "}
                      <Text style={{ color: theme.primary, fontWeight: "700" }}>
                        {tempLanguages.length}
                      </Text>
                      /{MAX_LANGUAGES} ngôn ngữ
                    </Text>
                  </View>

                  {tempLanguages.length > 0 && (
                    <View style={styles.previewBox}>
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.previewBoxText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        <Text
                          style={{ fontWeight: "700", color: theme.textPrimary }}
                        >
                          Đang chọn:{" "}
                        </Text>
                        {tempLanguages.join(", ")}
                      </Text>
                    </View>
                  )}

                  <FlatList
                    data={filteredLanguages}
                    keyExtractor={(item) => item.code}
                    contentContainerStyle={styles.listPadding}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => {
                      const isSelected = tempLanguages.includes(item.name);
                      return (
                        <Pressable
                          onPress={() => toggleLanguage(item.name)}
                          style={[
                            styles.selectRow,
                            {
                              backgroundColor: theme.surface,
                              borderColor: isSelected
                                ? theme.primary
                                : theme.border,
                              borderWidth: isSelected ? 1.5 : 1,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.selectRowText,
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
                            color={
                              isSelected ? theme.primary : theme.textTertiary
                            }
                          />
                        </Pressable>
                      );
                    }}
                  />
                </View>
              ) : type === "interests" ? (
                /* 3. Interests (Hobbies) Picker */
                <View style={styles.flex}>
                  <View
                    style={[
                      styles.searchBox,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="search-outline"
                      size={18}
                      color={theme.textTertiary}
                    />
                    <TextInput
                      value={hobbySearch}
                      onChangeText={setHobbySearch}
                      placeholder="Tìm kiếm sở thích..."
                      placeholderTextColor={theme.textTertiary}
                      style={[styles.searchInput, { color: theme.textPrimary }]}
                      autoCorrect={false}
                    />
                    {hobbySearch.length > 0 && (
                      <Pressable onPress={() => setHobbySearch("")} hitSlop={8}>
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color={theme.textTertiary}
                        />
                      </Pressable>
                    )}
                  </View>

                  <View style={styles.countBadgeRow}>
                    <Ionicons
                      name="sparkles-outline"
                      size={16}
                      color={theme.primary}
                    />
                    <Text
                      style={[
                        styles.countBadgeText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Đã chọn:{" "}
                      <Text style={{ color: theme.primary, fontWeight: "700" }}>
                        {tempInterests.length}
                      </Text>
                      /{MAX_INTERESTS} sở thích
                    </Text>
                  </View>

                  {tempInterests.length > 0 && (
                    <View style={styles.previewBox}>
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.previewBoxText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        <Text
                          style={{ fontWeight: "700", color: theme.textPrimary }}
                        >
                          Đang chọn:{" "}
                        </Text>
                        {tempInterests.join(", ")}
                      </Text>
                    </View>
                  )}

                  <SectionList
                    sections={hobbySections}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listPadding}
                    stickySectionHeadersEnabled={false}
                    keyboardShouldPersistTaps="handled"
                    renderSectionHeader={({ section: { title: sTitle } }) => (
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
                          {sTitle}
                        </Text>
                      </View>
                    )}
                    renderItem={({ item }) => {
                      const isSelected = tempInterests.includes(item.name);
                      return (
                        <Pressable
                          onPress={() => toggleInterest(item.name)}
                          style={[
                            styles.selectRow,
                            {
                              backgroundColor: theme.surface,
                              borderColor: isSelected
                                ? theme.primary
                                : theme.border,
                              borderWidth: isSelected ? 1.5 : 1,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.selectRowText,
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
                            color={
                              isSelected ? theme.primary : theme.textTertiary
                            }
                          />
                        </Pressable>
                      );
                    }}
                  />
                </View>
              ) : isAddressField ? (
                /* 4. Address Picker (City & Ward) */
                <View style={styles.flex}>
                  {/* Step Selector Tab */}
                  <View style={styles.addressTabRow}>
                    <Pressable
                      onPress={() => {
                        setAddressStep("city");
                        setAddressSearch("");
                      }}
                      style={[
                        styles.addressTab,
                        {
                          backgroundColor:
                            addressStep === "city"
                              ? theme.surface
                              : theme.background,
                          borderColor:
                            addressStep === "city"
                              ? theme.primary
                              : theme.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="business-outline"
                        size={15}
                        color={
                          addressStep === "city"
                            ? theme.primary
                            : theme.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.addressTabText,
                          {
                            color:
                              addressStep === "city"
                                ? theme.primary
                                : theme.textPrimary,
                            fontWeight: addressStep === "city" ? "700" : "500",
                          },
                        ]}
                      >
                        1. {tempCity || "Chọn Tỉnh / TP"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        if (!tempCity) {
                          Alert.alert("Lưu ý", "Vui lòng chọn Tỉnh / Thành phố trước");
                          return;
                        }
                        setAddressStep("ward");
                        setAddressSearch("");
                      }}
                      style={[
                        styles.addressTab,
                        {
                          backgroundColor:
                            addressStep === "ward"
                              ? theme.surface
                              : theme.background,
                          borderColor:
                            addressStep === "ward"
                              ? theme.primary
                              : theme.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="home-outline"
                        size={15}
                        color={
                          addressStep === "ward"
                            ? theme.primary
                            : theme.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.addressTabText,
                          {
                            color:
                              addressStep === "ward"
                                ? theme.primary
                                : theme.textPrimary,
                            fontWeight: addressStep === "ward" ? "700" : "500",
                          },
                        ]}
                      >
                        2. {tempWard || "Chọn Xã / Phường"}
                      </Text>
                    </Pressable>
                  </View>

                  <View
                    style={[
                      styles.searchBox,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="search-outline"
                      size={18}
                      color={theme.textTertiary}
                    />
                    <TextInput
                      value={addressSearch}
                      onChangeText={setAddressSearch}
                      placeholder={
                        addressStep === "city"
                          ? "Tìm Tỉnh / Thành phố..."
                          : `Tìm Xã / Phường tại ${tempCity}...`
                      }
                      placeholderTextColor={theme.textTertiary}
                      style={[styles.searchInput, { color: theme.textPrimary }]}
                      autoCorrect={false}
                    />
                    {addressSearch.length > 0 && (
                      <Pressable onPress={() => setAddressSearch("")} hitSlop={8}>
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color={theme.textTertiary}
                        />
                      </Pressable>
                    )}
                  </View>

                  {addressStep === "city" ? (
                    <FlatList
                      data={availableCities}
                      keyExtractor={(item) => item}
                      contentContainerStyle={styles.listPadding}
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) => {
                        const isSelected = item === tempCity;
                        return (
                          <Pressable
                            onPress={() => {
                              setTempCity(item);
                              setTempWard("");
                              setAddressSearch("");
                              setAddressStep("ward");
                            }}
                            style={[
                              styles.selectRow,
                              {
                                backgroundColor: theme.surface,
                                borderColor: isSelected
                                  ? theme.primary
                                  : theme.border,
                                borderWidth: isSelected ? 1.5 : 1,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.selectRowText,
                                {
                                  color: isSelected
                                    ? theme.primary
                                    : theme.textPrimary,
                                  fontWeight: isSelected ? "700" : "500",
                                },
                              ]}
                            >
                              {item}
                            </Text>
                            <Ionicons
                              name="chevron-forward"
                              size={18}
                              color={theme.textTertiary}
                            />
                          </Pressable>
                        );
                      }}
                    />
                  ) : (
                    <FlatList
                      data={filteredWards}
                      keyExtractor={(item) => item}
                      contentContainerStyle={styles.listPadding}
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) => {
                        const isSelected = item === tempWard;
                        return (
                          <Pressable
                            onPress={() => setTempWard(item)}
                            style={[
                              styles.selectRow,
                              {
                                backgroundColor: theme.surface,
                                borderColor: isSelected
                                  ? theme.primary
                                  : theme.border,
                                borderWidth: isSelected ? 1.5 : 1,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.selectRowText,
                                {
                                  color: isSelected
                                    ? theme.primary
                                    : theme.textPrimary,
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
                    />
                  )}

                  {/* Bottom Preview */}
                  <View
                    style={[
                      styles.addressPreviewBar,
                      {
                        backgroundColor: theme.surface,
                        borderTopColor: theme.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="location-sharp"
                      size={18}
                      color={theme.primary}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.addressPreviewText,
                        {
                          color: tempCity
                            ? theme.textPrimary
                            : theme.textSecondary,
                        },
                      ]}
                    >
                      {[tempWard, tempCity].filter(Boolean).join(", ") ||
                        "Chưa chọn địa chỉ"}
                    </Text>
                  </View>
                </View>
              ) : isPetField ? (
                /* 5. Pets Picker (multi-select, stored as one profile string) */
                <ScrollView contentContainerStyle={styles.scrollPadding}>
                  <Text
                    style={[
                      styles.badgePickerSub,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Chọn các lựa chọn phù hợp với bạn:
                  </Text>
                  <View style={styles.badgeWrap}>
                    {petListData.map((badge) => {
                      const isSelected = tempPets.includes(badge);
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
                                color: isSelected
                                  ? theme.white
                                  : theme.textPrimary,
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
                /* 6. Lifestyle Picker (FlatList with Category Sections) */
                <View style={styles.flex}>
                  <View
                    style={[
                      styles.searchBox,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="search-outline"
                      size={18}
                      color={theme.textTertiary}
                    />
                    <TextInput
                      value={lifestyleSearch}
                      onChangeText={setLifestyleSearch}
                      placeholder="Tìm kiếm phong cách sống..."
                      placeholderTextColor={theme.textTertiary}
                      style={[styles.searchInput, { color: theme.textPrimary }]}
                      autoCorrect={false}
                    />
                    {lifestyleSearch.length > 0 && (
                      <Pressable
                        onPress={() => setLifestyleSearch("")}
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

                  <View style={styles.countBadgeRow}>
                    <Ionicons
                      name="sparkles-outline"
                      size={16}
                      color={theme.primary}
                    />
                    <Text
                      style={[
                        styles.countBadgeText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Đã chọn:{" "}
                      <Text style={{ color: theme.primary, fontWeight: "700" }}>
                        {tempLifestyles.length}
                      </Text>{" "}
                      mục phong cách sống
                    </Text>
                  </View>

                  {tempLifestyles.length > 0 && (
                    <View style={styles.previewBox}>
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.previewBoxText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        <Text
                          style={{ fontWeight: "700", color: theme.textPrimary }}
                        >
                          Đang chọn:{" "}
                        </Text>
                        {tempLifestyles.join(", ")}
                      </Text>
                    </View>
                  )}

                  <FlatList
                    data={filteredLifestyleCategories}
                    keyExtractor={(cat) => cat.categoryId}
                    contentContainerStyle={styles.listPadding}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item: category }) => {
                      const categoryValues = category.items.map((i) => i.value);
                      const selectedCount = tempLifestyles.filter((v) =>
                        categoryValues.includes(v),
                      ).length;
                      const isLimitReached =
                        selectedCount >= category.maxSelection;

                      return (
                        <View
                          style={[
                            styles.categorySectionCard,
                            {
                              backgroundColor: theme.surface,
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <View style={styles.categorySectionHeader}>
                            <View style={styles.categoryTitleWrap}>
                              <View
                                style={[
                                  styles.categoryIconCircle,
                                  { backgroundColor: theme.primaryLight },
                                ]}
                              >
                                <Ionicons
                                  name={
                                    getCategoryIcon(category.categoryId) as any
                                  }
                                  size={18}
                                  color={theme.primary}
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[
                                    styles.categoryName,
                                    { color: theme.textPrimary },
                                  ]}
                                >
                                  {category.categoryName}
                                </Text>
                                <Text
                                  style={[
                                    styles.categoryDesc,
                                    { color: theme.textSecondary },
                                  ]}
                                >
                                  {category.description}
                                </Text>
                              </View>
                            </View>

                            <View
                              style={[
                                styles.limitBadge,
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
                                  styles.limitBadgeText,
                                  {
                                    color: isLimitReached
                                      ? theme.primary
                                      : theme.textSecondary,
                                    fontWeight: isLimitReached
                                      ? "700"
                                      : "500",
                                  },
                                ]}
                              >
                                {selectedCount}/{category.maxSelection}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.badgeWrap}>
                            {category.items.map((item) => {
                              const isSelected = tempLifestyles.includes(
                                item.value,
                              );
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
                  />
                </View>
              ) : isFreeTextField ? (
                /* 7. Free Text: Occupation / Height */
                <View style={styles.freeTextWrapper}>
                  <Text
                    style={[styles.inputLabel, { color: theme.textSecondary }]}
                  >
                    {field === "occupation"
                      ? "Nhập chức danh hoặc công việc hiện tại của bạn:"
                      : "Nhập chiều cao của bạn (tính bằng cm):"}
                  </Text>
                  <TextInput
                    value={field === "occupation" ? tempOccupation : tempHeight}
                    onChangeText={
                      field === "occupation"
                        ? setTempOccupation
                        : setTempHeight
                    }
                    placeholder={
                      field === "occupation"
                        ? "Ví dụ: Product Designer"
                        : "Ví dụ: 172"
                    }
                    placeholderTextColor={theme.textTertiary}
                    keyboardType={field === "height" ? "number-pad" : "default"}
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={handleDone}
                    style={[
                      styles.textInputLarge,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        color: theme.textPrimary,
                      },
                    ]}
                  />
                </View>
              ) : (
                /* 8. Education & Other details */
                <ScrollView contentContainerStyle={styles.listPadding}>
                  {detailOptions.map((option) => {
                    const isSelected = tempEducation === option;
                    return (
                      <Pressable
                        key={option}
                        style={[
                          styles.selectRow,
                          {
                            backgroundColor: theme.surface,
                            borderColor: isSelected
                              ? theme.primary
                              : theme.border,
                            borderWidth: isSelected ? 1.5 : 1,
                          },
                        ]}
                        onPress={() => setTempEducation(option)}
                      >
                        <Text
                          style={[
                            styles.selectRowText,
                            {
                              color: isSelected
                                ? theme.primary
                                : theme.textPrimary,
                              fontWeight: isSelected ? "700" : "500",
                            },
                          ]}
                        >
                          {option}
                        </Text>
                        {isSelected ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={theme.primary}
                          />
                        ) : (
                          <Ionicons
                            name="ellipse-outline"
                            size={20}
                            color={theme.textTertiary}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
  },
  sheetContainer: {
    justifyContent: "flex-end",
  },
  bottomSheet: {
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 16,
  },
  handleBarWrap: {
    alignItems: "center",
    paddingTop: spacing.xs + 2,
    paddingBottom: spacing.xs,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
  },
  headerBtn: {
    minWidth: 64,
    paddingVertical: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
  cancelText: {
    ...typography.body,
    fontSize: 15,
  },
  doneText: {
    ...typography.bodyBold,
    fontSize: 15,
    textAlign: "right",
  },
  contentBody: {
    flex: 1,
  },
  scrollPadding: {
    padding: spacing.base,
    paddingBottom: 40,
  },
  listPadding: {
    paddingHorizontal: spacing.base,
    paddingBottom: 40,
    gap: spacing.xs,
  },
  helper: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  sectionHeading: {
    ...typography.h3,
    fontSize: 16,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  photoThumbWrap: {
    width: "31%",
    aspectRatio: 3 / 4,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    position: "relative",
  },
  photoThumb: {
    width: "100%",
    height: "100%",
  },
  removePhotoBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.65)",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  suggestionItem: {
    width: "31%",
    aspectRatio: 3 / 4,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "transparent",
  },
  suggestionThumb: {
    width: "100%",
    height: "100%",
  },
  photoCheckedOverlay: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.base,
    marginVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    height: 42,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    fontSize: 14,
    paddingVertical: 0,
  },
  countBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.base,
    marginBottom: spacing.xs,
    gap: 6,
  },
  countBadgeText: {
    ...typography.caption,
    fontSize: 13,
  },
  previewBox: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.xs + 2,
  },
  previewBoxText: {
    ...typography.caption,
    fontSize: 12,
  },
  selectRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  selectRowText: {
    ...typography.body,
    fontSize: 15,
  },
  sectionHeaderBox: {
    paddingVertical: spacing.xs + 2,
    marginTop: spacing.sm,
  },
  sectionHeaderText: {
    ...typography.captionBold,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  addressTabRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs + 2,
  },
  addressTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
  },
  addressTabText: {
    ...typography.bodySmall,
    flex: 1,
  },
  addressPreviewBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm + 2,
    borderTopWidth: 1,
    gap: spacing.xs,
  },
  addressPreviewText: {
    ...typography.bodySmall,
    flex: 1,
    fontWeight: "600",
  },
  badgePickerSub: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  badgeWrap: {
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
  categorySectionCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  categorySectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  categoryTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
  },
  categoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    ...typography.bodyBold,
    fontSize: 15,
    marginBottom: 2,
  },
  categoryDesc: {
    ...typography.caption,
  },
  limitBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  limitBadgeText: {
    fontSize: 12,
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
  freeTextWrapper: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  inputLabel: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  textInputLarge: {
    height: 52,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    ...typography.body,
    fontSize: 15,
  },
});
