// components/LoadingState.jsx
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { SPACING } from '../constants/theme';

/**
 * Simple loading placeholder shown while today's content resolves. Used so
 * the app never shows a blank screen.
 */
export default function LoadingState({ message = "Preparing today's reminder..." }) {
  const { colors } = useApp();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={[styles.message, { color: colors.muted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  message: {
    marginTop: SPACING.md,
    fontSize: 14,
  },
});
