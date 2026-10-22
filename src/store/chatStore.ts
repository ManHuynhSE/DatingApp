import { create } from 'zustand';
import {
  chatConversations,
  ChatConversation,
  ChatMessage,
} from '@/data/mockData';

interface ChatState {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  sendMessage: (conversationId: string, text: string) => void;
  markAsRead: (conversationId: string) => void;
  setActiveConversation: (conversationId: string | null) => void;
  getConversation: (conversationId: string) => ChatConversation | undefined;
  getTotalUnread: () => number;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: chatConversations,
  activeConversationId: null,

  sendMessage: (conversationId: string, text: string) =>
    set((state) => {
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: 'current-user',
        text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        read: true,
        type: 'text',
      };

      return {
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: [...conv.messages, newMessage],
                lastMessage: text,
                lastMessageTime: 'Just now',
              }
            : conv
        ),
      };
    }),

  markAsRead: (conversationId: string) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              unreadCount: 0,
              messages: conv.messages.map((msg) => ({
                ...msg,
                read: true,
              })),
            }
          : conv
      ),
    })),

  setActiveConversation: (conversationId: string | null) =>
    set({ activeConversationId: conversationId }),

  getConversation: (conversationId: string) => {
    return get().conversations.find((c) => c.id === conversationId);
  },

  getTotalUnread: () => {
    return get().conversations.reduce(
      (total, conv) => total + conv.unreadCount,
      0
    );
  },
}));
