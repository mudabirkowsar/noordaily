// services/wallpaperService.js
//
// Orchestrates the Daily Islamic Lock Screen Wallpaper feature. This file
// owns:
//   - turning existing deterministic daily content (dailyContentService)
//     into wallpaper content + a solid color for any given date
//   - building the multi-day content cache that gets handed to the
//     native Android side (WorkManager cannot rely on the JS bridge)
//   - enabling/disabling the native WorkManager schedule
//   - reading back status/history for the UI
//
// IMPORTANT: this file does NOT draw pixels. Per the architecture chosen
// for this feature, the actual wallpaper bitmap (solid color + rendered
// Quran/Hadith text, dynamically sized, safe-area aware) is generated
// natively in Kotlin (see WallpaperGenerator.kt) so it keeps working even
// when this JS code — and the whole React Native bridge — is not running
// (app closed, killed, or the device just rebooted). The in-app preview
// screen renders the same content with React Native views
// (components/WallpaperPreviewCanvas.jsx) purely for the user to see what
// today's wallpaper looks like before/after it's applied.

import { toDateKey, fromDateKey, getDayOfYearIndex } from '../utils/dateUtils';
import { getDailyAyah, getDailyHadith } from './dailyContentService';
import { getColorForDayIndex } from '../constants/wallpaperColors';
import { WALLPAPER_CACHE_WINDOW_DAYS, WALLPAPER_INTERVAL_HOURS } from '../constants/config';
import * as native from './wallpaperNative';
import {
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
  setWallpaperLastError,
} from './storageService';

/**
 * Builds the full wallpaper content (ayah + hadith + color) for one date.
 * Deterministic: reusing dailyContentService means "today" always
 * resolves to the exact same content no matter how many times the app is
 * reopened during the same day (requirement: no randomness on app open).
 * @param {Date} date
 */
export function getWallpaperContentForDate(date) {
  const dayIndex = getDayOfYearIndex(date);
  const ayah = getDailyAyah(date);
  const hadith = getDailyHadith(date);
  const color = getColorForDayIndex(dayIndex);

  if (!ayah || !hadith) {
    return null;
  }

  return {
    id: `wallpaper_${toDateKey(date)}`,
    date: toDateKey(date),
    ayahId: ayah.id,
    ayah: {
      arabic: ayah.arabic || '',
      translation: ayah.translation,
      surahName: ayah.surahName,
      surahNumber: ayah.surahNumber,
      ayahNumber: ayah.ayahNumber,
      reference: `Quran ${ayah.surahNumber}:${ayah.ayahNumber} — ${ayah.surahName}`,
    },
    hadithId: hadith.id,
    hadith: {
      arabic: hadith.arabic || '',
      translation: hadith.translation,
      collection: hadith.collection,
      hadithNumber: hadith.hadithNumber,
      grade: hadith.grade || null,
      reference: `${hadith.collection}${hadith.hadithNumber ? ' — ' + hadith.hadithNumber : ''}`,
    },
    backgroundColor: color.hex,
    textStyle: color.text, // 'light' | 'dark' — which text palette to use on this background
  };
}

/**
 * Content for "today" in the device's local time zone.
 */
export function getTodayWallpaperContent() {
  return getWallpaperContentForDate(new Date());
}

/**
 * Pre-computes wallpaper content for a rolling window of upcoming days
 * (default ~400, i.e. more than a full year) and returns it as a plain
 * array ready to be JSON-stringified and handed to the native side. This
 * is the mechanism that lets the native WorkManager worker keep applying
 * the *correct, non-random, non-repeating-in-a-loop* wallpaper every day
 * without ever needing a live JS bridge — see section 30 of the spec.
 * @param {number} windowDays
 */
export function buildContentCache(windowDays = WALLPAPER_CACHE_WINDOW_DAYS) {
  const entries = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < windowDays; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const content = getWallpaperContentForDate(d);
    if (content) entries.push(content);
  }

  return {
    generatedAt: new Date().toISOString(),
    intervalHours: WALLPAPER_INTERVAL_HOURS,
    entries,
  };
}

/**
 * Pushes a freshly-built content cache to the native side. Call this on
 * every app open (cheap — pure JS, no I/O beyond one bridge call) so the
 * native worker's window of known days keeps rolling forward. Even if the
 * user never reopens the app for a long stretch, ~400 days of lead time
 * is baked in from the last time it *was* opened.
 */
export async function syncNativeContentCache() {
  const cache = buildContentCache();
  return native.syncContentCache(JSON.stringify(cache));
}

/**
 * Step 1 of enabling automation: confirms Android will actually let us
 * target the lock screen, without pretending success.
 */
export async function checkWallpaperSetup() {
  return native.checkWallpaperSetup();
}

/**
 * Generates today's wallpaper content (JS side, for the preview/UI) —
 * does not touch the lock screen. Matches the `generateDailyWallpaper()`
 * responsibility from the spec; actual pixel generation happens natively
 * as part of applyDailyWallpaper()/enableWallpaperAutomation().
 */
export function generateDailyWallpaper(date = new Date()) {
  return getWallpaperContentForDate(date);
}

/**
 * Applies today's (or, if `force`, a freshly regenerated) wallpaper to
 * the Android lock screen right now. Used by first-time setup and the
 * "Apply Now" settings action. Syncs the content cache first so the
 * native generator always has today's entry available.
 * @param {boolean} force re-render/apply even if today's wallpaper was
 *   already successfully applied (avoids double-applying on a normal call)
 */
export async function applyDailyWallpaper(force = false) {
  await syncNativeContentCache();
  const result = await native.generateAndApplyNow(force);

  if (result?.success) {
    await setWallpaperCurrentId(result.id || `wallpaper_${toDateKey(new Date())}`);
    await setWallpaperCurrentColor(result.backgroundColor || null);
    await setWallpaperLastAppliedAt(result.appliedAt || new Date().toISOString());
    await setWallpaperNextAt(result.nextAt || null);
    await setWallpaperLastError(null);
  } else if (result) {
    await setWallpaperLastError(result.errorCode || 'UNKNOWN_ERROR');
  }

  return result;
}

/**
 * Full first-time enable flow:
 *  1. verify Android setup (no faked success),
 *  2. sync the content cache,
 *  3. generate + apply the first wallpaper immediately,
 *  4. start the ~24h WorkManager schedule,
 *  5. persist enabled=true (local mirror + native).
 */
export async function enableWallpaperAutomation() {
  const setupCheck = await checkWallpaperSetup();
  if (!setupCheck?.success) {
    await setWallpaperEnabled(false);
    await setWallpaperLastError(setupCheck?.errorCode || 'SETUP_REQUIRED');
    return { success: false, stage: 'setup', ...setupCheck };
  }

  await syncNativeContentCache();

  const applyResult = await native.generateAndApplyNow(true);
  if (!applyResult?.success) {
    await setWallpaperEnabled(false);
    await setWallpaperLastError(applyResult?.errorCode || 'FIRST_APPLY_FAILED');
    return { success: false, stage: 'apply', ...applyResult };
  }

  const scheduleResult = await native.enableAutomation();
  if (!scheduleResult?.success) {
    await setWallpaperEnabled(false);
    await setWallpaperLastError(scheduleResult?.errorCode || 'SCHEDULE_FAILED');
    return { success: false, stage: 'schedule', ...scheduleResult };
  }

  await setWallpaperEnabled(true);
  await setWallpaperSetupComplete(true);
  await setWallpaperCurrentId(applyResult.id || null);
  await setWallpaperCurrentColor(applyResult.backgroundColor || null);
  await setWallpaperLastAppliedAt(applyResult.appliedAt || new Date().toISOString());
  await setWallpaperNextAt(scheduleResult.nextAt || applyResult.nextAt || null);
  await setWallpaperLastError(null);

  return { success: true, stage: 'done', ...applyResult, nextAt: scheduleResult.nextAt };
}

/**
 * Disables automation: cancels the WorkManager schedule and persists
 * enabled=false. Does not remove the already-applied wallpaper from the
 * lock screen (the user's lock screen keeps whatever it last showed).
 */
export async function disableWallpaperAutomation() {
  const result = await native.disableAutomation();
  await setWallpaperEnabled(false);
  return result;
}

/**
 * Clears all wallpaper state/cache/history natively and locally. Used by
 * Settings → "Reset Wallpaper Settings".
 */
export async function resetWallpaperAutomation() {
  await native.disableAutomation();
  const result = await native.resetWallpaperState();
  await setWallpaperEnabled(false);
  await setWallpaperSetupComplete(false);
  await setWallpaperCurrentId(null);
  await setWallpaperCurrentColor(null);
  await setWallpaperLastAppliedAt(null);
  await setWallpaperNextAt(null);
  await setWallpaperLastError(null);
  return result;
}

/**
 * Whether daily wallpaper automation is currently enabled. Reads the
 * native status when available (source of truth — it's what actually
 * drives WorkManager) and falls back to the local mirror otherwise, so
 * the UI still renders something sensible on iOS / Expo Go.
 */
export async function isWallpaperAutomationEnabled() {
  if (native.isNativeWallpaperAvailable) {
    const status = await native.getStatus();
    return !!status?.enabled;
  }
  return getWallpaperEnabled();
}

/**
 * Combined status object for Settings/Home: enabled, current wallpaper,
 * last/next change times, and whether lock-screen-only targeting is
 * supported on this device.
 */
export async function getCurrentWallpaperInfo() {
  if (native.isNativeWallpaperAvailable) {
    const status = await native.getStatus();
    return {
      enabled: !!status?.enabled,
      setupComplete: !!status?.enabled,
      lockScreenSupported: !!status?.lockScreenSupported,
      currentWallpaperId: status?.currentWallpaperId || null,
      backgroundColor: status?.backgroundColor || null,
      lastAppliedAt: status?.lastAppliedAt || null,
      nextAt: status?.nextAt || null,
      lastError: status?.lastError || null,
    };
  }

  const [enabled, setupComplete, id, color, lastAppliedAt, nextAt] = await Promise.all([
    getWallpaperEnabled(),
    getWallpaperSetupComplete(),
    getWallpaperCurrentId(),
    getWallpaperCurrentColor(),
    getWallpaperLastAppliedAt(),
    getWallpaperNextAt(),
  ]);

  return {
    enabled: !!enabled,
    setupComplete: !!setupComplete,
    lockScreenSupported: false,
    currentWallpaperId: id,
    backgroundColor: color,
    lastAppliedAt,
    nextAt,
    lastError: null,
  };
}

/** Just the last-applied timestamp, for lightweight "Next change" displays. */
export async function getLastWallpaperChange() {
  const info = await getCurrentWallpaperInfo();
  return info.lastAppliedAt;
}

/** Up to the last 30 applied wallpapers (id, date, color, appliedAt, status). */
export async function getWallpaperHistory() {
  return native.getHistory();
}

/**
 * Human-friendly "next change" estimate for display, e.g. "in about 14 hours".
 */
export function formatNextChange(nextAtIso) {
  if (!nextAtIso) return 'Not scheduled';
  const next = new Date(nextAtIso);
  if (Number.isNaN(next.getTime())) return 'Not scheduled';
  const diffMs = next.getTime() - Date.now();
  if (diffMs <= 0) return 'Any moment now';
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'In under an hour';
  if (hours === 1) return 'In about 1 hour';
  return `In about ${hours} hours`;
}

export default {
  getWallpaperContentForDate,
  getTodayWallpaperContent,
  buildContentCache,
  syncNativeContentCache,
  checkWallpaperSetup,
  generateDailyWallpaper,
  applyDailyWallpaper,
  enableWallpaperAutomation,
  disableWallpaperAutomation,
  resetWallpaperAutomation,
  isWallpaperAutomationEnabled,
  getCurrentWallpaperInfo,
  getLastWallpaperChange,
  getWallpaperHistory,
  formatNextChange,
};
