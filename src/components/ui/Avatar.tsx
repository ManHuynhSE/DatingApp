import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, borderRadius } from '@/theme';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: AvatarSize;
  online?: boolean;
  showOnlineIndicator?: boolean;
  verified?: boolean;
  style?: object;
}

const sizeMap: Record<AvatarSize, number> = {
  sm: 40,
  md: 56,
  lg: 80,
  xl: 120,
};

const onlineDotSizeMap: Record<AvatarSize, number> = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
};

const verifiedBadgeSizeMap: Record<AvatarSize, number> = {
  sm: 14,
  md: 18,
  lg: 22,
  xl: 28,
};

const fontSizeMap: Record<AvatarSize, number> = {
  sm: 14,
  md: 20,
  lg: 28,
  xl: 40,
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (parts[0]?.[0] ?? '?').toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'md',
  online = false,
  showOnlineIndicator = false,
  verified = false,
  style,
}) => {
  const dimension = sizeMap[size];
  const onlineDotSize = onlineDotSizeMap[size];
  const verifiedBadgeSize = verifiedBadgeSizeMap[size];
  const fontSize = fontSizeMap[size];

  return (
    <View style={[{ width: dimension, height: dimension }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>
            {name ? getInitials(name) : '?'}
          </Text>
        </View>
      )}

      {showOnlineIndicator && online && (
        <View
          style={[
            styles.onlineDot,
            {
              width: onlineDotSize,
              height: onlineDotSize,
              borderRadius: onlineDotSize / 2,
              borderWidth: onlineDotSize > 12 ? 3 : 2,
            },
          ]}
        />
      )}

      {verified && (
        <View
          style={[
            styles.verifiedBadge,
            {
              width: verifiedBadgeSize,
              height: verifiedBadgeSize,
              borderRadius: verifiedBadgeSize / 2,
            },
          ]}
        >
          <Ionicons
            name="checkmark"
            size={verifiedBadgeSize * 0.6}
            color={colors.white}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: colors.primary,
    fontWeight: '600',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.online,
    borderColor: colors.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
});

export default Avatar;
