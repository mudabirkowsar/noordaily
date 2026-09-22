// components/Logo.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

/**
 * NoorDaily wordmark with a crescent-in-circle glyph. size: 'small' | 'large'
 */
export default function Logo({ size = 'large', showTagline = false }) {
  const { colors } = useApp();
  const isLarge = size === 'large';
  const glyphSize = isLarge ? 72 : 40;
  const iconSize = isLarge ? 34 : 20;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.glyph,
          {
            width: glyphSize,
            height: glyphSize,
            borderRadius: glyphSize / 2,
            backgroundColor: colors.primary,
          },
        ]}
        accessibilityLabel="NoorDaily logo"
      >
        <Ionicons name="moon" size={iconSize} color={colors.secondary} />
      </View>
      <Text
        style={[
          styles.wordmark,
          { color: colors.text, fontSize: isLarge ? 26 : 18 },
        ]}
      >
        NOORDAILY
      </Text>
      {showTagline ? (
        <Text style={[styles.tagline, { color: colors.muted }]}>
          One Ayah. One Hadith. Every Day.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  glyph: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  wordmark: {
    fontWeight: '700',
    letterSpacing: 3,
  },
  tagline: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});
