
// app/settings.jsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

import { useApp } from '../context/AppContext';
import { SPACING, RADIUS, shadowStyle } from '../constants/theme';
import SettingRow from '../components/SettingRow';

import {
  getNotificationEnabled,
  setNotificationEnabled,
  getNotificationTime,
} from '../services/storageService';

import {
  requestNotificationPermission,
  cancelDailyReminder,
  rescheduleDailyReminder,
} from '../services/notificationService';

import {
  getCurrentWallpaperInfo,
  enableWallpaperAutomation,
  disableWallpaperAutomation,
  applyDailyWallpaper,
  resetWallpaperAutomation,
  formatNextChange,
} from '../services/wallpaperService';

import {
  DEFAULT_NOTIFICATION_TIME,
  APP_NAME,
} from '../constants/config';

const THEME_OPTIONS = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

const SIZE_OPTIONS = [
  { key: 'small', label: 'Small' },
  { key: 'medium', label: 'Medium' },
  { key: 'large', label: 'Large' },
];

/**
 * Safely convert any stored notification time
 * into HH:MM format.
 */
function normalizeNotificationTime(value) {
  if (value === null || value === undefined || value === '') {
    return DEFAULT_NOTIFICATION_TIME;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    const hhmmMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);

    if (hhmmMatch) {
      const hours = Number(hhmmMatch[1]);
      const minutes = Number(hhmmMatch[2]);

      if (
        Number.isInteger(hours) &&
        Number.isInteger(minutes) &&
        hours >= 0 &&
        hours <= 23 &&
        minutes >= 0 &&
        minutes <= 59
      ) {
        return `${String(hours).padStart(2, '0')}:${String(
          minutes
        ).padStart(2, '0')}`;
      }
    }

    const parsed = new Date(trimmed);

    if (!Number.isNaN(parsed.getTime())) {
      return `${String(parsed.getHours()).padStart(2, '0')}:${String(
        parsed.getMinutes()
      ).padStart(2, '0')}`;
    }

    return DEFAULT_NOTIFICATION_TIME;
  }

  if (value instanceof Date) {
    if (!Number.isNaN(value.getTime())) {
      return `${String(value.getHours()).padStart(2, '0')}:${String(
        value.getMinutes()
      ).padStart(2, '0')}`;
    }

    return DEFAULT_NOTIFICATION_TIME;
  }

  if (typeof value === 'number') {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return `${String(parsed.getHours()).padStart(2, '0')}:${String(
        parsed.getMinutes()
      ).padStart(2, '0')}`;
    }

    return DEFAULT_NOTIFICATION_TIME;
  }

  return DEFAULT_NOTIFICATION_TIME;
}

/**
 * Safely display HH:mm as a readable time.
 */
function safeFormatTime(value) {
  const normalized = normalizeNotificationTime(value);

  if (!normalized || typeof normalized !== 'string') {
    return '8:00 AM';
  }

  const parts = normalized.split(':');

  if (parts.length !== 2) {
    return '8:00 AM';
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return '8:00 AM';
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Section card
 */
function SectionCard({ title, children, colors }) {
  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: colors.muted,
          },
        ]}
      >
        {title}
      </Text>

      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          shadowStyle(colors.shadow, 0.05),
        ]}
      >
        {children}
      </View>
    </View>
  );
}

/**
 * Option picker
 */
function OptionPicker({
  options,
  selected,
  onSelect,
  colors,
}) {
  return (
    <View style={styles.optionRow}>
      {options.map((opt) => {
        const active = selected === opt.key;

        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onSelect(opt.key)}
            style={[
              styles.optionChip,
              {
                backgroundColor: active
                  ? colors.primary
                  : colors.primarySoft,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.optionLabel,
                {
                  color: active ? '#FFFFFF' : colors.primary,
                },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/**
 * Settings screen
 */
export default function SettingsScreen() {
  const {
    colors,
    themePreference,
    setThemePreference,
    arabicFontSize,
    setArabicFontSize,
    translationFontSize,
    setTranslationFontSize,
  } = useApp();

  const router = useRouter();

  const [notifEnabled, setNotifEnabled] = useState(false);

  const [notifTime, setNotifTime] = useState(
    normalizeNotificationTime(DEFAULT_NOTIFICATION_TIME)
  );

  const [wallpaperInfo, setWallpaperInfo] = useState(null);
  const [wallpaperBusy, setWallpaperBusy] = useState(false);

  const loadWallpaperInfo = async () => {
    try {
      const info = await getCurrentWallpaperInfo();
      setWallpaperInfo(info);
    } catch (error) {
      console.warn('Failed to load wallpaper status:', error);
    }
  };

  useEffect(() => {
    loadWallpaperInfo();
  }, []);

  const handleToggleWallpaper = async (value) => {
    setWallpaperBusy(true);
    try {
      if (value) {
        const result = await enableWallpaperAutomation();
        if (!result?.success) {
          Alert.alert(
            'Setup required',
            result?.message ||
              'Android needs an extra step before NoorDaily can set your lock screen wallpaper.'
          );
        }
      } else {
        await disableWallpaperAutomation();
      }
    } catch (error) {
      console.warn('Failed to update wallpaper automation:', error);
      Alert.alert('Something went wrong', 'Unable to update Daily Wallpaper. Please try again.');
    } finally {
      await loadWallpaperInfo();
      setWallpaperBusy(false);
    }
  };

  const handleApplyWallpaperNow = async () => {
    setWallpaperBusy(true);
    try {
      const result = await applyDailyWallpaper(true);
      if (result?.success) {
        Alert.alert('Applied', "Today's wallpaper has been set on your lock screen.");
      } else {
        Alert.alert('Unable to apply', result?.message || 'Please try again.');
      }
    } finally {
      await loadWallpaperInfo();
      setWallpaperBusy(false);
    }
  };

  const handleResetWallpaper = () => {
    Alert.alert(
      'Reset Wallpaper Settings',
      'This turns off Daily Wallpaper and clears its saved history. You can enable it again anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setWallpaperBusy(true);
            try {
              await resetWallpaperAutomation();
            } finally {
              await loadWallpaperInfo();
              setWallpaperBusy(false);
            }
          },
        },
      ]
    );
  };

  /**
   * Load notification settings safely.
   */
  useEffect(() => {
    let mounted = true;

    const loadNotificationSettings = async () => {
      try {
        const enabled = await getNotificationEnabled();
        const storedTime = await getNotificationTime();

        if (!mounted) {
          return;
        }

        setNotifEnabled(Boolean(enabled));

        const safeTime = normalizeNotificationTime(storedTime);

        setNotifTime(safeTime);
      } catch (error) {
        console.warn(
          'Failed to load notification settings:',
          error
        );

        if (!mounted) {
          return;
        }

        setNotifEnabled(false);

        setNotifTime(
          normalizeNotificationTime(
            DEFAULT_NOTIFICATION_TIME
          )
        );
      }
    };

    loadNotificationSettings();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Enable / disable daily notifications.
   */
  const handleToggleNotifications = async (value) => {
    try {
      setNotifEnabled(value);

      await setNotificationEnabled(value);

      if (value) {
        const granted = await requestNotificationPermission();

        if (!granted) {
          setNotifEnabled(false);

          await setNotificationEnabled(false);

          Alert.alert(
            'Notifications disabled',
            'Enable notifications in your device settings to receive your daily reminder.'
          );

          return;
        }

        const safeTime = normalizeNotificationTime(notifTime);

        setNotifTime(safeTime);

        await rescheduleDailyReminder(safeTime);
      } else {
        await cancelDailyReminder();
      }
    } catch (error) {
      console.warn(
        'Failed to update notification setting:',
        error
      );

      Alert.alert(
        'Something went wrong',
        'Unable to update the notification setting. Please try again.'
      );
    }
  };

  /**
   * App version
   */
  const appVersion =
    Constants.expoConfig?.version ||
    Constants.manifest?.version ||
    '1.0.0';

  /**
   * Safe notification time for display.
   */
  const displayedNotifTime = safeFormatTime(notifTime);

  return (
    <SafeAreaView
      style={[
        styles.safe,
        {
          backgroundColor: colors.background,
        },
      ]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text
          style={[
            styles.headerTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Settings
        </Text>

        {/* Notifications */}
        <SectionCard
          title="NOTIFICATIONS"
          colors={colors}
        >
          <SettingRow
            icon="notifications-outline"
            label="Daily Reminder"
            switchValue={notifEnabled}
            onSwitchChange={handleToggleNotifications}
          />

          <View
            style={[
              styles.divider,
              {
                backgroundColor: colors.border,
              },
            ]}
          />

          <SettingRow
            icon="time-outline"
            label="Reminder Time"
            value={displayedNotifTime}
            onPress={() =>
              router.push('/notification-settings')
            }
          />

          <View
            style={[
              styles.divider,
              {
                backgroundColor: colors.border,
              },
            ]}
          />

          <SettingRow
            icon="paper-plane-outline"
            label="Test Notification"
            onPress={() =>
              router.push('/notification-settings')
            }
          />
        </SectionCard>

        {/* Daily Wallpaper */}
        <SectionCard title="DAILY WALLPAPER" colors={colors}>
          <SettingRow
            icon="phone-portrait-outline"
            label="Daily Wallpaper"
            switchValue={!!wallpaperInfo?.enabled}
            onSwitchChange={handleToggleWallpaper}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <SettingRow
            icon="pulse-outline"
            label="Current Status"
            value={wallpaperInfo?.enabled ? 'Active' : 'Not enabled'}
          />

          {wallpaperInfo?.enabled ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <SettingRow
                icon="time-outline"
                label="Next Change"
                value={formatNextChange(wallpaperInfo?.nextAt)}
              />
            </>
          ) : null}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <SettingRow
            icon="eye-outline"
            label="Preview Today's Wallpaper"
            onPress={() => router.push('/wallpaper-preview')}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <SettingRow
            icon="sync-outline"
            label={wallpaperBusy ? 'Applying…' : 'Apply Now'}
            onPress={wallpaperBusy ? undefined : handleApplyWallpaperNow}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <SettingRow
            icon="refresh-outline"
            label="Reset Wallpaper Settings"
            onPress={wallpaperBusy ? undefined : handleResetWallpaper}
            danger
          />
        </SectionCard>

        {/* Appearance */}
        <SectionCard
          title="APPEARANCE"
          colors={colors}
        >
          <Text
            style={[
              styles.fieldLabel,
              {
                color: colors.text,
              },
            ]}
          >
            Theme
          </Text>

          <OptionPicker
            options={THEME_OPTIONS}
            selected={themePreference}
            onSelect={setThemePreference}
            colors={colors}
          />
        </SectionCard>

        {/* Reading */}
        <SectionCard
          title="READING"
          colors={colors}
        >
          <Text
            style={[
              styles.fieldLabel,
              {
                color: colors.text,
              },
            ]}
          >
            Arabic Font Size
          </Text>

          <OptionPicker
            options={SIZE_OPTIONS}
            selected={arabicFontSize}
            onSelect={setArabicFontSize}
            colors={colors}
          />

          <View
            style={{
              height: SPACING.md,
            }}
          />

          <Text
            style={[
              styles.fieldLabel,
              {
                color: colors.text,
              },
            ]}
          >
            Translation Font Size
          </Text>

          <OptionPicker
            options={SIZE_OPTIONS}
            selected={translationFontSize}
            onSelect={setTranslationFontSize}
            colors={colors}
          />
        </SectionCard>

        {/* Other */}
        <SectionCard
          title="OTHER"
          colors={colors}
        >
          <SettingRow
            icon="information-circle-outline"
            label={`About ${APP_NAME}`}
            onPress={() => router.push('/about')}
          />

          <View
            style={[
              styles.divider,
              {
                backgroundColor: colors.border,
              },
            ]}
          />

          <SettingRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => router.push('/privacy')}
          />

          <View
            style={[
              styles.divider,
              {
                backgroundColor: colors.border,
              },
            ]}
          />

          <SettingRow
            icon="phone-portrait-outline"
            label="App Version"
            value={appVersion}
          />
        </SectionCard>

        {/* Creator Credit */}
        <View style={styles.creatorContainer}>
          <View
            style={[
              styles.creatorLine,
              {
                backgroundColor: colors.border,
              },
            ]}
          />

          <Text
            style={[
              styles.createdByText,
              {
                color: colors.muted,
              },
            ]}
          >
            Created by
          </Text>

          <Text
            style={[
              styles.creatorName,
              {
                color: colors.primary,
              },
            ]}
          >
            Mudabir Kowsar
          </Text>

          <Text
            style={[
              styles.creatorSubtext,
              {
                color: colors.muted,
              },
            ]}
          >
            Made with care
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: SPACING.lg,
  },

  section: {
    marginBottom: SPACING.lg,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },

  sectionCard: {
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },

  optionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: SPACING.md,
    flexWrap: 'wrap',
  },

  optionChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
  },

  optionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Creator credit
  creatorContainer: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },

  creatorLine: {
    width: 60,
    height: StyleSheet.hairlineWidth,
    marginBottom: SPACING.md,
  },

  createdByText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  creatorName: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.2,
  },

  creatorSubtext: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.8,
  },
});
