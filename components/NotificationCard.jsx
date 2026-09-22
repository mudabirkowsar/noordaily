// components/NotificationCard.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { shadowStyle, RADIUS, SPACING } from '../constants/theme';
import { formatTime } from '../utils/dateUtils';

/**
 * Card used in onboarding / notification-settings to show and control the
 * daily reminder time and enabled state.
 */
export default function NotificationCard({
  enabled,
  onToggle,
  time,
  onChangeTimePress,
  onTestPress,
}) {
  const { colors } = useApp();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        shadowStyle(colors.shadow),
      ]}
    >
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          <Text style={[styles.rowLabel, { color: colors.text }]}>Daily Reminder</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#FFFFFF"
          accessibilityLabel="Toggle daily reminder"
        />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <TouchableOpacity
        style={styles.row}
        onPress={onChangeTimePress}
        accessibilityRole="button"
        accessibilityLabel="Change reminder time"
      >
        <View style={styles.rowLeft}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
          <Text style={[styles.rowLabel, { color: colors.text }]}>Reminder Time</Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.timeValue, { color: colors.secondary }]}>
            {formatTime(time)}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </TouchableOpacity>

      {onTestPress ? (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            style={styles.row}
            onPress={onTestPress}
            accessibilityRole="button"
            accessibilityLabel="Send a test notification"
          >
            <View style={styles.rowLeft}>
              <Ionicons name="paper-plane-outline" size={20} color={colors.primary} />
              <Text style={[styles.rowLabel, { color: colors.text }]}>
                Test Notification
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
