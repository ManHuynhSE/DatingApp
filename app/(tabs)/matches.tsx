import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
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

function calculateAge(birthDate?: string) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }
  return age;
}

function getPartnerPhoto(match: DatingMatchItem) {
  const photos = [...match.partner.photo].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position,
  );
  return photos[0]?.url ?? `https://picsum.photos/seed/${match.partner.id}/160/160`;
}

export default function MatchesScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === 'dark' ? darkColors : colors;
  const styles = createStyles(theme);
  const [matches, setMatches] = useState<DatingMatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMatches = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    setError(null);
    try {
      const response = await datingApi.getUserMatches(user.id);
      setMatches(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load matches.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      let active = true;
      datingApi
        .getUserMatches(user.id)
        .then((response) => {
          if (active) {
            setMatches(response.data ?? []);
            setError(null);
          }
        })
        .catch((err: unknown) => {
          if (active) {
            setError(err instanceof Error ? err.message : 'Could not load matches.');
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [user]),
  );

  const renderMatch = ({ item }: { item: DatingMatchItem }) => {
    const profile = item.partner.profile;
    const age = calculateAge(profile?.birth_date);
    const location = [profile?.ward, profile?.city].filter(Boolean).join(', ');
    const subtitle = [profile?.job_title, location].filter(Boolean).join(' · ');

    return (
      <Pressable
        accessibilityRole="button"
        disabled={!profile}
        onPress={() => router.push({ pathname: '/profile-detail', params: { userId: item.partner.id } })}
        style={({ pressed }) => [styles.matchCard, pressed && styles.pressed]}
      >
        <Image source={{ uri: getPartnerPhoto(item) }} style={styles.avatar} />
        <View style={styles.matchInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {profile?.display_name ?? 'Profile unavailable'}{age ? `, ${age}` : ''}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle || (profile?.bio ? profile.bio : 'You matched')}
          </Text>
          <Text style={styles.date}>
            Matched {new Date(item.matched_at).toLocaleDateString()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Matches</Text>
        <Text style={styles.count}>{matches.length}</Text>
      </View>

      {!user ? (
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>Sign in to see your matches</Text>
        </View>
      ) : loading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <Ionicons name="cloud-offline-outline" size={42} color={theme.textTertiary} />
          <Text style={styles.stateTitle}>Couldn’t load matches</Text>
          <Text style={styles.stateDescription}>{error}</Text>
          <Pressable onPress={refreshMatches} disabled={refreshing} style={styles.retryButton}>
            {refreshing ? <ActivityIndicator color={theme.white} /> : <Text style={styles.retryText}>Try again</Text>}
          </Pressable>
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.stateContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-outline" size={42} color={theme.primary} />
          </View>
          <Text style={styles.stateTitle}>No matches yet</Text>
          <Text style={styles.stateDescription}>
            When you and someone like each other, they’ll show up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderMatch}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    minHeight: 64,
    paddingHorizontal: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: { ...typography.h2, color: theme.textPrimary },
  count: {
    ...typography.bodySmall,
    color: theme.primary,
    backgroundColor: theme.primaryLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  list: { padding: spacing.base, paddingBottom: 100, gap: spacing.sm },
  matchCard: {
    minHeight: 88,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pressed: { opacity: 0.75 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.border },
  matchInfo: { flex: 1, gap: 3 },
  name: { ...typography.bodyBold, color: theme.textPrimary },
  subtitle: { ...typography.bodySmall, color: theme.textSecondary },
  date: { ...typography.caption, color: theme.textTertiary },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  stateTitle: { ...typography.h3, color: theme.textPrimary, textAlign: 'center', marginTop: spacing.md },
  stateDescription: { ...typography.body, color: theme.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  retryButton: {
    minWidth: 120,
    minHeight: 44,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { ...typography.bodyBold, color: theme.white },
});
