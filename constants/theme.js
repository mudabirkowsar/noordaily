// constants/theme.js
// Shared design tokens: spacing, radius, typography, shadows.

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const FONT_SIZES = {
  arabic: {
    small: 22,
    medium: 26,
    large: 32,
  },
  translation: {
    small: 14,
    medium: 16,
    large: 19,
  },
};

export const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: '700' },
  h2: { fontSize: 22, fontWeight: '700' },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.6 },
};

export function shadowStyle(color = '#000000', opacity = 0.08) {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: opacity,
    shadowRadius: 12,
    elevation: 3,
  };
}

export default { SPACING, RADIUS, FONT_SIZES, TYPOGRAPHY, shadowStyle };
