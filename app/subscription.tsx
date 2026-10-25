import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '@/theme';

const PLANS = [
  { id: 'free', title: 'Free', price: '$0', description: 'Meet people at your own pace.', features: ['Daily discovery matches', 'Basic filters', 'Message your matches'] },
  { id: 'premium', title: 'Premium', price: '$19.99', description: 'More control for meaningful connections.', features: ['Unlimited likes', 'Advanced filters', 'See who likes you', 'Undo accidental passes'] },
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
      Alert.alert('Prototype purchase complete', 'Premium is simulated for this UI prototype. No payment was processed.', [{ text: 'Done', onPress: () => router.back() }]);
    }, 700);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Choose your plan</Text>
        <View style={styles.iconButton} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Unlock tools that help your profile stand out.</Text>
        {PLANS.map((plan) => {
          const selected = plan.id === selectedPlan;
          return (
            <TouchableOpacity key={plan.id} style={[styles.planCard, selected && styles.planCardSelected]} onPress={() => setSelectedPlan(plan.id)} activeOpacity={0.85}>
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <Text style={styles.planDescription}>{plan.description}</Text>
                </View>
                <Text style={styles.price}>{plan.price}<Text style={styles.priceSuffix}>{plan.id === 'premium' ? '/month' : ''}</Text></Text>
              </View>
              {plan.features.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color={selected ? colors.primary : colors.textTertiary} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
              {selected && <View style={styles.selectedBadge}><Text style={styles.selectedBadgeText}>Selected</Text></View>}
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity style={[styles.primaryButton, isLoading && styles.disabledButton]} onPress={handleContinue} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryButtonText}>{selectedPlan === 'premium' ? 'Continue with Premium' : 'Continue with Free'}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.restoreButton} onPress={() => Alert.alert('Restore purchases', 'No previous prototype purchase was found.')}>
          <Text style={styles.restoreText}>Restore purchases</Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>This is a UI prototype. Payment processing is not connected.</Text>
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
