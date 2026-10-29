import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { colors, darkColors, typography, spacing, borderRadius } from '@/theme';
import { useThemeStore } from '@/store/themeStore';
import { datingApi, DatingMatchItem, ChatConversationSummary } from '@/api/datingClient';
import { useAuthStore } from '@/store/authStore';

interface Match {
  id: string;
  name: string;
  image: string;
  online: boolean;
  matchId: string;
}

interface Chat {
  id: string;
  name: string;
  image: string;
  lastMessage: string;
  timestamp: string;
  online: boolean;
  unread: boolean;
}

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200';

function formatTimestamp(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function mapMatch(match: DatingMatchItem): Match {
  return {
    id: match.partner.id,
    matchId: match.id,
    name: match.partner.profile?.display_name ?? 'Match',
    image: match.partner.photo?.[0]?.url ?? FALLBACK_AVATAR,
    online: false,
  };
}

function mapConversation(conversation: ChatConversationSummary): Chat {
  return {
    id: conversation.conversationId,
    name: conversation.partner.name,
    image: conversation.partner.avatar ?? FALLBACK_AVATAR,
    lastMessage: conversation.lastMessage ?? 'Say hello 👋',
    timestamp: formatTimestamp(conversation.lastMessageAt),
    online: false,
    unread: false,
  };
}

export default function InboxScreen() {
  const router = useRouter();
  const mode = useThemeStore((state) => state.mode);
  const userId = useAuthStore((state) => state.user?.id);
  const theme = mode === 'dark' ? darkColors : colors;
  const styles = createStyles(theme);
  const [matches, setMatches] = useState<Match[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);

  useFocusEffect(useCallback(() => {
    if (!userId) return undefined;
    let active = true;
    Promise.all([datingApi.getUserMatches(userId), datingApi.getChatConversations()])
      .then(([matchResponse, chatResponse]) => {
        if (!active) return;
        setMatches(matchResponse.data.filter((match) => match.status === 'active').map(mapMatch));
        setChats(chatResponse.data.map(mapConversation));
      })
      .catch((error) => {
        if (active) Alert.alert('Unable to load messages', error instanceof Error ? error.message : 'Please try again.');
      });
    return () => { active = false; };
  }, [userId]));

  const renderMatchItem = ({ item }: { item: Match }) => (
    <TouchableOpacity
      style={styles.matchItem}
      onPress={async () => {
        try {
          const result = await datingApi.getOrCreateChatConversation(item.matchId);
          router.push(`/chat/${result.data.conversationId}`);
        } catch (error) {
          Alert.alert('Unable to open chat', error instanceof Error ? error.message : 'Please try again.');
        }
      }}
    >
      <View style={styles.matchAvatarContainer}>
        <Image source={{ uri: item.image }} style={styles.matchAvatar} />
        {item.online && <View style={styles.onlineDot} />}
      </View>
      <Text style={styles.matchName} numberOfLines={1}>
        {item.name.split(' ')[0]}
      </Text>
    </TouchableOpacity>
  );

  const renderChatItem = (chat: Chat) => (
    <TouchableOpacity key={chat.id} style={styles.chatItem} onPress={() => router.push(`/chat/${chat.id}`)}>
      <View style={styles.chatAvatarContainer}>
        <Image source={{ uri: chat.image }} style={styles.chatAvatar} />
        {chat.online && <View style={styles.chatOnlineDot} />}
      </View>
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{chat.name}</Text>
          <Text style={styles.chatTimestamp}>{chat.timestamp}</Text>
        </View>
        <Text style={styles.chatLastMessage} numberOfLines={1}>
          {chat.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.scrollView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="search-outline" size={18} color={theme.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search messages..."
              placeholderTextColor={theme.textTertiary}
            />
          </View>
        </View>

        {/* Matches section */}
        <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Matches ({matches.length})</Text>
        </View>

        <FlatList
          data={matches}
          renderItem={renderMatchItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.matchesList}
          scrollEnabled
        />

        {/* Chats section */}
        <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Chats ({chats.length})</Text>
          <TouchableOpacity onPress={() => Alert.alert('Chat filters', 'Unread and online filters will be connected to the backend in the next phase.')}>
            <Ionicons name="filter-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.chatsList}>
          {chats.map(renderChatItem)}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: theme.textPrimary,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.bodySmall,
    color: theme.textPrimary,
    padding: 0,
  },
  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: theme.textPrimary,
  },
  // Matches list
  matchesList: {
    paddingHorizontal: spacing.base,
    gap: spacing.base,
  },
  matchItem: {
    alignItems: 'center',
    width: 72,
    marginRight: spacing.sm,
  },
  matchAvatarContainer: {
    position: 'relative',
    marginBottom: spacing.xs,
  },
  matchAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: theme.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.online,
    borderWidth: 2,
    borderColor: theme.white,
  },
  matchName: {
    ...typography.caption,
    color: theme.textPrimary,
    textAlign: 'center',
  },
  // Chats list
  chatsList: {
    paddingHorizontal: spacing.base,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    gap: spacing.md,
  },
  chatAvatarContainer: {
    position: 'relative',
  },
  chatAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  chatOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.online,
    borderWidth: 2,
    borderColor: theme.white,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  chatName: {
    ...typography.body,
    color: theme.textPrimary,
    fontWeight: '600',
  },
  chatTimestamp: {
    ...typography.caption,
    color: theme.textTertiary,
  },
  chatLastMessage: {
    ...typography.bodySmall,
    color: theme.textSecondary,
  },
});
