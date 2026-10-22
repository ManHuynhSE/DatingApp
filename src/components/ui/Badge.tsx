import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography } from '@/theme';

interface BadgeProps {
  count?: number;
  visible?: boolean;
  color?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const Badge: React.FC<BadgeProps> = ({
  count,
  visible = true,
  color = colors.error,
  size = 'sm',
  style,
}) => {
  if (!visible) return null;

  const isSm = size === 'sm';
  const showCount = count !== undefined && count > 0;
  const displayCount = count && count > 99 ? '99+' : count;

  if (!showCount) {
    // Simple dot indicator
    return (
      <View
        style={[
          styles.dot,
          {
            backgroundColor: color,
            width: isSm ? 8 : 10,
            height: isSm ? 8 : 10,
            borderRadius: isSm ? 4 : 5,
          },
          style,
        ]}
      />
    );
  }

  // Badge with count
  const minSize = isSm ? 18 : 22;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color,
          minWidth: minSize,
          height: minSize,
          borderRadius: minSize / 2,
        },
        style,
      ]}
    >
      <Text style={[styles.text, isSm && styles.textSm]}>
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  dot: {
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  text: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  textSm: {
    fontSize: 10,
  },
});

export default Badge;
