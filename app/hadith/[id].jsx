// app/hadith/[id].jsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { SPACING, RADIUS, shadowStyle } from '../../constants/theme';
import ScreenHeader from '../../components/ScreenHeader';
import FavoriteButton from '../../components/FavoriteButton';
import ShareButton from '../../components/ShareButton';
import EmptyState from '../../components/EmptyState';
import { getHadithById } from '../../services/dailyContentService';
import { shareHadith } from '../../services/sharingService';

export default function HadithDetailScreen() {
  const { id } = useLocalSearchParams();
  const { colors, arabicFontSizeValue, translationFontSizeValue } = useApp();
  const hadith = getHadithById(id);
  const hasArabic = Boolean(hadith?.arabic && hadith.arabic.trim());

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Hadith of the Day" />

        {!hadith ? (
          <EmptyState
            icon="moon-outline"
            title="Hadith not found"
            message="This hadith may no longer be available."
          />
        ) : (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
              shadowStyle(colors.shadow),
            ]}
          >
            {hasArabic ? (
              <Text
                style={[
                  styles.arabic,
                  { color: colors.text, fontSize: arabicFontSizeValue + 2 },
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

            <View style={[styles.metaBlock, { borderColor: colors.border }]}>
              <Text style={[styles.metaLabel, { color: colors.muted }]}>Collection</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {hadith.collection}
              </Text>

              {hadith.book ? (
                <>
                  <Text style={[styles.metaLabel, { color: colors.muted, marginTop: SPACING.sm }]}>
                    Book
                  </Text>
                  <Text style={[styles.metaValue, { color: colors.text }]}>{hadith.book}</Text>
                </>
              ) : null}

              <Text style={[styles.metaLabel, { color: colors.muted, marginTop: SPACING.sm }]}>
                Hadith Number
              </Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {hadith.hadithNumber}
              </Text>

              {hadith.grade ? (
                <>
                  <Text style={[styles.metaLabel, { color: colors.muted, marginTop: SPACING.sm }]}>
                    Grade
                  </Text>
                  <Text style={[styles.metaValue, { color: colors.text }]}>{hadith.grade}</Text>
                </>
              ) : null}
            </View>

            <View style={styles.actionsRow}>
              <FavoriteButton id={hadith.id} type="hadith" />
              <ShareButton onPress={() => shareHadith(hadith)} />
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
    lineHeight: 42,
    marginBottom: SPACING.lg,
    fontWeight: '500',
  },
  translation: {
    textAlign: 'center',
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
    paddingTop: SPACING.sm,
  },
});
