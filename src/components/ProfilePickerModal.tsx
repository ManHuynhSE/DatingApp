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
import * as ImagePicker from "expo-image-picker";
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
import { datingApi, type DatingPhoto } from "../api/datingClient";

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

type PhotoDraftItem = {
  key: string;
  url: string;
  id?: string;
  asset?: ImagePicker.ImagePickerAsset;
};

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.86, 740);

export interface ProfilePickerModalProps {
  visible: boolean;
  type: string;
  field?: string;
  onClose: () => void;
  initialData?: {
    city?: string;
    ward?: string;
    languages?: string[];
    interestedIn?: 'male' | 'female' | 'everyone';
    photos?: string[];
    birthDate?: string;
    [key: string]: any;
  };
  onSelectAddress?: (address: { city: string; ward: string; fullAddress: string }) => void;
  onSelectLanguages?: (languages: string[]) => void;
  onSelectInterestedIn?: (interestedIn: 'male' | 'female' | 'everyone') => void;
  onSelectPhotos?: (photos: string[]) => void;
  onSelectBirthDate?: (birthDate: string, age: number) => void;
}

export default function ProfilePickerModal({
  visible,
  type,
  field,
  onClose,
  initialData,
  onSelectAddress,
  onSelectLanguages,
  onSelectInterestedIn,
  onSelectPhotos,
  onSelectBirthDate,
}: ProfilePickerModalProps) {
  if (!visible) return null;

  return (
    <ProfilePickerSheetContent
      key={`${type}-${field ?? ""}`}
      type={type}
      field={field}
      onClose={onClose}
      initialData={initialData}
      onSelectAddress={onSelectAddress}
      onSelectLanguages={onSelectLanguages}
      onSelectInterestedIn={onSelectInterestedIn}
      onSelectPhotos={onSelectPhotos}
      onSelectBirthDate={onSelectBirthDate}
    />
  );
}

function ProfilePickerSheetContent({
  type,
  field,
  onClose,
  initialData,
  onSelectAddress,
  onSelectLanguages,
  onSelectInterestedIn,
  onSelectPhotos,
  onSelectBirthDate,
}: {
  type: string;
  field?: string;
  onClose: () => void;
  initialData?: {
    city?: string;
    ward?: string;
    languages?: string[];
    interestedIn?: 'male' | 'female' | 'everyone';
    photos?: string[];
    birthDate?: string;
    [key: string]: any;
  };
  onSelectAddress?: (address: { city: string; ward: string; fullAddress: string }) => void;
  onSelectLanguages?: (languages: string[]) => void;
  onSelectInterestedIn?: (interestedIn: 'male' | 'female' | 'everyone') => void;
  onSelectPhotos?: (photos: string[]) => void;
  onSelectBirthDate?: (birthDate: string, age: number) => void;
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
  const [photoItems, setPhotoItems] = useState<PhotoDraftItem[]>(() =>
    (draft?.photos ?? user?.photos ?? []).map((url, index) => ({
      key: `initial-${index}-${url}`,
      url,
    })),
  );
  const [serverPhotos, setServerPhotos] = useState<DatingPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(type === "photos");
  const [photosLoaded, setPhotosLoaded] = useState(false);
  const [photosSaving, setPhotosSaving] = useState(false);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [photoLoadAttempt, setPhotoLoadAttempt] = useState(0);
  const [tempLanguages, setTempLanguages] = useState<string[]>(
    () => initialData?.languages ?? draft?.languages ?? user?.languages ?? [],
  );
  const [tempInterestedIn, setTempInterestedIn] = useState<"male" | "female" | "everyone">(
    () => initialData?.interestedIn ?? "everyone",
  );
  // Birth Date States
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [tempYear, setTempYear] = useState(() => {
    if (initialData?.birthDate) {
      const parts = initialData.birthDate.split('-').map(Number);
      if (parts.length === 3 && parts[0]) return parts[0];
    }
    return new Date().getFullYear() - 22;
  });
  const [tempMonth, setTempMonth] = useState(() => {
    if (initialData?.birthDate) {
      const parts = initialData.birthDate.split('-').map(Number);
      if (parts.length === 3 && parts[1]) return parts[1];
    }
    return 1;
  });
  const [tempDay, setTempDay] = useState(() => {
    if (initialData?.birthDate) {
      const parts = initialData.birthDate.split('-').map(Number);
      if (parts.length === 3 && parts[2]) return parts[2];
    }
    return 1;
  });

  const maxDays = useMemo(() => {
    return new Date(tempYear, tempMonth, 0).getDate();
  }, [tempYear, tempMonth]);

  const effectiveDay = Math.min(tempDay, maxDays);

  const tempAge = useMemo(() => {
    const today = new Date();
    let a = today.getFullYear() - tempYear;
    const m = today.getMonth() + 1 - tempMonth;
    if (m < 0 || (m === 0 && today.getDate() < effectiveDay)) {
      a--;
    }
    return a;
  }, [tempYear, tempMonth, effectiveDay]);

  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear - 18; y >= currentYear - 100; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  const availableMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }, []);

  const availableDays = useMemo(() => {
    return Array.from({ length: maxDays }, (_, i) => i + 1);
  }, [maxDays]);

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

  const cityVal = initialData?.city ?? draft?.city ?? user?.city ?? "";
  const wardVal = initialData?.ward ?? draft?.ward ?? user?.ward ?? "";
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

  useEffect(() => {
    if (type !== "photos") return;
    let active = true;
    datingApi.getMyPhotos().then(({ data }) => {
      if (!active) return;
      setServerPhotos(data);
      setPhotoItems(data.map((photo) => ({
        key: photo.id,
        id: photo.id,
        url: photo.url,
      })));
      setPhotosLoaded(true);
    }).catch((error: unknown) => {
      if (!active) return;
      setPhotosError(error instanceof Error ? error.message : "Không tải được ảnh profile.");
    }).finally(() => {
      if (active) setPhotosLoading(false);
    });
    return () => { active = false; };
  }, [type, user?.id, photoLoadAttempt]);

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

  const savePhotos = async () => {
    if (!photosLoaded) {
      Alert.alert("Ảnh chưa sẵn sàng", "Tải lại danh sách ảnh rồi thử lại.");
      return;
    }

    setPhotosSaving(true);
    try {
      const retainedPhotoIds = new Set(
        photoItems.flatMap((photo) => photo.id ? [photo.id] : []),
      );
      const savedItems: { id: string; url: string }[] = [];
      for (const photo of photoItems) {
        if (photo.id) {
          savedItems.push({ id: photo.id, url: photo.url });
          continue;
        }
        if (!photo.asset) continue;

        const asset = photo.asset;
        const mimeType = asset.mimeType || "image/jpeg";
        const extension = mimeType.split("/")[1] || "jpg";
        const uploaded = await datingApi.uploadPhoto({
          uri: asset.uri,
          name: asset.fileName || `profile-${Date.now()}.${extension}`,
          type: mimeType,
          webFile: asset.file,
        });
        const savedPhoto = uploaded.data;
        savedItems.push({ id: savedPhoto.id, url: savedPhoto.url });
        setServerPhotos((previous) => [...previous, savedPhoto]);
        setPhotoItems((previous) => previous.map((item) =>
          item.key === photo.key
            ? { key: savedPhoto.id, id: savedPhoto.id, url: savedPhoto.url }
            : item,
        ));
      }

      for (const photo of serverPhotos) {
        if (!retainedPhotoIds.has(photo.id)) {
          await datingApi.deletePhoto(photo.id);
          setServerPhotos((previous) => previous.filter((item) => item.id !== photo.id));
        }
      }

      const ordered = await datingApi.reorderPhotos(savedItems.map((photo) => photo.id));
      const finalPhotos = ordered.data.map((photo) => photo.url);
      setServerPhotos(ordered.data);
      setPhotoItems(ordered.data.map((photo) => ({
        key: photo.id,
        id: photo.id,
        url: photo.url,
      })));
      update({ photos: finalPhotos });
      animateClose(handleFinishModal);
    } catch (error) {
      Alert.alert(
        "Không lưu được ảnh",
        error instanceof Error ? error.message : "Thử lại sau nhé.",
      );
    } finally {
      setPhotosSaving(false);
    }
  };

  // ─── DONE HANDLER: Validates and commits temporary state to draft ──────────
  const handleDone = () => {
    const baseDetails = draft?.details ?? user?.details;

    if (isAddressField) {
      const fullAddress = [tempWard, tempCity].filter(Boolean).join(", ");
      if (onSelectAddress) {
        onSelectAddress({ city: tempCity, ward: tempWard, fullAddress });
      } else {
        update({
          location: fullAddress,
          city: tempCity || undefined,
          ward: tempWard || undefined,
        });
      }
      animateClose(handleFinishModal);
      return;
    }

    if (type === "photos") {
      void savePhotos();
      return;
    }

    if (type === "languages") {
      if (onSelectLanguages) {
        onSelectLanguages(tempLanguages);
      } else {
        update({ languages: tempLanguages });
      }
      animateClose(handleFinishModal);
      return;
    }

    if (type === "birth_date") {
      if (tempAge < 18) {
        Alert.alert(
          "Age requirement",
          "You must be at least 18 years old to join HeartSync.",
        );
        return;
      }
      if (tempAge > 120) {
        Alert.alert("Invalid date", "Please select a valid birth date.");
        return;
      }
      const formatted = `${tempYear}-${String(tempMonth).padStart(2, "0")}-${String(effectiveDay).padStart(2, "0")}`;
      if (onSelectBirthDate) {
        onSelectBirthDate(formatted, tempAge);
      }
      animateClose(handleFinishModal);
      return;
    }

    if (type === "interested_in") {
      if (onSelectInterestedIn) {
        onSelectInterestedIn(tempInterestedIn);
      }
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
    if (type === "birth_date") return "Date of Birth";
    if (type === "interested_in") return "I'm interested in";
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

  const choosePhoto = async () => {
    if (!photosLoaded || photosLoading || photosSaving) return;
    if (photoItems.length >= 6) {
      Alert.alert("Đã đủ ảnh", "Profile hiện hỗ trợ tối đa 6 ảnh.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
        Alert.alert("Ảnh quá lớn", "Chọn ảnh nhỏ hơn 10 MB.");
        return;
      }

      setPhotoItems((previous) => [
        ...previous,
        {
          key: `local-${Date.now()}`,
          url: asset.uri,
          asset,
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Không mở được thư viện ảnh",
        error instanceof Error ? error.message : "Thử lại sau nhé.",
      );
    }
  };

  const removePhoto = (key: string) => {
    setPhotoItems((previous) => previous.filter((photo) => photo.key !== key));
  };

  const movePhoto = (index: number, offset: number) => {
    setPhotoItems((previous) => {
      const nextIndex = index + offset;
      if (nextIndex < 0 || nextIndex >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
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
                disabled={type === "photos" && (!photosLoaded || photosLoading || photosSaving)}
                accessibilityLabel="Done and save changes"
              >
                <Text style={[styles.doneText, { color: theme.primary }]}>
                  {type === "photos" && photosSaving ? "Saving…" : "Done"}
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
                    {photosLoading
                      ? "Loading your saved photos…"
                      : photosError
                        ? photosError
                        : "Add up to 6 real photos. The first photo is your main photo."}
                  </Text>
                  {photosError && (
                    <TouchableOpacity
                      style={styles.photoPickerButton}
                      onPress={() => {
                        setPhotosLoading(true);
                        setPhotosError(null);
                        setPhotoLoadAttempt((attempt) => attempt + 1);
                      }}
                    >
                      <Ionicons name="refresh-outline" size={18} color={theme.primary} />
                      <Text style={[styles.photoPickerButtonText, { color: theme.primary }]}>Try again</Text>
                    </TouchableOpacity>
                  )}
                  <View style={styles.photoGrid}>
                    {photoItems.map((photo, index) => (
                      <View key={photo.key} style={styles.photoThumbWrap}>
                        <Image
                          source={{ uri: photo.url }}
                          style={styles.photoThumb}
                        />
                        <TouchableOpacity
                          style={styles.photoPrimaryBtn}
                          onPress={() => movePhoto(index, -index)}
                          disabled={index === 0 || photosSaving || !photosLoaded}
                          accessibilityLabel={index === 0 ? "Main photo" : "Make main photo"}
                        >
                          <Ionicons
                            name={index === 0 ? "star" : "star-outline"}
                            size={15}
                            color={index === 0 ? "#FFC94A" : "#fff"}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.removePhotoBtn}
                          onPress={() => removePhoto(photo.key)}
                          disabled={photosSaving || !photosLoaded}
                          accessibilityLabel="Remove photo"
                        >
                          <Ionicons name="close" size={14} color="#fff" />
                        </TouchableOpacity>
                        {(index > 0 || index < photoItems.length - 1) && (
                          <View style={styles.photoOrderBar}>
                            <TouchableOpacity
                              style={styles.photoOrderBtn}
                              onPress={() => movePhoto(index, -1)}
                              disabled={index === 0 || photosSaving || !photosLoaded}
                              accessibilityLabel="Move photo earlier"
                            >
                              <Ionicons name="arrow-back" size={14} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.photoOrderBtn}
                              onPress={() => movePhoto(index, 1)}
                              disabled={index === photoItems.length - 1 || photosSaving || !photosLoaded}
                              accessibilityLabel="Move photo later"
                            >
                              <Ionicons name="arrow-forward" size={14} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.photoPickerButton,
                      { borderColor: theme.border, backgroundColor: theme.surface },
                    ]}
                    onPress={choosePhoto}
                    disabled={!photosLoaded || photosLoading || photosSaving || photoItems.length >= 6}
                    accessibilityLabel="Choose a photo from your library"
                  >
                    {photosSaving ? (
                      <Ionicons name="sync-outline" size={18} color={theme.primary} />
                    ) : (
                      <Ionicons name="image-outline" size={18} color={theme.primary} />
                    )}
                    <Text style={[styles.photoPickerButtonText, { color: theme.primary }]}>
                      Choose from library
                    </Text>
                  </TouchableOpacity>
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
              ) : type === "birth_date" ? (
                /* Birth Date Picker */
                <View style={styles.flex}>
                  {/* Top Preview Card */}
                  <View
                    style={[
                      styles.birthDateSummaryCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: tempAge >= 18 ? theme.border : theme.error,
                      },
                    ]}
                  >
                    <View style={styles.birthDateSummaryLeft}>
                      <Text
                        style={[styles.birthDateValueText, { color: theme.textPrimary }]}
                      >
                        {String(effectiveDay).padStart(2, "0")} / {String(tempMonth).padStart(2, "0")} / {tempYear}
                      </Text>
                      <Text
                        style={[typography.caption, { color: theme.textSecondary }]}
                      >
                        Day / Month / Year
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.birthDateAgeBadge,
                        {
                          backgroundColor:
                            tempAge >= 18 ? theme.primaryLight : "rgba(239, 68, 68, 0.15)",
                        },
                      ]}
                    >
                      <Ionicons
                        name={tempAge >= 18 ? "checkmark-circle" : "alert-circle"}
                        size={16}
                        color={tempAge >= 18 ? theme.primary : theme.error}
                      />
                      <Text
                        style={[
                          styles.birthDateAgeText,
                          { color: tempAge >= 18 ? theme.primary : theme.error },
                        ]}
                      >
                        {tempAge >= 18 ? `${tempAge} years old` : "Must be 18+"}
                      </Text>
                    </View>
                  </View>

                  {/* Direct Numeric Input Row */}
                  <View style={styles.dateInputRow}>
                    <View style={styles.dateInputCol}>
                      <Text style={[styles.dateInputLabel, { color: theme.textSecondary }]}>
                        Day
                      </Text>
                      <TextInput
                        value={String(effectiveDay)}
                        onChangeText={(t) => {
                          const n = parseInt(t.replace(/\D/g, ""), 10);
                          if (!Number.isNaN(n) && n >= 1 && n <= 31) {
                            setTempDay(n);
                          }
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                        style={[
                          styles.dateInputField,
                          {
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                            color: theme.textPrimary,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.dateInputCol}>
                      <Text style={[styles.dateInputLabel, { color: theme.textSecondary }]}>
                        Month
                      </Text>
                      <TextInput
                        value={String(tempMonth)}
                        onChangeText={(t) => {
                          const n = parseInt(t.replace(/\D/g, ""), 10);
                          if (!Number.isNaN(n) && n >= 1 && n <= 12) {
                            setTempMonth(n);
                          }
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                        style={[
                          styles.dateInputField,
                          {
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                            color: theme.textPrimary,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.dateInputColYear}>
                      <Text style={[styles.dateInputLabel, { color: theme.textSecondary }]}>
                        Year
                      </Text>
                      <TextInput
                        value={String(tempYear)}
                        onChangeText={(t) => {
                          const n = parseInt(t.replace(/\D/g, ""), 10);
                          if (!Number.isNaN(n) && n >= 1900 && n <= currentYear) {
                            setTempYear(n);
                          }
                        }}
                        keyboardType="number-pad"
                        maxLength={4}
                        style={[
                          styles.dateInputField,
                          {
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                            color: theme.textPrimary,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* 3 Interactive Columns */}
                  <View style={styles.dateColumnsContainer}>
                    {/* Days Column */}
                    <View style={styles.dateColumn}>
                      <Text style={[styles.dateColumnHeader, { color: theme.textSecondary }]}>
                        Day
                      </Text>
                      <FlatList
                        data={availableDays}
                        keyExtractor={(item) => `day-${item}`}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.dateColumnList}
                        renderItem={({ item }) => {
                          const isSelected = item === effectiveDay;
                          return (
                            <Pressable
                              onPress={() => setTempDay(item)}
                              style={[
                                styles.dateItem,
                                isSelected && {
                                  backgroundColor: theme.primary,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.dateItemText,
                                  {
                                    color: isSelected ? "#fff" : theme.textPrimary,
                                    fontWeight: isSelected ? "700" : "400",
                                  },
                                ]}
                              >
                                {String(item).padStart(2, "0")}
                              </Text>
                            </Pressable>
                          );
                        }}
                      />
                    </View>

                    {/* Months Column */}
                    <View style={[styles.dateColumn, styles.dateColumnMonth]}>
                      <Text style={[styles.dateColumnHeader, { color: theme.textSecondary }]}>
                        Month
                      </Text>
                      <FlatList
                        data={availableMonths}
                        keyExtractor={(item) => `month-${item}`}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.dateColumnList}
                        renderItem={({ item }) => {
                          const isSelected = item === tempMonth;
                          return (
                            <Pressable
                              onPress={() => setTempMonth(item)}
                              style={[
                                styles.dateItem,
                                isSelected && {
                                  backgroundColor: theme.primary,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.dateItemText,
                                  {
                                    color: isSelected ? "#fff" : theme.textPrimary,
                                    fontWeight: isSelected ? "700" : "400",
                                  },
                                ]}
                              >
                                {MONTH_NAMES[item - 1]}
                              </Text>
                            </Pressable>
                          );
                        }}
                      />
                    </View>

                    {/* Years Column */}
                    <View style={styles.dateColumn}>
                      <Text style={[styles.dateColumnHeader, { color: theme.textSecondary }]}>
                        Year
                      </Text>
                      <FlatList
                        data={availableYears}
                        keyExtractor={(item) => `year-${item}`}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.dateColumnList}
                        renderItem={({ item }) => {
                          const isSelected = item === tempYear;
                          return (
                            <Pressable
                              onPress={() => setTempYear(item)}
                              style={[
                                styles.dateItem,
                                isSelected && {
                                  backgroundColor: theme.primary,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.dateItemText,
                                  {
                                    color: isSelected ? "#fff" : theme.textPrimary,
                                    fontWeight: isSelected ? "700" : "400",
                                  },
                                ]}
                              >
                                {item}
                              </Text>
                            </Pressable>
                          );
                        }}
                      />
                    </View>
                  </View>
                </View>
              ) : type === "interested_in" ? (
                /* Interested In Picker */
                <View style={styles.flex}>
                  <Text
                    style={[
                      styles.helper,
                      { color: theme.textSecondary, marginBottom: spacing.md },
                    ]}
                  >
                    Select who you would like to see in your discovery feed:
                  </Text>
                  <View style={{ gap: spacing.sm, paddingHorizontal: spacing.base }}>
                    {INTERESTED_OPTIONS.map((item) => {
                      const isSelected = tempInterestedIn === item.value;
                      return (
                        <Pressable
                          key={item.value}
                          onPress={() => setTempInterestedIn(item.value)}
                          style={[
                            styles.selectRow,
                            {
                              backgroundColor: theme.surface,
                              borderColor: isSelected
                                ? theme.primary
                                : theme.border,
                              borderWidth: isSelected ? 1.5 : 1,
                              paddingVertical: spacing.md,
                            },
                          ]}
                        >
                          <View style={styles.interestedOptionRow}>
                            <View
                              style={[
                                styles.interestedOptionIconBox,
                                {
                                  backgroundColor: isSelected
                                    ? theme.primaryLight
                                    : theme.background,
                                },
                              ]}
                            >
                              <Ionicons
                                name={item.icon as any}
                                size={20}
                                color={
                                  isSelected
                                    ? theme.primary
                                    : theme.textSecondary
                                }
                              />
                            </View>
                            <View style={{ flex: 1 }}>
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
                                {item.label}
                              </Text>
                              <Text
                                style={[
                                  styles.previewBoxText,
                                  { color: theme.textSecondary, marginTop: 2 },
                                ]}
                              >
                                {item.subtitle}
                              </Text>
                            </View>
                          </View>
                          <Ionicons
                            name={
                              isSelected
                                ? "radio-button-on"
                                : "radio-button-off"
                            }
                            size={22}
                            color={
                              isSelected ? theme.primary : theme.textTertiary
                            }
                          />
                        </Pressable>
                      );
                    })}
                  </View>
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
  photoPrimaryBtn: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.65)",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  photoOrderBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 4,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  photoOrderBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPickerButton: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  photoPickerButtonText: {
    ...typography.bodyBold,
    fontSize: 14,
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
  interestedOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  birthDateSummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  birthDateSummaryLeft: {
    gap: 2,
  },
  birthDateValueText: {
    ...typography.h3,
    fontSize: 18,
    letterSpacing: 1,
  },
  birthDateAgeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  birthDateAgeText: {
    ...typography.captionBold,
    fontSize: 13,
  },
  dateInputRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  dateInputCol: {
    flex: 1,
  },
  dateInputColYear: {
    flex: 1.3,
  },
  dateInputLabel: {
    ...typography.caption,
    fontSize: 12,
    marginBottom: 4,
  },
  dateInputField: {
    height: 42,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    textAlign: "center",
    ...typography.bodyBold,
    fontSize: 16,
  },
  dateColumnsContainer: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  dateColumn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.15)",
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  dateColumnMonth: {
    flex: 1.2,
  },
  dateColumnHeader: {
    ...typography.captionBold,
    textAlign: "center",
    paddingVertical: 6,
    backgroundColor: "rgba(150, 150, 150, 0.08)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
  },
  dateColumnList: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  dateItem: {
    height: 38,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
  dateItemText: {
    ...typography.body,
    fontSize: 14,
  },
  interestedOptionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});