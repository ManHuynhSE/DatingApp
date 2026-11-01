import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import SpringPressable from '@/components/SpringPressable';
import { colors, darkColors, spacing, typography } from '@/theme';
import { datingApi, type ChatConversationSummary } from '@/api/datingClient';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

interface ChatRow {
  id: string;
  name: string;
  image: string;
  preview: string;
  timestamp: string;
}

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200';
const springFadeInDown = (delay = 0) =>
  FadeInDown.delay(delay).springify().damping(22).stiffness(240).mass(0.85);

function formatTimestamp(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function mapConversation(conversation: ChatConversationSummary): ChatRow {
  return {
    id: conversation.conversationId,
    name: conversation.partner.name,
    image: conversation.partner.avatar ?? FALLBACK_AVATAR,
    preview: conversation.lastMessage?.trim() || 'Say hello and start a conversation',
    timestamp: formatTimestamp(conversation.lastMessageAt),
  };
}

export default function InboxScreen() {
  const router = useRouter();
  const mode = useThemeStore((state) => state.mode);
  const userId = useAuthStore((state) => state.user?.id);
  const theme = mode === 'dark' ? darkColors : colors;
  const styles = createStyles(theme);
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    if (!userId) {
      setLoading(false);
      setChats([]);
      return undefined;
    }
    let active = true;
    setLoading(true);
    datingApi.getChatConversations()
      .then((chatResponse) => {
        if (!active) return;
        const conversations = chatResponse.data.map(mapConversation);
        setChats(conversations);
      })
      .catch((error) => {
        if (active) Alert.alert('Unable to load messages', error instanceof Error ? error.message : 'Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [userId]));

  const renderChat = ({ item, index }: { item: ChatRow; index: number }) => (
    <Animated.View entering={springFadeInDown(Math.min(index, 8) * 40 + 180)}>
      <SpringPressable
        onPress={() => router.push(`/chat/${item.id}`)}
        style={({ pressed }) => [styles.chatRow, pressed && styles.chatRowPressed]}
      >
        <Image source={{ uri: item.image }} style={styles.chatAvatar} />
        <View style={styles.chatBody}>
          <View style={styles.chatTopLine}>
            <Text style={styles.chatName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.chatTime}>{item.timestamp}</Text>
          </View>
          <Text style={styles.chatPreview} numberOfLines={1}>{item.preview}</Text>
        </View>
        <Ionicons name="chevron-forward" size={17} color={theme.textTertiary} />
      </SpringPressable>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={springFadeInDown()} style={styles.header}>
          <View>
            <Text style={styles.title}>Chat</Text>
          </View>
        </Animated.View>

        <Animated.View entering={springFadeInDown(150)} style={styles.messagesHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>TIN NHẮN</Text>
            {chats.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{chats.length}</Text>
              </View>
            )}
          </View>
          <Text style={styles.sectionHint}>Các cuộc trò chuyện của bạn</Text>
        </Animated.View>

        {loading ? (
          <View style={styles.messageLoading}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : chats.length > 0 ? (
          <FlatList
            data={chats}
            renderItem={renderChat}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        ) : (
          <Animated.View entering={springFadeInDown(200)} style={styles.emptyMessages}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={26} color={theme.primary} />
            </View>
            <Text style={styles.emptyTitle}>Chưa có cuộc trò chuyện nào</Text>
            <Text style={styles.emptyText}>Khi bạn đã sẵn sàng, hãy bắt đầu trò chuyện với người bạn đã tương hợp.</Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  content: { paddingBottom: 112 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: { ...typography.captionBold, color: theme.primary, letterSpacing: 1.3, marginBottom: 3 },
  title: { ...typography.h1, color: theme.textPrimary, fontSize: 30 },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primaryLight,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sectionTitle: { ...typography.captionBold, color: theme.primary, letterSpacing: 1.1 },
  countBadge: {
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
  },
  countText: { fontSize: 10, lineHeight: 13, fontWeight: '700', color: theme.white },
  sectionHint: { ...typography.caption, color: theme.textTertiary, marginTop: 3 },
  messagesHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  chatRow: {
    minHeight: 82,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: theme.background,
  },
  chatRowPressed: { backgroundColor: theme.surface },
  chatAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.surface,
  },
  chatBody: { flex: 1, minWidth: 0, gap: 4 },
  chatTopLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  chatName: { ...typography.bodyBold, color: theme.textPrimary, flex: 1 },
  chatTime: { ...typography.caption, color: theme.textTertiary },
  chatPreview: { ...typography.bodySmall, color: theme.textSecondary },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: theme.borderLight, marginLeft: 88 },
  messageLoading: { height: 80, alignItems: 'center', justifyContent: 'center' },
  emptyMessages: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { ...typography.bodyBold, color: theme.textPrimary },
  emptyText: { ...typography.bodySmall, color: theme.textSecondary, textAlign: 'center', marginTop: spacing.xs, maxWidth: 280 },
});
