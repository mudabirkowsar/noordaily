# NoorDaily

**One Ayah. One Hadith. Every Day.**

A peaceful, minimal Expo Router app that delivers one Qur'an Ayah and one
authentic Hadith to the user's phone every day via a scheduled local
notification.

Pure JavaScript / JSX — no TypeScript anywhere in this project.

## Content sources

- **`data/hadith.js`** — 250 hadiths from **Sahih al-Bukhari**, evenly
  sampled from the full ~7,000-hadith English-translation dataset the user
  supplied (`sahih_bukhari.json`, the well-known Volume/Book/Number
  compilation). Each entry keeps its original Volume/Book/Number reference
  and narrator attribution. No Arabic text was present in the source file,
  so `arabic` is left empty for every hadith — the UI already hides that
  block gracefully when it's blank. `grade` is labeled `'Sahih (Sahih
  al-Bukhari)'` since every hadith in the collection is, by definition,
  graded authentic (ṣaḥīḥ).
- **`data/quran.js`** — 74 āyāt (Surah Al-Faatiha plus 12 short, widely
  recited surahs, mostly from Juz 'Amma) with Uthmani-script Arabic and the
  public-domain **Pickthall** English translation, sourced live from the
  [Al Quran Cloud](https://alquran.cloud) API/site.

Both pools are cycled deterministically by `services/dailyContentService.js`
(`day-of-year mod pool-size`), so the same calendar date always shows the
same Ayah and Hadith. If you want full-year, non-repeating coverage, expand
either array with more entries in the same shape.

### If you want to expand the content further

- **More hadiths**: re-run the same extraction against your full
  `sahih_bukhari.json` (or another authenticated collection) and adjust the
  sampling in `data/hadith.js`'s generation step.
- **More Qur'an verses**: pull additional surahs from
  `https://alquran.cloud/surah/<number>` (or the JSON API at
  `api.alquran.cloud`) in the same `{ arabic, translation }` shape.
- Consider adding a second, more contemporary translation (e.g. Sahih
  International) if Pickthall's early-20th-century English feels dated for
  your audience — many translations are available through the same API.

The images in `assets/images/` (`icon.png`, `splash.png`,
`adaptive-icon.png`, `notification-icon.png`) are still 1×1 placeholder
pixels so `app.json` resolves correctly during development. Replace them
with real artwork (crescent + radiance on an emerald background, per the
brand brief) before building a release binary.

## Getting started

```bash
npm install
npx expo start
```

This project targets **Expo SDK 51 / React Native 0.74.5 / React 18.2.0 /
Expo Router 3.5**, matching the existing `package.json`. Do not upgrade
these without testing, since `expo-notifications ~0.28` and the datetime
picker version are pinned to this SDK.

Notifications (and the picker) work best on a physical device or a
development build — the Notifications permission flow is limited on
simulators/emulators, per Expo's own guidance.

## Project structure

```
app/                     Expo Router screens (bottom tabs + stack-style routes)
  _layout.jsx            Root Tabs navigator + notification deep-link wiring
  index.jsx              Home
  onboarding.jsx          3-step onboarding incl. notification setup
  notification-settings.jsx
  favorites.jsx
  history.jsx
  settings.jsx
  about.jsx
  privacy.jsx
  ayah/[id].jsx
  hadith/[id].jsx
  day/[date].jsx         Opened by the daily notification tap

components/              Reusable UI building blocks
services/                notificationService, storageService,
                         dailyContentService, sharingService, firebaseService
data/                    quran.js, hadith.js, dailyContent.js (demo content)
constants/               colors.js, theme.js, config.js
context/                 AppContext.jsx — theme + font size + favorites state
utils/                   dateUtils.js, greeting.js, validation.js
```

## How daily content selection works

`services/dailyContentService.js` picks the Ayah/Hadith for a date using
`(day-of-year mod pool-size)`, so the same calendar date always yields the
same content — no randomness at read time. Once you plug in a full year's
worth of verified content, every day of the year gets a distinct entry.

## Notifications

- `services/notificationService.js` centralizes permission requests, the
  Android `noor-daily` channel, scheduling/cancelling/rescheduling the
  recurring daily reminder, a test-notification helper, and notification-tap
  handling.
- Tapping the daily reminder always deep-links to `/day/<today's date>` —
  never to Home — both on cold start and while the app is running.
- Changing the reminder time in Settings cancels the old schedule before
  creating a new one, so duplicate notifications are never created.

## Offline-first

The entire core experience (today's content, history, favorites, settings)
works with no network connection — all content ships bundled in `data/`.
Firebase (`services/firebaseService.js`) is entirely optional and never
required for the app to function; no authentication is used anywhere.

## Storage keys (AsyncStorage)

See `constants/config.js` → `STORAGE_KEYS` for the full list. All reads and
writes go through `services/storageService.js` — never access
AsyncStorage directly from a screen or component.
