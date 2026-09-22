// components/HadithCard.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import { shadowStyle, RADIUS, SPACING } from '../constants/theme';
import FavoriteButton from './FavoriteButton';
import ShareButton from './ShareButton';
import { shareHadith } from '../services/sharingService';

/**
 * Premium card showing the Hadith of the Day: header, optional Arabic,
 * translation, source, and Save / Share / Read More actions.
 */
export default function HadithCard({ hadith, compact = false }) {
  const { colors, arabicFontSizeValue, translationFontSizeValue } = useApp();
  const router = useRouter();

  if (!hadith) return null;

  const hasArabic = Boolean(hadith.arabic && hadith.arabic.trim());

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        shadowStyle(colors.shadow),
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.headerLabel, { color: colors.primary }]}>
          🕌 HADITH OF THE DAY
        </Text>
      </View>

      {hasArabic ? (
        <Text
          style={[
            styles.arabic,
            { color: colors.text, fontSize: arabicFontSizeValue },
          ]}
          numberOfLines={compact ? 3 : undefined}
        >
          {hadith.arabic}
        </Text>
      ) : null}

      <Text
        style={[
          styles.translation,
          { color: colors.muted, fontSize: translationFontSizeValue },
        ]}
        numberOfLines={compact ? 4 : undefined}
      >
        {hadith.translation}
      </Text>

      <Text style={[styles.reference, { color: colors.secondary }]}>
        {hadith.collection}
        {hadith.hadithNumber ? `\nHadith No. ${hadith.hadithNumber}` : ''}
      </Text>

      <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
        <FavoriteButton id={hadith.id} type="hadith" />
        <ShareButton onPress={() => shareHadith(hadith)} />
      </View>

      <TouchableOpacity
        onPress={() => router.push(`/hadith/${hadith.id}`)}
        accessibilityRole="button"
        accessibilityLabel="Read more about this hadith"
      >
        <Text style={[styles.readMore, { color: colors.primary }]}>Read More</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
  },
  headerRow: {
    marginBottom: SPACING.md,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  arabic: {
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 40,
    marginBottom: SPACING.md,
    fontWeight: '500',
  },
  translation: {
    textAlign: 'center',
    lineHeight: 24,
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
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  readMore: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
