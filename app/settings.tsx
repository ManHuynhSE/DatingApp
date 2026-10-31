import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, darkColors, spacing, typography } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

export default function SettingsScreen() {
  const router = useRouter();
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === 'dark' ? darkColors : colors;
  const verified = useAuthStore((state) => state.user?.verified ?? false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.titleContainer} pointerEvents="none">
          <Text style={[styles.title, { color: theme.textPrimary }]}>Settings</Text>
        </View>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
          <Ionicons name="arrow-back" size={23} color={theme.textPrimary} />
        </Pressable>
        <View style={styles.back} />
      </View>

      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>ACCOUNT</Text>
      <Pressable
        onPress={() => router.push('/verify-phone')}
        accessibilityRole="button"
        style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View style={[styles.iconWrap, { backgroundColor: verified ? `${theme.success}20` : `${theme.primary}18` }]}>
          <Ionicons name={verified ? 'shield-checkmark-outline' : 'phone-portrait-outline'} size={22} color={verified ? theme.success : theme.primary} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Phone verification</Text>
          <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
            {verified ? 'Your account is verified' : 'Verify your account with an SMS code'}
          </Text>
        </View>
        {verified ? <Ionicons name="checkmark-circle" size={22} color={theme.success} /> : <Ionicons name="chevron-forward" size={21} color={theme.textTertiary} />}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    position: 'relative',
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: { width: 36, height: 40, justifyContent: 'center' },
  title: { ...typography.bodyBold, textAlign: 'center' },
  sectionLabel: { ...typography.captionBold, marginTop: spacing.xl, marginBottom: spacing.sm, marginHorizontal: spacing.base, letterSpacing: 1 },
  row: { marginHorizontal: spacing.base, padding: spacing.base, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { ...typography.bodyBold },
  rowSubtitle: { ...typography.caption },
});
