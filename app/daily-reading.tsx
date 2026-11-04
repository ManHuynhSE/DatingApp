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
        <View style={styles.headerTitleContainer} pointerEvents="none">
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            Năng lượng hôm nay
          </Text>
        </View>
        <Pressable onPress={() => router.back()} accessibilityLabel="Quay lại" style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
        </Pressable>
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
          <ZodiacHeroCard reading={reading} />

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

function ZodiacHeroCard({ reading }: { reading: StoredDailyReading }) {
  const elementMeta = useMemo(() => {
    const el = (reading.zodiac.element || '').toLowerCase();
    if (el.includes('lửa')) return { icon: 'flame' as const, color: '#FB923C', label: 'Nguyên tố Lửa' };
    if (el.includes('nước')) return { icon: 'water' as const, color: '#60A5FA', label: 'Nguyên tố Nước' };
    if (el.includes('khí')) return { icon: 'cloudy-night' as const, color: '#C084FC', label: 'Nguyên tố Khí' };
    if (el.includes('đất')) return { icon: 'leaf' as const, color: '#4ADE80', label: 'Nguyên tố Đất' };
    return { icon: 'sparkles' as const, color: '#F5D082', label: `Nguyên tố ${reading.zodiac.element}` };
  }, [reading.zodiac.element]);

  const energyVibe = useMemo(() => {
    const score = reading.zodiac.energyScore;
    if (score >= 80) return '✦ Năng lượng rạng rỡ, thu hút duyên lành';
    if (score >= 60) return '✦ Trực giác nhạy bén, tâm thái hài hòa';
    return '✦ Nên dành thời gian tĩnh lặng để tái tạo năng lượng';
  }, [reading.zodiac.energyScore]);

  return (
    <LinearGradient
      colors={['#54122C', '#340B1C', '#1B040F']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.heroBadgeRow}>
        <View style={styles.heroElementBadge}>
          <Ionicons name={elementMeta.icon} size={13} color={elementMeta.color} />
          <Text style={styles.heroElementText}>{elementMeta.label}</Text>
        </View>
        <View style={styles.heroDateBadge}>
          <Ionicons name="sparkles" size={12} color="#F5D082" />
          <Text style={styles.heroDateText}>{reading.date}</Text>
        </View>
      </View>

      <View style={styles.heroTitleWrap}>
        <Ionicons name="moon" size={26} color="#F5D082" />
        <Text style={styles.heroTitle}>{reading.zodiac.name}</Text>
      </View>

      <Text style={styles.heroSummary}>{reading.zodiac.summary}</Text>

      <View style={styles.heroEnergyCard}>
        <View style={styles.heroEnergyHeader}>
          <View style={styles.heroEnergyTitleRow}>
            <Ionicons name="flash" size={14} color="#F5D082" />
            <Text style={styles.heroEnergyTitle}>CHỈ SỐ NĂNG LƯỢNG HÔM NAY</Text>
          </View>
          <View style={styles.heroEnergyScoreRow}>
            <Text style={styles.heroEnergyNumber}>{reading.zodiac.energyScore}</Text>
            <Text style={styles.heroEnergyMax}>/100</Text>
          </View>
        </View>

        <View style={styles.heroEnergyTrack}>
          <LinearGradient
            colors={['#F59E0B', '#F43F5E', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.heroEnergyBar,
              { width: `${Math.min(100, Math.max(8, reading.zodiac.energyScore))}%` },
            ]}
          />
        </View>

        <Text style={styles.heroEnergyVibe}>{energyVibe}</Text>
      </View>
    </LinearGradient>
  );
}

function TarotHeartSymbol({ size = 28 }: { size?: number }) {
  const outerSize = size;
  const innerSize = Math.max(12, Math.round(size * 0.74));
  return (
    <View style={{ width: outerSize, height: outerSize, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons
        name="heart"
        size={outerSize}
        color="#F5D082"
        style={{ position: 'absolute' }}
      />
      <Ionicons
        name="heart"
        size={innerSize}
        color="#E84570"
        style={{ position: 'absolute' }}
      />
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
        <Ionicons name="sparkles" size={20} color="#E84570" />
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Lá bài Tarot hôm nay</Text>
      </View>

      <View style={styles.tarotStageContainer}>
        <View style={styles.tarotGlowHalo} pointerEvents="none" />

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
      </View>

      {selectedIndex === null ? (
        <Text style={[styles.tarotFlipHint, { color: theme.textSecondary }]}>
          ✨ Chạm vào một lá bài để nhận thông điệp vũ trụ
        </Text>
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
  const isSelected = selectedIndex === index;
  const isAnySelected = selectedIndex !== null;

  const progress = useDerivedValue(() => {
    return withTiming(isAnySelected ? 1 : 0, {
      duration: 380,
      easing: Easing.out(Easing.cubic),
    });
  }, [isAnySelected]);

  const flipProgress = useDerivedValue(() => {
    if (!isSelected) return 0;
    return withDelay(
      140,
      withTiming(1, {
        duration: 720,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
    );
  }, [isSelected]);

  const cardContainerStyle = useAnimatedStyle(() => {
    const restingRotation = (index - 1) * 5;
    const restingY = index === 1 ? 0 : 4;
    const targetCenterX = (1 - index) * 96;

    if (isSelected) {
      return {
        zIndex: 10,
        opacity: 1,
        transform: [
          { translateX: interpolate(progress.value, [0, 1], [0, targetCenterX], Extrapolation.CLAMP) },
          { translateY: interpolate(progress.value, [0, 1], [restingY, -6], Extrapolation.CLAMP) },
          { rotate: `${interpolate(progress.value, [0, 1], [restingRotation, 0], Extrapolation.CLAMP)}deg` },
          { scale: interpolate(flipProgress.value, [0, 0.5, 1], [1, 1.05, 1], Extrapolation.CLAMP) },
        ],
      };
    }

    if (isAnySelected) {
      return {
        zIndex: 1,
        opacity: interpolate(progress.value, [0, 0.7], [1, 0], Extrapolation.CLAMP),
        transform: [
          { translateX: 0 },
          { translateY: interpolate(progress.value, [0, 1], [restingY, 32], Extrapolation.CLAMP) },
          { rotate: `${restingRotation}deg` },
          { scale: interpolate(progress.value, [0, 1], [1, 0.85], Extrapolation.CLAMP) },
        ],
      };
    }

    return {
      zIndex: index === 1 ? 3 : 2,
      opacity: 1,
      transform: [
        { translateX: 0 },
        { translateY: restingY },
        { rotate: `${restingRotation}deg` },
        { scale: 1 },
      ],
    };
  });

  const backFaceStyle = useAnimatedStyle(() => {
    if (!isSelected) {
      return {
        opacity: 1,
        transform: [{ perspective: 1200 }, { rotateY: '0deg' }],
      };
    }
    const rotateY = interpolate(flipProgress.value, [0, 1], [0, 180]);
    const opacity = interpolate(flipProgress.value, [0, 0.49, 0.5, 1], [1, 1, 0, 0]);
    return {
      opacity,
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
    };
  });

  const frontFaceStyle = useAnimatedStyle(() => {
    if (!isSelected) {
      return {
        opacity: 0,
        transform: [{ perspective: 1200 }, { rotateY: '180deg' }],
      };
    }
    const rotateY = interpolate(flipProgress.value, [0, 1], [180, 360]);
    const opacity = interpolate(flipProgress.value, [0, 0.49, 0.5, 1], [0, 0, 1, 1]);
    return {
      opacity,
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
    };
  });

  const baseLeft = -64 + index * 96;

  return (
    <Animated.View
      style={[
        styles.tarotChoiceWrap,
        { left: baseLeft },
        cardContainerStyle,
      ]}
      pointerEvents={isAnySelected && !isSelected ? 'none' : 'auto'}
    >
      <Pressable
        onPress={selectedIndex === null ? onSelect : undefined}
        disabled={selectedIndex !== null}
        accessibilityLabel={`Chọn lá Tarot ${index + 1}`}
        style={styles.tarotPressable}
      >
        <View style={styles.tarotChoiceStage}>
          {/* Card Back Face (Identical design across all 3 cards) */}
          <Animated.View style={[styles.tarotFaceAbsolute, backFaceStyle]}>
            <LinearGradient
              colors={['#611531', '#3C0B1D', '#20050F']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.tarotBackCard}
            >
              <View style={styles.tarotBackInnerBorder}>
                <TarotHeartSymbol size={28} />
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Card Front Face (Revealed Tarot Card) */}
          <Animated.View style={[styles.tarotFaceAbsolute, frontFaceStyle]}>
            <LinearGradient
              colors={['#420C21', '#260614', '#15030B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tarotFrontCard}
            >
              <View style={styles.tarotFrontInnerBorder}>
                <View style={styles.tarotFrontHeader}>
                  <Ionicons name="sparkles" size={15} color="#F5D082" />
                  <View style={styles.tarotOrientationBadge}>
                    <Text style={styles.tarotOrientationText}>
                      {reading.tarot.orientation === 'reversed' ? '↺ Chiều Ngược' : '✦ Chiều Xuôi'}
                    </Text>
                  </View>
                  <Ionicons name="sparkles" size={15} color="#F5D082" />
                </View>

                <Text style={styles.tarotFrontName} numberOfLines={2}>
                  {reading.tarot.name}
                </Text>

                <View style={styles.tarotDivider}>
                  <View style={styles.tarotDividerLine} />
                  <Ionicons name="star" size={10} color="#F5D082" />
                  <View style={styles.tarotDividerLine} />
                </View>

                <ScrollView style={styles.tarotMessageScroll} showsVerticalScrollIndicator={false}>
                  {reading.tarot.meaning ? (
                    <Text style={styles.tarotFrontMeaning}>{reading.tarot.meaning}</Text>
                  ) : null}
                  <Text style={styles.tarotFrontMessage}>
                    &ldquo;{reading.tarot.message}&rdquo;
                  </Text>
                </ScrollView>

                <View style={styles.tarotFrontFooter}>
                  <TarotHeartSymbol size={18} />
                </View>
              </View>
            </LinearGradient>
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
        <Ionicons name={icon} size={22} color="#E84570" />
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
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 72,
  },
  headerTitle: { ...typography.bodyBold, textAlign: 'center' },
  backButton: {
    minWidth: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerActions: { width: 62, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  hero: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(230, 198, 122, 0.3)',
    shadowColor: '#E84570',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
    gap: spacing.md,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  heroElementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(245, 208, 130, 0.3)',
  },
  heroElementText: {
    ...typography.captionBold,
    color: '#F5D082',
    letterSpacing: 0.4,
  },
  heroDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  heroDateText: {
    ...typography.caption,
    color: '#FDE8E8',
  },
  heroTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.white,
    textShadowColor: 'rgba(245, 208, 130, 0.4)',
    textShadowRadius: 10,
  },
  heroSummary: {
    ...typography.body,
    color: '#FCE7F3',
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: spacing.sm,
  },
  heroEnergyCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 208, 130, 0.2)',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  heroEnergyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroEnergyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroEnergyTitle: {
    ...typography.captionBold,
    color: '#F5D082',
    letterSpacing: 0.8,
  },
  heroEnergyScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  heroEnergyNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8D56B',
  },
  heroEnergyMax: {
    fontSize: 13,
    color: '#FDE8E8',
    marginLeft: 2,
  },
  heroEnergyTrack: {
    height: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  heroEnergyBar: {
    height: '100%',
    borderRadius: 4,
  },
  heroEnergyVibe: {
    ...typography.caption,
    color: '#FCE7F3',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 2,
  },
  sectionCard: { borderRadius: borderRadius.lg, borderWidth: 1, padding: spacing.lg },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  cardTitle: { ...typography.bodyBold },
  tarotStageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  tarotGlowHalo: {
    position: 'absolute',
    width: 260,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(232, 67, 112, 0.08)',
  },
  tarotChoices: {
    height: 340,
    width: 300,
    alignSelf: 'center',
    position: 'relative',
    justifyContent: 'center',
  },
  tarotChoiceWrap: {
    position: 'absolute',
    width: 236,
    top: 5,
    alignItems: 'center',
  },
  tarotPressable: {
    width: 236,
    height: 330,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarotChoiceStage: {
    width: 236,
    height: 330,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarotFaceAbsolute: {
    position: 'absolute',
    backfaceVisibility: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarotBackCard: {
    width: 96,
    height: 154,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#4A0F24',
    padding: 7,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E84570',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  tarotBackInnerBorder: {
    flex: 1,
    width: '100%',
    borderRadius: 15,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 208, 130, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tarotFrontCard: {
    width: 236,
    height: 330,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E2BA69',
    padding: 8,
    shadowColor: '#E84570',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  tarotFrontInnerBorder: {
    flex: 1,
    width: '100%',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(245, 208, 130, 0.45)',
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tarotFrontHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    width: '100%',
    justifyContent: 'center',
  },
  tarotOrientationBadge: {
    backgroundColor: 'rgba(245, 208, 130, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 208, 130, 0.4)',
  },
  tarotOrientationText: {
    ...typography.captionBold,
    color: '#F5D082',
    letterSpacing: 0.5,
  },
  tarotFrontName: {
    ...typography.h2,
    color: '#FFF',
    textAlign: 'center',
    marginTop: spacing.xs,
    textShadowColor: 'rgba(245, 208, 130, 0.5)',
    textShadowRadius: 8,
  },
  tarotDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '80%',
    marginVertical: spacing.xs,
  },
  tarotDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(245, 208, 130, 0.3)',
  },
  tarotMessageScroll: {
    flex: 1,
    width: '100%',
    marginVertical: spacing.xs,
  },
  tarotFrontMeaning: {
    ...typography.caption,
    color: '#FDE8E8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  tarotFrontMessage: {
    ...typography.bodySmall,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  tarotFrontFooter: {
    marginTop: spacing.xs,
  },
  tarotFlipHint: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
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
