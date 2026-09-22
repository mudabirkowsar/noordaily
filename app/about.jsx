// app/about.jsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useApp } from '../context/AppContext';
import { SPACING } from '../constants/theme';
import ScreenHeader from '../components/ScreenHeader';
import Logo from '../components/Logo';
import { APP_NAME, APP_TAGLINE } from '../constants/config';

export default function AboutScreen() {
  const { colors } = useApp();
  const appVersion =
    Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="About" />

        <View style={styles.logoBlock}>
          <Logo size="large" showTagline />
        </View>

        <Text style={[styles.paragraph, { color: colors.text }]}>
          {APP_NAME} gives you one small moment each day to read, reflect,
          and remember — a single Ayah from the Qur'an and a single Hadith,
          delivered to your phone at a time you choose.
        </Text>
        <Text style={[styles.paragraph, { color: colors.muted }]}>
          {APP_TAGLINE}
        </Text>
        <Text style={[styles.paragraph, { color: colors.muted }]}>
          {APP_NAME} works fully offline, requires no account, and never
          asks for a login. Your saved favorites and settings stay on your
          device.
        </Text>

        <Text style={[styles.version, { color: colors.muted }]}>
          Version {appVersion}
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
  logoBlock: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  version: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});
