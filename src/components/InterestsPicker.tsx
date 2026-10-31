import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';
import {
  hobbiesList,
  HOBBY_EMOJIS,
  HOBBY_VI_NAMES,
  HOBBY_CATEGORIES,
  normalizeSearchText,
} from '../data/hobbies';
import { Hobby } from '../api/datingClient';

export interface InterestsPickerProps {
  selected: string[];
  onToggle: (hobbyName: string) => void;
  onClearAll?: () => void;
  maxSelection?: number;
  theme: Theme;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function InterestsPicker({
  selected,
  onToggle,
  onClearAll,
  maxSelection = 10,
  theme,
  containerStyle,
}: InterestsPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const isMaxReached = selected.length >= maxSelection;

  const handlePressChip = useCallback(
    (name: string) => {
      const isSelected = selected.includes(name);
      if (!isSelected && isMaxReached) {
        Alert.alert(
          'Giới hạn sở thích',
          `Bạn chỉ có thể chọn tối đa ${maxSelection} sở thích để hiển thị trên hồ sơ.`,
          [{ text: 'Đã hiểu', style: 'default' }]
        );
        return;
      }
      onToggle(name);
    },
    [selected, isMaxReached, maxSelection, onToggle]
  );

  // Filtered items when searching
  const searchResults = useMemo(() => {
    const q = normalizeSearchText(searchQuery);
    if (!q) return null;

    return hobbiesList.filter((item) => {
      const nameMatch = normalizeSearchText(item.name).includes(q);
      const catMatch = normalizeSearchText(item.category).includes(q);
      const viName = HOBBY_VI_NAMES[item.name] || '';
      const viMatch = normalizeSearchText(viName).includes(q);
      return nameMatch || catMatch || viMatch;
    });
  }, [searchQuery]);

  // Grouped items by category for normal mode
  const categoryGroups = useMemo(() => {
    if (activeCategory !== 'all') {
      const filtered = hobbiesList.filter((item) => item.category === activeCategory);
      return [
        {
          id: activeCategory,
          name: activeCategory,
          items: filtered,
        },
      ];
    }

    const groups: { id: string; name: string; items: Hobby[] }[] = [];
    // Maintain category ordering as declared in HOBBY_CATEGORIES
    for (const cat of HOBBY_CATEGORIES) {
      if (cat.id === 'all') continue;
      const items = hobbiesList.filter((h) => h.category === cat.name);
      if (items.length > 0) {
        groups.push({
          id: cat.id,
          name: cat.name,
          items,
        });
      }
    }
    return groups;
  }, [activeCategory]);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* 1. Search Bar */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={theme.textTertiary} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Tìm sở thích, ví dụ: Cafe, Gym, Game..."
          placeholderTextColor={theme.textTertiary}
          style={[styles.searchInput, { color: theme.textPrimary }]}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="never"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={8}
            accessibilityLabel="Xóa tìm kiếm"
          >
            <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Selected Tray / Counter Bar */}
      <View style={styles.selectedSection}>
        <View style={styles.selectedHeaderRow}>
          <View style={styles.selectedCountBadge}>
            <Ionicons name="sparkles" size={14} color={theme.primary} />
            <Text style={[styles.selectedCountText, { color: theme.textSecondary }]}>
              Đã chọn{' '}
              <Text style={{ color: theme.primary, fontWeight: '700' }}>
                {selected.length}
              </Text>
              /{maxSelection}
            </Text>
          </View>

          {selected.length > 0 && onClearAll && (
            <TouchableOpacity onPress={onClearAll} hitSlop={8}>
              <Text style={[styles.clearAllText, { color: theme.textTertiary }]}>
                Xóa tất cả
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Selected Chips Horizontal Carousel */}
        {selected.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {selected.map((hobbyName) => {
              const emoji = HOBBY_EMOJIS[hobbyName] || '✨';
              return (
                <TouchableOpacity
                  key={`selected-${hobbyName}`}
                  onPress={() => onToggle(hobbyName)}
                  activeOpacity={0.7}
                  style={[
                    styles.selectedPill,
                    {
                      backgroundColor: theme.primaryLight,
                      borderColor: theme.primary,
                    },
                  ]}
                  accessibilityLabel={`Bỏ chọn ${hobbyName}`}
                >
                  <Text style={styles.chipEmoji}>{emoji}</Text>
                  <Text
                    style={[styles.selectedPillText, { color: theme.primary }]}
                    numberOfLines={1}
                  >
                    {hobbyName}
                  </Text>
                  <Ionicons name="close" size={14} color={theme.primary} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={[styles.hintText, { color: theme.textTertiary }]}>
            Chọn tối đa {maxSelection} sở thích để kết nối với những người cùng gu.
          </Text>
        )}
      </View>

      {/* 3. Category Filter Tabs (When not searching) */}
      {!searchResults && (
        <View style={styles.categoryTabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTabsContent}
            keyboardShouldPersistTaps="handled"
          >
            {HOBBY_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setActiveCategory(cat.id)}
                  activeOpacity={0.8}
                  style={[
                    styles.categoryTab,
                    {
                      backgroundColor: isActive ? theme.primary : theme.surface,
                      borderColor: isActive ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text style={styles.categoryTabEmoji}>{cat.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryTabText,
                      {
                        color: isActive ? '#FFFFFF' : theme.textPrimary,
                        fontWeight: isActive ? '700' : '500',
                      },
                    ]}
                  >
                    {cat.labelVi}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 4. Main Scroll Area: Groups & Chips */}
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.mainScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Case A: Search Results */}
        {searchResults !== null ? (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Kết quả tìm kiếm ({searchResults.length})
              </Text>
            </View>

            {searchResults.length > 0 ? (
              <View style={styles.chipGrid}>
                {searchResults.map((item) => {
                  const isSelected = selected.includes(item.name);
                  const emoji = HOBBY_EMOJIS[item.name] || '✨';
                  const disabled = isMaxReached && !isSelected;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handlePressChip(item.name)}
                      activeOpacity={0.7}
                      style={[
                        styles.hobbyChip,
                        {
                          backgroundColor: isSelected
                            ? theme.primary
                            : theme.surface,
                          borderColor: isSelected
                            ? theme.primary
                            : theme.border,
                          opacity: disabled ? 0.45 : 1,
                        },
                      ]}
                    >
                      <Text style={styles.chipEmoji}>{emoji}</Text>
                      <Text
                        style={[
                          styles.hobbyChipText,
                          {
                            color: isSelected ? '#FFFFFF' : theme.textPrimary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                      {isSelected ? (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      ) : (
                        <Ionicons name="add" size={14} color={theme.textTertiary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="search-outline"
                  size={44}
                  color={theme.textTertiary}
                />
                <Text
                  style={[styles.emptyStateTitle, { color: theme.textPrimary }]}
                >
                  Không tìm thấy sở thích nào
                </Text>
                <Text
                  style={[
                    styles.emptyStateSubtitle,
                    { color: theme.textSecondary },
                  ]}
                >
                  Hãy thử tìm kiếm bằng tiếng Anh hoặc từ khóa khác nhé.
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Case B: Category Grouped Chips */
          categoryGroups.map((group) => {
            const catMeta = HOBBY_CATEGORIES.find(
              (c) => c.name === group.name || c.id === group.id
            );
            const titleLabel = catMeta
              ? `${catMeta.emoji} ${catMeta.labelVi}`
              : group.name;

            return (
              <View key={group.id} style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <Text
                    style={[styles.sectionTitle, { color: theme.textPrimary }]}
                  >
                    {titleLabel}
                  </Text>
                  <View
                    style={[
                      styles.sectionCountBadge,
                      { backgroundColor: theme.surface },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sectionCountText,
                        { color: theme.textTertiary },
                      ]}
                    >
                      {group.items.length}
                    </Text>
                  </View>
                </View>

                <View style={styles.chipGrid}>
                  {group.items.map((item) => {
                    const isSelected = selected.includes(item.name);
                    const emoji = HOBBY_EMOJIS[item.name] || '✨';
                    const disabled = isMaxReached && !isSelected;

                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handlePressChip(item.name)}
                        activeOpacity={0.7}
                        style={[
                          styles.hobbyChip,
                          {
                            backgroundColor: isSelected
                              ? theme.primary
                              : theme.surface,
                            borderColor: isSelected
                              ? theme.primary
                              : theme.border,
                            opacity: disabled ? 0.45 : 1,
                          },
                        ]}
                      >
                        <Text style={styles.chipEmoji}>{emoji}</Text>
                        <Text
                          style={[
                            styles.hobbyChipText,
                            {
                              color: isSelected ? '#FFFFFF' : theme.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {item.name}
                        </Text>
                        {isSelected ? (
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color="#FFFFFF"
                          />
                        ) : (
                          <Ionicons
                            name="add"
                            size={14}
                            color={theme.textTertiary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderWidth: 1,
    borderRadius: 21,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  selectedSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  selectedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  selectedCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  selectedCountText: {
    fontSize: 13,
    fontWeight: '500',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 2,
  },
  selectedScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    gap: 5,
  },
  selectedPillText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  categoryTabsContainer: {
    marginBottom: 6,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    gap: 5,
  },
  categoryTabEmoji: {
    fontSize: 14,
  },
  categoryTabText: {
    fontSize: 12.5,
  },
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
    gap: 18,
  },
  sectionWrap: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hobbyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  chipEmoji: {
    fontSize: 14,
  },
  hobbyChipText: {
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 6,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
