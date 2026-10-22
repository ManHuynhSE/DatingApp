import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, borderRadius, spacing } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'facebook' | 'apple' | 'phone';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
  textStyle,
}) => {
  const variantStyles = getVariantStyles(variant);
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.loaderColor}
        />
      ) : (
        <View style={styles.content}>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={variantStyles.iconColor}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.text,
              variantStyles.text,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

interface VariantStyle {
  container: ViewStyle;
  text: TextStyle;
  iconColor: string;
  loaderColor: string;
}

const getVariantStyles = (variant: ButtonVariant): VariantStyle => {
  switch (variant) {
    case 'primary':
      return {
        container: {
          backgroundColor: colors.primary,
          borderWidth: 0,
        },
        text: {
          color: colors.white,
        },
        iconColor: colors.white,
        loaderColor: colors.white,
      };
    case 'secondary':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        },
        text: {
          color: colors.primary,
        },
        iconColor: colors.primary,
        loaderColor: colors.primary,
      };
    case 'facebook':
      return {
        container: {
          backgroundColor: colors.facebook,
          borderWidth: 0,
        },
        text: {
          color: colors.white,
        },
        iconColor: colors.white,
        loaderColor: colors.white,
      };
    case 'apple':
      return {
        container: {
          backgroundColor: colors.apple,
          borderWidth: 0,
        },
        text: {
          color: colors.white,
        },
        iconColor: colors.white,
        loaderColor: colors.white,
      };
    case 'phone':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        },
        text: {
          color: colors.primary,
        },
        iconColor: colors.primary,
        loaderColor: colors.primary,
      };
  }
};

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  text: {
    ...typography.bodyBold,
    textAlign: 'center',
  },
});

export default Button;
