// components/DailyWallpaperCard.jsx
//
// Home-screen card for the Daily Islamic Lock Screen Wallpaper feature.
// Shows the "not enabled yet" pitch, or — once enabled — live status
// (active / next change) plus a shortcut to the preview screen. All the
// actual enable/apply/disable logic lives in services/wallpaperService.js;
// this component only calls it and reflects the result.

import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { SPACING, RADIUS, shadowStyle } from '../constants/theme';
import {
  getCurrentWallpaperInfo,
  enableWallpaperAutomation,
  formatNextChange,
} from '../services/wallpaperService';
import { isNativeWallpaperAvailable } from '../services/wallpaperNative';

export default function DailyWallpaperCard() {
  const { colors } = useApp();
  const router = useRouter();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const current = await getCurrentWallpaperInfo();
      setInfo(current);
    } catch (e) {
      console.warn('[NoorDaily Wallpaper] Failed to load status', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleEnable = async () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Android feature',
        'Automatic lock-screen wallpaper updates are only available on Android. You can still preview and share wallpapers here.'
      );
      router.push('/wallpaper-preview');
      return;
    }

    setLoading(true);
    console.log('[NoorDaily Wallpaper] Setup started');
    try {
      const result = await enableWallpaperAutomation();
      if (result?.success) {
        console.log('[NoorDaily Wallpaper] Wallpaper applied successfully');
        await refresh();
        router.push('/wallpaper-preview');
      } else if (result?.stage === 'setup') {
        Alert.alert(
          'Setup required',
          result?.message ||
            'Android needs an extra step before NoorDaily can set your lock screen wallpaper.'
        );
      } else {
        Alert.alert(
          'Could not enable Daily Wallpaper',
          result?.message || 'Please try again in a moment.'
        );
      }
    } catch (e) {
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (refreshing) return null;

  const enabled = !!info?.enabled;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        shadowStyle(colors.shadow, 0.06),
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="phone-portrait-outline" size={18} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Daily Wallpaper</Text>
        {enabled ? (
          <View style={styles.statusPill}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.statusText, { color: colors.primary }]}>Active</Text>
          </View>
        ) : null}
      </View>

      {enabled ? (
        <>
          <Text style={[styles.body, { color: colors.muted }]}>
            Your lock screen updates automatically about every 24 hours with a new
            Ayah and Hadith.
          </Text>
          <Text style={[styles.nextChange, { color: colors.secondary }]}>
            Next wallpaper: {formatNextChange(info?.nextAt)}
          </Text>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.primary }]}
            onPress={() => router.push('/wallpaper-preview')}
            accessibilityRole="button"
            accessibilityLabel="Preview today's wallpaper"
          >
            <Text style={[styles.secondaryLabel, { color: colors.primary }]}>
              Preview Wallpaper
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={[styles.body, { color: colors.muted }]}>
            Set up once and receive a new Quran Ayah &amp; Hadith on your lock screen
            every day{Platform.OS === 'android' ? ' — no need to open the app.' : '.'}
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleEnable}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Enable Daily Wallpaper"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryLabel}>Enable Daily Wallpaper</Text>
            )}
          </TouchableOpacity>
          {!isNativeWallpaperAvailable && Platform.OS === 'android' ? (
            <Text style={[styles.devNote, { color: colors.muted }]}>
              Requires a development or production build (not Expo Go).
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  nextChange: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  primaryButton: {
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  secondaryLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  devNote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
