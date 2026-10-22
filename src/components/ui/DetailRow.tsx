import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '@/theme';

interface DetailRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  placeholder?: string;
  onPress?: () => void;
  showChevron?: boolean;
  iconColor?: string;
  style?: ViewStyle;
  showDivider?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({
  icon,
  label,
  value,
  placeholder = 'Add',
  onPress,
  showChevron = true,
  iconColor = colors.primary,
  style,
  showDivider = true,
}) => {
  const hasValue = value !== undefined && value.length > 0;

  const content = (
    <View style={[styles.container, showDivider && styles.divider, style]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.right}>
          <Text
            style={[
              styles.value,
              !hasValue && styles.placeholder,
            ]}
          >
            {hasValue ? value : placeholder}
          </Text>
          {showChevron && (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textTertiary}
              style={styles.chevron}
            />
          )}
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    backgroundColor: colors.white,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  placeholder: {
    color: colors.primary,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});

export default DetailRow;
