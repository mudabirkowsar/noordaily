// components/AyahCard.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import { shadowStyle, RADIUS, SPACING } from '../constants/theme';
import FavoriteButton from './FavoriteButton';
import ShareButton from './ShareButton';
import { shareAyah } from '../services/sharingService';

/**
 * Premium card showing the Ayah of the Day: header, Arabic (RTL, large,
 * centered), translation, reference, and Save / Share / Read More actions.
 */
export default function AyahCard({ ayah, compact = false }) {
  const { colors, arabicFontSizeValue, translationFontSizeValue } = useApp();
  const router = useRouter();

  if (!ayah) return null;

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
          📖 AYAH OF THE DAY
        </Text>
      </View>

      <Text
        style={[
          styles.arabic,
          { color: colors.text, fontSize: arabicFontSizeValue },
        ]}
        numberOfLines={compact ? 3 : undefined}
      >
        {ayah.arabic}
      </Text>

      <Text
        style={[
          styles.translation,
          { color: colors.muted, fontSize: translationFontSizeValue },
        ]}
        numberOfLines={compact ? 3 : undefined}
      >
        "{ayah.translation}"
      </Text>

      <Text style={[styles.reference, { color: colors.secondary }]}>
        Qur'an {ayah.surahName} • {ayah.surahNumber}:{ayah.ayahNumber}
      </Text>

      <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
        <FavoriteButton id={ayah.id} type="ayah" />
        <ShareButton onPress={() => shareAyah(ayah)} />
      </View>

      <TouchableOpacity
        onPress={() => router.push(`/ayah/${ayah.id}`)}
        accessibilityRole="button"
        accessibilityLabel="Read more about this ayah"
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
    lineHeight: 46,
    marginBottom: SPACING.md,
    fontWeight: '500',
  },
  translation: {
    textAlign: 'center',
    fontStyle: 'italic',
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
