import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { datingApi, type Hobby } from "@/api/datingClient";
import ProfilePickerModal from "../src/components/ProfilePickerModal";
import { HOBBY_EMOJIS } from "../src/data/hobbies";

const hobbiesCatalog = require("../assets/hobbies_list.json") as Hobby[];

const detailFields = [
  { field: "relationship_intention", label: "Mục đích hẹn hò", icon: "heart-circle-outline" },
  { field: "location", label: "Address", icon: "location-outline" },
  { field: "height", label: "Height", icon: "resize-outline" },
  { field: "education", label: "Education", icon: "school-outline" },
  { field: "occupation", label: "Occupation", icon: "briefcase-outline" },
  { field: "exercise", label: "Lifestyle", icon: "sparkles-outline" },
  { field: "pets", label: "Pets", icon: "paw-outline" },
] as const;

export interface EditProfileScreenProps {
  embedded?: boolean;
}

export default function EditProfileScreen({
  embedded = false,
}: EditProfileScreenProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const mode = useThemeStore((state) => state.mode);
  const toggleMode = useThemeStore((state) => state.toggleMode);
  const theme = mode === "dark" ? darkColors : colors;
  const draft = useProfileEditStore((state) => state.draft);
  const start = useProfileEditStore((state) => state.start);
  const reset = useProfileEditStore((state) => state.reset);
  const update = useProfileEditStore((state) => state.update);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && !draft) start(user);
  }, [draft, start, user]);

  const current = draft ?? user;
  const completion = useMemo(() => {
    if (!current) return 0;
    const values = [
      current.name,
      current.age,
      current.occupation,
      current.aboutMe,
      current.photos.length,
      current.interests.length,
      current.languages.length,
      current.education,
    ];
    return Math.round((values.filter(Boolean).length / values.length) * 100);
  }, [current]);

  const [activePicker, setActivePicker] = useState<{
    type: string;
    field?: string;
  } | null>(null);

  if (!current) return null;

  const openPicker = (type: string, field?: string) => {
    setActivePicker({ type, field });
  };

  const closePicker = () => {
    setActivePicker(null);
  };

  const save = async () => {
    if (!user) return;

    if (!current.name.trim() || current.age < 18) {
      Alert.alert(
        "Complete your profile",
        "Enter your name and an age of at least 18.",
      );
      return;
    }

    const heightText = current.details.height.trim();
    const normalizedHeight = heightText.replace(/\s*cm$/i, "").trim();
    const heightCm = normalizedHeight ? Number(normalizedHeight) : null;
    if (
      heightText &&
      (heightCm === null || !Number.isInteger(heightCm) || heightCm < 100 || heightCm > 250)
    ) {
      Alert.alert("Invalid height", "Enter a height from 100 to 250 cm.");
      return;
    }

    const selectedPets = current.details.pets.trim();
    if (selectedPets.length > 50) {
      Alert.alert(
        "Pet selection is too long",
        "Your pet choices must fit within 50 characters. Remove one or more choices and try again.",
      );
      return;
    }

    setSaving(true);
    try {
      let ward: string | null = current.ward ?? null;
      let city: string | null = current.city ?? null;
      if (!city && !ward && current.location) {
        const parts = current.location.split(',').map((p) => p.trim()).filter(Boolean);
        if (parts.length > 1) {
          ward = parts[0];
          city = parts.slice(1).join(', ');
        } else if (parts.length === 1) {
          city = parts[0];
        }
      }

      const hobbiesPayload = current.hobbies?.length
        ? current.hobbies
        : hobbiesCatalog.filter((h) => current.interests.includes(h.name));

      const response = await datingApi.updateProfile(user.id, {
        display_name: current.name.trim().slice(0, 50),
        bio: current.aboutMe.trim() ? current.aboutMe.trim().slice(0, 500) : null,
        job_title: current.occupation.trim() ? current.occupation.trim().slice(0, 100) : null,
        city: city ? city.slice(0, 100) : null,
        ward: ward ? ward.slice(0, 100) : null,
        education: current.education.trim() ? current.education.trim().slice(0, 100) : null,
        height_cm: heightCm,
        pet: selectedPets || null,
        life_style: current.details.exercise
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
          .slice(0, 20),
        hobbies: hobbiesPayload.slice(0, 100),
        languages: current.languages.slice(0, 20),
      });
      if (!response.success) {
        throw new Error("Server chưa nhận được update");
      }
      const updatedLocation =
        [response.data.ward, response.data.city].filter(Boolean).join(", ") ||
        response.data.city ||
        "";
      if (current.relationship_intention !== undefined) {
        try {
          await datingApi.updateMyRelationshipIntention(current.relationship_intention);
        } catch (intentionErr) {
          console.warn("Could not sync relationship intention:", intentionErr);
        }
      }

      updateUser({
        name: response.data.display_name,
        photos: current.photos,
        aboutMe: response.data.bio ?? "",
        occupation: response.data.job_title ?? "",
        location: updatedLocation,
        city: response.data.city ?? undefined,
        ward: response.data.ward ?? undefined,
        education: response.data.education ?? "",
        hobbies: response.data.hobbies ?? [],
        interests: response.data.hobbies?.map((h) => h.name) ?? current.interests,
        languages: response.data.languages ?? [],
        relationship_intention: current.relationship_intention ?? response.data.relationship_intention ?? null,
        relationshipGoal: current.relationship_intention ?? '',
        details: {
          ...user.details,
          height: response.data.height_cm ? `${response.data.height_cm}cm` : "",
          pets: response.data.pet ?? "",
          exercise: response.data.life_style?.join(", ") ?? "",
        },
      });
      reset();
      if (!embedded) {
        router.back();
      } else Alert.alert("Saved", "Profile của bạn đã được lưu");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Lỗi kết nối hãy thử lại";
      Alert.alert("Không thể lưu profile", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerTitleContainer} pointerEvents="none">
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Profile
          </Text>
        </View>
        <Pressable
          onPress={() => (embedded ? router.push('/settings') : router.back())}
          style={styles.iconButton}
          accessibilityLabel={embedded ? "Open settings" : "Close edit profile"}
        >
          <Ionicons
            name={embedded ? "settings-outline" : "close"}
            size={24}
            color={theme.textPrimary}
          />
        </Pressable>
        <View style={styles.headerActions}>
          {embedded && (
            <Pressable
              onPress={toggleMode}
              style={styles.themeButton}
              accessibilityRole="button"
              accessibilityLabel={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <Ionicons
                name={mode === "dark" ? "sunny-outline" : "moon-outline"}
                size={21}
                color={theme.textPrimary}
              />
            </Pressable>
          )}
          <Pressable onPress={save} style={styles.saveButton} disabled={saving}>
            <Text style={[styles.saveText, { color: theme.primary }]}>
              {saving ? "Saving" : "Save"}
            </Text>
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.profileHeader}>
            <View style={styles.avatarStack}>
              <Image
                source={{
                  uri: current.photos[0] || "https://picsum.photos/seed/empty-profile/300/400",
                }}
                style={styles.avatar}
              />
            </View>
            <View style={styles.profileHeaderText}>
              <Text style={[styles.profileName, { color: theme.textPrimary }]}>
                {current.name || "Your name"}, {current.age || "--"}
              </Text>
              <Pressable
                onPress={() => {
                  if (!user?.id) {
                    Alert.alert("Profile unavailable", "Sign in to preview your profile.");
                    return;
                  }
                  router.push({
                    pathname: "/profile-detail",
                    params: { userId: user.id },
                  });
                }}
              >
                <Text style={[styles.preview, { color: theme.textSecondary }]}>
                  Preview profile <Ionicons name="chevron-forward" size={15} />
                </Text>
              </Pressable>
            </View>
          </View>

          <View
            style={[styles.completionCard, { backgroundColor: theme.surface }]}
          >
            <Ionicons
              name={completion < 100 ? "alert-circle" : "checkmark-circle"}
              size={22}
              color={completion < 100 ? theme.primary : theme.success}
            />
            <View style={styles.flex}>
              <Text
                style={[styles.completionTitle, { color: theme.textPrimary }]}
              >
                Complete your profile
              </Text>
              <Text
                style={[
                  styles.completionSubtitle,
                  { color: theme.textSecondary },
                ]}
              >
                {completion}% complete · Add more to get better matches
              </Text>
            </View>
          </View>

          <View style={styles.chipGrid}>
            {detailFields.map((item) => {
              const value =
                item.field === "relationship_intention"
                  ? current.relationship_intention
                  : item.field === "location"
                    ? current.location ||
                      [current.ward, current.city].filter(Boolean).join(", ")
                    : item.field === "occupation"
                      ? current.occupation
                      : item.field === "education"
                        ? current.education
                        : current.details[
                            item.field as keyof typeof current.details
                          ];
              return (
                <Pressable
                  key={item.field}
                  onPress={() =>
                    openPicker(
                      item.field === "relationship_intention"
                        ? "relationship_intention"
                        : "detail",
                      item.field,
                    )
                  }
                  style={[
                    styles.infoChip,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={[styles.infoChipText, { color: theme.textPrimary }]}
                    numberOfLines={1}
                  >
                    {value || item.label}
                  </Text>
                  <Ionicons name="add" size={18} color={theme.textSecondary} />
                </Pressable>
              );
            })}
          </View>

          <SectionTitle
            title="My photos"
            action={`Add ${Math.max(0, 6 - current.photos.length)} more`}
            theme={theme}
          />
          <Pressable
            onPress={() => openPicker("photos")}
            style={[styles.photosCard, { backgroundColor: theme.surface }]}
          >
            <View style={styles.photoStrip}>
              {(current.photos.length ? current.photos : [null])
                .slice(0, 6)
                .map((photo, index) => (
                  <View
                    key={`${photo ?? "empty"}-${index}`}
                    style={[styles.photoSlot, { borderColor: theme.border }]}
                  >
                    {photo ? (
                      <Image source={{ uri: photo }} style={styles.slotImage} />
                    ) : (
                      <Ionicons
                        name="add"
                        size={26}
                        color={theme.textTertiary}
                      />
                    )}
                  </View>
                ))}
            </View>
            <Text style={[styles.helperText, { color: theme.textSecondary }]}>
              Add up to 6 photos so people can get to know you.
            </Text>
            <Text style={[styles.editAction, { color: theme.primary }]}>
              Choose photos
            </Text>
          </Pressable>

          <SectionTitle title="About me" action="Edit" theme={theme} />
          <TextInput
            value={current.aboutMe}
            onChangeText={(aboutMe) => update({ aboutMe })}
            multiline
            placeholder="Tell people something memorable about you..."
            placeholderTextColor={theme.textTertiary}
            style={[
              styles.aboutInput,
              {
                color: theme.textPrimary,
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          />

          <SectionTitle
            title="My interests"
            action={`${current.interests.length}/10`}
            theme={theme}
          />
          <Pressable
            onPress={() => openPicker("interests")}
            style={[
              styles.selectionCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.selectionHeader}>
              <Ionicons
                name="sparkles-outline"
                size={22}
                color={theme.primary}
              />
              <Text
                style={[styles.selectionTitle, { color: theme.textPrimary }]}
              >
                What do you enjoy?
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.textTertiary}
              />
            </View>
            <View style={styles.tags}>
              {current.interests.map((item) => (
                <View
                  key={item}
                  style={[styles.tag, { backgroundColor: theme.primaryLight }]}
                >
                  <Text style={[styles.tagText, { color: theme.primary }]}>
                    {HOBBY_EMOJIS[item] ? `${HOBBY_EMOJIS[item]} ` : ""}{item}
                  </Text>
                </View>
              ))}
              {current.interests.length === 0 && (
                <Text
                  style={[styles.languageText, { color: theme.textSecondary }]}
                >
                  Add interests
                </Text>
              )}
            </View>
          </Pressable>

          <SectionTitle
            title="Languages"
            action={`${current.languages.length} selected`}
            theme={theme}
          />
          <Pressable
            onPress={() => openPicker("languages")}
            style={[
              styles.selectionCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.selectionHeader}>
              <Ionicons
                name="globe-outline"
                size={22}
                color={theme.secondary}
              />
              <Text
                style={[styles.selectionTitle, { color: theme.textPrimary }]}
              >
                I communicate in
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.textTertiary}
              />
            </View>
            <Text style={[styles.languageText, { color: theme.textSecondary }]}>
              {current.languages.join(" · ") || "Add languages"}
            </Text>
          </Pressable>

          {/* <Pressable
            onPress={save}
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.primaryButtonText, { color: theme.white }]}>
              {saving ? "Saving..." : "Save profile"}
            </Text>
          </Pressable> */}
        </ScrollView>
      </KeyboardAvoidingView>

      <ProfilePickerModal
        visible={activePicker !== null}
        type={activePicker?.type ?? "detail"}
        field={activePicker?.field}
        onClose={closePicker}
      />
    </SafeAreaView>
  );
}

function SectionTitle({
  title,
  action,
  theme,
}: {
  title: string;
  action: string;
  theme: typeof colors;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        {title}
      </Text>
      <Text style={[styles.sectionAction, { color: theme.primary }]}>
        {action}
      </Text>
    </View>
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
    position: "relative",
  },
  headerTitleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { ...typography.h3, textAlign: "center" },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  themeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.full,
  },
  saveButton: {
    minWidth: 52,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  saveText: { ...typography.bodyBold },
  content: {
    padding: spacing.base,
    paddingBottom: 140,
    gap: spacing.md,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 90,
    marginBottom: spacing.sm,
  },
  avatarStack: { width: 72, height: 72 },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "#fff",
  },
  profileHeaderText: { flex: 1, marginLeft: spacing.md },
  profileName: { ...typography.h2 },
  preview: { ...typography.bodySmall, marginTop: spacing.xs },
  completionCard: {
    minHeight: 68,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  completionTitle: { ...typography.bodyBold },
  completionSubtitle: { ...typography.caption, marginTop: 3 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  infoChip: {
    width: "48%",
    minHeight: 48,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  infoChipText: { flex: 1, ...typography.bodySmall },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  sectionTitle: { ...typography.h3 },
  sectionAction: { ...typography.bodySmall },
  photosCard: { borderRadius: borderRadius.lg, padding: spacing.md },
  photoStrip: { flexDirection: "row", gap: 5 },
  photoSlot: {
    flex: 1,
    height: 102,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  slotImage: { width: "100%", height: "100%" },
  helperText: { ...typography.bodySmall, marginTop: spacing.md },
  editAction: { ...typography.bodyBold, marginTop: spacing.sm },
  aboutInput: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    textAlignVertical: "top",
  },
  selectionCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  selectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  selectionTitle: { flex: 1, ...typography.bodyBold },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagText: { ...typography.captionBold },
  languageText: {
    ...typography.bodySmall,
    marginTop: spacing.sm,
    marginLeft: 30,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  primaryButtonText: { ...typography.bodyBold },
});
