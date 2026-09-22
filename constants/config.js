// constants/config.js
// General app configuration and AsyncStorage key names, centralized so
// no string keys are duplicated across services/screens.

export const APP_NAME = 'NoorDaily';
export const APP_TAGLINE = "One Ayah. One Hadith. Every Day.";

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'onboardingCompleted',
  NOTIFICATION_ENABLED: 'notificationEnabled',
  NOTIFICATION_TIME: 'notificationTime',
  THEME_PREFERENCE: 'themePreference',
  LANGUAGE_PREFERENCE: 'languagePreference',
  ARABIC_FONT_SIZE: 'noordaily_arabic_font_size',
  TRANSLATION_FONT_SIZE: 'noordaily_translation_font_size',
  FAVORITE_AYAHS: 'noordaily_favorite_ayahs',
  FAVORITE_HADITHS: 'noordaily_favorite_hadiths',
  SCHEDULED_NOTIFICATION_ID: 'noordaily_scheduled_notification_id',

  // Daily Wallpaper — mirrors the native (SharedPreferences) state so the
  // JS UI can render instantly without an async bridge call on every
  // screen focus. The native module remains the source of truth for
  // anything that must survive the JS layer being dead (see
  // services/wallpaperService.js).
  WALLPAPER_ENABLED: 'noordaily_wallpaper_enabled',
  WALLPAPER_SETUP_COMPLETE: 'noordaily_wallpaper_setup_complete',
  WALLPAPER_LAST_APPLIED_AT: 'noordaily_wallpaper_last_applied_at',
  WALLPAPER_NEXT_AT: 'noordaily_wallpaper_next_at',
  WALLPAPER_CURRENT_ID: 'noordaily_wallpaper_current_id',
  WALLPAPER_CURRENT_COLOR: 'noordaily_wallpaper_current_color',
  WALLPAPER_LAST_ERROR: 'noordaily_wallpaper_last_error',
};

export const NOTIFICATION_CHANNEL_ID = 'noor-daily';

export const DEFAULT_NOTIFICATION_TIME = { hour: 8, minute: 0 };

// How many upcoming days of deterministic content get pre-computed and
// handed to the native side in one go (see wallpaperService.buildContentCache).
// This is what lets the Android WorkManager worker keep applying a new,
// correct wallpaper every day even if NoorDaily is never reopened —
// the worker never needs a live JS bridge to know "today's" content.
export const WALLPAPER_CACHE_WINDOW_DAYS = 400;

// Approx. hours between automatic wallpaper changes. WorkManager cannot
// promise exact timing, only "about every N hours" — see WallpaperScheduler.kt.
export const WALLPAPER_INTERVAL_HOURS = 24;

export default {
  APP_NAME,
  APP_TAGLINE,
  STORAGE_KEYS,
  NOTIFICATION_CHANNEL_ID,
  DEFAULT_NOTIFICATION_TIME,
  WALLPAPER_CACHE_WINDOW_DAYS,
  WALLPAPER_INTERVAL_HOURS,
};
