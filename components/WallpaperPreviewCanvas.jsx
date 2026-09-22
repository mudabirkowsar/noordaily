// components/WallpaperPreviewCanvas.jsx
//
// Renders an on-screen approximation of a generated wallpaper: one solid
// background color with the Quran Ayah + reference and Hadith + reference
// laid out on it. This is a *preview* built with normal React Native
// views/text — the actual lock-screen bitmap is generated natively in
// Kotlin (WallpaperGenerator.kt) at full device resolution with the same
// content, so what's shown here matches what gets applied.

import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { getTextPaletteFor, getColorByHex } from '../constants/wallpaperColors';
import { APP_NAME } from '../constants/config';
import { formatLongDate, fromDateKey } from '../utils/dateUtils';

export default function WallpaperPreviewCanvas({ content, style, showFooter = true }) {
  const { width: screenWidth } = useWindowDimensions();

  if (!content) {
    return null;
  }

  const colorEntry = getColorByHex(content.backgroundColor);
  const palette = getTextPaletteFor(colorEntry);

  // A typical phone lock-screen aspect ratio (~9:19.5), capped to a
  // sensible width so the preview fits comfortably in any screen/modal.
  const previewWidth = Math.min(screenWidth * 0.78, 320);
  const previewHeight = previewWidth * (19.5 / 9);

  const hasArabicAyah = !!content.ayah?.arabic;
  const hasArabicHadith = !!content.hadith?.arabic;

  return (
    <View
      style={[
        styles.frame,
        { width: previewWidth, height: previewHeight, backgroundColor: colorEntry.hex },
        style,
      ]}
      accessibilityLabel="Wallpaper preview"
    >
      {/* Reserved clock/status area — real lock screens draw the clock here */}
      <View style={styles.clockReserve} />

      <View style={styles.body}>
        {hasArabicAyah ? (
          <Text
            style={[styles.arabic, { color: palette.primary }]}
            numberOfLines={3}
            adjustsFontSizeToFit
          >
            {content.ayah.arabic}
          </Text>
        ) : null}

        <Text
          style={[styles.translation, { color: palette.primary }]}
          numberOfLines={6}
          adjustsFontSizeToFit
        >
          "{content.ayah.translation}"
        </Text>
        <Text style={[styles.reference, { color: palette.secondary }]}>
          {content.ayah.reference}
        </Text>

        <View style={[styles.divider, { backgroundColor: palette.divider }]} />

        {hasArabicHadith ? (
          <Text
            style={[styles.arabicSmall, { color: palette.primary }]}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {content.hadith.arabic}
          </Text>
        ) : null}

        <Text
          style={[styles.hadithText, { color: palette.primary }]}
          numberOfLines={8}
          adjustsFontSizeToFit
        >
          {content.hadith.translation}
        </Text>
        <Text style={[styles.reference, { color: palette.secondary }]}>
          {content.hadith.reference}
          {content.hadith.grade ? ` · ${content.hadith.grade}` : ''}
        </Text>
      </View>

      {showFooter ? (
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: palette.muted }]}>
            {APP_NAME} · {formatLongDate(fromDateKey(content.date))}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 28,
    overflow: 'hidden',
    paddingHorizontal: 18,
    alignSelf: 'center',
  },
  clockReserve: {
    // Mirrors the top safe-area reservation used by the native generator
    // so the Android lock screen clock/date never overlaps the text.
    height: '16%',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  arabic: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 30,
  },
  arabicSmall: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  translation: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 19,
    marginBottom: 6,
  },
  hadithText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 6,
  },
  reference: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    width: '40%',
    alignSelf: 'center',
    marginVertical: 14,
  },
  footer: {
    paddingBottom: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
});
