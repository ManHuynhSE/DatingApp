import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Animated,
  type StyleProp,
  type ImageStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface LazyCardImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  placeholderColor?: string;
  showIndicator?: boolean;
}

export const LazyCardImage = React.memo(function LazyCardImage({
  uri,
  style,
  containerStyle,
  fallbackIcon = 'person-outline',
  placeholderColor = '#1C1D24',
  showIndicator = true,
}: LazyCardImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLoaded(false);
    setError(false);
    fadeAnim.setValue(0);
  }, [uri, fadeAnim]);

  const handleLoad = () => {
    setLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const handleError = () => {
    setError(true);
    setLoaded(true);
  };

  const isValidUri = typeof uri === 'string' && uri.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: placeholderColor }, containerStyle]}>
      {!isValidUri || error ? (
        <View style={styles.centerContainer}>
          <Ionicons
            name={fallbackIcon}
            size={72}
            color="rgba(255, 255, 255, 0.45)"
          />
        </View>
      ) : (
        <>
          {!loaded && showIndicator && (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.6)" />
            </View>
          )}
          <Animated.Image
            source={{ uri }}
            style={[style, { opacity: fadeAnim }]}
            resizeMode="cover"
            onLoad={handleLoad}
            onError={handleError}
          />
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});

export default LazyCardImage;
