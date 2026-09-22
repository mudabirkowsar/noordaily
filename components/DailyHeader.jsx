// components/DailyHeader.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { getGreeting } from '../utils/greeting';
import { formatLongDate } from '../utils/dateUtils';

/**
 * Home screen header: dynamic greeting, current date, and a bell icon
 * that opens notification settings.
 */
export default function DailyHeader({ date = new Date(), onBellPress }) {
  const { colors } = useApp();
  const greeting = getGreeting(date);
  const dateLabel = formatLongDate(date);

  return (
    <View style={styles.row}>
      <View>
        <Text style={[styles.greeting, { color: colors.text }]}>{greeting}</Text>
        <Text style={[styles.date, { color: colors.muted }]}>{dateLabel}</Text>
      </View>
      <TouchableOpacity
        onPress={onBellPress}
        accessibilityRole="button"
        accessibilityLabel="Open notification settings"
        style={[styles.bell, { backgroundColor: colors.primarySoft }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="notifications-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
  },
  date: {
    fontSize: 14,
    marginTop: 4,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
