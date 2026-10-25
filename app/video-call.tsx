import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '../src/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AVATAR_SIZE = 100;
type CallState = 'connecting' | 'connected' | 'reconnecting' | 'ended';

export default function VideoCallScreen() {
  const router = useRouter();
  const [dotIndex, setDotIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [callState, setCallState] = useState<CallState>('connecting');
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const connectTimer = setTimeout(() => setCallState('connected'), 2200);
    const interval = setInterval(() => {
      setDotIndex((prev) => (prev + 1) % 4);
    }, 500);
    return () => {
      clearTimeout(connectTimer);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (callState !== 'connected') return;
    const interval = setInterval(() => setDuration((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [callState]);

  const callingDots = '.'.repeat(dotIndex);
  const formattedDuration = `${Math.floor(duration / 60).toString().padStart(2, '0')}:${(duration % 60).toString().padStart(2, '0')}`;

  const endCall = () => {
    setCallState('ended');
    setTimeout(() => router.back(), 700);
  };

  const simulateReconnect = () => {
    setCallState('reconnecting');
    setTimeout(() => setCallState('connected'), 1600);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background image (camera placeholder) */}
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
        }}
        style={styles.backgroundImage}
        resizeMode="cover"
        blurRadius={8}
      />

      {/* Dark overlay */}
      <View style={styles.overlay} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-down" size={28} color={colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.topBtn} onPress={simulateReconnect} disabled={callState === 'ended'}>
          <Ionicons
            name="ellipsis-horizontal"
            size={24}
            color={colors.white}
          />
        </TouchableOpacity>
      </View>

      {/* Center content */}
      <View style={styles.centerContent}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300',
            }}
            style={styles.avatar}
            resizeMode="cover"
          />
        </View>

        {/* Name */}
        <Text style={styles.callerName}>Ava Jones</Text>

        {/* Status */}
        <Text style={styles.callingStatus}>
          {callState === 'connecting' && `Connecting${callingDots}`}
          {callState === 'connected' && formattedDuration}
          {callState === 'reconnecting' && `Reconnecting${callingDots}`}
          {callState === 'ended' && 'Call ended'}
        </Text>

        {/* Animated dots */}
        {(callState === 'connecting' || callState === 'reconnecting') && (
          <View style={styles.loadingDots}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    opacity: dotIndex % 3 === i ? 1 : 0.4,
                    transform: [{ scale: dotIndex % 3 === i ? 1.3 : 1 }],
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Bottom control bar */}
      <View style={styles.bottomBar}>
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={[styles.controlBtn, !cameraEnabled && styles.controlBtnActive]} onPress={() => setCameraEnabled((value) => !value)} disabled={callState === 'ended'}>
            <Ionicons
              name={cameraEnabled ? 'camera-reverse-outline' : 'videocam-off-outline'}
              size={24}
              color={colors.white}
            />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, muted && styles.controlBtnActive]} onPress={() => setMuted((value) => !value)} disabled={callState === 'ended'}>
            <Ionicons name={muted ? 'mic-off-outline' : 'mic-outline'} size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, styles.endCallBtn]}
            onPress={endCall}
          >
            <Ionicons name="call" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.huge + spacing.lg,
    zIndex: 10,
  },
  topBtn: {
    padding: spacing.sm,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: colors.white,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  callerName: {
    fontSize: typography.h1.fontSize,
    fontWeight: typography.h1.fontWeight,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  callingStatus: {
    fontSize: typography.body.fontSize,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.base,
    minWidth: 100,
    textAlign: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  bottomBar: {
    paddingBottom: spacing.huge + spacing.lg,
    paddingHorizontal: spacing.xxl,
    zIndex: 10,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30,30,30,0.8)',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xxl,
    gap: spacing.xxl,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(60,60,60,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnActive: {
    backgroundColor: colors.primary,
  },
  endCallBtn: {
    backgroundColor: colors.error,
    transform: [{ rotate: '135deg' }],
  },
});
