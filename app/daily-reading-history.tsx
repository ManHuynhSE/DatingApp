import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { firebaseAuth } from '@/auth/firebase';
import { listDailyReadings, type StoredDailyReading } from '@/services/dailyReadingHistory';
import { useThemeStore } from '@/store/themeStore';
import { colors, darkColors, spacing, typography, borderRadius } from '@/theme';

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return parsed.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function DailyReadingHistoryScreen() {
  const router = useRouter();
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === 'dark' ? darkColors : colors;
  const [items, setItems] = useState<StoredDailyReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    const uid = firebaseAuth.currentAuth?.currentUser?.uid;
    if (!uid) {
      setError('Phiên đăng nhập chưa sẵn sàng.');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      setItems(await listDailyReadings(uid));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải lịch sử.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadHistory();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadHistory]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Quay lại">
          <Ionicons name="chevron-back" size={26} color={theme.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Nhật ký vũ trụ</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.error} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => void loadHistory()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.date}
          contentContainerStyle={[styles.list, items.length === 0 && styles.emptyList]}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.item, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push({ pathname: '/daily-reading', params: { date: item.date } })}
            >
              <View style={styles.itemIcon}>
                <Ionicons name="sparkles" size={20} color="#F8D56B" />
              </View>
              <View style={styles.itemBody}>
                <Text style={[styles.itemDate, { color: theme.textPrimary }]}>{formatDate(item.date)}</Text>
                <Text style={[styles.itemMeta, { color: theme.textSecondary }]}>
                  {item.zodiac.name} · {item.tarot.name}
                </Text>
                <Text style={[styles.itemSummary, { color: theme.textSecondary }]} numberOfLines={2}>
                  {item.reading.overview}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="book-outline" size={52} color={theme.textTertiary} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Chưa có lịch sử chiêm tinh</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Mỗi lượt xem trong ngày sẽ được lưu lại ở đây.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
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
  title: { ...typography.bodyBold, flex: 1, textAlign: 'center' },
  headerSpacer: { width: 26 },
  list: { padding: spacing.base, gap: spacing.md },
  emptyList: { flex: 1 },
  item: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,213,107,0.14)',
  },
  itemBody: { flex: 1 },
  itemDate: { ...typography.bodyBold, textTransform: 'capitalize' },
  itemMeta: { ...typography.captionBold, marginTop: 3 },
  itemSummary: { ...typography.caption, lineHeight: 18, marginTop: 5 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { ...typography.bodyBold, textAlign: 'center', marginTop: spacing.md },
  emptyText: { ...typography.body, textAlign: 'center', lineHeight: 22, marginTop: spacing.sm },
  retryButton: { backgroundColor: '#8B5CF6', borderRadius: borderRadius.full, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, marginTop: spacing.lg },
  retryText: { ...typography.bodyBold, color: colors.white },
});
