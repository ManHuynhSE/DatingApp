import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { borderRadius, colors, darkColors, spacing, typography } from '@/theme';
import { datingApi, type ChatConversationSummary, type DatingMatchItem } from '@/api/datingClient';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

interface NewMatch {
  id: string;
  matchId: string;
  name: string;
  image: string;
}

interface ChatRow {
  id: string;
  matchId: string;
  name: string;
  image: string;
  preview: string;
  timestamp: string;
}

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200';

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

function mapMatch(match: DatingMatchItem): NewMatch {
  const photo = [...match.partner.photo].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position,
  )[0];
  return {
    id: match.partner.id,
    matchId: match.id,
    name: match.partner.profile?.display_name ?? 'Match',
    image: photo?.url ?? FALLBACK_AVATAR,
  };
}

function mapConversation(conversation: ChatConversationSummary): ChatRow {
  return {
    id: conversation.conversationId,
    matchId: conversation.matchId,
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
  const [matches, setMatches] = useState<NewMatch[]>([]);
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    if (!userId) {
      setLoading(false);
      setMatches([]);
      setChats([]);
      return undefined;
    }
    let active = true;
    setLoading(true);
    Promise.all([datingApi.getUserMatches(userId), datingApi.getChatConversations()])
      .then(([matchResponse, chatResponse]) => {
        if (!active) return;
        const activeMatches = matchResponse.data
          .filter((match) => match.status === 'active')
          .map(mapMatch);
        const conversations = chatResponse.data.map(mapConversation);
        const existingMatchIds = new Set(conversations.map((chat) => chat.matchId));
        setMatches(activeMatches.filter((match) => !existingMatchIds.has(match.matchId)));
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

  const openNewMatch = async (item: NewMatch) => {
    try {
      const result = await datingApi.getOrCreateChatConversation(item.matchId);
      router.push(`/chat/${result.data.conversationId}`);
    } catch (error) {
      Alert.alert('Unable to open chat', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const renderMatch = ({ item }: { item: NewMatch }) => (
    <Pressable onPress={() => openNewMatch(item)} style={styles.matchItem}>
      <View style={styles.matchAvatarFrame}>
        <Image source={{ uri: item.image }} style={styles.matchAvatar} />
        <View style={styles.matchHeart}>
          <Ionicons name="heart" size={11} color={theme.white} />
        </View>
      </View>
      <Text style={styles.matchName} numberOfLines={1}>{item.name.split(' ')[0]}</Text>
    </Pressable>
  );

  const renderChat = ({ item }: { item: ChatRow }) => (
    <Pressable
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
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>HEARTSYNC</Text>
            <Text style={styles.title}>Messages</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="chatbubbles-outline" size={22} color={theme.primary} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>NEW MATCHES</Text>
            {matches.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{matches.length}</Text>
              </View>
            )}
          </View>
          {matches.length > 0 && <Text style={styles.sectionHint}>Say hi to someone new</Text>}
        </View>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={styles.loadingText}>Loading matches…</Text>
          </View>
        ) : matches.length > 0 ? (
          <FlatList
            data={matches}
            renderItem={renderMatch}
            keyExtractor={(item) => item.matchId}
            horizontal
            scrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.matchesList}
          />
        ) : (
          <View style={styles.noNewMatches}>
            <Ionicons name="heart-outline" size={18} color={theme.textTertiary} />
            <Text style={styles.noNewMatchesText}>New mutual likes will show up here.</Text>
          </View>
        )}

        <View style={styles.messagesHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>MESSAGES</Text>
            {chats.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{chats.length}</Text>
              </View>
            )}
          </View>
          <Text style={styles.sectionHint}>Your conversations</Text>
        </View>

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
          <View style={styles.emptyMessages}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={26} color={theme.primary} />
            </View>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyText}>When you’re ready, start a chat with one of your matches.</Text>
          </View>
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
  sectionHeader: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
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
  matchesList: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.md },
  matchItem: { width: 66, alignItems: 'center', gap: 5 },
  matchAvatarFrame: { position: 'relative' },
  matchAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  matchHeart: {
    position: 'absolute',
    right: -1,
    bottom: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    borderWidth: 2,
    borderColor: theme.background,
  },
  matchName: { ...typography.caption, color: theme.textPrimary, textAlign: 'center', maxWidth: 66 },
  noNewMatches: {
    marginHorizontal: spacing.lg,
    minHeight: 56,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: theme.surface,
  },
  noNewMatchesText: { ...typography.bodySmall, color: theme.textSecondary },
  messagesHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
    marginTop: spacing.sm,
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
  loadingRow: {
    minHeight: 72,
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: { ...typography.bodySmall, color: theme.textSecondary },
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
