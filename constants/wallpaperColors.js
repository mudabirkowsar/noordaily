// constants/wallpaperColors.js
//
// Centralized solid-color palette for the Daily Islamic Lock Screen
// Wallpaper feature. Every wallpaper background is ONE flat solid color
// from this list — no gradients, images, patterns or textures anywhere
// in the wallpaper itself. Text color is derived automatically from each
// background's contrast so it is always readable.
//
// The same (date -> color) mapping used here is also mirrored on the
// Android native side (see WallpaperContentStore.kt) so the color chosen
// for "today" is identical whether it is computed by JS (for the in-app
// preview) or by the native WorkManager worker (for the actual lock
// screen apply) — both derive it the same deterministic way from the
// calendar day-of-year, and the concrete value is written into the daily
// content cache JSON so the native side never has to duplicate this file.

// Dark backgrounds -> light/off-white text.
// Light backgrounds -> dark text.
export const WALLPAPER_COLORS = [
  { hex: '#0B3D2E', text: 'light', name: 'Deep Emerald' },
  { hex: '#14532D', text: 'light', name: 'Forest Green' },
  { hex: '#064E3B', text: 'light', name: 'Deep Teal Green' },
  { hex: '#1E293B', text: 'light', name: 'Slate Night' },
  { hex: '#172554', text: 'light', name: 'Midnight Blue' },
  { hex: '#312E81', text: 'light', name: 'Indigo Dusk' },
  { hex: '#3B0764', text: 'light', name: 'Deep Violet' },
  { hex: '#4C1D1D', text: 'light', name: 'Maroon' },
  { hex: '#292524', text: 'light', name: 'Warm Charcoal' },
  { hex: '#171717', text: 'light', name: 'Near Black' },
  { hex: '#000000', text: 'light', name: 'Black' },
  { hex: '#F5F5DC', text: 'dark', name: 'Beige' },
  { hex: '#F1E9D2', text: 'dark', name: 'Warm Cream' },
  { hex: '#E8DCC4', text: 'dark', name: 'Sand' },
  { hex: '#FFFFFF', text: 'dark', name: 'White' },
];

export const WALLPAPER_TEXT_ON_DARK = {
  primary: '#FFFFFF',
  secondary: '#E5E7EB',
  muted: '#9CA3AF',
  divider: 'rgba(255,255,255,0.18)',
};

export const WALLPAPER_TEXT_ON_LIGHT = {
  primary: '#1F2933',
  secondary: '#374151',
  muted: '#6B7280',
  divider: 'rgba(31,41,51,0.18)',
};

/**
 * Deterministically picks a palette entry for a given 1-based day-of-year
 * index. Uses a different stride than the content selection so the color
 * doesn't always change in lockstep with which ayah/hadith pool index is
 * used (purely a visual nicety — still 100% deterministic per date).
 * @param {number} dayIndex 1-based day-of-year
 */
export function getColorForDayIndex(dayIndex) {
  const safeIndex = Number.isInteger(dayIndex) && dayIndex > 0 ? dayIndex : 1;
  const idx = (safeIndex - 1) % WALLPAPER_COLORS.length;
  return WALLPAPER_COLORS[idx];
}

/**
 * Returns the readable text palette (primary/secondary/muted/divider) for
 * a given background palette entry.
 */
export function getTextPaletteFor(colorEntry) {
  if (!colorEntry) return WALLPAPER_TEXT_ON_DARK;
  return colorEntry.text === 'dark' ? WALLPAPER_TEXT_ON_LIGHT : WALLPAPER_TEXT_ON_DARK;
}

/**
 * Finds a palette entry by hex, falling back to the first dark color if
 * the hex isn't recognized (e.g. cache from a future app version).
 */
export function getColorByHex(hex) {
  return (
    WALLPAPER_COLORS.find((c) => c.hex.toLowerCase() === String(hex).toLowerCase()) ||
    WALLPAPER_COLORS[0]
  );
}

export default {
  WALLPAPER_COLORS,
  WALLPAPER_TEXT_ON_DARK,
  WALLPAPER_TEXT_ON_LIGHT,
  getColorForDayIndex,
  getTextPaletteFor,
  getColorByHex,
};
