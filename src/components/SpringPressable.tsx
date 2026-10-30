import React from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type SpringPressableProps = Omit<PressableProps, 'style'> & {
  style?: PressableProps['style'];
  pressedScale?: number;
};

const springConfig = { damping: 22, stiffness: 240, mass: 0.85 };

export default function SpringPressable({
  children,
  onPressIn,
  onPressOut,
  style,
  pressedScale = 0.97,
  ...props
}: SpringPressableProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        {...props}
        onPressIn={(event) => {
          scale.set(withSpring(pressedScale, springConfig));
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.set(withSpring(1, springConfig));
          onPressOut?.(event);
        }}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
