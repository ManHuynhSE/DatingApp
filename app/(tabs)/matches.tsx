import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { colors, darkColors, borderRadius, spacing, typography } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { datingApi, type DatingMatchItem } from '@/api/datingClient';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300';

function calculateAge(birthDate?: string) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) age -= 1;
  return age;
}

function getPartnerPhoto(match: DatingMatchItem) {
  const photos = [...match.partner.photo].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position,
  );
  return photos[0]?.url ?? FALLBACK_PHOTO;
}

function formatMatchDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently matched';
  return `Matched ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export default function MatchesScreen() {
  const router = useRouter();
  const userId = useAuthStore((state) => state.user?.id);
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === 'dark' ? darkColors : colors;
  const styles = createStyles(theme);
  const [matches, setMatches] = useState<DatingMatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMatches = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setRefreshing(true);
    setError(null);
    try {
      const response = await datingApi.getUserMatches(userId);
      setMatches(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load matches.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        setLoading(false);
        return;
      }
      let active = true;
      datingApi.getUserMatches(userId)
        .then((response) => {
          if (!active) return;
          setMatches(response.data ?? []);
          setError(null);
        })
        .catch((err: unknown) => {
          if (active) setError(err instanceof Error ? err.message : 'Could not load matches.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => { active = false; };
    }, [userId]),
  );

  const openProfile = (item: DatingMatchItem) => {
    if (!item.partner.profile) return;
    router.push({
      pathname: '/profile-detail',
      params: { userId: item.partner.id, source: 'matches' },
    });
  };

  const renderMatch = ({ item }: { item: DatingMatchItem }) => {
    const profile = item.partner.profile;
    const age = calculateAge(profile?.birth_date);
    const context = [profile?.job_title, profile?.city].filter(Boolean).join(' · ');

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${profile?.display_name ?? 'match'} profile`}
        disabled={!profile}
        onPress={() => openProfile(item)}
        style={({ pressed }) => [styles.matchCard, pressed && styles.matchCardPressed, !profile && styles.matchCardUnavailable]}
      >
        <View style={styles.photoWrap}>
          <Image source={{ uri: getPartnerPhoto(item) }} style={styles.avatar} />
          <View style={styles.photoHeart}>
            <Ionicons name="heart" size={12} color={theme.white} />
          </View>
        </View>

        <View style={styles.matchInfo}>
          <View style={styles.nameLine}>
            <Text style={styles.name} numberOfLines={1}>
              {profile?.display_name ?? 'Profile unavailable'}{age ? `, ${age}` : ''}
            </Text>
            {profile?.is_verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={11} color={theme.white} />
              </View>
            )}
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>
            {context || (profile?.bio ? profile.bio : 'Your mutual like starts here')}
          </Text>
          <View style={styles.dateLine}>
            <Ionicons name="heart-outline" size={13} color={theme.primary} />
            <Text style={styles.date}>{formatMatchDate(item.matched_at)}</Text>
          </View>
        </View>

        <View style={styles.openButton}>
          <Ionicons name="chevron-forward" size={19} color={theme.primary} />
        </View>
      </Pressable>
    );
  };

  const listHeader = (
    <View>
      <View style={styles.pageHeader}>
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowDot} />
          <Text style={styles.eyebrow}>YOUR CONNECTIONS</Text>
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Matches</Text>
          <View style={styles.countPill}>
            <Ionicons name="heart" size={15} color={theme.primary} />
            <Text style={styles.countText}>{matches.length}</Text>
          </View>
        </View>
        <Text style={styles.subtitleHeader}>A mutual like is a lovely place to start.</Text>
      </View>

      {matches.length > 0 && (
        <View style={styles.noteCard}>
          <View style={styles.noteIcon}>
            <Ionicons name="sparkles-outline" size={20} color={theme.primary} />
          </View>
          <Text style={styles.noteText}>Say hello and see where the conversation goes.</Text>
        </View>
      )}

      <View style={styles.listHeading}>
        <Text style={styles.listTitle}>People you matched with</Text>
        <Text style={styles.listCount}>{matches.length}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {!userId ? (
        <View style={styles.stateContainer}>
          <View style={styles.stateIcon}>
            <Ionicons name="person-outline" size={28} color={theme.primary} />
          </View>
          <Text style={styles.stateTitle}>Sign in to see your matches</Text>
          <Text style={styles.stateDescription}>Your mutual likes will appear here.</Text>
        </View>
      ) : loading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Finding your connections…</Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <View style={styles.stateIcon}>
            <Ionicons name="cloud-offline-outline" size={28} color={theme.textTertiary} />
          </View>
          <Text style={styles.stateTitle}>Couldn’t load matches</Text>
          <Text style={styles.stateDescription}>{error}</Text>
          <Pressable onPress={refreshMatches} disabled={refreshing} style={styles.retryButton}>
            {refreshing
              ? <ActivityIndicator color={theme.white} />
              : <Text style={styles.retryText}>Try again</Text>}
          </Pressable>
        </View>
      ) : matches.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={renderMatch}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={(
            <View style={styles.emptyState}>
              <View style={styles.emptyArtwork}>
                <View style={styles.emptyHalo} />
                <Ionicons name="heart" size={38} color={theme.primary} />
                <View style={styles.emptySparkle}>
                  <Ionicons name="sparkles" size={16} color={theme.secondary} />
                </View>
              </View>
              <Text style={styles.emptyTitle}>Your story starts with a match</Text>
              <Text style={styles.emptyDescription}>
                Like someone you’re interested in. If they like you back, you’ll find them here.
              </Text>
              <Pressable onPress={() => router.push('/(tabs)/discovery')} style={styles.discoverButton}>
                <Text style={styles.discoverButtonText}>Explore profiles</Text>
                <Ionicons name="arrow-forward" size={17} color={theme.white} />
              </Pressable>
            </View>
          )}
          contentContainerStyle={styles.emptyListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={(
            <RefreshControl refreshing={refreshing} onRefresh={refreshMatches} tintColor={theme.primary} />
          )}
        />
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderMatch}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={(
            <RefreshControl refreshing={refreshing} onRefresh={refreshMatches} tintColor={theme.primary} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  pageHeader: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  eyebrowDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.primary },
  eyebrow: { ...typography.captionBold, color: theme.primary, letterSpacing: 1.2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { ...typography.h1, color: theme.textPrimary, fontSize: 32 },
  countPill: {
    minWidth: 48,
    height: 32,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: theme.primaryLight,
  },
  countText: { ...typography.bodyBold, color: theme.primary },
  subtitleHeader: { ...typography.bodySmall, color: theme.textSecondary, marginTop: spacing.xs },
  noteCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
    minHeight: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: theme.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  noteIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: { ...typography.bodySmall, color: theme.textPrimary, flex: 1 },
  listHeading: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: { ...typography.bodyBold, color: theme.textPrimary },
  listCount: { ...typography.captionBold, color: theme.textTertiary },
  listContent: { paddingBottom: 112 },
  matchCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    minHeight: 112,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  matchCardPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  matchCardUnavailable: { opacity: 0.65 },
  photoWrap: { position: 'relative' },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: borderRadius.lg,
    backgroundColor: theme.border,
  },
  photoHeart: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: theme.surface,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchInfo: { flex: 1, minWidth: 0, gap: 5 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { ...typography.bodyBold, color: theme.textPrimary, flexShrink: 1 },
  verifiedBadge: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: { ...typography.caption, color: theme.textSecondary },
  dateLine: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  date: { ...typography.caption, color: theme.textTertiary },
  openButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListContent: { flexGrow: 1, paddingBottom: 112 },
  emptyState: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  emptyArtwork: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyHalo: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: theme.white,
  },
  emptySparkle: {
    position: 'absolute',
    top: 13,
    right: 14,
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: theme.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { ...typography.h3, color: theme.textPrimary, textAlign: 'center' },
  emptyDescription: {
    ...typography.bodySmall,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: spacing.sm,
    maxWidth: 310,
  },
  discoverButton: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  discoverButtonText: { ...typography.bodyBold, color: theme.white },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  stateIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  stateTitle: { ...typography.h3, color: theme.textPrimary, textAlign: 'center' },
  stateDescription: { ...typography.bodySmall, color: theme.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  loadingText: { ...typography.bodySmall, color: theme.textSecondary, marginTop: spacing.md },
  retryButton: {
    minWidth: 130,
    minHeight: 46,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { ...typography.bodyBold, color: theme.white },
});
