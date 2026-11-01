import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { LiveChatMessage } from '@/services/chatService';

interface ChatUnreadState {
  userUid: string | null;
  unreadConversationIds: string[];
  lastReadAtByConversation: Record<string, number>;
  hydrate: (userUid: string) => Promise<void>;
  observeMessages: (conversationId: string, messages: LiveChatMessage[], userUid: string) => void;
  markRead: (conversationId: string, readAt: number, userUid: string) => void;
  clear: () => void;
}

const storageKey = (userUid: string) => `chat-last-read:${userUid}`;

export const useChatUnreadStore = create<ChatUnreadState>((set, get) => ({
  userUid: null,
  unreadConversationIds: [],
  lastReadAtByConversation: {},
  clear: () => set({ userUid: null, unreadConversationIds: [], lastReadAtByConversation: {} }),

  hydrate: async (userUid) => {
    set({ userUid, unreadConversationIds: [], lastReadAtByConversation: {} });
    try {
      const raw = await AsyncStorage.getItem(storageKey(userUid));
      if (get().userUid !== userUid) return;
      const lastReadAtByConversation = raw
        ? (JSON.parse(raw) as Record<string, number>)
        : {};
      set({ lastReadAtByConversation });
    } catch {
      if (get().userUid === userUid) set({ lastReadAtByConversation: {} });
    }
  },

  observeMessages: (conversationId, messages, userUid) => {
    const state = get();
    if (state.userUid !== userUid) return;

    const latestIncomingAt = messages.reduce((latest, message) => {
      if (message.senderUid === userUid || !Number.isFinite(message.createdAt.getTime())) {
        return latest;
      }
      return Math.max(latest, message.createdAt.getTime());
    }, 0);
    const lastReadAt = state.lastReadAtByConversation[conversationId] ?? 0;
    const isUnread = latestIncomingAt > lastReadAt;

    set((current) => ({
      unreadConversationIds: isUnread
        ? current.unreadConversationIds.includes(conversationId)
          ? current.unreadConversationIds
          : [...current.unreadConversationIds, conversationId]
        : current.unreadConversationIds.filter((id) => id !== conversationId),
    }));
  },

  markRead: (conversationId, readAt, userUid) => {
    const state = get();
    if (state.userUid !== userUid) return;
    const lastReadAtByConversation = {
      ...state.lastReadAtByConversation,
      [conversationId]: Math.max(
        state.lastReadAtByConversation[conversationId] ?? 0,
        readAt,
      ),
    };
    set({
      lastReadAtByConversation,
      unreadConversationIds: state.unreadConversationIds.filter((id) => id !== conversationId),
    });
    void AsyncStorage.setItem(storageKey(userUid), JSON.stringify(lastReadAtByConversation)).catch(() => undefined);
  },
}));
