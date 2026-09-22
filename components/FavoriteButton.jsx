// components/FavoriteButton.jsx
import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import {
  isAyahFavorite,
  isHadithFavorite,
  saveFavoriteAyah,
  removeFavoriteAyah,
  saveFavoriteHadith,
  removeFavoriteHadith,
} from '../services/storageService';

/**
 * A "♡ Save" button that toggles favorite state for an ayah or hadith.
 * type: 'ayah' | 'hadith'
 */
export default function FavoriteButton({ id, type, style }) {
  const { colors, notifyFavoritesChanged } = useApp();
  const [favorite, setFavorite] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const isFav =
        type === 'ayah' ? await isAyahFavorite(id) : await isHadithFavorite(id);
      if (mounted) setFavorite(isFav);
    })();
    return () => {
      mounted = false;
    };
  }, [id, type]);

  const animate = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.25, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const toggle = async () => {
    animate();
    if (favorite) {
      setFavorite(false);
      if (type === 'ayah') await removeFavoriteAyah(id);
      else await removeFavoriteHadith(id);
    } else {
      setFavorite(true);
      if (type === 'ayah') await saveFavoriteAyah(id);
      else await saveFavoriteHadith(id);
    }
    notifyFavoritesChanged();
  };

  return (
    <TouchableOpacity
      onPress={toggle}
      style={[styles.button, style]}
      accessibilityRole="button"
      accessibilityLabel={favorite ? 'Remove from favorites' : 'Save to favorites'}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={favorite ? 'heart' : 'heart-outline'}
          size={18}
          color={favorite ? colors.secondary : colors.muted}
        />
      </Animated.View>
      <Text style={[styles.label, { color: favorite ? colors.secondary : colors.muted }]}>
        Save
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
});
