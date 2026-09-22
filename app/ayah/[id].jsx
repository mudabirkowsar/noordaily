// app/ayah/[id].jsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { SPACING, RADIUS, shadowStyle } from '../../constants/theme';
import ScreenHeader from '../../components/ScreenHeader';
import FavoriteButton from '../../components/FavoriteButton';
import ShareButton from '../../components/ShareButton';
import AudioButton from '../../components/AudioButton';
import EmptyState from '../../components/EmptyState';
import { getAyahById } from '../../services/dailyContentService';
import { shareAyah } from '../../services/sharingService';

export default function AyahDetailScreen() {
  const { id } = useLocalSearchParams();
  const { colors, arabicFontSizeValue, translationFontSizeValue } = useApp();
  const ayah = getAyahById(id);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Ayah of the Day" />

        {!ayah ? (
          <EmptyState
            icon="book-outline"
            title="Ayah not found"
            message="This ayah may no longer be available."
          />
        ) : (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
              shadowStyle(colors.shadow),
            ]}
          >
            <Text
              style={[
                styles.arabic,
                { color: colors.text, fontSize: arabicFontSizeValue + 2 },
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

            <View style={[styles.metaBlock, { borderColor: colors.border }]}>
              <Text style={[styles.metaLabel, { color: colors.muted }]}>Surah</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {ayah.surahName} ({ayah.surahNumber})
              </Text>
              <Text style={[styles.metaLabel, { color: colors.muted, marginTop: SPACING.sm }]}>
                Ayah Number
              </Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{ayah.ayahNumber}</Text>
            </View>

            <View style={styles.actionsRow}>
              <AudioButton audioUrl={ayah.audioUrl} />
              <FavoriteButton id={ayah.id} type="ayah" />
              <ShareButton onPress={() => shareAyah(ayah)} />
            </View>
          </View>
        )}
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
  arabic: {
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 48,
    marginBottom: SPACING.lg,
    fontWeight: '500',
  },
  translation: {
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  metaBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'transparent',
    paddingTop: SPACING.sm,
  },
});
