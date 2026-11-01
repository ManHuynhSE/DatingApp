import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '@/theme';

const PLANS = [
  { id: 'free', title: 'Miễn phí', price: '$0', description: 'Gặp gỡ mọi người theo nhịp độ của riêng bạn.', features: ['Gợi ý tương hợp mỗi ngày', 'Bộ lọc tìm kiếm cơ bản', 'Nhắn tin với người đã tương hợp'] },
  { id: 'premium', title: 'Cao cấp', price: '$19.99', description: 'Nhiều quyền năng hơn cho những kết nối ý nghĩa.', features: ['Lượt thích không giới hạn', 'Bộ lọc tìm kiếm nâng cao', 'Xem ai đã thích bạn', 'Hoàn tác lượt bỏ qua'] },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = () => {
    if (selectedPlan === 'free') {
      router.back();
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Hoàn tất đăng ký thử nghiệm', 'Gói Cao cấp đã được mô phỏng cho phiên bản thử nghiệm này. Không có khoản phí nào phát sinh.', [{ text: 'Xong', onPress: () => router.back() }]);
    }, 700);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} accessibilityLabel="Quay lại">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Chọn gói tài khoản</Text>
        <View style={styles.iconButton} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Mở khóa các công cụ giúp hồ sơ của bạn nổi bật hơn.</Text>
        {PLANS.map((plan) => {
          const selected = plan.id === selectedPlan;
          return (
            <TouchableOpacity key={plan.id} style={[styles.planCard, selected && styles.planCardSelected]} onPress={() => setSelectedPlan(plan.id)} activeOpacity={0.85}>
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <Text style={styles.planDescription}>{plan.description}</Text>
                </View>
                <Text style={styles.price}>{plan.price}<Text style={styles.priceSuffix}>{plan.id === 'premium' ? '/tháng' : ''}</Text></Text>
              </View>
              {plan.features.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color={selected ? colors.primary : colors.textTertiary} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
              {selected && <View style={styles.selectedBadge}><Text style={styles.selectedBadgeText}>Đã chọn</Text></View>}
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity style={[styles.primaryButton, isLoading && styles.disabledButton]} onPress={handleContinue} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryButtonText}>{selectedPlan === 'premium' ? 'Tiếp tục với gói Cao cấp' : 'Tiếp tục với gói Miễn phí'}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.restoreButton} onPress={() => Alert.alert('Khôi phục gói mua', 'Không tìm thấy giao dịch thử nghiệm nào trước đó.')}>
          <Text style={styles.restoreText}>Khôi phục gói mua</Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>Đây là bản thử nghiệm giao diện. Hệ thống thanh toán chưa được kết nối.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h3, color: colors.textPrimary },
  content: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  planCard: { position: 'relative', borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, backgroundColor: colors.surface, padding: spacing.lg, marginBottom: spacing.md },
  planCardSelected: { borderColor: colors.primary, borderWidth: 2 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.base },
  planTitle: { ...typography.h3, color: colors.textPrimary },
  planDescription: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, maxWidth: 210 },
  price: { ...typography.h3, color: colors.primary },
  priceSuffix: { ...typography.caption, color: colors.textSecondary },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  featureText: { ...typography.bodySmall, color: colors.textPrimary },
  selectedBadge: { position: 'absolute', top: spacing.md, right: spacing.md, backgroundColor: colors.primaryLight, borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  selectedBadgeText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  primaryButton: { minHeight: 52, borderRadius: borderRadius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  disabledButton: { opacity: 0.7 },
  primaryButtonText: { ...typography.body, color: colors.white, fontWeight: '700' },
  restoreButton: { alignItems: 'center', paddingVertical: spacing.lg },
  restoreText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  disclaimer: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', lineHeight: 18 },
});
