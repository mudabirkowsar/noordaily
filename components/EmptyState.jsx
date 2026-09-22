// components/EmptyState.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { SPACING } from '../constants/theme';

/**
 * Generic empty-state placeholder, e.g. for Favorites with nothing saved.
 */
export default function EmptyState({
  icon = 'heart-outline',
  title = 'Nothing here yet.',
  message,
}) {
  const { colors } = useApp();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={40} color={colors.secondary} style={styles.icon} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: colors.muted }]}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  icon: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
