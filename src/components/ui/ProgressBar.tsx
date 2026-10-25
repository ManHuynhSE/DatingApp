import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing } from '@/theme';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  label?: string;
  style?: ViewStyle;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color = colors.primary,
  backgroundColor = colors.primaryLight,
  showLabel = false,
  label,
  style,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View style={[styles.wrapper, style]}>
      {showLabel && (
        <View style={styles.labelRow}>
          {label && (
            <Text style={styles.label}>{label}</Text>
          )}
          <Text style={styles.percentage}>{Math.round(clampedProgress)}%</Text>
        </View>
      )}
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor,
            borderRadius: height / 2,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress}%`,
              height,
              backgroundColor: color,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  percentage: {
    ...typography.captionBold,
    color: colors.primary,
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

export default ProgressBar;
