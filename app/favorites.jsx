// app/favorites.jsx
import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { SPACING, RADIUS, shadowStyle } from '../constants/theme';
import EmptyState from '../components/EmptyState';
import { getFavorites } from '../services/storageService';
import { getAyahById, getHadithById } from '../services/dailyContentService';

const TABS = [
  { key: 'ayahs', label: 'Ayahs' },
  { key: 'hadiths', label: 'Hadiths' },
];

export default function FavoritesScreen() {
  const { colors, favoritesVersion } = useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ayahs');
  const [favoriteAyahs, setFavoriteAyahs] = useState([]);
  const [favoriteHadiths, setFavoriteHadiths] = useState([]);

  const load = useCallback(async () => {
    const { ayahs, hadiths } = await getFavorites();
    setFavoriteAyahs(ayahs.map(getAyahById).filter(Boolean));
    setFavoriteHadiths(hadiths.map(getHadithById).filter(Boolean));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, favoritesVersion])
  );

  const data = activeTab === 'ayahs' ? favoriteAyahs : favoriteHadiths;

  const renderItem = ({ item }) => {
    const isAyah = activeTab === 'ayahs';
    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
          shadowStyle(colors.shadow),
        ]}
        onPress={() => router.push(isAyah ? `/ayah/${item.id}` : `/hadith/${item.id}`)}
        accessibilityRole="button"
      >
        <Ionicons
          name={isAyah ? 'book-outline' : 'moon-outline'}
          size={18}
          color={colors.primary}
          style={styles.cardIcon}
        />
        <View style={styles.cardTextWrap}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
            {item.translation}
          </Text>
          <Text style={[styles.cardMeta, { color: colors.secondary }]} numberOfLines={1}>
            {isAyah
              ? `Qur'an ${item.surahName} • ${item.surahNumber}:${item.ayahNumber}`
              : `${item.collection}${item.hadithNumber ? ` • No. ${item.hadithNumber}` : ''}`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Favorites</Text>
      </View>

      <View style={[styles.tabs, { borderColor: colors.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab.key)}
            accessibilityRole="button"
            accessibilityLabel={`Show favorite ${tab.label}`}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === tab.key ? colors.primary : colors.muted },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="Nothing saved yet."
            message={'When something speaks to your heart,\nsave it here.'}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: SPACING.lg,
  },
  tabButton: {
    paddingVertical: SPACING.sm,
    marginRight: SPACING.lg,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    padding: SPACING.lg,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardIcon: {
    marginRight: SPACING.sm,
  },
  cardTextWrap: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    fontWeight: '600',
  },
});
