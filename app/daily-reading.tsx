import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Share,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { fetchDailyReading, getZodiacName } from '@/api/astroTarotClient';
import {
  getDailyReadingHistory,
  saveDailyReading,
  saveReflectionAnswer,
  type StoredDailyReading,
} from '@/services/dailyReadingHistory';
import { firebaseAuth } from '@/auth/firebase';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { datingApi } from '@/api/datingClient';
import { colors, darkColors, spacing, typography, borderRadius } from '@/theme';

const loadingMessages = [
  'Đang đọc ngày sinh của bạn...',
  'Đang xác định cung hoàng đạo...',
  'Đang kết nối với các vì sao...',
  'Đang rút lá bài Tarot hôm nay...',
  'Đang giải mã thông điệp dành riêng cho bạn...',
];

const constellationStars = [
  { x: 34, y: 48, size: 5 },
  { x: 98, y: 26, size: 4 },
  { x: 166, y: 58, size: 6 },
  { x: 246, y: 34, size: 4 },
  { x: 284, y: 102, size: 5 },
  { x: 226, y: 154, size: 4 },
  { x: 146, y: 132, size: 5 },
  { x: 72, y: 158, size: 4 },
  { x: 40, y: 236, size: 5 },
  { x: 126, y: 218, size: 4 },
  { x: 216, y: 244, size: 6 },
  { x: 286, y: 218, size: 4 },
];

const constellationLinks = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 2],
  [6, 7],
  [7, 0],
  [7, 8],
  [8, 9],
  [9, 10],
  [10, 11],
  [11, 4],
] as const;

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DailyReadingScreen() {
  const router = useRouter();
  const { date: requestedDate } = useLocalSearchParams<{ date?: string }>();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const firebaseUid = firebaseAuth.currentAuth?.currentUser?.uid;
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === 'dark' ? darkColors : colors;
  const date = useMemo(() => requestedDate || getTodayKey(), [requestedDate]);
  const [reading, setReading] = useState<StoredDailyReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reflectionAnswer, setReflectionAnswer] = useState('');
  const [reflectionSaving, setReflectionSaving] = useState(false);
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const sessionKey = `${firebaseUid ?? ''}:${user?.id ?? ''}`;
  const requestIdRef = useRef(0);
  const loadedSessionKeyRef = useRef<string | null>(null);

  const loadReading = useCallback(async () => {
    if (loadedSessionKeyRef.current !== sessionKey) {
      loadedSessionKeyRef.current = sessionKey;
      setReading(null);
      setReflectionAnswer('');
      setReflectionSaved(false);
      setError(null);
    }
    const requestId = ++requestIdRef.current;
    if (!firebaseUid || !user?.id) {
      setError('Phiên đăng nhập chưa sẵn sàng. Vui lòng thử lại.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let birthDate = user.birthDate;
      if (!birthDate) {
        const profileResponse = await datingApi.getUserProfile(user.id, false, false);
        birthDate = profileResponse.data.birth_date;
        if (birthDate) updateUser({ birthDate });
      }
      if (!birthDate) {
        setError('Hồ sơ chưa có ngày sinh để tạo thông điệp hôm nay.');
        return;
      }

      const cached = await getDailyReadingHistory(firebaseUid, date);
      if (requestId !== requestIdRef.current) return;
      const expectedZodiac = getZodiacName(birthDate);
      if (cached && cached.zodiac?.name === expectedZodiac) {
        setReading(cached);
        setReflectionAnswer(cached.reflectionAnswer ?? '');
        return;
      }

      if (date !== getTodayKey()) {
        setError('Không tìm thấy lượt xem cho ngày này.');
        return;
      }

      const result = await fetchDailyReading({
        birthDate,
        relationshipIntention: user.relationship_intention,
        date,
        language: 'vi',
        variationSeed: Math.floor(Math.random() * 1_000_000_000),
      });
      if (requestId !== requestIdRef.current) return;
      await saveDailyReading(firebaseUid, result);
      if (requestId !== requestIdRef.current) return;
      setReading(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải thông điệp hôm nay.');
    } finally {
      setLoading(false);
    }
  }, [date, firebaseUid, sessionKey, updateUser, user]);

  const saveAnswer = async () => {
    if (!firebaseUid || !reading) return;
    setReflectionSaving(true);
    try {
      await saveReflectionAnswer(firebaseUid, reading.date, reflectionAnswer.trim());
      setReflectionSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu câu trả lời.');
    } finally {
      setReflectionSaving(false);
    }
  };

  const shareReading = async () => {
    if (!reading) return;
    await Share.share({
      message: [
        `Năng lượng của tôi ngày ${reading.date}`,
        `${reading.zodiac.name} · Lá bài ${reading.tarot.name}`,
        '',
        reading.reading.overview,
        '',
        'Được tạo bởi Mewdy AstroTarot ✨',
      ].join('\n'),
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadReading();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadReading]);

  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => {
      setLoadingIndex((index) => (index + 1) % loadingMessages.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [loading]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Quay lại">
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Năng lượng hôm nay</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/daily-reading-history')} accessibilityLabel="Mở lịch sử">
            <Ionicons name="book-outline" size={22} color={theme.textPrimary} />
          </Pressable>
          <Pressable onPress={() => void shareReading()} accessibilityLabel="Chia sẻ lượt xem">
            <Ionicons name="share-outline" size={22} color={theme.textPrimary} />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={[styles.loading, { backgroundColor: theme.background }]}>
          <CosmicLoading />
          <Text style={[styles.loadingTitle, { color: theme.textPrimary }]}>Kết nối với các vì sao</Text>
          <Text style={[styles.loadingMessage, { color: theme.textSecondary }]}>
            {loadingMessages[loadingIndex]}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={54} color={theme.error} />
          <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>Chưa thể đọc năng lượng hôm nay</Text>
          <Text style={[styles.errorMessage, { color: theme.textSecondary }]}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => void loadReading()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : reading ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['#30245C', '#171A38']} style={styles.hero}>
            <Ionicons name="moon" size={30} color="#F8D56B" />
            <Text style={styles.heroEyebrow}>{reading.zodiac.element}</Text>
            <Text style={styles.heroTitle}>{reading.zodiac.name}</Text>
            <Text style={styles.heroSummary}>{reading.zodiac.summary}</Text>
            <View style={styles.scorePill}>
              <Text style={styles.scoreText}>Năng lượng {reading.zodiac.energyScore}/100</Text>
            </View>
          </LinearGradient>

          <TarotFlipCard reading={reading} theme={theme} />

          <ReadingCard title="Tổng quan" icon="sunny-outline" text={reading.reading.overview} theme={theme} />
          <ReadingCard title="Tình yêu & kết nối" icon="heart-outline" text={reading.reading.love} theme={theme} />
          <ReadingCard title="Lời khuyên hôm nay" icon="compass-outline" text={reading.reading.connectionAdvice} theme={theme} />
          <ReadingCard title="Cảm xúc" icon="flower-outline" text={reading.reading.emotion} theme={theme} />

          <View style={[styles.reflection, { backgroundColor: theme.primaryLight }]}>
            <Text style={[styles.reflectionLabel, { color: theme.primary }]}>CÂU HỎI SUY NGẪM</Text>
            <Text style={[styles.reflectionText, { color: theme.textPrimary }]}>{reading.reflectionQuestion}</Text>
            <TextInput
              value={reflectionAnswer}
              onChangeText={(value) => {
                setReflectionAnswer(value);
                setReflectionSaved(false);
              }}
              placeholder="Viết câu trả lời của bạn..."
              placeholderTextColor={theme.textTertiary}
              multiline
              style={[styles.reflectionInput, { color: theme.textPrimary, borderColor: theme.border }]}
            />
            <Pressable
              style={[styles.saveAnswerButton, reflectionSaving && styles.disabledButton]}
              onPress={() => void saveAnswer()}
              disabled={reflectionSaving}
            >
              <Text style={styles.saveAnswerText}>{reflectionSaved ? 'Đã lưu' : reflectionSaving ? 'Đang lưu...' : 'Lưu suy ngẫm'}</Text>
            </Pressable>
          </View>
          <Text style={[styles.disclaimer, { color: theme.textTertiary }]}>{reading.disclaimer}</Text>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

function CosmicLoading() {
  const corePulse = useSharedValue(0.92);
  const coreGlow = useSharedValue(0.55);

  useEffect(() => {
    corePulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.92, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    coreGlow.value = withRepeat(
      withSequence(
        withTiming(0.95, { duration: 1500 }),
        withTiming(0.55, { duration: 1500 }),
      ),
      -1,
    );
  }, [coreGlow, corePulse]);

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: corePulse.value }],
    opacity: coreGlow.value,
  }));

  return (
    <View style={styles.constellation}>
      <Animated.View style={[styles.constellationHalo, coreStyle]} />
      <Animated.View style={[styles.constellationCore, coreStyle]}>
        <Ionicons name="sparkles" size={28} color="#F8D56B" />
      </Animated.View>

      {constellationLinks.map(([fromIndex, toIndex], index) => {
        const from = constellationStars[fromIndex];
        const to = constellationStars[toIndex];
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = `${Math.atan2(dy, dx)}rad`;
        return (
          <ConstellationLine
            key={`${fromIndex}-${toIndex}`}
            length={length}
            angle={angle}
            left={from.x}
            top={from.y}
            delay={index * 180}
          />
        );
      })}

      {constellationStars.map((star, index) => (
        <ConstellationStar key={`${star.x}-${star.y}`} {...star} delay={index * 120} />
      ))}
    </View>
  );
}

function TarotFlipCard({
  reading,
  theme,
}: {
  reading: StoredDailyReading;
  theme: typeof colors;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardHeading}>
        <Ionicons name="layers-outline" size={22} color="#8B5CF6" />
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Lá bài Tarot hôm nay</Text>
      </View>
      <View style={styles.tarotChoices}>
        {[0, 1, 2].map((index) => (
          <TarotChoiceCard
            key={index}
            index={index}
            selectedIndex={selectedIndex}
            reading={reading}
            onSelect={() => setSelectedIndex(index)}
          />
        ))}
      </View>
      {selectedIndex === null ? (
        <Text style={[styles.tarotFlipHint, { color: theme.textTertiary }]}>Chọn một lá bài để nhận thông điệp</Text>
      ) : null}
    </View>
  );
}

function TarotChoiceCard({
  index,
  selectedIndex,
  reading,
  onSelect,
}: {
  index: number;
  selectedIndex: number | null;
  reading: StoredDailyReading;
  onSelect: () => void;
}) {
  const progress = useDerivedValue(
    () => withTiming(selectedIndex === null ? 0 : 1, { duration: 720, easing: Easing.out(Easing.cubic) }),
    [selectedIndex],
  );
  const reveal = useDerivedValue(
    () => withTiming(selectedIndex === index ? 1 : 0, { duration: 720, easing: Easing.inOut(Easing.ease) }),
    [selectedIndex, index],
  );
  const cardStyle = useAnimatedStyle(() => {
    const isSelected = selectedIndex === index;
    return {
      opacity: interpolate(
        progress.value,
        [0, 1],
        [1, isSelected ? 1 : 0],
        Extrapolation.CLAMP,
      ),
      zIndex: isSelected ? 5 : 1,
      transform: [
        { translateX: interpolate(progress.value, [0, 1], [0, 104 - index * 100], Extrapolation.CLAMP) },
        { translateY: interpolate(progress.value, [0, 1], [0, isSelected ? -14 : 20], Extrapolation.CLAMP) },
        { scale: interpolate(progress.value, [0, 1], [1, isSelected ? 1.04 : 0.7], Extrapolation.CLAMP) },
        { rotate: `${interpolate(progress.value, [0, 1], [(index - 1) * 3, 0], Extrapolation.CLAMP)}deg` },
      ],
    };
  });
  const faceSizeStyle = useAnimatedStyle(() => {
    const width = interpolate(progress.value, [0, 1], [92, 230], Extrapolation.CLAMP);
    return {
      width,
      left: (230 - width) / 2,
    };
  });
  const backStyle = useAnimatedStyle(() => ({
    opacity: 1 - reveal.value,
    transform: [{ perspective: 900 }, { rotateY: `${interpolate(reveal.value, [0, 1], [0, 90])}deg` }],
  }));
  const resultStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ perspective: 900 }, { rotateY: `${interpolate(reveal.value, [0, 1], [-90, 0])}deg` }],
  }));

  return (
    <Animated.View style={[styles.tarotChoiceWrap, { left: index * 100 - 69 }, cardStyle]}>
      <Pressable onPress={selectedIndex === null ? onSelect : undefined} disabled={selectedIndex !== null} accessibilityLabel={`Chọn lá Tarot ${index + 1}`}>
        <View style={styles.tarotChoiceStage}>
          <Animated.View style={[styles.tarotChoiceFace, styles.tarotChoiceBack, faceSizeStyle, backStyle]}>
            <View style={styles.tarotChoicePattern}>
              <Ionicons name="sparkles" size={27} color="#F8D56B" />
              <Text style={styles.tarotChoiceNumber}>{index + 1}</Text>
            </View>
          </Animated.View>
          <Animated.View style={[styles.tarotChoiceFace, styles.tarotChoiceResult, faceSizeStyle, resultStyle]}>
            <Ionicons name="sparkles" size={20} color="#5B21B6" />
            <Text style={styles.tarotResultName}>{reading.tarot.name}</Text>
            <Text style={styles.tarotResultOrientation}>
              {reading.tarot.orientation === 'reversed' ? 'Ngược' : 'Xuôi'}
            </Text>
            <Text style={styles.tarotResultMessage}>{reading.tarot.message}</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function ConstellationLine({
  length,
  angle,
  left,
  top,
  delay,
}: {
  length: number;
  angle: string;
  left: number;
  top: number;
  delay: number;
}) {
  const opacity = useSharedValue(0.12);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 700 }),
          withTiming(0.12, { duration: 1500 }),
        ),
        -1,
      ),
    );
  }, [delay, opacity]);

  const lineStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.constellationLine,
        { width: length, left, top, transform: [{ rotate: angle }] },
        lineStyle,
      ]}
    />
  );
}

function ConstellationStar({
  x,
  y,
  size,
  delay,
}: {
  x: number;
  y: number;
  size: number;
  delay: number;
}) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.35, { duration: 850 }),
          withTiming(0.7, { duration: 1150 }),
        ),
        -1,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 850 }),
          withTiming(0.45, { duration: 1150 }),
        ),
        -1,
      ),
    );
  }, [delay, opacity, scale]);

  const starStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.constellationStar,
        { width: size, height: size, borderRadius: size / 2, left: x - size / 2, top: y - size / 2 },
        starStyle,
      ]}
    />
  );
}

function ReadingCard({
  title,
  icon,
  text,
  theme,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  theme: typeof colors;
}) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardHeading}>
        <Ionicons name={icon} size={22} color="#8B5CF6" />
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{title}</Text>
      </View>
      <Text style={[styles.body, { color: theme.textSecondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    height: 56,
    paddingHorizontal: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { ...typography.bodyBold, flex: 1, textAlign: 'center' },
  headerActions: { width: 62, flexDirection: 'row', justifyContent: 'space-between' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  constellation: {
    width: 320,
    height: 250,
    marginBottom: spacing.md,
    position: 'relative',
  },
  constellationHalo: {
    position: 'absolute',
    width: 108,
    height: 108,
    left: 106,
    top: 76,
    borderRadius: 54,
    backgroundColor: 'rgba(248,213,107,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248,213,107,0.28)',
  },
  constellationCore: {
    position: 'absolute',
    width: 64,
    height: 64,
    left: 128,
    top: 98,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,213,107,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(248,213,107,0.6)',
    shadowColor: '#F8D56B',
    shadowOpacity: 0.65,
    shadowRadius: 18,
    elevation: 8,
  },
  constellationLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(139,92,246,0.22)',
    transformOrigin: 'left center',
  },
  constellationStar: {
    position: 'absolute',
    backgroundColor: '#F8D56B',
    shadowColor: '#F8D56B',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  loadingTitle: { ...typography.h2, textAlign: 'center' },
  loadingMessage: { ...typography.body, textAlign: 'center', marginTop: spacing.sm },
  spinner: { marginTop: spacing.xl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorTitle: { ...typography.h3, textAlign: 'center', marginTop: spacing.lg },
  errorMessage: { ...typography.body, textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 },
  retryButton: { backgroundColor: '#8B5CF6', borderRadius: borderRadius.full, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, marginTop: spacing.xl },
  retryText: { ...typography.bodyBold, color: colors.white },
  content: { padding: spacing.base, gap: spacing.md, paddingBottom: spacing.xxxl },
  hero: { borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center' },
  heroEyebrow: { ...typography.captionBold, color: '#C4B5FD', marginTop: spacing.sm, textTransform: 'uppercase' },
  heroTitle: { ...typography.h1, color: colors.white, marginTop: spacing.xs },
  heroSummary: { ...typography.body, color: '#E5E7EB', textAlign: 'center', lineHeight: 23, marginTop: spacing.md },
  scorePill: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.lg },
  scoreText: { ...typography.captionBold, color: '#F8D56B' },
  sectionCard: { borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.lg },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  cardTitle: { ...typography.bodyBold },
  tarotChoices: {
    height: 250,
    width: 300,
    alignSelf: 'center',
    position: 'relative',
    justifyContent: 'center',
  },
  tarotChoiceWrap: { position: 'absolute', width: 230, alignItems: 'center' },
  tarotChoiceStage: { width: 230, height: 216, position: 'relative' },
  tarotChoiceFace: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    backfaceVisibility: 'hidden',
  },
  tarotChoiceBack: {
    backgroundColor: '#30245C',
    borderWidth: 1,
    borderColor: 'rgba(248,213,107,0.55)',
    shadowColor: '#30245C',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  tarotChoicePattern: {
    width: 62,
    height: 132,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(248,213,107,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  tarotChoiceNumber: { ...typography.captionBold, color: '#DDD6FE' },
  tarotChoiceResult: {
    backgroundColor: '#F8D56B',
    borderWidth: 1,
    borderColor: '#EAB308',
  },
  tarotResultName: {
    ...typography.h3,
    color: '#241744',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  tarotResultOrientation: { ...typography.captionBold, color: '#5B21B6', marginTop: 2 },
  tarotResultMessage: {
    ...typography.bodySmall,
    color: '#3B276B',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  tarotFace: {
    ...StyleSheet.absoluteFill,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  tarotFront: {
    backgroundColor: '#30245C',
    borderWidth: 1,
    borderColor: 'rgba(248,213,107,0.42)',
  },
  tarotBack: { backgroundColor: '#F8D56B' },
  tarotBackLabel: { ...typography.h2, color: colors.white, letterSpacing: 4, marginTop: spacing.sm },
  tarotName: { ...typography.h2, color: '#241744', textAlign: 'center' },
  tarotTapHint: { ...typography.caption, color: '#DDD6FE', marginTop: spacing.md },
  tarotOrientation: { ...typography.captionBold, color: '#5B21B6', marginTop: spacing.xs, marginBottom: spacing.md },
  tarotMeaning: { ...typography.body, color: '#3B276B', lineHeight: 22, textAlign: 'center' },
  tarotMessage: { ...typography.bodyBold, color: '#241744', lineHeight: 23, textAlign: 'center', marginTop: spacing.md },
  tarotFlipHint: { ...typography.caption, textAlign: 'center', marginTop: spacing.sm },
  body: { ...typography.body, lineHeight: 23 },
  quote: { ...typography.bodyBold, lineHeight: 24, marginTop: spacing.lg },
  reflection: { borderRadius: borderRadius.lg, padding: spacing.lg },
  reflectionLabel: { ...typography.captionBold, letterSpacing: 0.8 },
  reflectionText: { ...typography.h3, marginTop: spacing.sm, lineHeight: 28 },
  reflectionInput: {
    minHeight: 86,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    textAlignVertical: 'top',
    ...typography.body,
  },
  saveAnswerButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#8B5CF6',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  disabledButton: { opacity: 0.6 },
  saveAnswerText: { ...typography.captionBold, color: colors.white },
  disclaimer: { ...typography.caption, textAlign: 'center', lineHeight: 18, paddingHorizontal: spacing.md },
});
