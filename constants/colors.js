// constants/colors.js
// Central color system for NoorDaily. Never hard-code colors in components —
// always pull from this file via the theme context.

export const COLORS = {
  light: {
    background: '#FAF8F2',
    backgroundAlt: '#F1ECDD',
    card: '#FFFFFF',
    cardAlt: '#FBF9F3',
    primary: '#14532D',
    primarySoft: '#E5EEE7',
    secondary: '#B08D35',
    secondarySoft: '#F3EAD2',
    text: '#1F2933',
    muted: '#6B7280',
    border: '#E5E7EB',
    danger: '#B3261E',
    overlay: 'rgba(20, 20, 15, 0.5)',
    tabInactive: '#9CA3AF',
    shadow: '#000000',
  },
  dark: {
    background: '#101512',
    backgroundAlt: '#0B0F0C',
    card: '#18201B',
    cardAlt: '#1D2620',
    primary: '#6FAF82',
    primarySoft: '#1E2A22',
    secondary: '#D4B45C',
    secondarySoft: '#2A2618',
    text: '#F5F5F0',
    muted: '#A3AAA5',
    border: '#2B342E',
    danger: '#E5847B',
    overlay: 'rgba(0, 0, 0, 0.65)',
    tabInactive: '#5C665F',
    shadow: '#000000',
  },
};

export default COLORS;
