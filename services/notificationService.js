// services/notificationService.js
//
// Everything related to Expo Notifications: permission requests, the
// Android channel, scheduling/cancelling the recurring daily reminder,
// sending a test notification, and handling notification taps so the app
// deep-links straight to today's /day/[date] screen instead of the Home tab.

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { NOTIFICATION_CHANNEL_ID } from '../constants/config';
import { toDateKey } from '../utils/dateUtils';
import {
  getScheduledNotificationId,
  setScheduledNotificationId,
} from './storageService';

// Show alerts even while the app is foregrounded, so the daily reminder is
// never silently swallowed.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NOTIFICATION_TITLE = '🌙 NoorDaily — Daily Reminder';
const NOTIFICATION_BODY =
    "📖 Your Ayah and 🕌 Hadith are ready. Tap to read today's reminder.";

/**
 * Creates the Android notification channel used for the daily reminder.
 * Safe to call multiple times; no-op on iOS.
 */
export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: 'NoorDaily Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: '#14532D',
    sound: 'default',
  });
}

/**
 * Requests notification permission (physical devices only — simulators
 * cannot receive push/local notification permission properly).
 * @returns {Promise<boolean>} whether permission is granted
 */
export async function requestNotificationPermission() {
  if (!Device.isDevice) {
    console.warn('Must use a physical device for full notification support.');
  }

  await ensureAndroidChannel();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Checks current permission status without prompting.
 */
export async function getNotificationPermissionStatus() {
  const { status } = await Notifications.getPermissionsAsync();
  return status; // 'granted' | 'denied' | 'undetermined'
}

/**
 * Schedules (or replaces) the recurring daily reminder at the given time.
 * Always cancels any previously scheduled NoorDaily notification first so
 * duplicates are never created.
 * @param {{hour: number, minute: number}} time
 * @returns {Promise<string|null>} the new notification identifier
 */
export async function scheduleDailyReminder(time) {
  await ensureAndroidChannel();
  await cancelDailyReminder();

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: NOTIFICATION_TITLE,
      body: NOTIFICATION_BODY,
      data: { type: 'daily-reminder' },
      sound: 'default',
    },
    trigger: {
      hour: time.hour,
      minute: time.minute,
      repeats: true,
      channelId: NOTIFICATION_CHANNEL_ID,
    },
  });

  await setScheduledNotificationId(identifier);
  return identifier;
}

/**
 * Cancels the currently scheduled NoorDaily reminder, if any.
 */
export async function cancelDailyReminder() {
  const id = await getScheduledNotificationId();
  if (id) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      // Already cancelled or invalid id — safe to ignore.
    }
  }
  // Belt-and-braces: also clear anything else NoorDaily may have scheduled,
  // in case a previous version left a stray notification behind.
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => n.content?.data?.type === 'daily-reminder')
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
  await setScheduledNotificationId(null);
}

/**
 * Cancels then reschedules the daily reminder at a new time. Use this
 * whenever the user changes their reminder time in Settings.
 */
export async function rescheduleDailyReminder(time) {
  await cancelDailyReminder();
  return scheduleDailyReminder(time);
}

/**
 * Fires an immediate test notification so the user can confirm reminders
 * are working, without waiting for the scheduled time.
 */
export async function sendTestNotification() {
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: NOTIFICATION_TITLE,
      body: NOTIFICATION_BODY,
      data: { type: 'daily-reminder' },
      sound: 'default',
    },
    trigger: null, // fire immediately
  });
}

/**
 * Extracts the target route for a notification response. The daily reminder
 * always points at *today's* date, computed at tap-time (not schedule-time),
 * since it's a repeating trigger.
 * @param {Notifications.NotificationResponse} response
 * @returns {string} route path, e.g. '/day/2026-09-19'
 */
export function getRouteFromNotificationResponse(response) {
  const data = response?.notification?.request?.content?.data;
  if (data?.type === 'daily-reminder') {
    return `/day/${toDateKey(new Date())}`;
  }
  return `/day/${toDateKey(new Date())}`;
}

/**
 * Registers a listener for notification taps. Returns an unsubscribe
 * function — callers MUST invoke this on unmount to avoid leaking
 * listeners.
 * @param {(route: string) => void} onNavigate
 */
export function handleNotificationResponse(onNavigate) {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const route = getRouteFromNotificationResponse(response);
      onNavigate(route);
    }
  );
  return () => subscription.remove();
}

/**
 * Checks if the app was cold-started by tapping a notification, and if so
 * returns the route it should open. Call once on app boot.
 */
export async function getInitialNotificationRoute() {
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return null;
  return getRouteFromNotificationResponse(response);
}

export default {
  ensureAndroidChannel,
  requestNotificationPermission,
  getNotificationPermissionStatus,
  scheduleDailyReminder,
  cancelDailyReminder,
  rescheduleDailyReminder,
  sendTestNotification,
  handleNotificationResponse,
  getInitialNotificationRoute,
  getRouteFromNotificationResponse,
};
