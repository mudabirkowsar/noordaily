// services/sharingService.js
//
// Builds share text for an Ayah, a Hadith, or the full daily reminder, and
// hands it off via the OS share sheet. expo-sharing works with files, so for
// plain text we fall back to React Native's built-in Share API, which is
// the standard approach for sharing text content.

import { Share } from 'react-native';
import { APP_NAME, APP_TAGLINE } from '../constants/config';

const DIVIDER = '────────────';

export function buildAyahShareText(ayah) {
  if (!ayah) return '';
  return [
    `${APP_NAME.toUpperCase()}`,
    '',
    '📖 AYAH OF THE DAY',
    '',
    ayah.arabic,
    '',
    ayah.translation,
    '',
    `Qur'an ${ayah.surahName} • ${ayah.surahNumber}:${ayah.ayahNumber}`,
    '',
    APP_NAME,
  ].join('\n');
}

export function buildHadithShareText(hadith) {
  if (!hadith) return '';
  return [
    `${APP_NAME.toUpperCase()}`,
    '',
    '🕌 HADITH OF THE DAY',
    '',
    hadith.arabic && hadith.arabic.trim() ? `${hadith.arabic}\n` : '',
    hadith.translation,
    '',
    `${hadith.collection}${hadith.hadithNumber ? ` • No. ${hadith.hadithNumber}` : ''}`,
    '',
    APP_NAME,
  ]
    .filter((line) => line !== '')
    .join('\n');
}

export function buildDailyShareText({ ayah, hadith }) {
  return [
    `${APP_NAME.toUpperCase()}`,
    '',
    APP_TAGLINE,
    '',
    '📖 AYAH OF THE DAY',
    '',
    ayah?.arabic || '',
    '',
    ayah?.translation || '',
    '',
    ayah ? `Qur'an ${ayah.surahName} ${ayah.surahNumber}:${ayah.ayahNumber}` : '',
    '',
    DIVIDER,
    '',
    '🕌 HADITH OF THE DAY',
    '',
    hadith?.translation || '',
    '',
    hadith?.collection || '',
    '',
    DIVIDER,
    '',
    APP_NAME,
  ].join('\n');
}

/**
 * Opens the native share sheet with the given text.
 */
export async function shareText(message) {
  try {
    await Share.share({ message });
    return true;
  } catch (e) {
    console.warn('sharingService: share failed', e);
    return false;
  }
}

export async function shareAyah(ayah) {
  return shareText(buildAyahShareText(ayah));
}

export async function shareHadith(hadith) {
  return shareText(buildHadithShareText(hadith));
}

export async function shareDailyContent(dailyContent) {
  return shareText(buildDailyShareText(dailyContent));
}

export default {
  buildAyahShareText,
  buildHadithShareText,
  buildDailyShareText,
  shareText,
  shareAyah,
  shareHadith,
  shareDailyContent,
};
