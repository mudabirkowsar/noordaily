// services/wallpaperNative.js
//
// Thin, defensive wrapper around the native `NoorWallpaperModule` (see
// android/.../wallpaper/WallpaperModule.kt). Every method degrades to a
// safe, clearly-labeled "unsupported" result instead of throwing when:
//   - running on iOS (automatic lock-screen wallpaper is Android-only), or
//   - running in Expo Go / a JS bundle built before the native module was
//     compiled in (dev convenience — the app must not crash).
//
// This is the ONLY file that should ever touch NativeModules for the
// wallpaper feature — everything else goes through wallpaperService.js.

import { NativeModules, Platform } from 'react-native';

const { NoorWallpaperModule } = NativeModules;

export const isNativeWallpaperAvailable = Platform.OS === 'android' && !!NoorWallpaperModule;

function unsupportedResult(extra = {}) {
  return {
    success: false,
    errorCode: Platform.OS === 'ios' ? 'IOS_UNSUPPORTED' : 'NATIVE_MODULE_MISSING',
    message:
      Platform.OS === 'ios'
        ? 'Automatic lock-screen wallpaper updates are an Android-only feature.'
        : 'The native wallpaper module is not available in this build. Run a development/production build (not Expo Go) after adding the native Android module.',
    ...extra,
  };
}

/**
 * Sends the pre-computed daily content cache (JSON string, see
 * wallpaperService.buildContentCache) to the native side so the
 * WorkManager worker can keep applying correct wallpapers even when the
 * JS bridge is completely dead (app closed / removed from recents).
 */
export async function syncContentCache(jsonString) {
  if (!isNativeWallpaperAvailable) return unsupportedResult();
  try {
    return await NoorWallpaperModule.syncContentCache(jsonString);
  } catch (e) {
    return unsupportedResult({ message: e?.message || String(e) });
  }
}

/**
 * Verifies the device/OS can actually do what we need (WallpaperManager
 * present, lock-screen targeting supported) BEFORE claiming success in
 * the UI. Never fake this.
 */
export async function checkWallpaperSetup() {
  if (!isNativeWallpaperAvailable) return unsupportedResult();
  try {
    return await NoorWallpaperModule.checkWallpaperSetup();
  } catch (e) {
    return unsupportedResult({ message: e?.message || String(e) });
  }
}

/**
 * Generates (native Canvas/Bitmap) and applies today's wallpaper to the
 * lock screen right now, synchronously from the JS caller's perspective.
 * Used for first-time setup and the "Apply Now" button.
 */
export async function generateAndApplyNow(force = false) {
  if (!isNativeWallpaperAvailable) return unsupportedResult();
  try {
    return await NoorWallpaperModule.generateAndApplyNow(!!force);
  } catch (e) {
    return unsupportedResult({ message: e?.message || String(e) });
  }
}

/**
 * Turns on the WorkManager periodic schedule (~every 24h) and persists
 * enabled=true natively so a reboot / app-kill can restore it.
 */
export async function enableAutomation() {
  if (!isNativeWallpaperAvailable) return unsupportedResult();
  try {
    return await NoorWallpaperModule.enableAutomation();
  } catch (e) {
    return unsupportedResult({ message: e?.message || String(e) });
  }
}

/** Cancels the WorkManager schedule and persists enabled=false. */
export async function disableAutomation() {
  if (!isNativeWallpaperAvailable) return unsupportedResult();
  try {
    return await NoorWallpaperModule.disableAutomation();
  } catch (e) {
    return unsupportedResult({ message: e?.message || String(e) });
  }
}

/** Reads native status: enabled, lastAppliedAt, nextAt, current wallpaper info, last error. */
export async function getStatus() {
  if (!isNativeWallpaperAvailable) {
    return { enabled: false, lockScreenSupported: false, ...unsupportedResult() };
  }
  try {
    return await NoorWallpaperModule.getStatus();
  } catch (e) {
    return { enabled: false, lockScreenSupported: false, ...unsupportedResult({ message: e?.message || String(e) }) };
  }
}

/** Returns up to the last 30 applied wallpapers (id, date, color, appliedAt, status). */
export async function getHistory() {
  if (!isNativeWallpaperAvailable) return [];
  try {
    const result = await NoorWallpaperModule.getHistory();
    return Array.isArray(result) ? result : [];
  } catch (e) {
    return [];
  }
}

/** Clears all native wallpaper state/cache/history (Settings → Reset). */
export async function resetWallpaperState() {
  if (!isNativeWallpaperAvailable) return unsupportedResult();
  try {
    return await NoorWallpaperModule.resetWallpaperState();
  } catch (e) {
    return unsupportedResult({ message: e?.message || String(e) });
  }
}

export default {
  isNativeWallpaperAvailable,
  syncContentCache,
  checkWallpaperSetup,
  generateAndApplyNow,
  enableAutomation,
  disableAutomation,
  getStatus,
  getHistory,
  resetWallpaperState,
};
