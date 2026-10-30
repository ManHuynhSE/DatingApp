import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
} from 'react-native';
import { colors } from '../../theme';

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 6;

export interface RangeSliderProps {
  min: number;
  max: number;
  low: number;
  high: number;
  step?: number;
  minRange?: number;
  onValueChange: (low: number, high: number) => void;
  onDragStateChange?: (isDragging: boolean) => void;
  activeColor?: string;
  inactiveColor?: string;
}

export function RangeSlider({
  min,
  max,
  low,
  high,
  step = 1,
  minRange = 0,
  onValueChange,
  onDragStateChange,
  activeColor = colors.primary,
  inactiveColor = colors.border,
}: RangeSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  trackWidthRef.current = trackWidth;

  const lowRef = useRef(low);
  lowRef.current = low;
  const highRef = useRef(high);
  highRef.current = high;

  const activeThumbRef = useRef<'low' | 'high' | null>(null);
  const startValRef = useRef<number>(0);

  const range = max - min || 1;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_evt, gestureState) =>
          Math.abs(gestureState.dx) > 2,
        onPanResponderTerminationRequest: () => false,

        onPanResponderGrant: (evt) => {
          onDragStateChange?.(true);
          const width = trackWidthRef.current;
          if (width <= 0) return;

          const touchX = evt.nativeEvent.locationX - THUMB_SIZE / 2;
          const clampedX = Math.max(0, Math.min(width, touchX));
          const touchVal = min + (clampedX / width) * range;

          const distLow = Math.abs(touchVal - lowRef.current);
          const distHigh = Math.abs(touchVal - highRef.current);

          let chosen: 'low' | 'high';
          if (distLow < distHigh) {
            chosen = 'low';
          } else if (distHigh < distLow) {
            chosen = 'high';
          } else {
            chosen = touchVal < lowRef.current ? 'low' : 'high';
          }

          activeThumbRef.current = chosen;

          // If tap was away from the thumb, jump to tapped position
          const threshold = range * 0.08;
          const nearestDist = Math.min(distLow, distHigh);
          if (nearestDist > threshold) {
            const stepped = Math.round(touchVal / step) * step;
            if (chosen === 'low') {
              const nextLow = Math.max(min, Math.min(highRef.current - minRange, stepped));
              startValRef.current = nextLow;
              onValueChange(nextLow, highRef.current);
            } else {
              const nextHigh = Math.max(lowRef.current + minRange, Math.min(max, stepped));
              startValRef.current = nextHigh;
              onValueChange(lowRef.current, nextHigh);
            }
          } else {
            startValRef.current = chosen === 'low' ? lowRef.current : highRef.current;
          }
        },

        onPanResponderMove: (_evt, gestureState) => {
          const width = trackWidthRef.current;
          if (width <= 0 || !activeThumbRef.current) return;

          const deltaVal = (gestureState.dx / width) * range;
          const rawVal = startValRef.current + deltaVal;
          const steppedVal = Math.round(rawVal / step) * step;

          if (activeThumbRef.current === 'low') {
            const nextLow = Math.max(min, Math.min(highRef.current - minRange, steppedVal));
            if (nextLow !== lowRef.current) {
              onValueChange(nextLow, highRef.current);
            }
          } else {
            const nextHigh = Math.max(lowRef.current + minRange, Math.min(max, steppedVal));
            if (nextHigh !== highRef.current) {
              onValueChange(lowRef.current, nextHigh);
            }
          }
        },

        onPanResponderRelease: () => {
          activeThumbRef.current = null;
          onDragStateChange?.(false);
        },

        onPanResponderTerminate: () => {
          activeThumbRef.current = null;
          onDragStateChange?.(false);
        },
      }),
    [min, max, range, step, minRange, onValueChange, onDragStateChange],
  );

  const safeLow = Math.max(min, Math.min(max, low));
  const safeHigh = Math.max(safeLow, Math.min(max, high));

  const lowPercent = ((safeLow - min) / range) * 100;
  const highPercent = ((safeHigh - min) / range) * 100;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View
        style={styles.innerTrackArea}
        pointerEvents="none"
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        {/* Inactive background track */}
        <View style={[styles.backgroundTrack, { backgroundColor: inactiveColor }]} />

        {/* Active filled track */}
        <View
          style={[
            styles.filledTrack,
            {
              backgroundColor: activeColor,
              left: `${lowPercent}%`,
              width: `${Math.max(0, highPercent - lowPercent)}%`,
            },
          ]}
        />

        {/* Low Thumb (Left end) */}
        <View
          style={[
            styles.thumb,
            {
              borderColor: activeColor,
              left: `${lowPercent}%`,
            },
          ]}
        />

        {/* High Thumb (Right end) */}
        <View
          style={[
            styles.thumb,
            {
              borderColor: activeColor,
              left: `${highPercent}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

export interface SingleSliderProps {
  min: number;
  max: number;
  value: number;
  step?: number;
  onValueChange: (value: number) => void;
  onDragStateChange?: (isDragging: boolean) => void;
  activeColor?: string;
  inactiveColor?: string;
}

export function SingleSlider({
  min,
  max,
  value,
  step = 1,
  onValueChange,
  onDragStateChange,
  activeColor = colors.primary,
  inactiveColor = colors.border,
}: SingleSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  trackWidthRef.current = trackWidth;

  const valRef = useRef(value);
  valRef.current = value;
  const startValRef = useRef<number>(0);

  const range = max - min || 1;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_evt, gestureState) =>
          Math.abs(gestureState.dx) > 2,
        onPanResponderTerminationRequest: () => false,

        onPanResponderGrant: (evt) => {
          onDragStateChange?.(true);
          const width = trackWidthRef.current;
          if (width <= 0) return;

          const touchX = evt.nativeEvent.locationX - THUMB_SIZE / 2;
          const clampedX = Math.max(0, Math.min(width, touchX));
          const touchVal = min + (clampedX / width) * range;

          const dist = Math.abs(touchVal - valRef.current);
          const threshold = range * 0.08;

          if (dist > threshold) {
            const stepped = Math.round(touchVal / step) * step;
            const nextVal = Math.max(min, Math.min(max, stepped));
            startValRef.current = nextVal;
            onValueChange(nextVal);
          } else {
            startValRef.current = valRef.current;
          }
        },

        onPanResponderMove: (_evt, gestureState) => {
          const width = trackWidthRef.current;
          if (width <= 0) return;

          const deltaVal = (gestureState.dx / width) * range;
          const rawVal = startValRef.current + deltaVal;
          const steppedVal = Math.round(rawVal / step) * step;
          const nextVal = Math.max(min, Math.min(max, steppedVal));

          if (nextVal !== valRef.current) {
            onValueChange(nextVal);
          }
        },

        onPanResponderRelease: () => {
          onDragStateChange?.(false);
        },

        onPanResponderTerminate: () => {
          onDragStateChange?.(false);
        },
      }),
    [min, max, range, step, onValueChange, onDragStateChange],
  );

  const safeVal = Math.max(min, Math.min(max, value));
  const percent = ((safeVal - min) / range) * 100;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View
        style={styles.innerTrackArea}
        pointerEvents="none"
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        {/* Inactive background track */}
        <View style={[styles.backgroundTrack, { backgroundColor: inactiveColor }]} />

        {/* Active filled track */}
        <View
          style={[
            styles.filledTrack,
            {
              backgroundColor: activeColor,
              left: 0,
              width: `${percent}%`,
            },
          ]}
        />

        {/* Thumb */}
        <View
          style={[
            styles.thumb,
            {
              borderColor: activeColor,
              left: `${percent}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: THUMB_SIZE / 2,
  },
  innerTrackArea: {
    width: '100%',
    height: 36,
    justifyContent: 'center',
    position: 'relative',
  },
  backgroundTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  filledTrack: {
    position: 'absolute',
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    transform: [{ translateX: -THUMB_SIZE / 2 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 3.5,
    elevation: 4,
  },
});
