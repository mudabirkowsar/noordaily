// app/day/[date].jsx
//
// This is the screen the daily notification deep-links to. Shows both the
// Ayah and Hadith for the given date, with a Listen option for the ayah.

import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { SPACING, RADIUS, shadowStyle } from '../../constants/theme';
import ScreenHeader from '../../components/ScreenHeader';
import FavoriteButton from '../../components/FavoriteButton';
import ShareButton from '../../components/ShareButton';
import AudioButton from '../../components/AudioButton';
import { getDailyContent } from '../../services/dailyContentService';
import { shareAyah, shareHadith } from '../../services/sharingService';
import { fromDateKey, formatFullDate } from '../../utils/dateUtils';

export default function DayDetailScreen() {
  const { date: dateParam } = useLocalSearchParams();
  const { colors, arabicFontSizeValue, translationFontSizeValue } = useApp();

  const date = useMemo(() => fromDateKey(dateParam), [dateParam]);
  const content = useMemo(() => getDailyContent(date), [date]);
  const { ayah, hadith } = content;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Today's Reminder" subtitle={formatFullDate(date)} />

        {ayah ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
              shadowStyle(colors.shadow),
            ]}
          >
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>
              📖 Ayah of the Day
            </Text>
            <Text
              style={[
                styles.arabic,
                { color: colors.text, fontSize: arabicFontSizeValue },
              ]}
            >
              {ayah.arabic}
            </Text>
            <Text
              style={[
                styles.translation,
                { color: colors.muted, fontSize: translationFontSizeValue },
              ]}
            >
              "{ayah.translation}"
            </Text>
            <Text style={[styles.reference, { color: colors.secondary }]}>
              Qur'an {ayah.surahNumber}:{ayah.ayahNumber}
            </Text>

            <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
              <FavoriteButton id={ayah.id} type="ayah" />
              <ShareButton onPress={() => shareAyah(ayah)} />
              <AudioButton audioUrl={ayah.audioUrl} />
            </View>
          </View>
        ) : null}

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {hadith ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
              shadowStyle(colors.shadow),
            ]}
          >
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>
              🕌 Hadith of the Day
            </Text>
            {hadith.arabic && hadith.arabic.trim() ? (
              <Text
                style={[
                  styles.arabic,
                  { color: colors.text, fontSize: arabicFontSizeValue },
                ]}
              >
                {hadith.arabic}
              </Text>
            ) : null}
            <Text
              style={[
                styles.translation,
                { color: colors.muted, fontSize: translationFontSizeValue },
              ]}
            >
              {hadith.translation}
            </Text>
            <Text style={[styles.reference, { color: colors.secondary }]}>
              {hadith.collection}
            </Text>

            <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
              <FavoriteButton id={hadith.id} type="hadith" />
              <ShareButton onPress={() => shareHadith(hadith)} />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  card: {
    borderRadius: RADIUS.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  arabic: {
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 44,
    marginBottom: SPACING.md,
    fontWeight: '500',
  },
  translation: {
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: SPACING.sm,
  },
  reference: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: SPACING.sm,
  },
  divider: {
    height: SPACING.lg,
    backgroundColor: 'transparent',
  },
});
