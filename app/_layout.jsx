
import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../context/AppContext';
import TabIcon from '../components/BottomTabBar';
import {
  handleNotificationResponse,
  getInitialNotificationRoute,
  ensureAndroidChannel,
} from '../services/notificationService';

function RootTabs() {
  const { colors, colorScheme, ready } = useApp();
  const router = useRouter();

  useEffect(() => {
    ensureAndroidChannel();

    // Cold start via notification tap.
    getInitialNotificationRoute().then((route) => {
      if (route) router.replace(route);
    });

    // Tap while app is running/backgrounded.
    const unsubscribe = handleNotificationResponse((route) => {
      router.push(route);
    });

    return unsubscribe;
  }, []);

  if (!ready) return null;

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="home" focused={focused} color={color} />
            ),
            tabBarAccessibilityLabel: 'Home',
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="history" focused={focused} color={color} />
            ),
            tabBarAccessibilityLabel: 'History',
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: 'Favorites',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="favorites" focused={focused} color={color} />
            ),
            tabBarAccessibilityLabel: 'Favorites',
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="settings" focused={focused} color={color} />
            ),
            tabBarAccessibilityLabel: 'Settings',
          }}
        />

        {/* Hidden routes: reachable via router.push but not shown as tabs */}
        <Tabs.Screen name="onboarding" options={{ href: null }} />
        <Tabs.Screen name="notification-settings" options={{ href: null }} />
        <Tabs.Screen name="about" options={{ href: null }} />
        <Tabs.Screen name="privacy" options={{ href: null }} />
        <Tabs.Screen name="ayah/[id]" options={{ href: null }} />
        <Tabs.Screen name="hadith/[id]" options={{ href: null }} />
        <Tabs.Screen name="day/[date]" options={{ href: null }} />
        <Tabs.Screen name="wallpaper-preview" options={{ href: null }} />
      </Tabs>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <RootTabs />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
