import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '@/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <View pointerEvents="none" style={styles.glassBackground}>
            <BlurView
              intensity={72}
              tint="light"
              blurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassOverlay} />
          </View>
        ),
        tabBarItemStyle: styles.tabBarItem,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        animation: 'fade',
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: 180,
          },
        },
        tabBarButton: ({ ref: _ref, ...props }) => (
          <Pressable {...props} android_ripple={{ color: 'transparent' }} />
        ),
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={21} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="discovery"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Ionicons name="heart" size={21} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} size={21} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Ionicons name={focused ? 'paper-plane' : 'paper-plane-outline'} size={21} color={color} />
              <View style={styles.notificationDot} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
    height: 64,
    paddingBottom: 4,
    paddingTop: 4,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    elevation: 0,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  glassBackground: {
    flex: 1,
    marginHorizontal: 0,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.62)',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  tabBarItem: {
    height: 56,
    marginVertical: 0,
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  notificationDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.notificationDot,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
});
