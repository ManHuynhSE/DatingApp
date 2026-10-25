import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { firebaseAuth } from '@/auth/firebase';

type TabType = 'activity' | 'safety';

export default function ProfileScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('activity');
  const user = useAuthStore((state) => state.user);
  const profileName = user?.name || 'HeartSync member';
  const profileAge = user?.age ? `, ${user.age}` : '';
  const profilePhoto = user?.photos[0];
  const profileCompletion = user?.profileCompletion ?? 0;

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          try {
            await firebaseAuth.signOut();
            router.replace('/(auth)/sign-in');
          } catch (error) {
            Alert.alert(
              'Unable to log out',
              error instanceof Error ? error.message : 'Please try again.',
            );
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/subscription')} accessibilityLabel="Open subscription plans">
            <Ionicons name="diamond-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Profile avatar section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={profilePhoto ? { uri: profilePhoto } : require('../../assets/icon.png')}
              style={styles.avatar}
            />
            <View style={styles.completeBadge}>
              <Text style={styles.completeBadgeText}>{profileCompletion}%</Text>
            </View>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.profileName}>{profileName}{profileAge}</Text>
            <Ionicons name="checkmark-circle" size={18} color="#4A90D9" />
          </View>
          <TouchableOpacity onPress={() => router.push('/edit-profile')}>
            <Text style={styles.editProfileLink}>Edit your profile {'>'}</Text>
          </TouchableOpacity>
        </View>

        {/* Verification card */}
        <View style={styles.verificationCard}>
          <View style={styles.verificationRow}>
            <View style={styles.verificationIconContainer}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            </View>

            <View style={styles.verificationTextContainer}>
              <Text style={styles.verificationText}>
                Verification adds an extra layer of trust and authenticity to your profile.
              </Text>
              <TouchableOpacity onPress={() => Alert.alert('Verification', 'Identity verification is ready for backend integration.')}>
                <Text style={styles.verifyLink}>Verify your account now!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tab selector */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
            onPress={() => setActiveTab('activity')}
          >
            <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
              Activity
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'safety' && styles.activeTab]}
            onPress={() => setActiveTab('safety')}
          >
            <Text style={[styles.tabText, activeTab === 'safety' && styles.activeTabText]}>
              Safety
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'activity' ? (
          <>
            <View style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <View>
                  <Text style={styles.activityTitle}>Your activity</Text>
                  <Text style={styles.activitySubtitle}>Small steps make meaningful connections.</Text>
                </View>
                <Ionicons name="pulse-outline" size={26} color={colors.primary} />
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>12</Text>
                  <Text style={styles.statLabel}>Likes sent</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>04</Text>
                  <Text style={styles.statLabel}>Connections</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>86%</Text>
                  <Text style={styles.statLabel}>Profile ready</Text>
                </View>
              </View>
            </View>

            <View style={styles.nextStepCard}>
              <Ionicons name="sparkles-outline" size={22} color={colors.secondary} />
              <View style={styles.nextStepText}>
                <Text style={styles.nextStepTitle}>Make your profile stand out</Text>
                <Text style={styles.nextStepDescription}>Add another photo or a conversation starter to get more meaningful replies.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
          </>
        ) : (
          <View style={styles.safetyContent}>
            <Ionicons name="shield-checkmark-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.safetyTitle}>Safety Center</Text>
            <Text style={styles.safetyDescription}>
              Your safety matters. Review our community guidelines and safety tips to stay protected while meeting new people.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  headerButton: {
    padding: spacing.xs,
  },
  // Avatar section
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  completeBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: colors.white,
  },
  completeBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  profileName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  editProfileLink: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '500',
  },
  // Verification card
  verificationCard: {
    marginHorizontal: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  verificationRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  verificationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  verificationTextContainer: {
    flex: 1,
  },
  verificationText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  verifyLink: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  // Tab selector
  tabSelector: {
    flexDirection: 'row',
    marginHorizontal: spacing.base,
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  activityCard: {
    marginHorizontal: spacing.base,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  activityTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  activitySubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: `${colors.primary}35`,
  },
  nextStepCard: {
    marginHorizontal: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  nextStepText: {
    flex: 1,
  },
  nextStepTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  nextStepDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  // Safety tab
  safetyContent: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing['2xl'],
    gap: spacing.md,
  },
  safetyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  safetyDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
