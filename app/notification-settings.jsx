// app/notification-settings.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../context/AppContext';
import { SPACING } from '../constants/theme';
import ScreenHeader from '../components/ScreenHeader';
import NotificationCard from '../components/NotificationCard';
import {
  getNotificationEnabled,
  setNotificationEnabled,
  getNotificationTime,
  setNotificationTime,
} from '../services/storageService';
import {
  requestNotificationPermission,
  rescheduleDailyReminder,
  cancelDailyReminder,
  sendTestNotification,
  getNotificationPermissionStatus,
} from '../services/notificationService';
import { DEFAULT_NOTIFICATION_TIME } from '../constants/config';

export default function NotificationSettingsScreen() {
  const { colors } = useApp();
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState(DEFAULT_NOTIFICATION_TIME);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const [savedEnabled, savedTime, permStatus] = await Promise.all([
        getNotificationEnabled(),
        getNotificationTime(),
        getNotificationPermissionStatus(),
      ]);
      setEnabled(savedEnabled);
      setTime(savedTime || DEFAULT_NOTIFICATION_TIME);
      setPermissionDenied(permStatus === 'denied');
      setLoading(false);
    })();
  }, []);

  const handleToggle = async (value) => {
    setEnabled(value);
    await setNotificationEnabled(value);

    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setPermissionDenied(true);
        setEnabled(false);
        await setNotificationEnabled(false);
        return;
      }
      setPermissionDenied(false);
      // Cancel then reschedule: never leave duplicate reminders.
      await rescheduleDailyReminder(time);
    } else {
      await cancelDailyReminder();
    }
  };

  const onTimeChange = async (event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios');
    if (!selectedDate) return;
    const newTime = { hour: selectedDate.getHours(), minute: selectedDate.getMinutes() };
    setTime(newTime);
    await setNotificationTime(newTime);
    if (enabled) {
      await rescheduleDailyReminder(newTime);
    }
  };

  const handleTest = async () => {
    const granted = await requestNotificationPermission();
    if (!granted) {
      setPermissionDenied(true);
      return;
    }
    await sendTestNotification();
    Alert.alert('Test sent', 'Check your notification tray in a moment.');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Daily Reminder" />

        {!loading && (
          <>
            <NotificationCard
              enabled={enabled}
              onToggle={handleToggle}
              time={time}
              onChangeTimePress={() => setShowPicker(true)}
              onTestPress={handleTest}
            />

            {permissionDenied ? (
              <View style={[styles.notice, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.noticeText, { color: colors.text }]}>
                  Notifications are currently disabled. Enable them in your
                  device settings to receive your daily NoorDaily reminder.
                </Text>
              </View>
            ) : null}

            {showPicker && (
              <DateTimePicker
                value={(() => {
                  const d = new Date();
                  d.setHours(time.hour, time.minute, 0, 0);
                  return d;
                })()}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            )}
          </>
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
  notice: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 14,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
