// services/storageService.js
//
// All AsyncStorage reads/writes go through this file so keys are never
// duplicated or typo'd elsewhere in the app.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, DEFAULT_NOTIFICATION_TIME } from '../constants/config';

async function safeGet(key, fallback = null) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('storageService: failed to read', key, e);
    return fallback;
  }
}

async function safeSet(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('storageService: failed to write', key, e);
    return false;
  }
}

// ---- Onboarding ----
export async function getOnboardingCompleted() {
  return safeGet(STORAGE_KEYS.ONBOARDING_COMPLETED, false);
}
export async function setOnboardingCompleted(value) {
  return safeSet(STORAGE_KEYS.ONBOARDING_COMPLETED, value);
}

// ---- Notification prefs ----
export async function getNotificationEnabled() {
  return safeGet(STORAGE_KEYS.NOTIFICATION_ENABLED, false);
}
export async function setNotificationEnabled(value) {
  return safeSet(STORAGE_KEYS.NOTIFICATION_ENABLED, value);
}
export async function getNotificationTime() {
  return safeGet(STORAGE_KEYS.NOTIFICATION_TIME, DEFAULT_NOTIFICATION_TIME);
}
export async function setNotificationTime(time) {
  return safeSet(STORAGE_KEYS.NOTIFICATION_TIME, time);
}
export async function getScheduledNotificationId() {
  return safeGet(STORAGE_KEYS.SCHEDULED_NOTIFICATION_ID, null);
}
export async function setScheduledNotificationId(id) {
  return safeSet(STORAGE_KEYS.SCHEDULED_NOTIFICATION_ID, id);
}

// ---- Theme / language ----
export async function getThemePreference() {
  return safeGet(STORAGE_KEYS.THEME_PREFERENCE, 'system');
}
export async function setThemePreference(value) {
  return safeSet(STORAGE_KEYS.THEME_PREFERENCE, value);
}
export async function getLanguagePreference() {
  return safeGet(STORAGE_KEYS.LANGUAGE_PREFERENCE, 'en');
}
export async function setLanguagePreference(value) {
  return safeSet(STORAGE_KEYS.LANGUAGE_PREFERENCE, value);
}

// ---- Font sizes ----
export async function getArabicFontSize() {
  return safeGet(STORAGE_KEYS.ARABIC_FONT_SIZE, 'medium');
}
export async function setArabicFontSize(value) {
  return safeSet(STORAGE_KEYS.ARABIC_FONT_SIZE, value);
}
export async function getTranslationFontSize() {
  return safeGet(STORAGE_KEYS.TRANSLATION_FONT_SIZE, 'medium');
}
export async function setTranslationFontSize(value) {
  return safeSet(STORAGE_KEYS.TRANSLATION_FONT_SIZE, value);
}

// ---- Favorites ----
export async function getFavorites() {
  const ayahs = await safeGet(STORAGE_KEYS.FAVORITE_AYAHS, []);
  const hadithsFav = await safeGet(STORAGE_KEYS.FAVORITE_HADITHS, []);
  return { ayahs, hadiths: hadithsFav };
}

export async function saveFavoriteAyah(id) {
  const ayahs = await safeGet(STORAGE_KEYS.FAVORITE_AYAHS, []);
  if (!ayahs.includes(id)) ayahs.push(id);
  return safeSet(STORAGE_KEYS.FAVORITE_AYAHS, ayahs);
}

export async function removeFavoriteAyah(id) {
  const ayahs = await safeGet(STORAGE_KEYS.FAVORITE_AYAHS, []);
  return safeSet(
    STORAGE_KEYS.FAVORITE_AYAHS,
    ayahs.filter((a) => a !== id)
  );
}

export async function saveFavoriteHadith(id) {
  const list = await safeGet(STORAGE_KEYS.FAVORITE_HADITHS, []);
  if (!list.includes(id)) list.push(id);
  return safeSet(STORAGE_KEYS.FAVORITE_HADITHS, list);
}

export async function removeFavoriteHadith(id) {
  const list = await safeGet(STORAGE_KEYS.FAVORITE_HADITHS, []);
  return safeSet(
    STORAGE_KEYS.FAVORITE_HADITHS,
    list.filter((h) => h !== id)
  );
}

export async function isAyahFavorite(id) {
  const ayahs = await safeGet(STORAGE_KEYS.FAVORITE_AYAHS, []);
  return ayahs.includes(id);
}

export async function isHadithFavorite(id) {
  const list = await safeGet(STORAGE_KEYS.FAVORITE_HADITHS, []);
  return list.includes(id);
}

// ---- Daily Wallpaper (local mirror of native state — see wallpaperService.js) ----
export async function getWallpaperEnabled() {
  return safeGet(STORAGE_KEYS.WALLPAPER_ENABLED, false);
}
export async function setWallpaperEnabled(value) {
  return safeSet(STORAGE_KEYS.WALLPAPER_ENABLED, value);
}
export async function getWallpaperSetupComplete() {
  return safeGet(STORAGE_KEYS.WALLPAPER_SETUP_COMPLETE, false);
}
export async function setWallpaperSetupComplete(value) {
  return safeSet(STORAGE_KEYS.WALLPAPER_SETUP_COMPLETE, value);
}
export async function getWallpaperLastAppliedAt() {
  return safeGet(STORAGE_KEYS.WALLPAPER_LAST_APPLIED_AT, null);
}
export async function setWallpaperLastAppliedAt(isoString) {
  return safeSet(STORAGE_KEYS.WALLPAPER_LAST_APPLIED_AT, isoString);
}
export async function getWallpaperNextAt() {
  return safeGet(STORAGE_KEYS.WALLPAPER_NEXT_AT, null);
}
export async function setWallpaperNextAt(isoString) {
  return safeSet(STORAGE_KEYS.WALLPAPER_NEXT_AT, isoString);
}
export async function getWallpaperCurrentId() {
  return safeGet(STORAGE_KEYS.WALLPAPER_CURRENT_ID, null);
}
export async function setWallpaperCurrentId(id) {
  return safeSet(STORAGE_KEYS.WALLPAPER_CURRENT_ID, id);
}
export async function getWallpaperCurrentColor() {
  return safeGet(STORAGE_KEYS.WALLPAPER_CURRENT_COLOR, null);
}
export async function setWallpaperCurrentColor(hex) {
  return safeSet(STORAGE_KEYS.WALLPAPER_CURRENT_COLOR, hex);
}
export async function getWallpaperLastError() {
  return safeGet(STORAGE_KEYS.WALLPAPER_LAST_ERROR, null);
}
export async function setWallpaperLastError(error) {
  return safeSet(STORAGE_KEYS.WALLPAPER_LAST_ERROR, error);
}

export default {
  getOnboardingCompleted,
  setOnboardingCompleted,
  getNotificationEnabled,
  setNotificationEnabled,
  getNotificationTime,
  setNotificationTime,
  getScheduledNotificationId,
  setScheduledNotificationId,
  getThemePreference,
  setThemePreference,
  getLanguagePreference,
  setLanguagePreference,
  getArabicFontSize,
  setArabicFontSize,
  getTranslationFontSize,
  setTranslationFontSize,
  getFavorites,
  saveFavoriteAyah,
  removeFavoriteAyah,
  saveFavoriteHadith,
  removeFavoriteHadith,
  isAyahFavorite,
  isHadithFavorite,
  getWallpaperEnabled,
  setWallpaperEnabled,
  getWallpaperSetupComplete,
  setWallpaperSetupComplete,
  getWallpaperLastAppliedAt,
  setWallpaperLastAppliedAt,
  getWallpaperNextAt,
  setWallpaperNextAt,
  getWallpaperCurrentId,
  setWallpaperCurrentId,
  getWallpaperCurrentColor,
  setWallpaperCurrentColor,
  getWallpaperLastError,
  setWallpaperLastError,
};
