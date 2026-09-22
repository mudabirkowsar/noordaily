// components/SettingRow.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { SPACING } from '../constants/theme';

/**
 * A single settings row. Supports three interaction modes:
 * - onPress (navigates / opens something) with a chevron
 * - switchValue + onSwitchChange (toggle)
 * - value (plain trailing text, e.g. "Medium")
 */
export default function SettingRow({
  icon,
  label,
  onPress,
  switchValue,
  onSwitchChange,
  value,
  danger = false,
}) {
  const { colors } = useApp();
  const isSwitch = typeof switchValue === 'boolean';
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={styles.row}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
    >
      <View style={styles.left}>
        {icon ? (
          <Ionicons
            name={icon}
            size={20}
            color={danger ? colors.danger : colors.primary}
            style={styles.icon}
          />
        ) : null}
        <Text style={[styles.label, { color: danger ? colors.danger : colors.text }]}>
          {label}
        </Text>
      </View>

      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      ) : (
        <View style={styles.right}>
          {value ? (
            <Text style={[styles.value, { color: colors.muted }]}>{value}</Text>
          ) : null}
          {onPress ? (
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          ) : null}
        </View>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  icon: {
    marginRight: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  value: {
    fontSize: 14,
    marginRight: 4,
  },
});
