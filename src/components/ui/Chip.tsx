import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, borderRadius, spacing } from '@/theme';

interface ChipProps {
  label: string;
  onPress?: () => void;
  onClose?: () => void;
  selected?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  variant?: 'default' | 'outline';
}

const Chip: React.FC<ChipProps> = ({
  label,
  onPress,
  onClose,
  selected = false,
  icon,
  style,
  variant = 'default',
}) => {
  const isOutline = variant === 'outline';

  const containerStyle = [
    styles.container,
    selected
      ? styles.selectedContainer
      : isOutline
      ? styles.outlineContainer
      : styles.defaultContainer,
    style,
  ];

  const textColor = selected
    ? colors.white
    : isOutline
    ? colors.textSecondary
    : colors.primary;

  const content = (
    <>
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={textColor}
          style={styles.icon}
        />
      )}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      {onClose && (
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="close"
            size={14}
            color={textColor}
          />
        </TouchableOpacity>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  defaultContainer: {
    backgroundColor: colors.primaryLight,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedContainer: {
    backgroundColor: colors.primary,
  },
  icon: {
    marginRight: spacing.xs,
  },
  label: {
    ...typography.caption,
    fontWeight: '500',
  },
  closeButton: {
    marginLeft: spacing.xs,
  },
});

export default Chip;
