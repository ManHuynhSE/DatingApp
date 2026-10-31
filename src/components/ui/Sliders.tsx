import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  type LayoutChangeEvent,
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
  const safeLowProp = Math.max(min, Math.min(max, Math.min(low, high)));
  const safeHighProp = Math.max(safeLowProp, Math.min(max, Math.max(low, high)));

  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  trackWidthRef.current = trackWidth;

  const containerRef = useRef<View>(null);
  const containerPageXRef = useRef<number | null>(null);

  const [localLow, setLocalLow] = useState(safeLowProp);
  const [localHigh, setLocalHigh] = useState(safeHighProp);
  const [activeThumb, setActiveThumb] = useState<'low' | 'high' | null>(null);

  const lowRef = useRef(safeLowProp);
  const highRef = useRef(safeHighProp);
  const activeThumbRef = useRef<'low' | 'high' | 'pending' | null>(null);
  const startTrackXRef = useRef(0);
  const fingerOffsetRef = useRef(0);
  const isDraggingRef = useRef(false);

  const propsRef = useRef({
    min,
    max,
    step,
    minRange,
    onValueChange,
    onDragStateChange,
  });
  propsRef.current = {
    min,
    max,
    step,
    minRange,
    onValueChange,
    onDragStateChange,
  };

  // Sync external prop updates when not actively dragging
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalLow(safeLowProp);
      lowRef.current = safeLowProp;
    }
  }, [safeLowProp]);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalHigh(safeHighProp);
      highRef.current = safeHighProp;
    }
  }, [safeHighProp]);

  // Clean up drag state on unmount
  useEffect(() => {
    return () => {
      if (isDraggingRef.current) {
        propsRef.current.onDragStateChange?.(false);
      }
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_evt, gestureState) =>
        Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1,
      onMoveShouldSetPanResponderCapture: (_evt, gestureState) =>
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
        Math.abs(gestureState.dx) > 2,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (evt) => {
        const width = trackWidthRef.current;
        if (width <= 0) return;

        isDraggingRef.current = true;
        propsRef.current.onDragStateChange?.(true);

        containerRef.current?.measureInWindow((x) => {
          if (typeof x === 'number') {
            containerPageXRef.current = x;
          }
        });

        let touchXOnTrack = evt.nativeEvent.locationX - THUMB_SIZE / 2;
        if (
          containerPageXRef.current !== null &&
          evt.nativeEvent.pageX !== undefined
        ) {
          touchXOnTrack =
            evt.nativeEvent.pageX -
            containerPageXRef.current -
            THUMB_SIZE / 2;
        }
        const clampedTouchX = Math.max(0, Math.min(width, touchXOnTrack));

        const currentMin = propsRef.current.min;
        const currentMax = propsRef.current.max;
        const currentRange = currentMax - currentMin || 1;
        const currentStep = propsRef.current.step || 1;
        const currentMinRange = propsRef.current.minRange || 0;

        const touchVal = currentMin + (clampedTouchX / width) * currentRange;

        const curLow = lowRef.current;
        const curHigh = highRef.current;

        const lowX = ((curLow - currentMin) / currentRange) * width;
        const highX = ((curHigh - currentMin) / currentRange) * width;

        const distLow = Math.abs(touchVal - curLow);
        const distHigh = Math.abs(touchVal - curHigh);

        let chosen: 'low' | 'high' | 'pending';
        // If thumbs are close or overlapping
        if (Math.abs(distLow - distHigh) < currentRange * 0.03) {
          if (touchVal < curLow) {
            chosen = 'low';
          } else if (touchVal > curHigh) {
            chosen = 'high';
          } else {
            chosen = 'pending';
          }
        } else if (distLow < distHigh) {
          chosen = 'low';
        } else {
          chosen = 'high';
        }

        activeThumbRef.current = chosen;
        if (chosen !== 'pending') {
          setActiveThumb(chosen);
        }

        let offset = 0;
        if (chosen === 'low') {
          const distFromThumb = Math.abs(clampedTouchX - lowX);
          if (distFromThumb <= THUMB_SIZE * 0.9) {
            offset = clampedTouchX - lowX;
          } else {
            // Tap on track: jump low thumb to tapped position
            const stepped = Math.round(touchVal / currentStep) * currentStep;
            const nextLow = Math.max(
              currentMin,
              Math.min(curHigh - currentMinRange, stepped),
            );
            lowRef.current = nextLow;
            setLocalLow(nextLow);
            propsRef.current.onValueChange(nextLow, curHigh);
            offset = 0;
          }
        } else if (chosen === 'high') {
          const distFromThumb = Math.abs(clampedTouchX - highX);
          if (distFromThumb <= THUMB_SIZE * 0.9) {
            offset = clampedTouchX - highX;
          } else {
            // Tap on track: jump high thumb to tapped position
            const stepped = Math.round(touchVal / currentStep) * currentStep;
            const nextHigh = Math.max(
              curLow + currentMinRange,
              Math.min(currentMax, stepped),
            );
            highRef.current = nextHigh;
            setLocalHigh(nextHigh);
            propsRef.current.onValueChange(curLow, nextHigh);
            offset = 0;
          }
        }

        startTrackXRef.current = clampedTouchX;
        fingerOffsetRef.current = offset;
      },

      onPanResponderMove: (_evt, gestureState) => {
        const width = trackWidthRef.current;
        if (width <= 0) return;

        let chosen = activeThumbRef.current;
        if (!chosen) return;

        // Resolve pending thumb selection on first move direction
        if (chosen === 'pending') {
          if (Math.abs(gestureState.dx) < 1.5) return;
          chosen = gestureState.dx < 0 ? 'low' : 'high';
          activeThumbRef.current = chosen;
          setActiveThumb(chosen);
        }

        const currentMin = propsRef.current.min;
        const currentMax = propsRef.current.max;
        const currentRange = currentMax - currentMin || 1;
        const currentStep = propsRef.current.step || 1;
        const currentMinRange = propsRef.current.minRange || 0;

        let targetX =
          startTrackXRef.current +
          gestureState.dx -
          fingerOffsetRef.current;

        // Prevent boundary dead-zones when dragging past ends
        if (targetX < 0) {
          fingerOffsetRef.current =
            startTrackXRef.current + gestureState.dx;
          targetX = 0;
        } else if (targetX > width) {
          fingerOffsetRef.current =
            startTrackXRef.current + gestureState.dx - width;
          targetX = width;
        }

        const rawVal = currentMin + (targetX / width) * currentRange;
        const steppedVal = Math.round(rawVal / currentStep) * currentStep;

        let nextLow = lowRef.current;
        let nextHigh = highRef.current;

        if (chosen === 'low') {
          nextLow = Math.max(currentMin, Math.min(currentMax, steppedVal));
          // Fluidly push the high thumb if low thumb reaches it
          if (nextLow + currentMinRange > nextHigh) {
            nextHigh = Math.min(currentMax, nextLow + currentMinRange);
            if (
              nextHigh === currentMax &&
              nextLow + currentMinRange > currentMax
            ) {
              nextLow = currentMax - currentMinRange;
            }
          }
        } else {
          nextHigh = Math.max(currentMin, Math.min(currentMax, steppedVal));
          // Fluidly push the low thumb if high thumb reaches it
          if (nextHigh - currentMinRange < nextLow) {
            nextLow = Math.max(currentMin, nextHigh - currentMinRange);
            if (
              nextLow === currentMin &&
              nextHigh - currentMinRange < currentMin
            ) {
              nextHigh = currentMin + currentMinRange;
            }
          }
        }

        if (
          nextLow !== lowRef.current ||
          nextHigh !== highRef.current
        ) {
          lowRef.current = nextLow;
          highRef.current = nextHigh;
          setLocalLow(nextLow);
          setLocalHigh(nextHigh);
          propsRef.current.onValueChange(nextLow, nextHigh);
        }
      },

      onPanResponderRelease: () => {
        isDraggingRef.current = false;
        activeThumbRef.current = null;
        setActiveThumb(null);
        propsRef.current.onDragStateChange?.(false);
      },

      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        activeThumbRef.current = null;
        setActiveThumb(null);
        propsRef.current.onDragStateChange?.(false);
      },
    }),
  ).current;

  const handleTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      setTrackWidth(w);
      trackWidthRef.current = w;
    }
    containerRef.current?.measureInWindow((x) => {
      if (typeof x === 'number') {
        containerPageXRef.current = x;
      }
    });
  };

  const range = max - min || 1;
  const displayLow = isDraggingRef.current ? localLow : safeLowProp;
  const displayHigh = isDraggingRef.current ? localHigh : safeHighProp;

  const safeLow = Math.max(min, Math.min(max, displayLow));
  const safeHigh = Math.max(safeLow, Math.min(max, displayHigh));

  const lowPercent = Math.max(0, Math.min(100, ((safeLow - min) / range) * 100));
  const highPercent = Math.max(0, Math.min(100, ((safeHigh - min) / range) * 100));

  return (
    <View
      ref={containerRef}
      style={styles.container}
      pointerEvents="box-only"
      {...panResponder.panHandlers}
    >
      <View style={styles.innerTrackArea} onLayout={handleTrackLayout}>
        {/* Inactive background track */}
        <View
          style={[styles.backgroundTrack, { backgroundColor: inactiveColor }]}
        />

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

        {/* Low Thumb (Left) */}
        <View
          style={[
            styles.thumb,
            {
              borderColor: activeColor,
              left: `${lowPercent}%`,
              zIndex: activeThumb === 'low' ? 3 : 2,
              transform: [
                { translateX: -THUMB_SIZE / 2 },
                { scale: activeThumb === 'low' ? 1.15 : 1 },
              ],
              shadowOpacity: activeThumb === 'low' ? 0.35 : 0.22,
              elevation: activeThumb === 'low' ? 6 : 4,
            },
          ]}
        />

        {/* High Thumb (Right) */}
        <View
          style={[
            styles.thumb,
            {
              borderColor: activeColor,
              left: `${highPercent}%`,
              zIndex: activeThumb === 'high' ? 3 : 2,
              transform: [
                { translateX: -THUMB_SIZE / 2 },
                { scale: activeThumb === 'high' ? 1.15 : 1 },
              ],
              shadowOpacity: activeThumb === 'high' ? 0.35 : 0.22,
              elevation: activeThumb === 'high' ? 6 : 4,
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
  const safeValProp = Math.max(min, Math.min(max, value));

  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  trackWidthRef.current = trackWidth;

  const containerRef = useRef<View>(null);
  const containerPageXRef = useRef<number | null>(null);

  const [localVal, setLocalVal] = useState(safeValProp);
  const [isDragging, setIsDragging] = useState(false);

  const valRef = useRef(safeValProp);
  const startTrackXRef = useRef(0);
  const fingerOffsetRef = useRef(0);
  const isDraggingRef = useRef(false);

  const propsRef = useRef({
    min,
    max,
    step,
    onValueChange,
    onDragStateChange,
  });
  propsRef.current = {
    min,
    max,
    step,
    onValueChange,
    onDragStateChange,
  };

  // Sync external prop updates when not dragging
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalVal(safeValProp);
      valRef.current = safeValProp;
    }
  }, [safeValProp]);

  // Clean up drag state on unmount
  useEffect(() => {
    return () => {
      if (isDraggingRef.current) {
        propsRef.current.onDragStateChange?.(false);
      }
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_evt, gestureState) =>
        Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1,
      onMoveShouldSetPanResponderCapture: (_evt, gestureState) =>
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
        Math.abs(gestureState.dx) > 2,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (evt) => {
        const width = trackWidthRef.current;
        if (width <= 0) return;

        isDraggingRef.current = true;
        setIsDragging(true);
        propsRef.current.onDragStateChange?.(true);

        containerRef.current?.measureInWindow((x) => {
          if (typeof x === 'number') {
            containerPageXRef.current = x;
          }
        });

        let touchXOnTrack = evt.nativeEvent.locationX - THUMB_SIZE / 2;
        if (
          containerPageXRef.current !== null &&
          evt.nativeEvent.pageX !== undefined
        ) {
          touchXOnTrack =
            evt.nativeEvent.pageX -
            containerPageXRef.current -
            THUMB_SIZE / 2;
        }
        const clampedTouchX = Math.max(0, Math.min(width, touchXOnTrack));

        const currentMin = propsRef.current.min;
        const currentMax = propsRef.current.max;
        const currentRange = currentMax - currentMin || 1;
        const currentStep = propsRef.current.step || 1;

        const currentVal = valRef.current;
        const thumbX = ((currentVal - currentMin) / currentRange) * width;
        const distFromThumb = Math.abs(clampedTouchX - thumbX);

        let offset = 0;
        if (distFromThumb <= THUMB_SIZE * 0.9) {
          offset = clampedTouchX - thumbX;
        } else {
          // Tap on track: jump thumb to tapped position
          const touchVal = currentMin + (clampedTouchX / width) * currentRange;
          const stepped = Math.round(touchVal / currentStep) * currentStep;
          const nextVal = Math.max(currentMin, Math.min(currentMax, stepped));
          valRef.current = nextVal;
          setLocalVal(nextVal);
          propsRef.current.onValueChange(nextVal);
          offset = 0;
        }

        startTrackXRef.current = clampedTouchX;
        fingerOffsetRef.current = offset;
      },

      onPanResponderMove: (_evt, gestureState) => {
        const width = trackWidthRef.current;
        if (width <= 0 || !isDraggingRef.current) return;

        const currentMin = propsRef.current.min;
        const currentMax = propsRef.current.max;
        const currentRange = currentMax - currentMin || 1;
        const currentStep = propsRef.current.step || 1;

        let targetX =
          startTrackXRef.current +
          gestureState.dx -
          fingerOffsetRef.current;

        // Prevent boundary dead-zones when dragging past ends
        if (targetX < 0) {
          fingerOffsetRef.current =
            startTrackXRef.current + gestureState.dx;
          targetX = 0;
        } else if (targetX > width) {
          fingerOffsetRef.current =
            startTrackXRef.current + gestureState.dx - width;
          targetX = width;
        }

        const rawVal = currentMin + (targetX / width) * currentRange;
        const steppedVal = Math.round(rawVal / currentStep) * currentStep;
        const nextVal = Math.max(currentMin, Math.min(currentMax, steppedVal));

        if (nextVal !== valRef.current) {
          valRef.current = nextVal;
          setLocalVal(nextVal);
          propsRef.current.onValueChange(nextVal);
        }
      },

      onPanResponderRelease: () => {
        isDraggingRef.current = false;
        setIsDragging(false);
        propsRef.current.onDragStateChange?.(false);
      },

      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        setIsDragging(false);
        propsRef.current.onDragStateChange?.(false);
      },
    }),
  ).current;

  const handleTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      setTrackWidth(w);
      trackWidthRef.current = w;
    }
    containerRef.current?.measureInWindow((x) => {
      if (typeof x === 'number') {
        containerPageXRef.current = x;
      }
    });
  };

  const range = max - min || 1;
  const displayVal = isDraggingRef.current ? localVal : safeValProp;
  const safeVal = Math.max(min, Math.min(max, displayVal));
  const percent = Math.max(0, Math.min(100, ((safeVal - min) / range) * 100));

  return (
    <View
      ref={containerRef}
      style={styles.container}
      pointerEvents="box-only"
      {...panResponder.panHandlers}
    >
      <View style={styles.innerTrackArea} onLayout={handleTrackLayout}>
        {/* Inactive background track */}
        <View
          style={[styles.backgroundTrack, { backgroundColor: inactiveColor }]}
        />

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
              transform: [
                { translateX: -THUMB_SIZE / 2 },
                { scale: isDragging ? 1.15 : 1 },
              ],
              shadowOpacity: isDragging ? 0.35 : 0.22,
              elevation: isDragging ? 6 : 4,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3.5,
  },
});
