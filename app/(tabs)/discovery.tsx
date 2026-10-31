import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, darkColors, spacing } from '@/theme';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import {
  datingApi,
  DiscoveryGroup,
  DiscoveryIntention,
} from '@/api/datingClient';
import DiscoveryFeedModal, {
  DiscoveryFeedTopic,
} from '@/components/DiscoveryFeedModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = spacing.md;
const CONTAINER_PADDING = spacing.base;
const CARD_WIDTH = (SCREEN_WIDTH - CONTAINER_PADDING * 2 - CARD_GAP) / 2;
const CARD_HEIGHT = 205;

function formatMemberCount(count: number): string {
  try {
    return new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(count);
  } catch {
    return count > 999 ? `${(count / 1000).toFixed(1)}N` : String(count);
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const GROUP_META: Record<
  string,
  {
    title: string;
    imageUrl: string;
    glowColor: string;
    fallbackIcon: keyof typeof Ionicons.glyphMap;
    description: string;
  }
> = {
  'me-phim': {
    title: 'Hội mê Phim',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Television/3D/television_3d.png',
    glowColor: 'rgba(255, 77, 141, 0.22)',
    fallbackIcon: 'tv-outline',
    description: 'Cùng xem phim, thảo luận về những bộ phim bom tấn và rạp chiếu.',
  },
  'me-game': {
    title: 'Hội mê Game',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Puzzle%20piece/3D/puzzle_piece_3d.png',
    glowColor: 'rgba(255, 122, 0, 0.22)',
    fallbackIcon: 'game-controller-outline',
    description: 'Tìm đồng đội leo rank, chơi co-op và chia sẻ đam mê game.',
  },
  'me-nghe-thuat': {
    title: 'Mê nghệ thuật',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Artist%20palette/3D/artist_palette_3d.png',
    glowColor: 'rgba(168, 85, 247, 0.22)',
    fallbackIcon: 'color-palette-outline',
    description: 'Đam mê hội họa, nhiếp ảnh, thiết kế và nghệ thuật sáng tạo.',
  },
  'du-lich': {
    title: 'Du lịch',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Airplane/3D/airplane_3d.png',
    glowColor: 'rgba(59, 130, 246, 0.22)',
    fallbackIcon: 'airplane-outline',
    description: 'Khám phá những vùng đất mới, phượt và tận hưởng trải nghiệm vi vu.',
  },
  'yeu-the-thao': {
    title: 'Yêu thể thao',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Soccer%20ball/3D/soccer_ball_3d.png',
    glowColor: 'rgba(34, 197, 94, 0.22)',
    fallbackIcon: 'football-outline',
    description: 'Chạy bộ, gym, thể thao và cùng nhau duy trì phong độ năng động.',
  },
  'thich-di-nhau': {
    title: 'Thích đi nhậu',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Beer%20mug/3D/beer_mug_3d.png',
    glowColor: 'rgba(245, 158, 11, 0.22)',
    fallbackIcon: 'beer-outline',
    description: 'Gặp gỡ chill cuối tuần, chuyện trò và cụng ly sảng khoái.',
  },
  'me-am-thuc': {
    title: 'Mê ẩm thực',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Cooking/3D/cooking_3d.png',
    glowColor: 'rgba(239, 68, 68, 0.22)',
    fallbackIcon: 'restaurant-outline',
    description: 'Ăn sập phố phường, nấu nướng và cùng khám phá các món ngon.',
  },
  'yeu-thien-nhien': {
    title: 'Yêu thiên nhiên',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Deciduous%20tree/3D/deciduous_tree_3d.png',
    glowColor: 'rgba(16, 185, 129, 0.22)',
    fallbackIcon: 'leaf-outline',
    description: 'Yêu cây cỏ, dã ngoại cắm trại và hòa mình vào thiên nhiên.',
  },
  'yeu-am-nhac': {
    title: 'Yêu âm nhạc',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Musical%20notes/3D/musical_notes_3d.png',
    glowColor: 'rgba(236, 72, 153, 0.22)',
    fallbackIcon: 'musical-notes-outline',
    description: 'Nghe nhạc, chia sẻ playlist và cùng thưởng thức những giai điệu hay.',
  },
  'thich-kham-pha-tri-thuc': {
    title: 'Thích khám phá tri thức',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Books/3D/books_3d.png',
    glowColor: 'rgba(99, 102, 241, 0.22)',
    fallbackIcon: 'book-outline',
    description: 'Đọc sách, trao đổi kiến thức sâu sắc và tìm hiểu góc nhìn mới.',
  },
  'song-tich-cuc': {
    title: 'Sống tích cực',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sun/3D/sun_3d.png',
    glowColor: 'rgba(234, 179, 8, 0.22)',
    fallbackIcon: 'sunny-outline',
    description: 'Lan tỏa nguồn năng lượng tươi sáng, phát triển bản thân mỗi ngày.',
  },
  'thich-ket-noi': {
    title: 'Thích kết nối',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sparkles/3D/sparkles_3d.png',
    glowColor: 'rgba(20, 184, 166, 0.22)',
    fallbackIcon: 'people-outline',
    description: 'Mở rộng vòng kết nối, trò chuyện cởi mở và kết thêm bạn mới.',
  },
  'nguoi-yeu': {
    title: 'Người yêu',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Tulip/3D/tulip_3d.png',
    glowColor: 'rgba(255, 51, 75, 0.25)',
    fallbackIcon: 'rose-outline',
    description: 'Tìm kiếm nửa kia để cùng chia sẻ những khoảnh khắc ngọt ngào.',
  },
  'ban-hen-ho-lau-dai': {
    title: 'Bạn hẹn hò lâu dài',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Ring/3D/ring_3d.png',
    glowColor: 'rgba(224, 36, 195, 0.22)',
    fallbackIcon: 'diamond-outline',
    description: 'Hướng tới mối quan hệ lâu dài, gắn kết và xây dựng tương lai.',
  },
  'bat-ki': {
    title: 'Bất kì',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Gem%20stone/3D/gem_stone_3d.png',
    glowColor: 'rgba(217, 70, 239, 0.22)',
    fallbackIcon: 'sparkles-outline',
    description: 'Gặp gỡ những người có tần số chung, thấu hiểu và lắng nghe.',
  },
  'ban-moi': {
    title: 'Bạn mới',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Hot%20beverage/3D/hot_beverage_3d.png',
    glowColor: 'rgba(245, 158, 11, 0.22)',
    fallbackIcon: 'cafe-outline',
    description: 'Mở rộng vòng kết nối bạn bè, trò chuyện và cùng nhau chia sẻ cuộc sống.',
  },
  'chua-ro': {
    title: 'Chưa rõ',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Crescent%20moon/3D/crescent_moon_3d.png',
    glowColor: 'rgba(56, 189, 248, 0.24)',
    fallbackIcon: 'moon-outline',
    description: 'Vẫn đang khám phá và tìm hiểu bản thân trong các mối quan hệ.',
  },
};

const INTENTION_META: Record<
  string,
  {
    title: string;
    imageUrl: string;
    glowColor: string;
    fallbackIcon: keyof typeof Ionicons.glyphMap;
    description: string;
  }
> = {
  'Người yêu': {
    title: 'Người yêu',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Tulip/3D/tulip_3d.png',
    glowColor: 'rgba(255, 51, 75, 0.25)',
    fallbackIcon: 'rose-outline',
    description: 'Tìm kiếm nửa kia để cùng chia sẻ những khoảnh khắc ngọt ngào.',
  },
  'Bạn hẹn hò lâu dài': {
    title: 'Mối quan hệ nghiêm túc',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Ring/3D/ring_3d.png',
    glowColor: 'rgba(224, 36, 195, 0.22)',
    fallbackIcon: 'diamond-outline',
    description: 'Hướng tới mối quan hệ lâu dài, gắn kết và xây dựng tương lai.',
  },
  'Bất kì': {
    title: 'Bất kì',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Gem%20stone/3D/gem_stone_3d.png',
    glowColor: 'rgba(217, 70, 239, 0.22)',
    fallbackIcon: 'sparkles-outline',
    description: 'Gặp gỡ những người có tần số chung, thấu hiểu và lắng nghe.',
  },
  'Bạn mới': {
    title: 'Bạn mới',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Hot%20beverage/3D/hot_beverage_3d.png',
    glowColor: 'rgba(245, 158, 11, 0.22)',
    fallbackIcon: 'cafe-outline',
    description: 'Mở rộng vòng kết nối bạn bè, trò chuyện và cùng nhau chia sẻ cuộc sống.',
  },
  'Chưa rõ': {
    title: 'Chưa rõ',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Crescent%20moon/3D/crescent_moon_3d.png',
    glowColor: 'rgba(56, 189, 248, 0.24)',
    fallbackIcon: 'moon-outline',
    description: 'Vẫn đang khám phá và tìm hiểu bản thân trong các mối quan hệ.',
  },
  'người yêu': {
    title: 'Người yêu',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Tulip/3D/tulip_3d.png',
    glowColor: 'rgba(255, 51, 75, 0.25)',
    fallbackIcon: 'rose-outline',
    description: 'Tìm kiếm nửa kia để cùng chia sẻ những khoảnh khắc ngọt ngào.',
  },
  'bạn hẹn hò lâu dài': {
    title: 'Mối quan hệ nghiêm túc',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Ring/3D/ring_3d.png',
    glowColor: 'rgba(224, 36, 195, 0.22)',
    fallbackIcon: 'diamond-outline',
    description: 'Hướng tới mối quan hệ lâu dài, gắn kết và xây dựng tương lai.',
  },
  'bất kì': {
    title: 'Bất kì',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Gem%20stone/3D/gem_stone_3d.png',
    glowColor: 'rgba(217, 70, 239, 0.22)',
    fallbackIcon: 'sparkles-outline',
    description: 'Gặp gỡ những người có tần số chung, thấu hiểu và lắng nghe.',
  },
  'bạn mới': {
    title: 'Bạn mới',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Hot%20beverage/3D/hot_beverage_3d.png',
    glowColor: 'rgba(245, 158, 11, 0.22)',
    fallbackIcon: 'cafe-outline',
    description: 'Mở rộng vòng kết nối bạn bè, trò chuyện và cùng nhau chia sẻ cuộc sống.',
  },
  'chưa rõ': {
    title: 'Chưa rõ',
    imageUrl:
      'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Crescent%20moon/3D/crescent_moon_3d.png',
    glowColor: 'rgba(56, 189, 248, 0.24)',
    fallbackIcon: 'moon-outline',
    description: 'Vẫn đang khám phá và tìm hiểu bản thân trong các mối quan hệ.',
  },
};

export default function DiscoveryScreen() {
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === 'dark' ? darkColors : colors;
  const currentUser = useAuthStore((state) => state.user);
  const userId = currentUser?.id;

  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [serverGroups, setServerGroups] = useState<DiscoveryGroup[] | null>(null);
  const [serverIntentions, setServerIntentions] = useState<DiscoveryIntention[] | null>(null);

  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});

  // Active Feed Modal
  const [selectedTopic, setSelectedTopic] = useState<DiscoveryFeedTopic | null>(null);
  const [feedModalVisible, setFeedModalVisible] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([
      datingApi.getDiscoveryGroups().catch((err) => {
        console.warn('Get discovery groups error:', err);
        return null;
      }),
      datingApi.getDiscoveryIntentions().catch((err) => {
        console.warn('Get discovery intentions error:', err);
        return null;
      }),
    ])
      .then(([groupsRes, intentionsRes]) => {
        if (!active) return;
        let hasSuccess = false;
        if (groupsRes?.success && Array.isArray(groupsRes.data)) {
          setServerGroups(groupsRes.data);
          hasSuccess = true;
        }
        if (intentionsRes?.success && Array.isArray(intentionsRes.data)) {
          setServerIntentions(intentionsRes.data);
          hasSuccess = true;
        }

        if (!hasSuccess && (groupsRes === null || intentionsRes === null)) {
          setFetchError(
            'Không thể kết nối đến máy chủ. Vui lòng kéo xuống để thử lại.',
          );
        } else {
          setFetchError(null);
        }
      })
      .catch((err) => {
        if (!active) return;
        console.warn('Error fetching discovery data:', err);
        setFetchError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
      })
      .finally(() => {
        if (active) {
          setInitialLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setFetchError(null);
    try {
      const [groupsRes, intentionsRes] = await Promise.all([
        datingApi.getDiscoveryGroups().catch(() => null),
        datingApi.getDiscoveryIntentions().catch(() => null),
      ]);
      let hasSuccess = false;
      if (groupsRes?.success && Array.isArray(groupsRes.data)) {
        setServerGroups(groupsRes.data);
        hasSuccess = true;
      }
      if (intentionsRes?.success && Array.isArray(intentionsRes.data)) {
        setServerIntentions(intentionsRes.data);
        hasSuccess = true;
      }
      if (!hasSuccess && (groupsRes === null || intentionsRes === null)) {
        setFetchError(
          'Không thể kết nối đến máy chủ. Vui lòng kéo xuống để thử lại.',
        );
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Merge server data with visual design metadata - strictly no mock data
  const cards: DiscoveryFeedTopic[] = useMemo(() => {
    const result: DiscoveryFeedTopic[] = [];
    const seenSlugs = new Set<string>();

    // 1. Groups from backend
    if (serverGroups && serverGroups.length > 0) {
      for (const group of serverGroups) {
        if (!group.is_active) continue;
        const meta = GROUP_META[group.slug];
        seenSlugs.add(group.slug);
        result.push({
          type: 'group',
          id: group.id || `group-${group.slug}`,
          slug: group.slug,
          name: group.name,
          memberCount: group.member_count ?? 0,
          isMember: group.is_member ?? false,
          imageUrl:
            meta?.imageUrl ||
            'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sparkles/3D/sparkles_3d.png',
          glowColor: meta?.glowColor || 'rgba(255, 77, 141, 0.22)',
          fallbackIcon: meta?.fallbackIcon || 'people-outline',
          description: meta?.description || group.name,
        });
      }
    }

    // 2. Intentions from backend that are not already present as discovery groups
    if (serverIntentions && serverIntentions.length > 0) {
      for (const intention of serverIntentions) {
        const slug = slugify(intention.value);
        if (seenSlugs.has(slug)) continue;

        const meta =
          INTENTION_META[intention.value] ||
          INTENTION_META[intention.value.toLowerCase()];
        result.push({
          type: 'intention',
          id: `intention-${intention.value}`,
          value: intention.value,
          name: meta?.title || intention.value,
          memberCount: intention.member_count ?? 0,
          imageUrl:
            meta?.imageUrl ||
            'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sparkles/3D/sparkles_3d.png',
          glowColor: meta?.glowColor || 'rgba(255, 51, 75, 0.25)',
          fallbackIcon: meta?.fallbackIcon || 'heart-outline',
          description: meta?.description || intention.value,
        });
      }
    }

    return result;
  }, [serverGroups, serverIntentions]);

  const handleTopicPress = (topic: DiscoveryFeedTopic) => {
    setSelectedTopic(topic);
    setFeedModalVisible(true);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Khám Phá
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Tìm kiếm những người có chung mục đích và sở thích
          </Text>
        </View>

        {/* Loading State */}
        {initialLoading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Đang tải danh sách nhóm khám phá...
            </Text>
          </View>
        ) : fetchError && cards.length === 0 ? (
          <View style={styles.stateContainer}>
            <Ionicons name="cloud-offline-outline" size={54} color={theme.textTertiary} />
            <Text style={[styles.stateTitle, { color: theme.textPrimary }]}>
              Không thể tải dữ liệu
            </Text>
            <Text style={[styles.stateSubtitle, { color: theme.textSecondary }]}>
              {fetchError}
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: theme.primary }]}
              onPress={handleRefresh}
            >
              <Ionicons name="refresh" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.stateContainer}>
            <Ionicons name="search-outline" size={54} color={theme.textTertiary} />
            <Text style={[styles.stateTitle, { color: theme.textPrimary }]}>
              Chưa có nhóm nào
            </Text>
            <Text style={[styles.stateSubtitle, { color: theme.textSecondary }]}>
              Hiện chưa có nhóm khám phá nào đang hoạt động.
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: theme.primary }]}
              onPress={handleRefresh}
            >
              <Ionicons name="refresh" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.retryBtnText}>Tải lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* 2-Column Grid */
          <View style={styles.gridContainer}>
            {cards.map((topic) => {
              const hasError = imageErrorMap[topic.id];

              return (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: mode === 'dark' ? '#1B1C22' : '#F6F3EC',
                      borderColor: mode === 'dark' ? '#292B33' : theme.border,
                    },
                  ]}
                  activeOpacity={0.82}
                  onPress={() => handleTopicPress(topic)}
                >
                  {/* Center Visual Art */}
                  <View style={styles.visualContainer}>
                    {!hasError && topic.imageUrl ? (
                      <Image
                        source={{ uri: topic.imageUrl }}
                        style={styles.cardImage}
                        resizeMode="contain"
                        onError={() =>
                          setImageErrorMap((prev) => ({
                            ...prev,
                            [topic.id]: true,
                          }))
                        }
                      />
                    ) : (
                      <View
                        style={[
                          styles.fallbackIconWrap,
                          {
                            backgroundColor:
                              topic.glowColor || 'rgba(255, 77, 141, 0.22)',
                          },
                        ]}
                      >
                        <Ionicons
                          name={topic.fallbackIcon || 'sparkles-outline'}
                          size={44}
                          color={theme.primary}
                        />
                      </View>
                    )}
                  </View>

                  {/* Card Bottom Row: Title on Left, Count on Right */}
                  <View style={styles.cardBottomRow}>
                    <Text
                      style={[
                        styles.cardTopicTitle,
                        { color: theme.textPrimary },
                      ]}
                      numberOfLines={2}
                    >
                      {topic.name}
                    </Text>
                    <Text
                      style={[
                        styles.cardCountText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {formatMemberCount(topic.memberCount)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Discovery Feed Modal */}
      <DiscoveryFeedModal
        visible={feedModalVisible}
        onClose={() => setFeedModalVisible(false)}
        topic={selectedTopic}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingTop: spacing.xs,
    paddingBottom: 120,
  },
  header: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.lg,
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 14,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 18,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
    padding: spacing.base,
  },
  visualContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    position: 'relative',
  },
  cardImage: {
    width: 92,
    height: 92,
  },
  fallbackIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 4,
  },
  cardTopicTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    lineHeight: 19,
  },
  cardCountText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
