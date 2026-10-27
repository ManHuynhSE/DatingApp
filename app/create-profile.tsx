import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography } from '../src/theme';
import { datingApi } from '../src/api/datingClient';
import { firebaseAuth } from '../src/auth/firebase';

export default function CreateProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'non_binary' | 'other'>('male');
  const [occupation, setOccupation] = useState('');
  const [about, setAbout] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const finish = async () => {
    if (!name.trim() || !age.trim() || !userId) {
      Alert.alert('Complete your profile', 'Please add your name and age before continuing.');
      return;
    }

    setIsSaving(true);
    try {
      // Calculate birth_date from age
      const birthYear = new Date().getFullYear() - parseInt(age);
      const birth_date = new Date(birthYear, 0, 1).toISOString().split('T')[0];

      const profile = await datingApi.createProfile({
        user_id: userId,
        display_name: name.trim(),
        birth_date,
        gender,
        bio: about.trim() || null,
        job_title: occupation.trim() || null,
      });

      if (profile.success) {
        router.replace('/(tabs)/discovery');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please check your connection and try again.';
      Alert.alert('Unable to save profile', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/(auth)/sign-in')} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Create your profile</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.progressLabel}>Let&apos;s get to know you</Text>
        <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
        <Text style={styles.sectionTitle}>Add your photos</Text>
        <Text style={styles.helper}>Your main photo is how you appear in the swipe view.</Text>
        <View style={styles.photoGrid}>
          <Pressable style={styles.mainPhoto} onPress={() => Alert.alert('Add photo', 'Photo picker will be connected in the native build.')}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500' }} style={styles.photo} />
            <View style={styles.photoEdit}><Ionicons name="camera" size={16} color={colors.white} /></View>
          </Pressable>
          <View style={styles.photoSlots}>{[1, 2].map((slot) => <Pressable key={slot} style={styles.slot} onPress={() => Alert.alert('Add photo', 'Photo picker will be connected in the native build.')}><Ionicons name="add" size={24} color={colors.textTertiary} /></Pressable>)}</View>
        </View>
        <Text style={styles.sectionTitle}>About you</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={colors.textTertiary} style={styles.input} />
        <TextInput value={age} onChangeText={setAge} placeholder="Age" keyboardType="number-pad" placeholderTextColor={colors.textTertiary} style={styles.input} />
        <TextInput value={occupation} onChangeText={setOccupation} placeholder="Occupation" placeholderTextColor={colors.textTertiary} style={styles.input} />
        <TextInput value={about} onChangeText={setAbout} placeholder="Tell people a little about yourself..." placeholderTextColor={colors.textTertiary} style={[styles.input, styles.about]} multiline />
        <Text style={styles.sectionTitle}>Your preferences</Text>
        <View style={styles.preferenceRow}><Text style={styles.preferenceText}>I&apos;m interested in</Text><Text style={styles.preferenceValue}>Women</Text><Ionicons name="chevron-forward" size={18} color={colors.textTertiary} /></View>
        <View style={styles.preferenceRow}><Text style={styles.preferenceText}>Languages</Text><Text style={styles.preferenceValue}>English</Text><Ionicons name="chevron-forward" size={18} color={colors.textTertiary} /></View>
        <Pressable style={styles.primaryButton} onPress={finish} disabled={isSaving}><Text style={styles.primaryText}>{isSaving ? 'Saving...' : 'Continue to HeartSync'}</Text></Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { height: 76, paddingHorizontal: spacing.base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  content: { padding: spacing.base, paddingBottom: 50 },
  progressLabel: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: 8 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.primaryLight, marginBottom: spacing.xl },
  progressFill: { width: '25%', height: '100%', borderRadius: 4, backgroundColor: colors.primary },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: 6 },
  helper: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  photoGrid: { flexDirection: 'row', height: 190, gap: 10 },
  mainPhoto: { flex: 1.35, borderRadius: borderRadius.md, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  photoEdit: { position: 'absolute', right: 8, bottom: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  photoSlots: { flex: .65, gap: 10 },
  slot: { flex: 1, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.textTertiary, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  input: { height: 50, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, marginTop: 10, color: colors.textPrimary, ...typography.body },
  about: { height: 110, textAlignVertical: 'top', paddingTop: spacing.md },
  preferenceRow: { minHeight: 54, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row', alignItems: 'center', gap: 8 },
  preferenceText: { flex: 1, ...typography.body, color: colors.textPrimary },
  preferenceValue: { ...typography.bodySmall, color: colors.textSecondary },
  primaryButton: { height: 52, borderRadius: borderRadius.md, marginTop: spacing.xl, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryText: { ...typography.bodyBold, color: colors.white },
});
