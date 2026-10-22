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
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/theme';

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
  const { id } = useLocalSearchParams<{ id: string }>();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const scrollViewRef = useRef<ScrollView>(null);

  const profile = MOCK_PROFILE;

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
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleMediaAction = (label: string) => {
    Alert.alert(label, `${label} is available in the MVP interface and will be connected to device permissions/backend next.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.push('/video-call')}
        >
          <Ionicons name="videocam-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn} onPress={() => Alert.alert('Conversation menu', 'Unmatch, block and report actions are available for backend integration.')}>
          <Ionicons
            name="ellipsis-vertical"
            size={22}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Profile info bar */}
      <TouchableOpacity
        style={styles.profileBar}
        onPress={() => router.push('/profile-detail')}
        activeOpacity={0.7}
      >
        <Image source={{ uri: profile.avatar }} style={styles.avatar} />
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.profileName}>
              {profile.name}, {profile.age}
            </Text>
            {profile.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={10} color={colors.white} />
              </View>
            )}
          </View>
          <View style={styles.profileMeta}>
            <View style={styles.pronounsChip}>
              <Text style={styles.pronounsText}>{profile.pronouns}</Text>
            </View>
            <Text style={styles.occupationText} numberOfLines={1}>
              {profile.occupation}
            </Text>
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textTertiary}
        />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: false })
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
        <View style={styles.inputArea}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor={colors.textTertiary}
              multiline
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

const styles = StyleSheet.create({
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
    padding: spacing.xs,
    marginHorizontal: spacing.xs,
  },
  profileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  profileName: {
    fontSize: typography.bodyBold.fontSize,
    fontWeight: typography.bodyBold.fontWeight,
    color: colors.textPrimary,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pronounsChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  pronounsText: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
  },
  occupationText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    flex: 1,
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
