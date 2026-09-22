// app/privacy.jsx
import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { SPACING } from '../constants/theme';
import ScreenHeader from '../components/ScreenHeader';
import { APP_NAME } from '../constants/config';

export default function PrivacyScreen() {
  const { colors } = useApp();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Privacy Policy" />

        <Text style={[styles.heading, { color: colors.text }]}>No account required</Text>
        <Text style={[styles.paragraph, { color: colors.muted }]}>
          {APP_NAME} does not require you to sign up, log in, or provide any
          personal information to use the app.
        </Text>

        <Text style={[styles.heading, { color: colors.text }]}>What stays on your device</Text>
        <Text style={[styles.paragraph, { color: colors.muted }]}>
          Your onboarding status, notification preferences, theme choice,
          font size preferences, and favorites are stored locally on your
          device using AsyncStorage. This data is not transmitted anywhere
          unless you explicitly enable an optional cloud sync feature in the
          future.
        </Text>

        <Text style={[styles.heading, { color: colors.text }]}>Notifications</Text>
        <Text style={[styles.paragraph, { color: colors.muted }]}>
          {APP_NAME} schedules a local daily notification on your device.
          This does not require any data to leave your device.
        </Text>

        <Text style={[styles.heading, { color: colors.text }]}>Optional sync</Text>
        <Text style={[styles.paragraph, { color: colors.muted }]}>
          {APP_NAME} may optionally connect to a content service to keep the
          Qur'an and Hadith content up to date. This does not involve
          account creation or personal data collection.
        </Text>

        <Text style={[styles.paragraph, { color: colors.muted, marginTop: SPACING.lg }]}>
          This is a placeholder privacy policy for development purposes.
          Replace it with your finalized policy before publishing this app.
        </Text>
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
  heading: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
  },
});
