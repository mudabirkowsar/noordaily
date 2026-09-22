// app/history.jsx
//
// Lets the user browse previous daily reminders, grouped by month, using
// date-fns for formatting. Fully offline: content is derived deterministically
// from the date via dailyContentService, no network needed.

import React, { useMemo } from 'react';
import { View, Text, SectionList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format, subDays } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { SPACING, RADIUS, shadowStyle } from '../constants/theme';
import { getDailyContent } from '../services/dailyContentService';
import { toDateKey } from '../utils/dateUtils';

const DAYS_OF_HISTORY = 60;

function buildHistorySections() {
  const today = new Date();
  const days = Array.from({ length: DAYS_OF_HISTORY }, (_, i) => subDays(today, i));

  const byMonth = {};
  days.forEach((date) => {
    const monthKey = format(date, 'MMMM yyyy');
    if (!byMonth[monthKey]) byMonth[monthKey] = [];
    byMonth[monthKey].push(date);
  });

  return Object.keys(byMonth).map((monthKey) => ({
    title: monthKey,
    data: byMonth[monthKey],
  }));
}

export default function HistoryScreen() {
  const { colors } = useApp();
  const router = useRouter();
  const sections = useMemo(buildHistorySections, []);

  const renderItem = ({ item: date }) => {
    const content = getDailyContent(date);
    const dateKey = toDateKey(date);

    return (
      <TouchableOpacity
        style={[
          styles.row,
          { backgroundColor: colors.card, borderColor: colors.border },
          shadowStyle(colors.shadow, 0.05),
        ]}
        onPress={() => router.push(`/day/${dateKey}`)}
        accessibilityRole="button"
        accessibilityLabel={`View reminder for ${format(date, 'MMMM d')}`}
      >
        <View style={[styles.dayBadge, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.dayNumber, { color: colors.primary }]}>
            {format(date, 'd')}
          </Text>
        </View>
        <View style={styles.rowTextWrap}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            Ayah + Hadith
          </Text>
          <Text style={[styles.rowSubtitle, { color: colors.muted }]} numberOfLines={1}>
            {content.ayah ? `Qur'an ${content.ayah.surahName} ${content.ayah.surahNumber}:${content.ayah.ayahNumber}` : ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Daily History</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(date) => toDateKey(date)}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: colors.muted, backgroundColor: colors.background }]}>
            {section.title}
          </Text>
        )}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingVertical: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  dayBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowTextWrap: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 12,
  },
});
