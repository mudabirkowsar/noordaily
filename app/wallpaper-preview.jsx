// app/wallpaper-preview.jsx
//
// Shows today's Daily Wallpaper content as close as possible to how it
// will look on the real Android lock screen, with actions to apply it
// now or turn on daily automation. On iOS, "Set as Lock Screen" and
// automation are replaced with a clear explanation that automatic
// system wallpaper changes are an Android-only capability.

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { SPACING, RADIUS } from '../constants/theme';
import WallpaperPreviewCanvas from '../components/WallpaperPreviewCanvas';
import {
  getTodayWallpaperContent,
  getCurrentWallpaperInfo,
  applyDailyWallpaper,
  enableWallpaperAutomation,
  getWallpaperHistory,
  formatNextChange,
} from '../services/wallpaperService';

export default function WallpaperPreviewScreen() {
  const { colors } = useApp();
  const router = useRouter();
  const [content, setContent] = useState(null);
  const [info, setInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setContent(getTodayWallpaperContent());
    const [currentInfo, recentHistory] = await Promise.all([
      getCurrentWallpaperInfo(),
      getWallpaperHistory(),
    ]);
    setInfo(currentInfo);
    setHistory(recentHistory.slice(0, 5));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSetNow = async () => {
    setBusy(true);
    try {
      const result = await applyDailyWallpaper(true);
      if (result?.success) {
        Alert.alert('Applied', 'Today\u2019s wallpaper is now on your lock screen.');
        await load();
      } else {
        Alert.alert('Setup required', result?.message || 'Unable to set the wallpaper right now.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleEnableDaily = async () => {
    setBusy(true);
    try {
      const result = await enableWallpaperAutomation();
      if (result?.success) {
        Alert.alert('Daily Wallpaper Enabled', 'Your lock screen will automatically change every 24 hours.');
        await load();
      } else {
        Alert.alert('Setup required', result?.message || 'Unable to enable Daily Wallpaper right now.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={styles.closeButton}
        >
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Wallpaper Preview</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <WallpaperPreviewCanvas content={content} style={styles.canvas} />

        {info?.enabled ? (
          <Text style={[styles.statusLine, { color: colors.muted }]}>
            Daily Wallpaper is active · Next change: {formatNextChange(info?.nextAt)}
          </Text>
        ) : (
          <Text style={[styles.statusLine, { color: colors.muted }]}>
            Daily Wallpaper is not enabled yet.
          </Text>
        )}

        {Platform.OS === 'android' ? (
          <>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleSetNow}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Set as Lock Screen"
            >
              {busy ? <ActivityIndicator color="#FFFFFF" /> : (
                <Text style={styles.primaryLabel}>Set as Lock Screen</Text>
              )}
            </TouchableOpacity>

            {!info?.enabled ? (
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.primary }]}
                onPress={handleEnableDaily}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Enable Daily Wallpaper"
              >
                <Text style={[styles.secondaryLabel, { color: colors.primary }]}>
                  Enable Daily Wallpaper
                </Text>
              </TouchableOpacity>
            ) : null}
          </>
        ) : (
          <View style={[styles.iosNotice, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={[styles.iosNoticeText, { color: colors.text }]}>
              Automatic lock-screen wallpaper updates are an Android feature. On iOS you can
              preview today's wallpaper here and set it manually from your Photos/Wallpaper
              settings after sharing it.
            </Text>
          </View>
        )}

        <TouchableOpacity onPress={() => router.back()} style={styles.closeTextButton}>
          <Text style={[styles.closeText, { color: colors.muted }]}>Close</Text>
        </TouchableOpacity>

        {history.length > 0 ? (
          <View style={styles.historyBlock}>
            <Text style={[styles.historyTitle, { color: colors.muted }]}>RECENT WALLPAPERS</Text>
            {history.map((item) => (
              <View key={item.id} style={styles.historyRow}>
                <View style={[styles.historySwatch, { backgroundColor: item.backgroundColor || colors.border }]} />
                <Text style={[styles.historyDate, { color: colors.text }]}>{item.date}</Text>
                <Text style={[styles.historyStatus, { color: colors.muted }]}>{item.status}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  closeButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
  },
  canvas: { marginTop: SPACING.md, marginBottom: SPACING.lg },
  statusLine: { fontSize: 13, marginBottom: SPACING.lg, textAlign: 'center' },
  primaryButton: {
    width: '100%',
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  primaryLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    width: '100%',
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    paddingVertical: SPACING.md - 2,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  secondaryLabel: { fontSize: 15, fontWeight: '700' },
  iosNotice: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  iosNoticeText: { flex: 1, fontSize: 12, lineHeight: 17 },
  closeTextButton: { paddingVertical: SPACING.sm },
  closeText: { fontSize: 13, fontWeight: '600' },
  historyBlock: { width: '100%', marginTop: SPACING.lg },
  historyTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: SPACING.sm },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  historySwatch: { width: 16, height: 16, borderRadius: 8 },
  historyDate: { fontSize: 12, fontWeight: '600', flex: 1 },
  historyStatus: { fontSize: 11 },
});
