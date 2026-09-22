// context/AppContext.jsx
//
// Central app-level context: resolved theme colors (system/light/dark),
// font size preferences, and a favorites-changed counter so screens can
// re-read favorites from storage after a change elsewhere in the app.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { COLORS } from '../constants/colors';
import { FONT_SIZES } from '../constants/theme';
import {
  getThemePreference,
  setThemePreference as persistThemePreference,
  getArabicFontSize,
  setArabicFontSize as persistArabicFontSize,
  getTranslationFontSize,
  setTranslationFontSize as persistTranslationFontSize,
} from '../services/storageService';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [themePreference, setThemePreferenceState] = useState('system');
  const [arabicFontSize, setArabicFontSizeState] = useState('medium');
  const [translationFontSize, setTranslationFontSizeState] = useState('medium');
  const [favoritesVersion, setFavoritesVersion] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const [theme, arabicSize, translationSize] = await Promise.all([
        getThemePreference(),
        getArabicFontSize(),
        getTranslationFontSize(),
      ]);
      setThemePreferenceState(theme || 'system');
      setArabicFontSizeState(arabicSize || 'medium');
      setTranslationFontSizeState(translationSize || 'medium');
      setReady(true);
    })();
  }, []);

  const resolvedScheme = useMemo(() => {
    if (themePreference === 'light' || themePreference === 'dark') {
      return themePreference;
    }
    return systemScheme === 'dark' ? 'dark' : 'light';
  }, [themePreference, systemScheme]);

  const colors = COLORS[resolvedScheme];

  const setThemePreference = useCallback(async (value) => {
    setThemePreferenceState(value);
    await persistThemePreference(value);
  }, []);

  const setArabicFontSize = useCallback(async (value) => {
    setArabicFontSizeState(value);
    await persistArabicFontSize(value);
  }, []);

  const setTranslationFontSize = useCallback(async (value) => {
    setTranslationFontSizeState(value);
    await persistTranslationFontSize(value);
  }, []);

  const notifyFavoritesChanged = useCallback(() => {
    setFavoritesVersion((v) => v + 1);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      colorScheme: resolvedScheme,
      colors,
      themePreference,
      setThemePreference,
      arabicFontSize,
      setArabicFontSize,
      arabicFontSizeValue: FONT_SIZES.arabic[arabicFontSize] || FONT_SIZES.arabic.medium,
      translationFontSize,
      setTranslationFontSize,
      translationFontSizeValue:
        FONT_SIZES.translation[translationFontSize] || FONT_SIZES.translation.medium,
      favoritesVersion,
      notifyFavoritesChanged,
    }),
    [
      ready,
      resolvedScheme,
      colors,
      themePreference,
      setThemePreference,
      arabicFontSize,
      setArabicFontSize,
      translationFontSize,
      setTranslationFontSize,
      favoritesVersion,
      notifyFavoritesChanged,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}

export default AppContext;
