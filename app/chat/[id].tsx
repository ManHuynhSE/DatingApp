import React, { useState, useRef } from 'react';
import {
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
import { useRouter } from 'expo-router';
import { colors, darkColors, typography, spacing, borderRadius, resolveThemeStyles } from '../../src/theme';
import { useThemeStore } from '../../src/store/themeStore';

interface Message {
  id: string;
  text: string;
  sent: boolean;
  time: string;
  status?: string;
}

const MOCK_PROFILE = {
  id: '1',
  name: 'Ava Jones',
  age: 25,
  verified: true,
  pronouns: 'she/her/hers',
  occupation: 'Business Analyst at Tech',
  avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200',
};

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    text: "Hey! I saw you're into Asian food too. What's your favorite cuisine?",
    sent: false,
    time: '10:30 AM',
  },
  {
    id: '2',
    text: "Hi Ava! I love Japanese food, especially ramen and sushi. How about you?",
    sent: true,
    time: '10:32 AM',
    status: 'Sent',
  },
  {
    id: '3',
    text: "Oh I'm a huge fan of Thai food! The balance of sweet, sour, salty and spicy is just perfect 😍",
    sent: false,
    time: '10:34 AM',
  },
  {
    id: '4',
    text: "That sounds amazing! We should definitely try a Thai restaurant together sometime 🍜",
    sent: true,
    time: '10:35 AM',
    status: 'Sent',
  },
];

export default function ChatDetailScreen() {
  const router = useRouter();
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === 'dark' ? darkColors : colors;
  const styles = resolveThemeStyles(baseStyles, theme);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const scrollViewRef = useRef<ScrollView>(null);

  const profile = MOCK_PROFILE;

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

  const handleSend = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: String(messages.length + 1),
      text: message.trim(),
      sent: true,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'Sent',
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage('');
    scrollMessagesToBottom(true);
  };

  const handleMediaAction = (label: string) => {
    Alert.alert(label, `${label} is available in the MVP interface and will be connected to device permissions/backend next.`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerProfile}
          onPress={() => router.push('/profile-detail')}
          activeOpacity={0.75}
          accessibilityLabel={`Open ${profile.name}'s profile`}
        >
          <Image source={{ uri: profile.avatar }} style={styles.headerAvatar} />
          <View style={styles.headerProfileInfo}>
            <View style={styles.headerNameRow}>
              <Text style={[styles.headerProfileName, { color: theme.textPrimary }]} numberOfLines={1}>
                {profile.name}, {profile.age}
              </Text>
              {profile.verified && (
                <View style={styles.headerVerifiedBadge}>
                  <Ionicons name="checkmark" size={9} color={colors.white} />
                </View>
              )}
            </View>
            <Text style={[styles.headerOccupation, { color: theme.textSecondary }]} numberOfLines={1}>
              {profile.occupation}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.push('/video-call')}
          accessibilityLabel="Start video call"
        >
          <Ionicons name="videocam-outline" size={24} color={theme.textPrimary} />
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
          {/* Date separator */}
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>Today</Text>
            <View style={styles.dateLine} />
          </View>

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
                  msg.sent ? styles.sentBubble : [styles.receivedBubble, { backgroundColor: theme.surface }],
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

          {/* Mini-game banner */}
          <View style={styles.miniGameBanner}>
            <View style={styles.miniGameIcon}>
              <Ionicons name="game-controller" size={24} color={colors.primary} />
            </View>
            <Text style={styles.miniGameText}>
              Invite your match to play a mini-game. Break the ice and find out
              if you both sync on a deeper level.
            </Text>
          </View>
        </ScrollView>

        {/* Input area */}
        <View style={[styles.inputArea, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
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
              <Ionicons
                name="happy-outline"
                size={24}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.mediaBar}>
            <TouchableOpacity style={styles.mediaBtn} onPress={() => handleMediaAction('Conversation starters')}>
              <Ionicons
                name="globe-outline"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mediaBtn, styles.mediaBtnHighlight]}
              onPress={() => setMessage((value) => value || 'What is your favorite way to spend a Sunday?')}
            >
              <Ionicons name="bulb" size={20} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaBtn} onPress={() => handleMediaAction('Photo library')}>
              <Ionicons
                name="image-outline"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaBtn} onPress={() => handleMediaAction('Camera')}>
              <Ionicons
                name="camera-outline"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaBtn} onPress={() => handleMediaAction('Voice message')}>
              <Ionicons
                name="mic-outline"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={[
                styles.sendButton,
                message.trim() ? styles.sendButtonActive : {},
              ]}
              onPress={handleSend}
            >
              <Ionicons
                name="send"
                size={18}
                color={message.trim() ? colors.white : colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerProfile: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerProfileInfo: {
    minWidth: 0,
    maxWidth: 180,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerProfileName: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  headerVerifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerOccupation: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chatArea: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.base,
    gap: spacing.md,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
    gap: spacing.md,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dateText: {
    fontSize: typography.caption.fontSize,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  messageBubbleWrapper: {
    maxWidth: '80%',
    marginBottom: spacing.xs,
  },
  sentBubbleWrapper: {
    alignSelf: 'flex-end',
  },
  receivedBubbleWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  sentBubble: {
    backgroundColor: colors.textPrimary,
    borderBottomRightRadius: spacing.xs,
  },
  receivedBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: typography.body.fontSize,
    lineHeight: 22,
  },
  sentText: {
    color: colors.white,
  },
  receivedText: {
    color: colors.textPrimary,
  },
  messageFooter: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  sentFooter: {
    justifyContent: 'flex-end',
  },
  receivedFooter: {
    justifyContent: 'flex-start',
  },
  messageTime: {
    fontSize: typography.caption.fontSize,
    color: colors.textTertiary,
  },
  messageStatus: {
    fontSize: typography.caption.fontSize,
    color: colors.textTertiary,
  },
  miniGameBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  miniGameIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniGameText: {
    flex: 1,
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  inputArea: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    maxHeight: 100,
  },
  emojiBtn: {
    padding: spacing.xs,
  },
  mediaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  mediaBtn: {
    padding: spacing.xs,
  },
  mediaBtnHighlight: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
