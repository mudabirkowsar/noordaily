// components/BottomTabBar.jsx
//
// Small helper used by app/_layout.jsx to render each bottom tab icon with
// a filled/outline swap based on focus state, keeping _layout.jsx tidy.

import React from 'react';
import { Ionicons } from '@expo/vector-icons';

const ICONS = {
  home: { active: 'home', inactive: 'home-outline' },
  history: { active: 'calendar', inactive: 'calendar-outline' },
  favorites: { active: 'heart', inactive: 'heart-outline' },
  settings: { active: 'settings', inactive: 'settings-outline' },
};

export default function TabIcon({ name, focused, color, size = 22 }) {
  const set = ICONS[name] || ICONS.home;
  return (
    <Ionicons name={focused ? set.active : set.inactive} size={size} color={color} />
  );
}
