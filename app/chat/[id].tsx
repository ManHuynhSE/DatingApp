import React, { useState, useRef } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, darkColors, typography, spacing, borderRadius } from '../../src/theme';
import { useThemeStore } from '../../src/store/themeStore';
import { datingApi } from '../../src/api/datingClient';
import { firebaseAuth } from '../../src/auth/firebase';
import { createClientMessageId, listenToLatestMessages } from '../../src/services/chatService';

interface Message {
  id: string;
  text: string;
  sent: boolean;
  time: string;
  status?: string;
}

export default function ChatDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const conversationId = Array.isArray(params.id) ? params.id[0] : params.id;
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === 'dark' ? darkColors : colors;
  const styles = createStyles(theme);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Match', age: 0, verified: false, occupation: '',
    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200',
  });
  const scrollViewRef = useRef<ScrollView>(null);
  const pendingMessageId = useRef<string | null>(null);
  const currentFirebaseUid = firebaseAuth.currentAuth?.currentUser?.uid ?? '';

  const scrollMessagesToBottom = (animated = true) => {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated });
    });
  };

  React.useEffect(() => {
    const keyboardSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => scrollMessagesToBottom(true), 80);
    });

    return () => keyboardSubscription.remove();
  }, []);

  React.useEffect(() => {
    if (!conversationId) return;
    let active = true;
    void datingApi.getChatConversation(conversationId).then(({ data }) => {
      if (!active) return;
      const birthDate = data.partner.birthDate ? new Date(data.partner.birthDate) : null;
      let age = 0;
      if (birthDate && !Number.isNaN(birthDate.getTime())) {
        age = new Date().getFullYear() - birthDate.getFullYear();
        const beforeBirthday = new Date().getMonth() < birthDate.getMonth()
          || (new Date().getMonth() === birthDate.getMonth() && new Date().getDate() < birthDate.getDate());
        if (beforeBirthday) age -= 1;
      }
      setProfile({
        name: data.partner.name,
        age,
        verified: data.partner.verified,
        occupation: data.partner.occupation ?? '',
        avatar: data.partner.avatar ?? 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200',
      });
    }).catch((error) => {
      if (active) Alert.alert('Unable to open chat', error instanceof Error ? error.message : 'Please try again.');
    });

    const unsubscribe = listenToLatestMessages(
      conversationId,
      (liveMessages) => {
        if (!active) return;
        setMessages(liveMessages.map((item) => ({
          id: item.id,
          text: item.text,
          sent: item.senderUid === currentFirebaseUid,
          time: item.createdAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          status: item.senderUid === currentFirebaseUid ? 'Sent' : undefined,
        })));
        scrollMessagesToBottom(false);
      },
      (error) => {
        if (active) Alert.alert('Chat connection error', error.message);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [conversationId, currentFirebaseUid]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text || !conversationId || sending) return;
    setSending(true);
    try {
      const clientMessageId = pendingMessageId.current ?? createClientMessageId(conversationId);
      pendingMessageId.current = clientMessageId;
      await datingApi.sendChatMessage(conversationId, { clientMessageId, text });
      pendingMessageId.current = null;
      setMessage('');
      scrollMessagesToBottom(true);
    } catch (error) {
      Alert.alert('Message not sent', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleMediaAction = (label: string) => {
    Alert.alert(label, `${label} is available in the MVP interface and will be connected to device permissions/backend next.`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerProfile}
          onPress={() => router.push('/profile-detail')}
          activeOpacity={0.75}
          accessibilityLabel={`Open ${profile.name}'s profile`}
        >
          <View style={styles.avatarFrame}>
            <Image source={{ uri: profile.avatar }} style={styles.headerAvatar} />
          </View>
          <View style={styles.headerProfileInfo}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerProfileName} numberOfLines={1}>
                {profile.name}{profile.age > 0 ? `, ${profile.age}` : ''}
              </Text>
              {profile.verified && (
                <View style={styles.headerVerifiedBadge}>
                  <Ionicons name="checkmark" size={10} color={theme.white} />
                </View>
              )}
            </View>
            <Text style={styles.headerOccupation} numberOfLines={1}>
              {profile.occupation || 'Your match'}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.push('/video-call')}
          accessibilityLabel="Start video call"
        >
            <Ionicons name="videocam-outline" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustContentInsets
          onContentSizeChange={() =>
            scrollMessagesToBottom(false)
          }
        >
          {messages.length > 0 ? (
            <View style={styles.dateSeparator}>
              <View style={styles.dateLine} />
              <Text style={styles.dateText}>Today</Text>
              <View style={styles.dateLine} />
            </View>
          ) : null}

          {messages.length === 0 ? (
            <View style={styles.emptyConversation}>
              <View style={styles.emptyAvatarFrame}>
                <Image source={{ uri: profile.avatar }} style={styles.emptyAvatar} />
                {profile.verified && (
                  <View style={styles.emptyVerifiedBadge}>
                    <Ionicons name="checkmark" size={11} color={theme.white} />
                  </View>
                )}
              </View>
              <Text style={styles.emptyTitle}>You matched with {profile.name}</Text>
              <Text style={styles.emptyDescription}>Start with a friendly hello and see where the conversation goes.</Text>
            </View>
          ) : null}

          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubbleWrapper,
                msg.sent
                  ? styles.sentBubbleWrapper
                  : styles.receivedBubbleWrapper,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                    msg.sent ? styles.sentBubble : styles.receivedBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.sent ? styles.sentText : styles.receivedText,
                  ]}
                >
                  {msg.text}
                </Text>
              </View>
              <View
                style={[
                  styles.messageFooter,
                  msg.sent ? styles.sentFooter : styles.receivedFooter,
                ]}
              >
                <Text style={styles.messageTime}>{msg.time}</Text>
                {msg.status && (
                  <Text style={styles.messageStatus}> · {msg.status}</Text>
                )}
              </View>
            </View>
          ))}

          {messages.length === 0 ? (
            <TouchableOpacity style={styles.icebreakerCard} onPress={() => setMessage('What do you enjoy doing on a free day?')}>
              <View style={styles.miniGameIcon}>
                <Ionicons name="sparkles" size={20} color={theme.primary} />
              </View>
              <View style={styles.icebreakerCopy}>
                <Text style={styles.icebreakerTitle}>Need an opener?</Text>
                <Text style={styles.miniGameText}>Tap for a conversation starter</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={theme.primary} />
            </TouchableOpacity>
          ) : null}
        </ScrollView>

        {/* Input area */}
        <View style={styles.inputArea}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor={theme.textTertiary}
              multiline
              onFocus={() => scrollMessagesToBottom(true)}
            />
            <TouchableOpacity style={styles.emojiBtn} onPress={() => setMessage((value) => `${value} 😊`)}>
              <Ionicons name="happy-outline" size={23} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>
          <View style={styles.mediaBar}>
            <TouchableOpacity style={styles.mediaBtn} onPress={() => handleMediaAction('Conversation starters')}>
              <Ionicons
                name="globe-outline"
                size={22}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mediaBtn, styles.mediaBtnHighlight]}
              onPress={() => setMessage((value) => value || 'What is your favorite way to spend a Sunday?')}
            >
              <Ionicons name="bulb" size={19} color={theme.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaBtn} onPress={() => handleMediaAction('Photo library')}>
              <Ionicons
                name="image-outline"
                size={22}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaBtn} onPress={() => handleMediaAction('Camera')}>
              <Ionicons
                name="camera-outline"
                size={22}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaBtn} onPress={() => handleMediaAction('Voice message')}>
              <Ionicons
                name="mic-outline"
                size={22}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={[
                styles.sendButton,
                message.trim() && !sending ? styles.sendButtonActive : {},
              ]}
              onPress={handleSend}
              disabled={!message.trim() || sending}
              accessibilityLabel="Send message"
            >
              {sending ? <ActivityIndicator size="small" color={theme.white} /> : (
                <Ionicons name="send" size={17} color={message.trim() ? theme.white : theme.textTertiary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
    backgroundColor: theme.background,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
  },
  headerProfile: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
  },
  avatarFrame: { position: 'relative' },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.surface,
  },
  headerProfileInfo: { minWidth: 0, flex: 1 },
  headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  headerProfileName: { ...typography.bodyBold, color: theme.textPrimary, flexShrink: 1 },
  headerVerifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerOccupation: { ...typography.caption, color: theme.textSecondary, marginTop: 1 },
  chatArea: { flex: 1, backgroundColor: theme.background },
  messagesContainer: { flex: 1 },
  messagesContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.lg, gap: spacing.md, flexGrow: 1 },
  dateSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.sm, gap: spacing.md },
  dateLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.border },
  dateText: {
    ...typography.caption,
    color: theme.textTertiary,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  emptyConversation: { alignItems: 'center', paddingTop: spacing.xxl, paddingBottom: spacing.md },
  emptyAvatarFrame: { position: 'relative', marginBottom: spacing.md },
  emptyAvatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: theme.surface },
  emptyVerifiedBadge: {
    position: 'absolute',
    right: 0,
    bottom: 1,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.secondary,
    borderWidth: 2,
    borderColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { ...typography.bodyBold, color: theme.textPrimary, textAlign: 'center' },
  emptyDescription: {
    ...typography.bodySmall,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
    marginTop: spacing.xs,
  },
  messageBubbleWrapper: { maxWidth: '82%', marginBottom: spacing.xs },
  sentBubbleWrapper: { alignSelf: 'flex-end' },
  receivedBubbleWrapper: { alignSelf: 'flex-start' },
  messageBubble: { paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderRadius: borderRadius.xl },
  sentBubble: { backgroundColor: theme.primary, borderBottomRightRadius: spacing.xs },
  receivedBubble: {
    backgroundColor: theme.surface,
    borderBottomLeftRadius: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  messageText: { fontSize: typography.body.fontSize, lineHeight: 23 },
  sentText: { color: theme.white },
  receivedText: { color: theme.textPrimary },
  messageFooter: { flexDirection: 'row', marginTop: spacing.xs },
  sentFooter: { justifyContent: 'flex-end' },
  receivedFooter: { justifyContent: 'flex-start' },
  messageTime: { ...typography.caption, color: theme.textTertiary },
  messageStatus: { ...typography.caption, color: theme.textTertiary },
  icebreakerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  miniGameIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icebreakerCopy: { flex: 1, gap: 2 },
  icebreakerTitle: { ...typography.bodyBold, color: theme.textPrimary },
  miniGameText: { ...typography.caption, color: theme.textSecondary, lineHeight: 17 },
  inputArea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: theme.background,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.xl,
    paddingLeft: spacing.base,
    paddingRight: spacing.xs,
    borderWidth: 1,
    borderColor: theme.border,
    minHeight: 50,
  },
  textInput: { flex: 1, fontSize: typography.body.fontSize, color: theme.textPrimary, paddingVertical: spacing.sm, maxHeight: 100 },
  emojiBtn: { padding: spacing.xs },
  mediaBar: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.md, gap: spacing.md },
  mediaBtn: { padding: spacing.xs },
  mediaBtnHighlight: {
    backgroundColor: theme.primary,
    borderRadius: borderRadius.full,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  sendButtonActive: { backgroundColor: theme.primary, borderColor: theme.primary },
});
