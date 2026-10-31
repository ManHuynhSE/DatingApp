import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Octicons from '@expo/vector-icons/Octicons';
import { View, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, darkColors } from '@/theme';
import { useThemeStore } from '@/store/themeStore';

export default function TabLayout() {
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === 'dark' ? darkColors : colors;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tabActive,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarStyle: [styles.tabBar, { borderColor: theme.border }],
        tabBarIconStyle: styles.tabBarIcon,
        tabBarBackground: () => (
          <View pointerEvents="none" style={styles.glassBackground}>
            <BlurView
              intensity={72}
              tint={mode === 'dark' ? 'dark' : 'light'}
              blurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.glassOverlay, { backgroundColor: mode === 'dark' ? 'rgba(20,22,28,0.68)' : 'rgba(255,255,255,0.16)' }]} />
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
        name="swipe"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Octicons name="flame" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="discovery"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Ionicons name={focused ? 'compass' : 'compass-outline'} size={23} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Ionicons name={focused ? 'heart' : 'heart-outline'} size={21} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={21} color={color} />
              <View style={styles.notificationDot} />
            </View>
          ),
        }}
      />
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
      <Tabs.Screen name="saved" options={{ href: null }} />
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
    paddingBottom: 0,
    paddingTop: 0,
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
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    marginVertical: 0,
  },
  tabBarIcon: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: 0,
    transform: [{ translateY: 8 }],
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 0,
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
