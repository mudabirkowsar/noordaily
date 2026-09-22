// app/onboarding.jsx
//
// Three-step onboarding: intro, feature overview, then notification setup.
// Completing (or skipping) step 3 marks onboarding as done and enters Home.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { SPACING, RADIUS } from '../constants/theme';
import Logo from '../components/Logo';
import NotificationCard from '../components/NotificationCard';
import {
  setOnboardingCompleted,
  setNotificationEnabled,
  setNotificationTime,
} from '../services/storageService';
import {
  requestNotificationPermission,
  scheduleDailyReminder,
} from '../services/notificationService';
import { enableWallpaperAutomation } from '../services/wallpaperService';
import { DEFAULT_NOTIFICATION_TIME } from '../constants/config';

const FEATURES = [
  { icon: '📖', title: "Qur'an", body: 'One Ayah every day.' },
  { icon: '🕌', title: 'Hadith', body: 'One authentic Hadith every day.' },
  { icon: '🔔', title: 'Reminder', body: 'Receive it directly on your phone.' },
];

export default function OnboardingScreen() {
  const { colors } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [time, setTime] = useState(DEFAULT_NOTIFICATION_TIME);
  const [showPicker, setShowPicker] = useState(false);
  const [permissionNote, setPermissionNote] = useState(null);
  const [wallpaperChoice, setWallpaperChoice] = useState(null); // null | 'enable' | 'later'
  const [wallpaperBusy, setWallpaperBusy] = useState(false);
  const [wallpaperNote, setWallpaperNote] = useState(null);

  const LAST_STEP = 3;

  const finishOnboarding = async () => {
    await setOnboardingCompleted(true);
    await setNotificationTime(time);

    if (reminderEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        await scheduleDailyReminder(time);
        await setNotificationEnabled(true);
      } else {
        await setNotificationEnabled(false);
        setPermissionNote(
          'Notifications are currently disabled. You can enable them anytime from Settings or your device settings.'
        );
      }
    } else {
      await setNotificationEnabled(false);
    }

    router.replace('/');
  };

  const handleEnableWallpaper = async () => {
    setWallpaperBusy(true);
    try {
      const result = await enableWallpaperAutomation();
      if (!result?.success) {
        setWallpaperNote(
          result?.message ||
            'Daily Wallpaper needs an extra step — you can finish setting it up later from Settings.'
        );
      }
    } finally {
      setWallpaperChoice('enable');
      setWallpaperBusy(false);
    }
  };

  const onTimeChange = (event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTime({ hour: selectedDate.getHours(), minute: selectedDate.getMinutes() });
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {step === 0 && (
          <View style={styles.centerBlock}>
            <Logo size="large" />
            <Text style={[styles.title, { color: colors.text }]}>
              One Ayah.{'\n'}One Hadith.{'\n'}Every Day.
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              A small reminder for your heart.
            </Text>
          </View>
        )}

        {step === 1 && (
          <View style={styles.centerBlock}>
            {FEATURES.map((f) => (
              <View
                key={f.title}
                style={[styles.featureRow, { borderColor: colors.border }]}
              >
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>
                    {f.title}
                  </Text>
                  <Text style={[styles.featureBody, { color: colors.muted }]}>
                    {f.body}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {step === 2 && (
          <View style={styles.centerBlock}>
            <Ionicons
              name="notifications-outline"
              size={40}
              color={colors.primary}
              style={{ marginBottom: SPACING.lg }}
            />
            <Text style={[styles.title, { color: colors.text, fontSize: 22 }]}>
              When should NoorDaily remind you?
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted, marginBottom: SPACING.xl }]}>
              NoorDaily uses notifications to send your daily Ayah and Hadith
              reminder.
            </Text>

            <NotificationCard
              enabled={reminderEnabled}
              onToggle={setReminderEnabled}
              time={time}
              onChangeTimePress={() => setShowPicker(true)}
            />

            {permissionNote ? (
              <Text style={[styles.permissionNote, { color: colors.muted }]}>
                {permissionNote}
              </Text>
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
          </View>
        )}

        {step === 3 && (
          <View style={styles.centerBlock}>
            <Ionicons
              name="phone-portrait-outline"
              size={40}
              color={colors.primary}
              style={{ marginBottom: SPACING.lg }}
            />
            <Text style={[styles.title, { color: colors.text, fontSize: 22 }]}>
              Your Lock Screen, Your Daily Reminder
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted, marginBottom: SPACING.xl }]}>
              Enable Daily Wallpaper to automatically receive a new solid-color wallpaper
              containing a Quran Ayah and Hadith every day. This step is optional.
            </Text>

            {Platform.OS !== 'android' ? (
              <Text style={[styles.permissionNote, { color: colors.muted }]}>
                Automatic lock-screen updates are an Android feature. On iOS you can still
                preview and share daily wallpapers from Home.
              </Text>
            ) : wallpaperChoice === 'enable' ? (
              <Text style={[styles.permissionNote, { color: colors.primary }]}>
                {wallpaperNote || 'Daily Wallpaper is set up. Your lock screen will change automatically.'}
              </Text>
            ) : wallpaperChoice === 'later' ? (
              <Text style={[styles.permissionNote, { color: colors.muted }]}>
                No problem — you can enable this anytime from Home or Settings.
              </Text>
            ) : (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary, width: '100%' }]}
                onPress={handleEnableWallpaper}
                disabled={wallpaperBusy}
                accessibilityRole="button"
                accessibilityLabel="Enable Daily Wallpaper"
              >
                <Text style={styles.buttonLabel}>
                  {wallpaperBusy ? 'Setting up…' : 'Enable Daily Wallpaper'}
                </Text>
              </TouchableOpacity>
            )}

            {Platform.OS === 'android' && wallpaperChoice === null ? (
              <TouchableOpacity
                onPress={() => setWallpaperChoice('later')}
                style={{ marginTop: SPACING.md }}
              >
                <Text style={[styles.subtitle, { color: colors.muted, marginTop: 0 }]}>
                  Maybe Later
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === step ? colors.primary : colors.border,
                  width: i === step ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => (step < LAST_STEP ? setStep(step + 1) : finishOnboarding())}
          accessibilityRole="button"
          accessibilityLabel={step < LAST_STEP ? 'Continue' : 'Finish setup'}
        >
          <Text style={styles.buttonLabel}>
            {step < LAST_STEP ? 'Continue' : 'Finish'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  centerBlock: {
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: SPACING.xl,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureBody: {
    fontSize: 14,
  },
  permissionNote: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: SPACING.lg,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
