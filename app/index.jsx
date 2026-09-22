// app/index.jsx — Home screen
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { SPACING } from '../constants/theme';
import DailyHeader from '../components/DailyHeader';
import AyahCard from '../components/AyahCard';
import HadithCard from '../components/HadithCard';
import DailyWallpaperCard from '../components/DailyWallpaperCard';
import LoadingState from '../components/LoadingState';
import { getDailyContent } from '../services/dailyContentService';
import { validateDailyContent } from '../utils/validation';
import { getOnboardingCompleted } from '../services/storageService';

export default function HomeScreen() {
  const { colors } = useApp();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [dailyContent, setDailyContent] = useState(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    (async () => {
      const completed = await getOnboardingCompleted();
      if (!completed) {
        router.replace('/onboarding');
        return;
      }
      setCheckingOnboarding(false);
    })();
  }, []);

  const loadContent = useCallback(() => {
    try {
      const today = new Date();
      const content = getDailyContent(today);
      const check = validateDailyContent(content);
      if (!check.valid) {
        console.warn('Home: daily content validation issues', check.errors);
      }
      setDailyContent(content);
      setError(false);
    } catch (e) {
      console.warn('Home: failed to load daily content', e);
      setError(true);
    }
  }, []);

  // Recalculate today's content and refresh whenever Home regains focus,
  // so a new day (or updated favorites) is always reflected.
  useFocusEffect(
    useCallback(() => {
      if (!checkingOnboarding) loadContent();
    }, [checkingOnboarding, loadContent])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadContent();
    setRefreshing(false);
  }, [loadContent]);

  if (checkingOnboarding) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <DailyHeader onBellPress={() => router.push('/notification-settings')} />

        <Text style={[styles.subheading, { color: colors.muted }]}>
          Your daily reminder
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Today's reminder isn't available right now.
            </Text>
            <Text style={[styles.errorMessage, { color: colors.muted }]}>
              Please try again.
            </Text>
            <TouchableOpacity
              onPress={loadContent}
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel="Retry loading today's reminder"
            >
              <Text style={styles.retryLabel}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : !dailyContent ? (
          <LoadingState />
        ) : (
          <>
            <View style={styles.cardSpacing}>
              <AyahCard ayah={dailyContent.ayah} />
            </View>
            <View style={styles.cardSpacing}>
              <HadithCard hadith={dailyContent.hadith} />
            </View>
            <DailyWallpaperCard />
            <Text style={[styles.footerQuote, { color: colors.secondary }]}>
              "Read. Reflect. Remember."
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  subheading: {
    fontSize: 14,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  cardSpacing: {
    marginBottom: SPACING.lg,
  },
  footerQuote: {
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 14,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  errorBox: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
  },
  retryLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
