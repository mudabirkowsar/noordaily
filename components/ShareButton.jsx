// components/ShareButton.jsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

/**
 * A "↗ Share" button. Pass an onPress that triggers the appropriate
 * sharingService function for the content being shown.
 */
export default function ShareButton({ onPress, style }) {
  const { colors } = useApp();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, style]}
      accessibilityRole="button"
      accessibilityLabel="Share"
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Ionicons name="share-social-outline" size={18} color={colors.muted} />
      <Text style={[styles.label, { color: colors.muted }]}>Share</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
});
